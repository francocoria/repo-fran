import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

/**
 * Helper para configurar el cliente de Mercado Pago.
 * Usa producción si MERCADOPAGO_ACCESS_TOKEN está seteado, sino cae a
 * MERCADOPAGO_ACCESS_TOKEN_TEST (sandbox).
 */
function getAccessToken(): string {
  const token =
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;
  if (!token) {
    throw new Error(
      "Falta MERCADOPAGO_ACCESS_TOKEN o MERCADOPAGO_ACCESS_TOKEN_TEST",
    );
  }
  return token;
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
  return (
    !process.env.MERCADOPAGO_ACCESS_TOKEN &&
    !!process.env.MERCADOPAGO_ACCESS_TOKEN_TEST
  );
}

/** Precio fijo Premium mensual — extraer a env var en el futuro */
export const PREMIUM_PRICE_ARS = 9990;
export const PREMIUM_CURRENCY = "ARS";
export const PREMIUM_PLAN_TITLE = "PetApp Premium · Vet (mensual)";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-friendly.fun";
