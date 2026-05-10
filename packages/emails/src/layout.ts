/**
 * Wrapper HTML común para todos los emails.
 * Incluye estilos inline para máxima compatibilidad con clientes de email.
 */

interface LayoutOpts {
  title: string;
  preheader?: string;
  appName?: string;
  appUrl?: string;
  body: string;
}

export function emailLayout({
  title,
  preheader = "",
  appName = "PetApp",
  appUrl = "https://petapp.example.com",
  body,
}: LayoutOpts): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:#1a1d23;">
<div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
${escape(preheader)}
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f5f7;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#5eead4 0%,#06b6d4 100%);padding:24px 32px;">
<h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">🐾 ${escape(appName)}</h1>
</td></tr>
<tr><td style="padding:32px;">
${body}
</td></tr>
<tr><td style="padding:24px 32px;background-color:#fafafa;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;text-align:center;">
Recibís este email porque sos usuario de ${escape(appName)}.<br>
<a href="${escape(appUrl)}" style="color:#0d9488;text-decoration:none;">Abrir la app</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td>
<a href="${escape(href)}" style="display:inline-block;padding:12px 24px;background-color:#0d9488;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${escape(label)}</a>
</td></tr></table>`;
}

export function escape(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
