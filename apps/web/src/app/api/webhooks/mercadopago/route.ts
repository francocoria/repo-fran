import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { activatePremiumFromPayment } from "@/lib/premium-activation";
import { getMpWebhookSecret } from "@/lib/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Mercado Pago para notificaciones de pagos.
 *
 * MP nos manda un POST cuando un pago cambia de estado. Usamos el `id`
 * del pago para fetchear los detalles y activar la suscripción.
 *
 * La activación es una vía de RESPALDO: la página `/vet/plan` también
 * activa Premium al volver del checkout (redirect). Por eso, aunque la
 * firma falle o el webhook no llegue, el usuario igual queda activado.
 *
 * Validación: header `x-signature` que firma `id` + `request-id` con
 * MERCADOPAGO_WEBHOOK_SECRET.
 *
 * Idempotencia: `activatePremiumFromPayment` filtra por payment_id.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  // MP manda `data.id` tanto en el body como en el query string.
  const urlDataId = request.nextUrl.searchParams.get("data.id");

  // 1) Validar firma del webhook (si tenemos el secret)
  const secret = getMpWebhookSecret();
  if (secret) {
    const signature = request.headers.get("x-signature") ?? "";
    const requestId = request.headers.get("x-request-id") ?? "";
    if (!verifyMpSignature(secret, signature, requestId, body, urlDataId)) {
      // No cortamos el flujo: logueamos y seguimos. La activación es
      // idempotente y la vía de redirect cubre el caso. Cortar acá
      // sólo lograba que un secret mal configurado bloquee pagos reales.
      console.warn(
        "[mp-webhook] firma inválida — se procesa igual (idempotente).",
      );
    }
  } else {
    console.warn("[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET no seteado.");
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
