"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, getAdminUser } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { createSupabaseAdminClient } from "@pet-app/lib/supabase/admin";
import {
  sendEmail,
  premiumActivatedTemplate,
  verificationApprovedTemplate,
  verificationRejectedTemplate,
} from "@pet-app/emails";
import { writeAuditLog } from "@/lib/audit";
import { logError } from "@/lib/logger";

// ─── Helper ─────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await requireUser();
  const admin = await getAdminUser(user.id);
  if (!admin) throw new Error("FORBIDDEN");
  return { user, admin };
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Activar Premium (registrar pago manual) ──────────────────────

const activatePremiumSchema = z.object({
  vetId: z.string().uuid(),
  monthsGranted: z.coerce.number().int().min(1).max(60),
  amount: z.coerce.number().min(0),
  currency: z.string().default("USD"),
  method: z.enum(["transfer", "cash", "mp_external", "stripe_external", "other"]),
  paidAt: z.string().min(1),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function activatePremium(formData: FormData) {
  try {
    const { user } = await requireAdmin();

    const payload = {
      vetId: formData.get("vetId"),
      monthsGranted: formData.get("monthsGranted"),
      amount: formData.get("amount"),
      currency: formData.get("currency") || "USD",
      method: formData.get("method"),
      paidAt: formData.get("paidAt"),
      notes: formData.get("notes") || undefined,
    };

    const parsed = activatePremiumSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }
    const d = parsed.data;

    const vet = await prisma.vetProfile.findUnique({
      where: { id: d.vetId },
      select: { id: true, full_name: true, user_id: true },
    });
    if (!vet) return { success: false, error: "Vet no encontrado." };

    // Calcular nuevo expires_at: extender desde el actual o desde hoy
    const existing = await prisma.subscription.findUnique({
      where: { vet_id: vet.id },
    });

    const baseDate =
      existing?.expires_at && existing.expires_at > new Date()
        ? existing.expires_at
        : new Date();
    const newExpiresAt = addMonths(baseDate, d.monthsGranted);

    const subscription = await prisma.subscription.upsert({
      where: { vet_id: vet.id },
      create: {
        vet_id: vet.id,
        plan: "premium",
        status: "active",
        starts_at: new Date(),
        expires_at: newExpiresAt,
        granted_by_id: user.id,
        notes: d.notes || null,
      },
      update: {
        plan: "premium",
        status: "active",
        expires_at: newExpiresAt,
        granted_by_id: user.id,
      },
    });

    // Registrar pago
    await prisma.manualPayment.create({
      data: {
        subscription_id: subscription.id,
        vet_id: vet.id,
        amount: d.amount,
        currency: d.currency,
        method: d.method,
        paid_at: new Date(d.paidAt),
        months_granted: d.monthsGranted,
        recorded_by_id: user.id,
        notes: d.notes || null,
      },
    });

    // Audit log con IP + UA (writeAuditLog no rompe el flujo si falla)
    await writeAuditLog({
      actorId: user.id,
      action: "activate.premium",
      resourceType: "subscription",
      resourceId: subscription.id,
      metadata: {
        vet_id: vet.id,
        months: d.monthsGranted,
        amount: d.amount,
        currency: d.currency,
        method: d.method,
      },
    });

    // Email + notificación
    const admin = createSupabaseAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(vet.user_id);
    const email = userData?.user?.email;

    if (email) {
      const tpl = premiumActivatedTemplate({
        vetName: vet.full_name,
        expiresAt: newExpiresAt,
        monthsGranted: d.monthsGranted,
      });
      const sent = await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
      });

      await prisma.emailLog.create({
        data: {
          to_user_id: vet.user_id,
          to_email: email,
          type: "premium_activated",
          subject: tpl.subject,
          status: sent.success ? "sent" : "failed",
          error_msg: sent.error ?? null,
        },
      });
    }

    await prisma.notification.create({
      data: {
        user_id: vet.user_id,
        type: "premium_activated",
        title: "🎉 Premium activado",
        body: `Tu plan Premium ya está activo hasta el ${newExpiresAt.toLocaleDateString("es-AR")}.`,
        link: "/vet/plan",
      },
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/vets/${vet.id}`);
    revalidatePath("/admin/payments");
    return { success: true, expiresAt: newExpiresAt };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Sin permisos." };
    }
    logError("activatePremium", error);
    return { success: false, error: "No se pudo activar." };
  }
}

// ─── Aprobar / rechazar verificación de matrícula ─────────────────

export async function approveVerification(requestId: string) {
  try {
    const { user } = await requireAdmin();

    const req = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        vet: { select: { id: true, full_name: true, user_id: true } },
      },
    });
    if (!req) return { success: false, error: "Solicitud no encontrada." };
    if (req.status !== "pending") {
      return { success: false, error: "Esta solicitud ya fue procesada." };
    }

    await prisma.$transaction([
      prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          reviewed_at: new Date(),
          reviewed_by_id: user.id,
        },
      }),
      prisma.vetProfile.update({
        where: { id: req.vet_id },
        data: { verified: true, verified_at: new Date() },
      }),
    ]);
    await writeAuditLog({
      actorId: user.id,
      action: "approve.vet_license",
      resourceType: "vet_profile",
      resourceId: req.vet_id,
      metadata: { requestId },
    });

    // Email + notificación
    const admin = createSupabaseAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(
      req.vet.user_id,
    );
    const email = userData?.user?.email;
    if (email) {
      const tpl = verificationApprovedTemplate({ vetName: req.vet.full_name });
      const sent = await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
      });
      await prisma.emailLog.create({
        data: {
          to_user_id: req.vet.user_id,
          to_email: email,
          type: "verification_approved",
          subject: tpl.subject,
          status: sent.success ? "sent" : "failed",
          error_msg: sent.error ?? null,
        },
      });
    }

    await prisma.notification.create({
      data: {
        user_id: req.vet.user_id,
        type: "verification_approved",
        title: "✅ Matrícula verificada",
        body: "Ya tenés tu badge azul de verificado.",
        link: "/vet/plan",
      },
    });

    revalidatePath("/admin/verifications");
    revalidatePath(`/admin/vets/${req.vet_id}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Sin permisos." };
    }
    logError("approveVerification", error);
    return { success: false, error: "No se pudo aprobar." };
  }
}

