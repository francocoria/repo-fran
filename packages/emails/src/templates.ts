import { emailLayout, button, infoBox, escape } from "./layout";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-friendly.fun";
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

// ─── Invitación a co-dueño ─────────────────────────────────────────

export interface CoOwnerInvitedData {
  /** Nombre del que invita (dueño principal) */
  inviterName: string;
  /** Nombre de la mascota */
  animalName: string;
  /** Especie (para el copy: "perro", "gata", etc.) */
  animalSpecies?: string;
  /** Foto opcional para mostrar embebida en el mail */
  animalPhotoUrl?: string | null;
  /** Nombre del invitado (si lo conocemos) */
  inviteeName?: string | null;
  /** ¿La cuenta ya existe? (afecta el CTA) */
  recipientHasAccount: boolean;
}

const SPECIES_LABEL: Record<string, string> = {
  dog: "perro",
  cat: "gato",
  bird: "ave",
  rabbit: "conejo",
  rodent: "roedor",
  reptile: "reptil",
  fish: "pez",
  exotic: "mascota exótica",
  other: "mascota",
};

export function coOwnerInvitedTemplate(data: CoOwnerInvitedData) {
  const subject = `${escape(data.inviterName)} te invitó a cuidar a ${escape(data.animalName)} en PetApp`;
  const speciesNoun =
    SPECIES_LABEL[data.animalSpecies ?? "other"] ?? "mascota";
  const ctaUrl = data.recipientHasAccount
    ? `${APP_URL}/app/access`
    : `${APP_URL}/signup`;
  const ctaLabel = data.recipientHasAccount
    ? "Aceptar invitación"
    : "Crear cuenta gratis y aceptar";
  const greetingName = data.inviteeName ? escape(data.inviteeName) : "hola";

  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#fef9f3;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0c0a09;-webkit-font-smoothing:antialiased;">

<div style="display:none;font-size:1px;color:#fef9f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
${escape(data.inviterName)} quiere compartir el cuidado de ${escape(data.animalName)} con vos en PetApp.
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef9f3;padding:48px 16px;">
<tr><td align="center">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:20px;border:1px solid #f3e8d8;overflow:hidden;box-shadow:0 1px 2px rgba(124,58,237,0.04),0 8px 24px rgba(12,10,9,0.06);">

<!-- HERO -->
<tr><td style="background:linear-gradient(180deg,#fef3eb 0%,#ffffff 100%);padding:36px 40px 32px;text-align:center;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td style="background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#22d3ee 100%);border-radius:20px;width:72px;height:72px;text-align:center;line-height:72px;box-shadow:0 4px 14px rgba(124,58,237,0.35);">
<span style="font-size:36px;line-height:72px;">🐾</span>
</td>
</tr></table>

<div style="margin-top:18px;font-size:18px;font-weight:800;letter-spacing:-0.02em;line-height:1;">
<span style="color:#0c0a09;">Pet</span><span style="color:#7c3aed;">App</span>
</div>

<p style="margin:14px 0 0;display:inline-block;background:#faf5ff;color:#7c3aed;font-size:10.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;padding:5px 12px;border-radius:999px;">
Invitación a co-dueño
</p>

</td></tr>

<!-- TITLE -->
<tr><td style="padding:8px 40px 0;text-align:center;">
<h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.025em;color:#0c0a09;line-height:1.2;">
${greetingName === "hola" ? "Te invitan a cuidar" : `${greetingName}, te invitan a cuidar`} a <span style="color:#7c3aed;">${escape(data.animalName)}</span>
</h1>
<p style="margin:14px auto 0;max-width:360px;font-size:14.5px;color:#57534e;line-height:1.55;">
<strong>${escape(data.inviterName)}</strong> quiere compartir el cuidado de su ${speciesNoun} con vos. Como co-dueño vas a poder ver el historial completo y agregar info.
</p>
</td></tr>

${
  data.animalPhotoUrl
    ? `
<!-- PHOTO -->
<tr><td style="padding:24px 40px 0;text-align:center;">
<img src="${escape(data.animalPhotoUrl)}" alt="${escape(data.animalName)}" width="180" height="180" style="border-radius:90px;border:3px solid #ffffff;box-shadow:0 4px 14px rgba(12,10,9,0.12);object-fit:cover;">
</td></tr>
`
    : ""
}

<!-- DIVIDER -->
<tr><td style="padding:32px 40px 0;text-align:center;">
<div style="height:1px;background:linear-gradient(90deg,transparent 0%,#7c3aed 30%,#22d3ee 70%,transparent 100%);opacity:0.25;"></div>
<p style="margin:20px 0 0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c3aed;">
Lo que vas a poder hacer
</p>
</td></tr>

<!-- FEATURE 01 -->
<tr><td style="padding:20px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf5ff;border:1px solid #ede9fe;border-radius:12px;">
<tr><td style="padding:14px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td valign="top" style="width:38px;">
<div style="background:#ffffff;border:1px solid #ddd6fe;border-radius:8px;width:30px;height:30px;text-align:center;line-height:30px;font-family:'SF Mono',ui-monospace,monospace;font-size:10.5px;font-weight:700;color:#7c3aed;">01</div>
</td>
<td>
<p style="margin:0;font-size:14px;font-weight:700;color:#0c0a09;line-height:1.3;">
Ver el historial completo
</p>
<p style="margin:2px 0 0;font-size:12.5px;color:#57534e;line-height:1.5;">
Vacunas, peso, alergias, medicaciones y consultas de ${escape(data.animalName)}.
</p>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- FEATURE 02 -->
<tr><td style="padding:10px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fdf4ff;border:1px solid #f5d0fe;border-radius:12px;">
<tr><td style="padding:14px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td valign="top" style="width:38px;">
<div style="background:#ffffff;border:1px solid #f5d0fe;border-radius:8px;width:30px;height:30px;text-align:center;line-height:30px;font-family:'SF Mono',ui-monospace,monospace;font-size:10.5px;font-weight:700;color:#a21caf;">02</div>
</td>
<td>
<p style="margin:0;font-size:14px;font-weight:700;color:#0c0a09;line-height:1.3;">
Agregar info en el momento
</p>
<p style="margin:2px 0 0;font-size:12.5px;color:#57534e;line-height:1.5;">
Si estás cuidándola, cargá un peso o registrá la consulta vet desde tu cel.
</p>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- FEATURE 03 -->
<tr><td style="padding:10px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
<tr><td style="padding:14px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td valign="top" style="width:38px;">
<div style="background:#ffffff;border:1px solid #a5f3fc;border-radius:8px;width:30px;height:30px;text-align:center;line-height:30px;font-family:'SF Mono',ui-monospace,monospace;font-size:10.5px;font-weight:700;color:#0891b2;">03</div>
</td>
<td>
<p style="margin:0;font-size:14px;font-weight:700;color:#0c0a09;line-height:1.3;">
Avisos en tiempo real
</p>
<p style="margin:2px 0 0;font-size:12.5px;color:#57534e;line-height:1.5;">
Te llegan los recordatorios de vacunas y antiparasitarios igual que al dueño.
</p>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:32px 40px 8px;text-align:center;">
<a href="${escape(ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%);color:#ffffff;font-size:14.5px;font-weight:600;letter-spacing:-0.01em;padding:14px 28px;border-radius:12px;text-decoration:none;box-shadow:0 4px 14px rgba(124,58,237,0.35);">
${escape(ctaLabel)}
</a>
</td></tr>

${
  data.recipientHasAccount
    ? `
<tr><td style="padding:12px 40px 0;text-align:center;">
<p style="margin:0;font-size:12px;color:#78716c;line-height:1.5;">
Entrá a PetApp con tu cuenta y aceptá la invitación desde la solapa <strong>Accesos</strong>.
</p>
</td></tr>
`
    : `
<tr><td style="padding:12px 40px 0;text-align:center;">
<p style="margin:0;font-size:12px;color:#78716c;line-height:1.5;">
Es gratis. Después de registrarte vas a ver la invitación pendiente.
</p>
</td></tr>
`
}

<!-- SECURITY NOTE -->
<tr><td style="padding:32px 40px 36px;text-align:center;">
<p style="margin:0;font-size:12.5px;color:#78716c;line-height:1.6;">
¿No conocés a ${escape(data.inviterName)} o no esperabas esto? Ignorá este email. Mientras no aceptes, no tenés acceso a ningún dato.
</p>
</td></tr>

</table>

<!-- FOOTER -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin-top:20px;">
<tr><td style="padding:0 40px 8px;text-align:center;">
<p style="margin:0;font-size:18px;line-height:1;letter-spacing:0.15em;">
<span>🐶</span> <span>🐱</span> <span>🐰</span> <span>🐦</span>
</p>
</td></tr>
<tr><td style="padding:8px 40px 0;text-align:center;">
<p style="margin:0;font-size:11.5px;color:#a8a29e;line-height:1.6;">
Hecho con cariño para los que aman a sus mascotas<br>
<a href="${APP_URL}" style="color:#7c3aed;text-decoration:none;font-weight:600;">${escape(APP_URL.replace(/^https?:\/\//, ""))}</a>
</p>
</td></tr>
</table>

</td></tr>
</table>

</body>
</html>`,
  };
}
