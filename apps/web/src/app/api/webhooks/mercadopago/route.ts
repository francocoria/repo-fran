import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { activatePremiumFromPayment } from "@/lib/premium-activation";
import { getMpWebhookSecret, isMpSandbox } from "@/lib/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Mercado Pago para notificaciones de pagos.
 *
 * MP nos manda un POST cuando un pago cambia de estado. Usamos el `id`
 * del pago para fetchear los detalles y activar la suscripción.
 *
 * Validación de firma (CRÍTICO-6 del audit):
 * - Producción: si MERCADOPAGO_WEBHOOK_SECRET está seteado y la firma falla
 *   → 401. Si NO está seteado → 503 (config incompleta, falla cerrada).
 * - Sandbox: si el secret está, se valida; si no, se permite sin firma para
 *   facilitar testing con curl/postman.
 *
 * La vía de RESPALDO sigue siendo `/vet/plan` (redirect post-checkout):
 * aunque el webhook devuelva 401, el usuario queda activo al volver.
 *
 * Idempotencia: `activatePremiumFromPayment` filtra por payment_id.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // MP manda `data.id` tanto en el body como en el query string.
  const urlDataId = request.nextUrl.searchParams.get("data.id");

  // 1) Validar firma del webhook
  const secret = getMpWebhookSecret();
  const sandbox = isMpSandbox();

  if (!secret) {
    if (!sandbox) {
      // Producción sin secret = configuración rota. No procesamos.
      console.error(
        "[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado en producción",
      );
      return NextResponse.json(
        { error: "Webhook no configurado" },
        { status: 503 },
      );
    }
    console.warn(
      "[mp-webhook] sandbox sin secret — se procesa sin validar firma.",
    );
  } else {
    const signature = request.headers.get("x-signature") ?? "";
    const requestId = request.headers.get("x-request-id") ?? "";
    if (!verifyMpSignature(secret, signature, requestId, body, urlDataId)) {
      console.warn("[mp-webhook] firma inválida", {
        hasSig: Boolean(signature),
        hasReqId: Boolean(requestId),
        urlDataId: Boolean(urlDataId),
      });
      return NextResponse.json(
        { error: "Firma inválida" },
        { status: 401 },
      );
    }
  }

  // 2) Parsear el payload
  let payload: { type?: string; data?: { id?: string | number } };
  try {
    payload = JSON.parse(body || "{}");
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Para Checkout Pro simple, nos importa "payment".
  if (payload.type && payload.type !== "payment") {
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  const paymentId = payload.data?.id ?? urlDataId;
  if (!paymentId) {
    return NextResponse.json({ error: "Falta data.id" }, { status: 400 });
  }

  const result = await activatePremiumFromPayment(String(paymentId));

  if (!result.ok && result.status === "error") {
    return NextResponse.json({ error: result.detail }, { status: 500 });
  }
  return NextResponse.json(result);
}

/**
 * Valida la firma del webhook de MP.
 * Formato del header x-signature: `ts=...,v1=...`
 * Manifest: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * HMAC-SHA256 con el secret.
 */
function verifyMpSignature(
  secret: string,
  signature: string,
  requestId: string,
  body: string,
  urlDataId: string | null,
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

    // MP arma el manifest con el `data.id` del query string. Si no está,
    // caemos al del body.
    let dataId = urlDataId ?? "";
    if (!dataId) {
      try {
        const parsed = JSON.parse(body);
        dataId = String(parsed.data?.id ?? "");
      } catch {
        return false;
      }
    }
    // MP recomienda lowercasear el id si es alfanumérico.
    dataId = dataId.toLowerCase();

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    console.error("[mp-webhook] verify error:", err);
    return false;
  }
}