export async function rejectVerification(
  requestId: string,
  reason: string,
) {
  try {
    const { user } = await requireAdmin();
    const trimmedReason = reason.trim().slice(0, 500);

    const req = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        vet: { select: { id: true, full_name: true, user_id: true } },
      },
    });
    if (!req) return { success: false, error: "Solicitud no encontrada." };
    if (req.status !== "pending") {
      return { success: false, error: "Ya fue procesada." };
    }

    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        reviewed_at: new Date(),
        reviewed_by_id: user.id,
        rejection_reason: trimmedReason || null,
      },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "reject.vet_license",
      resourceType: "vet_profile",
      resourceId: req.vet_id,
      metadata: { requestId, reason: trimmedReason },
    });

    // Email
    const admin = createSupabaseAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(
      req.vet.user_id,
    );
    const email = userData?.user?.email;
    if (email) {
      const tpl = verificationRejectedTemplate({
        vetName: req.vet.full_name,
        reason: trimmedReason,
      });
      const sent = await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
      });
      await prisma.emailLog.create({
        data: {
          to_user_id: req.vet.user_id,
          to_email: email,
          type: "verification_rejected",
          subject: tpl.subject,
          status: sent.success ? "sent" : "failed",
          error_msg: sent.error ?? null,
        },
      });
    }

    await prisma.notification.create({
      data: {
        user_id: req.vet.user_id,
        type: "verification_rejected",
        title: "Verificación rechazada",
        body: trimmedReason || "Podés volver a solicitarla con otra foto.",
        link: "/vet/plan",
      },
    });

    revalidatePath("/admin/verifications");
    revalidatePath(`/admin/vets/${req.vet_id}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Sin permisos." };
    }
    logError("rejectVerification", error);
    return { success: false, error: "No se pudo rechazar." };
  }
}

// ─── Suspender / reactivar suscripción ────────────────────────────

export async function suspendSubscription(vetId: string, reason: string) {
  try {
    const { user } = await requireAdmin();
    const trimmed = reason.trim().slice(0, 500);

    const sub = await prisma.subscription.findUnique({
      where: { vet_id: vetId },
    });
    if (!sub) return { success: false, error: "Sin suscripción." };

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "suspended", notes: trimmed || sub.notes },
    });

    await writeAuditLog({
      actorId: user.id,
      action: "suspend.subscription",
      resourceType: "subscription",
      resourceId: sub.id,
      metadata: { vetId, reason: trimmed },
    });

    revalidatePath(`/admin/vets/${vetId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Sin permisos." };
    }
    logError("suspendSubscription", error);
    return { success: false, error: "No se pudo suspender." };
  }
}
