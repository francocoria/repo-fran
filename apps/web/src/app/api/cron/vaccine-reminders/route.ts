import { NextResponse } from "next/server";
import { prisma } from "@pet-app/db";
import { sendEmail, vaccineReminderTemplate } from "@pet-app/emails";
import { createSupabaseAdminClient } from "@pet-app/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const REMINDER_WINDOWS = [7, 1, 0, -1, -7];
const DAYS_BEFORE_RESEND = 6;

export async function GET(request: Request) {
  const unauthorized = verifyCronAuth(request);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const startWindow = new Date(now);
  startWindow.setDate(startWindow.getDate() - 7);
  startWindow.setHours(0, 0, 0, 0);
  const endWindow = new Date(now);
  endWindow.setDate(endWindow.getDate() + 14);
  endWindow.setHours(23, 59, 59, 999);

  const candidates = await prisma.vaccine.findMany({
    where: {
      next_dose_date: { gte: startWindow, lte: endWindow },
    },
    select: {
      id: true,
      name: true,
      next_dose_date: true,
      animal: {
        select: {
          id: true,
          name: true,
          status: true,
          owner_profile: {
            select: { user_id: true, full_name: true },
          },
        },
      },
    },
  });

  const admin = createSupabaseAdminClient();
  const resendThreshold = new Date(
    Date.now() - DAYS_BEFORE_RESEND * 24 * 60 * 60 * 1000,
  );

  let sent = 0;
  let skippedRecent = 0;
  let skippedNoEmail = 0;
  let skippedArchived = 0;

  for (const v of candidates) {
    if (!v.next_dose_date) continue;
    if (v.animal.status === "archived") {
      skippedArchived++;
      continue;
    }

    const nextDose = new Date(v.next_dose_date);
    const msPerDay = 1000 * 60 * 60 * 24;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextDose);
    target.setHours(0, 0, 0, 0);
    const daysUntil = Math.round(
      (target.getTime() - today.getTime()) / msPerDay,
    );

    if (!REMINDER_WINDOWS.includes(daysUntil)) continue;

    const recent = await prisma.emailLog.findFirst({
      where: {
        to_user_id: v.animal.owner_profile.user_id,
        type: "vaccine_reminder",
        sent_at: { gte: resendThreshold },
        subject: { contains: v.animal.name },
      },
    });
    if (recent) {
      skippedRecent++;
      continue;
    }

    const { data: userData } = await admin.auth.admin.getUserById(
      v.animal.owner_profile.user_id,
    );
    const email = userData?.user?.email;
    if (!email) {
      skippedNoEmail++;
      continue;
    }

    const tpl = vaccineReminderTemplate({
      ownerName: v.animal.owner_profile.full_name,
      animalName: v.animal.name,
      animalId: v.animal.id,
      vaccineName: v.name,
      nextDoseDate: v.next_dose_date,
      daysUntil,
    });

    const result = await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
    });

    await prisma.emailLog.create({
      data: {
        to_user_id: v.animal.owner_profile.user_id,
        to_email: email,
        type: "vaccine_reminder",
        subject: tpl.subject,
        status: result.success ? "sent" : "failed",
        error_msg: result.error ?? null,
      },
    });

    if (result.success) {
      sent++;
      await prisma.notification.create({
        data: {
          user_id: v.animal.owner_profile.user_id,
          type: "vaccine_reminder",
          title:
            daysUntil < 0
              ? `Vacuna vencida: ${v.animal.name}`
              : daysUntil === 0
                ? `Hoy: vacuna de ${v.animal.name}`
                : `Próxima vacuna: ${v.animal.name}`,
          body: `${v.name} — ${v.next_dose_date.toLocaleDateString("es-AR")}`,
          link: `/app/animals/${v.animal.id}`,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    candidates: candidates.length,
    sent,
    skippedRecent,
    skippedNoEmail,
    skippedArchived,
  });
}
