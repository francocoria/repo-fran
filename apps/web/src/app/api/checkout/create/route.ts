import { NextResponse, type NextRequest } from "next/server";
import { requireUser, getVetProfile } from "@/lib/auth";
import {
  getPreferenceClient,
  PREMIUM_PRICE_ARS,
  PREMIUM_CURRENCY,
  PREMIUM_PLAN_TITLE,
  APP_URL,
  isMpSandbox,
} from "@/lib/mercadopago";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Crea una preferencia de Mercado Pago para activar Premium mensual.
 *
 * El usuario que llama tiene que estar logueado COMO vet.
 * Después de crear la preferencia, devolvemos init_point (la URL de
 * checkout) y el frontend redirige al usuario.
 *
 * Cuando MP procesa el pago, llama al webhook /api/webhooks/mercadopago
 * que actualiza subscriptions.
 */
export async function POST(_request: NextRequest) {
  try {
    const user = await requireUser();
    const vetProfile = await getVetProfile(user.id);
    if (!vetProfile) {
      return NextResponse.json(
        { error: "Sólo veterinarios pueden activar Premium." },
        { status: 403 },
      );
    }

    const preference = getPreferenceClient();

    const result = await preference.create({
      body: {
        items: [
          {
            id: "premium-monthly",
            title: PREMIUM_PLAN_TITLE,
            description:
              "Pacientes ilimitados, certificados, plantillas y verificación.",
            quantity: 1,
            currency_id: PREMIUM_CURRENCY,
            unit_price: PREMIUM_PRICE_ARS,
          },
        ],
        payer: {
          email: user.email ?? undefined,
          name: vetProfile.full_name ?? undefined,
        },
        back_urls: {
          success: `${APP_URL}/vet/plan?checkout=success`,
          failure: `${APP_URL}/vet/plan?checkout=failure`,
          pending: `${APP_URL}/vet/plan?checkout=pending`,
        },
        auto_return: "approved",
        // Referencia externa: nuestro vet_id. Lo recibimos de vuelta
        // en el webhook para saber qué suscripción activar.
        external_reference: vetProfile.id,
        notification_url: `${APP_URL}/api/webhooks/mercadopago`,
        statement_descriptor: "PetApp Premium",
        metadata: {
          vet_id: vetProfile.id,
          plan: "premium",
        },
      },
    });

    // En sandbox usamos sandbox_init_point (las tarjetas de prueba sólo
    // funcionan ahí). En producción, init_point.
    const sandbox = isMpSandbox();
    const checkoutUrl = sandbox
      ? (result.sandbox_init_point ?? result.init_point)
      : (result.init_point ?? result.sandbox_init_point);

    return NextResponse.json({
      success: true,
      preferenceId: result.id,
      checkoutUrl,
      sandbox,
    });
  } catch (error: unknown) {
    logError("api/checkout/create", error);
    return NextResponse.json(
      { error: "No pudimos generar el checkout. Reintentá en unos minutos." },
      { status: 500 },
    );
  }
}
