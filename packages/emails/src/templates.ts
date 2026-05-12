import { emailLayout, button, infoBox, escape } from "./layout";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://petapp-one.vercel.app";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "PetApp";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function greeting(name: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0c0a09;">Hola <strong>${escape(name)}</strong>,</p>`;
}

function paragraph(text: string, size = 15): string {
  return `<p style="margin:0 0 14px;font-size:${size}px;line-height:1.55;color:#3f3f3f;">${text}</p>`;
}

// ─── Premium activado ──────────────────────────────────────────────

export interface PremiumActivatedData {
  vetName: string;
  expiresAt: Date | string;
  monthsGranted: number;
}

export function premiumActivatedTemplate(data: PremiumActivatedData) {
  const subject = "🎉 Tu plan Premium ya está activo";
  const body = `
${greeting(data.vetName)}
${paragraph("Activamos tu plan <strong>Premium</strong>. Ya tenés acceso a todos los beneficios profesionales.")}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
<tr><td style="padding:18px 20px;">
<p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#78716c;">Vence</p>
<p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#0c0a09;">${fmtDate(data.expiresAt)}</p>
<p style="margin:6px 0 0;font-size:13px;color:#78716c;">${data.monthsGranted} mes${data.monthsGranted !== 1 ? "es" : ""} de Premium</p>
</td></tr>
</table>
</td></tr>
</table>

${paragraph("<strong>Lo que se desbloquea:</strong>")}
<ul style="margin:0 0 18px;padding-left:20px;font-size:14px;line-height:1.7;color:#3f3f3f;">
<li>Pacientes ilimitados</li>
<li>Certificados profesionales en PDF</li>
<li>Recetas con tu marca</li>
<li>Estadísticas de práctica</li>
<li>Plantillas de consulta propias</li>
</ul>

${button(`${APP_URL}/vet/plan`, "Ver mi plan", "gold")}

${paragraph("Cualquier duda, respondé este email.", 13)}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu plan Premium ya está activo en PetApp",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
      heroBackground: "linear-gradient(135deg,#f59e0b 0%,#fbbf24 60%,#fb923c 100%)",
      heroIcon: "👑",
    }),
  };
}

// ─── Premium por vencer ────────────────────────────────────────────

export interface PremiumExpiringSoonData {
  vetName: string;
  expiresAt: Date | string;
  daysLeft: number;
}

export function premiumExpiringSoonTemplate(data: PremiumExpiringSoonData) {
  const dayStr = data.daysLeft === 1 ? "día" : "días";
  const subject = `⏳ Tu Premium vence en ${data.daysLeft} ${dayStr}`;
  const body = `
${greeting(data.vetName)}
${paragraph(`Tu plan <strong>Premium</strong> vence el <strong>${fmtDate(data.expiresAt)}</strong> (en ${data.daysLeft} ${dayStr}).`)}

${infoBox(`Si no renovás, vas a perder los beneficios premium (pacientes ilimitados, certificados, branding). <strong>Tu historial se mantiene intacto.</strong>`, "warning")}

${paragraph("Para renovar, escribinos por WhatsApp desde la app o respondé este email.")}

${button(`${APP_URL}/vet/plan`, "Renovar Premium", "gold")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: `Tu plan vence en ${data.daysLeft} ${dayStr}.`,
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
      heroBackground: "linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)",
      heroIcon: "⏳",
    }),
  };
}

// ─── Premium vencido ───────────────────────────────────────────────

export interface PremiumExpiredData {
  vetName: string;
  expiredAt: Date | string;
}

export function premiumExpiredTemplate(data: PremiumExpiredData) {
  const subject = "Tu plan Premium venció";
  const body = `
${greeting(data.vetName)}
${paragraph(`Tu plan Premium venció el <strong>${fmtDate(data.expiredAt)}</strong>.`)}
${paragraph("Volviste al <strong>plan gratis</strong> con cap de 5 pacientes activos. <strong>Tu historial y consultas siguen disponibles</strong> — solo se bloquean los features premium.")}

${infoBox("Reactivá Premium cuando quieras desde la app. No perdés nada.", "info")}

${button(`${APP_URL}/vet/plan`, "Reactivar Premium", "gold")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu plan Premium venció. Volviste al plan gratis.",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
      heroIcon: "📅",
    }),
  };
}

// ─── Verificación aprobada ─────────────────────────────────────────

export interface VerificationApprovedData {
  vetName: string;
}

export function verificationApprovedTemplate(data: VerificationApprovedData) {
  const subject = "✅ Tu matrícula fue verificada";
  const body = `
${greeting(data.vetName)}
${paragraph("Aprobamos tu solicitud de verificación. Ya tenés un <strong>badge azul de verificado</strong> visible para los dueños de mascotas.")}

${infoBox("Esto les da más confianza al elegir un vet y aprueba tus solicitudes de acceso más rápido.", "success")}

${button(`${APP_URL}/vet/plan`, "Ver mi perfil", "accent")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu matrícula fue verificada en PetApp",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
      heroBackground: "linear-gradient(135deg,#3b82f6 0%,#06b6d4 100%)",
      heroIcon: "🛡️",
    }),
  };
}

