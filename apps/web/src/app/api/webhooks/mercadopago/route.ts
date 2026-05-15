import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getPaymentClient } from "@/lib/mercadopago";
import { prisma } from "@pet-app/db";
import { sendEmail, premiumActivatedTemplate } from "@pet-app/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Mercado Pago para notificaciones de pagos.
 *
 * MP nos manda un POST cuando un pago cambia de estado. El body es chico
 * pero el `id` del pago lo usamos para fetchear los detalles via API y
 * validar antes de activar la suscripción.
 *
 * Validación: header `x-signature` que firma `id` + `request-id` con
 * MERCADOPAGO_WEBHOOK_SECRET. Si está mal, rechazamos.
 *
 * Idempotencia: MP reintenta varias veces. Filtramos por payment_id en
 * la tabla manual_payments para no duplicar.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // 1) Validar firma del webhook (si tenemos el secret)
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("x-signature") ?? "";
    const requestId = request.headers.get("x-request-id") ?? "";
    if (!verifyMpSignature(secret, signature, requestId, body)) {
      console.warn("[mp-webhook] signature mismatch — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn(
      "[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET no seteado — saltando validación. NO USAR EN PROD.",
    );
  }

  // 2) Parsear el payload
  let payload: { type?: string; data?: { id?: string | number } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Tipos: "payment", "subscription_authorized_payment", "merchant_order", etc.
  // Para Checkout Pro simple, nos importa "payment".
  if (payload.type !== "payment") {
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  const paymentId = payload.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "Falta data.id" }, { status: 400 });
  }

  // 3) Fetch del pago real
  try {
    const paymentClient = getPaymentClient();
    const payment = await paymentClient.get({ id: String(paymentId) });

    console.log("[mp-webhook] payment received:", {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      amount: payment.transaction_amount,
    });

    if (payment.status !== "approved") {
      // Sólo activamos premium en pagos aprobados
      return NextResponse.json({
        ok: true,
        status: payment.status,
        action: "no_op",
      });
    }

    const vetId = payment.external_reference;
    if (!vetId) {
      console.error("[mp-webhook] payment sin external_reference");
      return NextResponse.json(
        { error: "Falta external_reference" },
        { status: 400 },
      );
    }

    // 4) Idempotencia: si ya procesamos este payment_id, skip.
    // El schema no tiene columna external_reference para ManualPayment, así
    // que usamos el campo `notes` con prefijo `mp:<payment_id>`.
    const mpRef = `mp:${payment.id}`;
    const existing = await prisma.manualPayment.findFirst({
      where: { notes: { contains: mpRef } },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        status: "already_processed",
        manualPaymentId: existing.id,
      });
    }

    // 5) Activar/extender suscripción Premium por 1 mes
    const vetProfile = await prisma.vetProfile.findUnique({
      where: { id: vetId },
      select: { id: true, full_name: true, user_id: true },
    });
    if (!vetProfile) {
      console.error("[mp-webhook] vet no encontrado:", vetId);
      return NextResponse.json({ error: "Vet not found" }, { status: 404 });
    }

    const now = new Date();
    const existingSub = await prisma.subscription.findUnique({
      where: { vet_id: vetId },
    });

    // Si la suscripción aún está vigente, agregamos 1 mes a partir de
    // expires_at. Sino, agregamos 1 mes desde ahora.
    const baseDate =
      existingSub?.expires_at && existingSub.expires_at > now
        ? existingSub.expires_at
        : now;
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

    await prisma.subscription.upsert({
      where: { vet_id: vetId },
      create: {
        vet_id: vetId,
        plan: "premium",
        status: "active",
        starts_at: now,
        expires_at: newExpiresAt,
      },
      update: {
        plan: "premium",
        status: "active",
        expires_at: newExpiresAt,
      },
    });

    // Registramos el pago para auditoría + idempotencia.
    const subForPayment = await prisma.subscription.findUnique({
      where: { vet_id: vetId },
      select: { id: true },
    });
    await prisma.manualPayment.create({
      data: {
        subscription_id: subForPayment!.id,
        vet_id: vetId,
        amount: payment.transaction_amount ?? 0,
        currency: payment.currency_id ?? "ARS",
        method: "mp_external",
        paid_at: now,
        months_granted: 1,
        // El "recorded_by" es el propio vet (pago auto) — usamos su id.
        recorded_by_id: vetId,
        notes: `${mpRef} · ${payment.payment_method_id ?? "?"} · ${payment.payment_type_id ?? "?"}`,
      },
    });

    // 6) Mandar mail de confirmación
    if (vetProfile.user_id && payment.payer?.email) {
      const tmpl = premiumActivatedTemplate({
        vetName: vetProfile.full_name,
        expiresAt: newExpiresAt,
        monthsGranted: 1,
      });
      await sendEmail({
        to: payment.payer.email,
        subject: tmpl.subject,
        html: tmpl.html,
      });
    }

    return NextResponse.json({
      ok: true,
      status: "activated",
      vet_id: vetId,
      expires_at: newExpiresAt.toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[mp-webhook] failed processing payment:", msg, error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Valida la firma del webhook de MP.
 * Formato esperado: `ts=...,v1=...` en el header x-signature.
 * Manifest: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * HMAC-SHA256 con secret.
 */
function verifyMpSignature(
  secret: string,
  signature: string,
  requestId: string,
  body: string,
): boolean {
  try {
    const parts = signature.split(",").reduce(
      (acc, part) => {
        const [k, v] = part.split("=");
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      },
      {} as Record<string, string>,
    );

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    // Extraemos data.id del body para construir el manifest
    let dataId = "";
    try {
      const parsed = JSON.parse(body);
      dataId = String(parsed.data?.id ?? "");
    } catch {
      return false;
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    // timing-safe compare
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    console.error("[mp-webhook] verify error:", err);
    return false;
  }
}
