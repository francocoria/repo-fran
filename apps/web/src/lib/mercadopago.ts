import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

/**
 * El modo lo controla SOLO la variable `MERCADOPAGO_MODE`.
 * Si no es exactamente "production", estamos en sandbox.
 *
 * Esto hace que tener cargado el token de producción NO active cobros
 * reales por accidente: hay que poner `MERCADOPAGO_MODE=production` a
 * propósito para salir en vivo.
 */
function isProduction(): boolean {
  return process.env.MERCADOPAGO_MODE === "production";
}

/**
 * Helper para configurar el cliente de Mercado Pago.
 * Producción → MERCADOPAGO_ACCESS_TOKEN.
 * Sandbox    → MERCADOPAGO_ACCESS_TOKEN_TEST.
 */
function getAccessToken(): string {
  const token = isProduction()
    ? process.env.MERCADOPAGO_ACCESS_TOKEN
    : process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;
  if (!token) {
    throw new Error(
      isProduction()
        ? "Falta MERCADOPAGO_ACCESS_TOKEN (modo producción)"
        : "Falta MERCADOPAGO_ACCESS_TOKEN_TEST (modo sandbox)",
    );
  }
  return token;
}

/** Secret del webhook según el modo. */
export function getMpWebhookSecret(): string | undefined {
  return isProduction()
    ? process.env.MERCADOPAGO_WEBHOOK_SECRET
    : (process.env.MERCADOPAGO_WEBHOOK_SECRET_TEST ??
        process.env.MERCADOPAGO_WEBHOOK_SECRET);
}

export function getMpConfig(): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: getAccessToken(),
    options: { timeout: 10_000 },
  });
}

export function getPreferenceClient() {
  return new Preference(getMpConfig());
}

export function getPaymentClient() {
  return new Payment(getMpConfig());
}

/** Indica si estamos usando sandbox (no producción). Útil para UI. */
export function isMpSandbox(): boolean {
  return !isProduction();
}

/** Precio fijo Premium mensual — extraer a env var en el futuro */
export const PREMIUM_PRICE_ARS = 9990;
export const PREMIUM_CURRENCY = "ARS";
export const PREMIUM_PLAN_TITLE = "PetApp Premium · Vet (mensual)";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-friendly.fun";