// ─── Verificación rechazada ────────────────────────────────────────

export interface VerificationRejectedData {
  vetName: string;
  reason?: string;
}

export function verificationRejectedTemplate(data: VerificationRejectedData) {
  const subject = "Tu solicitud de verificación fue rechazada";
  const body = `
${greeting(data.vetName)}
${paragraph("Tu solicitud de verificación de matrícula fue rechazada.")}

${data.reason ? infoBox(`<strong>Motivo:</strong> ${escape(data.reason)}`, "rose") : ""}

${paragraph("Podés volver a solicitarla con una foto más clara o que muestre todos los datos de la matrícula.")}

${button(`${APP_URL}/vet/plan/verify`, "Volver a solicitar")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu solicitud de verificación fue rechazada.",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
      heroIcon: "🛡️",
    }),
  };
}

// ─── Acceso aprobado (lado vet) ────────────────────────────────────

export interface VetAccessApprovedData {
  vetName: string;
  animalName: string;
  ownerName: string;
}

export function vetAccessApprovedTemplate(data: VetAccessApprovedData) {
  const subject = `${data.animalName} ya está en tus pacientes`;
  const body = `
${greeting(data.vetName)}
${paragraph(`<strong>${escape(data.ownerName)}</strong> aprobó tu solicitud de acceso al historial de <strong>${escape(data.animalName)}</strong>.`)}
${paragraph("Ya podés ver el historial completo y registrar consultas.")}

${button(`${APP_URL}/vet/patients`, "Ver paciente", "accent")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: `${data.ownerName} aprobó tu acceso a ${data.animalName}.`,
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
      heroIcon: "🐾",
    }),
  };
}

// ─── Recordatorio de vacuna ────────────────────────────────────────

export interface VaccineReminderData {
  ownerName: string;
  animalName: string;
  animalId: string;
  vaccineName: string;
  nextDoseDate: Date | string;
  daysUntil: number;
}

export function vaccineReminderTemplate(data: VaccineReminderData) {
  const overdue = data.daysUntil < 0;
  const daysAbs = Math.abs(data.daysUntil);
  const subject = overdue
    ? `⚠️ Vacuna vencida de ${data.animalName}`
    : daysAbs === 0
      ? `📅 ${data.animalName} se vacuna hoy`
      : `📅 ${data.animalName} se vacuna en ${daysAbs} día${daysAbs !== 1 ? "s" : ""}`;

  const body = `
${greeting(data.ownerName)}
${paragraph(
  overdue
    ? `La vacuna <strong>${escape(data.vaccineName)}</strong> de <strong>${escape(data.animalName)}</strong> está vencida desde el <strong>${fmtDate(data.nextDoseDate)}</strong>.`
    : daysAbs === 0
      ? `Hoy le toca a <strong>${escape(data.animalName)}</strong> la vacuna <strong>${escape(data.vaccineName)}</strong>.`
      : `<strong>${escape(data.animalName)}</strong> tiene que vacunarse en <strong>${daysAbs} día${daysAbs !== 1 ? "s" : ""}</strong>: <strong>${escape(data.vaccineName)}</strong> (${fmtDate(data.nextDoseDate)}).`,
)}

${infoBox(
  overdue
    ? "Las vacunas vencidas pueden generar problemas serios de salud. Coordiná un turno con tu vet lo antes posible."
    : "Coordiná un turno con tu vet con anticipación.",
  overdue ? "rose" : "info",
)}

${button(`${APP_URL}/app/animals/${data.animalId}`, `Ver perfil de ${data.animalName}`)}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: overdue
        ? `Vacuna vencida hace ${daysAbs} día${daysAbs !== 1 ? "s" : ""}`
        : `Próxima dosis en ${daysAbs} día${daysAbs !== 1 ? "s" : ""}`,
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
      heroBackground: overdue
        ? "linear-gradient(135deg,#fb7185 0%,#e11d48 100%)"
        : "linear-gradient(135deg,#5eead4 0%,#06b6d4 100%)",
      heroIcon: "💉",
    }),
  };
}
