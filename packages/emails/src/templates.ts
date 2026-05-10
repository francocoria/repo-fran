import { emailLayout, button, escape } from "./layout";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://petapp.example.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "PetApp";

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escape(data.vetName)},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
Activamos tu plan <strong>Premium</strong>. Ya tenés acceso a todos los beneficios:
</p>
<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.8;color:#374151;">
<li>Pacientes ilimitados</li>
<li>Certificados profesionales en PDF</li>
<li>Recetas con tu marca</li>
<li>Estadísticas de práctica</li>
<li>Plantillas de consulta propias</li>
</ul>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
<strong>Vence:</strong> ${fmtDate(data.expiresAt)} (${data.monthsGranted} mes${data.monthsGranted !== 1 ? "es" : ""}).
</p>
${button(`${APP_URL}/vet/plan`, "Ver mi plan")}
<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
Cualquier duda, respondé este email.
</p>`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu plan Premium ya está activo en PetApp",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
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
  const subject = `⏳ Tu plan Premium vence en ${data.daysLeft} día${data.daysLeft !== 1 ? "s" : ""}`;
  const body = `
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escape(data.vetName)},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
Tu plan <strong>Premium</strong> vence el <strong>${fmtDate(data.expiresAt)}</strong>.
</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
Si no renovás, vas a perder los beneficios premium (pacientes ilimitados, certificados, branding) y volvés al plan gratis con cap de 5 pacientes activos.
</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
Tu historial y consultas <strong>se mantienen intactos</strong> — solo pierdes acceso a los features premium.
</p>
${button(`${APP_URL}/vet/plan`, "Renovar Premium")}
<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
Para renovar, escribinos por WhatsApp desde la app o respondé este email.
</p>`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: `Tu plan vence en ${data.daysLeft} día${data.daysLeft !== 1 ? "s" : ""}.`,
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
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
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escape(data.vetName)},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
Tu plan Premium venció el <strong>${fmtDate(data.expiredAt)}</strong>.
</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
Volviste al <strong>plan gratis</strong> con cap de 5 pacientes activos. <strong>Tu historial y todas tus consultas siguen disponibles</strong> — solo se bloquean los features premium (certificados, branding propio, ilimitados).
</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
Si querés volver a Premium, escribinos por WhatsApp y lo activamos al toque.
</p>
${button(`${APP_URL}/vet/plan`, "Reactivar Premium")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu plan Premium venció. Volviste al plan gratis.",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
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
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escape(data.vetName)},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
Aprobamos tu solicitud de verificación. Ya tenés un <strong>badge azul de verificado</strong> visible para los dueños de mascotas.
</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
Esto les da más confianza a la hora de elegirte y aprueba tus solicitudes de acceso.
</p>
${button(`${APP_URL}/vet/plan`, "Ver mi perfil")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu matrícula fue verificada en PetApp",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
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
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escape(data.vetName)},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
Tu solicitud de verificación de matrícula fue rechazada.
</p>
${data.reason ? `<p style="margin:0 0 16px;padding:12px 16px;background-color:#fef2f2;border-left:3px solid #dc2626;font-size:14px;line-height:1.6;border-radius:4px;"><strong>Motivo:</strong> ${escape(data.reason)}</p>` : ""}
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
Podés volver a solicitarla con una foto más clara o que muestre todos los datos.
</p>
${button(`${APP_URL}/vet/plan`, "Volver a solicitar")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: "Tu solicitud de verificación fue rechazada.",
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
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
  const subject = `Acceso aprobado: ${data.animalName}`;
  const body = `
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escape(data.vetName)},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
${escape(data.ownerName)} aprobó tu solicitud de acceso al historial de <strong>${escape(data.animalName)}</strong>.
</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
Ya podés ver el historial completo y registrar consultas desde la app.
</p>
${button(`${APP_URL}/vet/patients`, "Ver paciente")}`;

  return {
    subject,
    html: emailLayout({
      title: subject,
      preheader: `${data.ownerName} aprobó tu acceso a ${data.animalName}.`,
      appName: APP_NAME,
      appUrl: APP_URL,
      body,
    }),
  };
}
