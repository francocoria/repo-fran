import { NextResponse } from "next/server";
import { prisma } from "@pet-app/db";
import {
  sendEmail,
  premiumExpiredTemplate,
  premiumExpiringSoonTemplate,
} from "@pet-app/emails";
import { createSupabaseAdminClient } from "@pet-app/lib/supabase/admin";
import { daysUntilExpiry } from "@pet-app/lib/utils/subscription";
import { verifyCronAuth } from "@/lib/cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cron job — corre diariamente para:
 *  1. Marcar suscripciones vencidas (status: active → expired)
 *  2. Enviar emails de aviso (X días antes) y de vencimiento
 *
 * Configurado en vercel.json. Protegido con CRON_SECRET (Bearer token,
 * comparación timing-safe).
 */
export async function GET(request: Request) {
  const unauthorized = verifyCronAuth(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Service role para leer auth.users
  const admin = createSupabaseAdminClient();

  // ─── 1. EXPIRAR ──────────────────────────────────────────────
  const toExpire = await prisma.subscription.findMany({
    where: {
      status: "active",
      plan: { not: "free" },
      expires_at: { lt: now },
    },
    include: {
      vet: { select: { full_name: true, user_id: true } },
    },
  });

  let expiredCount = 0;
  let expiredEmailsSent = 0;

  for (const sub of toExpire) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "expired" },
    });
    expiredCount++;

    // Email
    const { data: userData } = await admin.auth.admin.getUserById(
      sub.vet.user_id,
    );
    const email = userData?.user?.email;
    if (email && sub.expires_at) {
      const tpl = premiumExpiredTemplate({
        vetName: sub.vet.full_name,
        expiredAt: sub.expires_at,
      });
      const sent = await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
      });

      await prisma.emailLog.create({
        data: {
          to_user_id: sub.vet.user_id,
          to_email: email,
          type: "premium_expired",
          subject: tpl.subject,
          status: sent.success ? "sent" : "failed",
          error_msg: sent.error ?? null,
        },
      });

      if (sent.success) expiredEmailsSent++;
    }

    // Notificación in-app
    await prisma.notification.create({
      data: {
        user_id: sub.vet.user_id,
        type: "premium_expired",
        title: "Tu plan Premium venció",
        body: "Volviste al plan gratis. Podés reactivarlo cuando quieras.",
        link: "/vet/plan",
      },
    });
  }

  // ─── 2. AVISO DE VENCIMIENTO PRÓXIMO ─────────────────────────
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "active",
      plan: { not: "free" },
      expires_at: {
        gte: now,
        lt: sevenDaysFromNow,
      },
    },
    include: {
      vet: { select: { full_name: true, user_id: true } },
    },
  });

  let warningEmailsSent = 0;
  const warningSentSince = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 días atrás

  for (const sub of expiringSoon) {
    if (!sub.expires_at) continue;
    const days = daysUntilExpiry(sub.expires_at);
    if (days === null || days < 1) continue;

    // Evitar duplicar — no enviar si ya hubo uno en los últimos 4 días
    const recent = await prisma.emailLog.findFirst({
      where: {
        to_user_id: sub.vet.user_id,
        type: "premium_expiring_soon",
        sent_at: { gte: warningSentSince },
        status: "sent",
      },
    });
    if (recent) continue;

    const { data: userData } = await admin.auth.admin.getUserById(
      sub.vet.user_id,
    );
    const email = userData?.user?.email;
    if (!email) continue;

    const tpl = premiumExpiringSoonTemplate({
      vetName: sub.vet.full_name,
      expiresAt: sub.expires_at,
      daysLeft: days,
    });
    const sent = await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
    });

    await prisma.emailLog.create({
      data: {
        to_user_id: sub.vet.user_id,
        to_email: email,
        type: "premium_expiring_soon",
        subject: tpl.subject,
        status: sent.success ? "sent" : "failed",
        error_msg: sent.error ?? null,
      },
    });

    if (sent.success) warningEmailsSent++;
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    expired: {
      count: expiredCount,
      emailsSent: expiredEmailsSent,
    },
    warnings: {
      checked: expiringSoon.length,
      emailsSent: warningEmailsSent,
    },
  });
}
