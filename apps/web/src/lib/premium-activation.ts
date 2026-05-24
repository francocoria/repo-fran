import "server-only";
import { getPaymentClient } from "@/lib/mercadopago";
import { prisma } from "@pet-app/db";
import { sendEmail, premiumActivatedTemplate } from "@pet-app/emails";
import { logError, logInfo, logWarn } from "@/lib/logger";

/**
 * Activación de Premium a partir de un pago de Mercado Pago.
 *
 * Esta lógica es compartida por:
 *  - el webhook (`/api/webhooks/mercadopago`) — vía push de MP
 *  - la página de plan (`/vet/plan?payment_id=...`) — vía redirect de MP
 *
 * Tener las dos vías hace que la activación NO dependa de que el webhook
 * llegue: si el webhook falla o tarda, el redirect la resuelve igual.
 *
 * Es idempotente: si el `payment_id` ya fue procesado, no vuelve a
 * extender la suscripción (filtra por `notes` con prefijo `mp:<id>`).
 */
export type ActivationResult =
  | {
      ok: true;
      status: "activated" | "already_processed";
      vetId: string;
      expiresAt: Date | null;
    }
  | {
      ok: false;
      status: "not_approved" | "no_reference" | "no_vet" | "error";
      detail?: string;
    };

export async function activatePremiumFromPayment(
  paymentId: string,
): Promise<ActivationResult> {
  try {
    const paymentClient = getPaymentClient();
    const payment = await paymentClient.get({ id: String(paymentId) });

    logInfo("premium-activation", "payment fetched", {
      id: payment.id,
      status: payment.status,
      vetId: payment.external_reference,
      amount: payment.transaction_amount,
    });

    if (payment.status !== "approved") {
      return {
        ok: false,
        status: "not_approved",
        detail: payment.status ?? undefined,
      };
    }

    const vetId = payment.external_reference;
    if (!vetId) {
      logWarn("premium-activation", "pago sin external_reference", {
        paymentId: payment.id,
      });
      return { ok: false, status: "no_reference" };
    }

    // Idempotencia: el schema de ManualPayment no tiene columna dedicada,
    // así que marcamos el payment_id dentro de `notes` con prefijo `mp:`.
    const mpRef = `mp:${payment.id}`;
    const already = await prisma.manualPayment.findFirst({
      where: { notes: { contains: mpRef } },
    });
    if (already) {
      const sub = await prisma.subscription.findUnique({
        where: { vet_id: vetId },
        select: { expires_at: true },
      });
      return {
        ok: true,
        status: "already_processed",
        vetId,
        expiresAt: sub?.expires_at ?? null,
      };
    }

    const vetProfile = await prisma.vetProfile.findUnique({
      where: { id: vetId },
      select: { id: true, full_name: true, user_id: true },
    });
    if (!vetProfile) {
      logWarn("premium-activation", "vet no encontrado", { vetId });
      return { ok: false, status: "no_vet" };
    }

    const now = new Date();
    const existingSub = await prisma.subscription.findUnique({
      where: { vet_id: vetId },
    });

    // Si la suscripción sigue vigente, sumamos 1 mes desde expires_at.
    // Si venció o no existe, 1 mes desde ahora.
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
        recorded_by_id: vetId,
        notes: `${mpRef} · ${payment.payment_method_id ?? "?"} · ${payment.payment_type_id ?? "?"}`,
      },
    });

    // Mail de confirmación — no bloqueante.
    if (vetProfile.user_id && payment.payer?.email) {
      const tmpl = premiumActivatedTemplate({
        vetName: vetProfile.full_name,
        expiresAt: newExpiresAt,
        monthsGranted: 1,
      });
      void sendEmail({
        to: payment.payer.email,
        subject: tmpl.subject,
        html: tmpl.html,
      }).catch((e) => logError("premium-activation/email", e, { vetId }));
    }

    return { ok: true, status: "activated", vetId, expiresAt: newExpiresAt };
  } catch (error: unknown) {
    logError("premium-activation", error);
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return { ok: false, status: "error", detail };
  }
}
