interface LayoutOpts {
  title: string;
  preheader?: string;
  appName?: string;
  appUrl?: string;
  body: string;
  heroBackground?: string;
  heroIcon?: string;
}

export function emailLayout({
  title,
  preheader = "",
  appName = "PetApp",
  appUrl = "https://petapp-one.vercel.app",
  body,
  heroBackground = "linear-gradient(135deg,#5eead4 0%,#06b6d4 60%,#0891b2 100%)",
  heroIcon = "🐾",
}: LayoutOpts): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Helvetica,Arial,sans-serif;color:#0c0a09;">
<div style="display:none;font-size:1px;color:#fafaf9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
${escape(preheader)}
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafaf9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(12,10,9,.04),0 4px 12px rgba(12,10,9,.06);">

<tr><td style="background:${heroBackground};padding:28px 32px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td valign="middle" style="background:rgba(255,255,255,.2);border-radius:10px;width:36px;height:36px;text-align:center;">
<span style="font-size:20px;line-height:36px;">${heroIcon}</span>
</td>
<td valign="middle" style="padding-left:10px;">
<span style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#0c0a09;">Pet</span><span style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;">App</span>
</td>
</tr></table>
</td></tr>

<tr><td style="padding:32px 36px;">
${body}
</td></tr>

<tr><td style="padding:20px 36px;background-color:#fafaf9;border-top:1px solid #e7e5e4;text-align:center;">
<p style="margin:0;font-size:12px;color:#78716c;line-height:1.5;">
Recibís este email porque sos usuario de ${escape(appName)}.
</p>
<p style="margin:6px 0 0;font-size:11px;">
<a href="${escape(appUrl)}" style="color:#7c3aed;text-decoration:none;font-weight:500;">Abrir la app →</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function button(
  href: string,
  label: string,
  variant: "primary" | "accent" | "rose" | "gold" = "primary",
): string {
  const colors = {
    primary: "#7c3aed",
    accent: "#06b6d4",
    rose: "#e11d48",
    gold: "linear-gradient(135deg,#f59e0b,#fbbf24)",
  };
  const bg = colors[variant];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;"><tr><td>
<a href="${escape(href)}" style="display:inline-block;padding:12px 24px;background:${bg};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">${escape(label)}</a>
</td></tr></table>`;
}

export function infoBox(
  content: string,
  tone: "info" | "warning" | "rose" | "success" = "info",
): string {
  const styles = {
    info: { bg: "#f0f9ff", border: "#bae6fd", color: "#075985" },
    warning: { bg: "#fef9c3", border: "#fde68a", color: "#854d0e" },
    rose: { bg: "#ffe4e6", border: "#fda4af", color: "#9f1239" },
    success: { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46" },
  }[tone];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;background:${styles.bg};border:1px solid ${styles.border};border-radius:10px;"><tr><td style="padding:12px 14px;"><p style="margin:0;font-size:13px;color:${styles.color};line-height:1.5;">${content}</p></td></tr></table>`;
}

export function escape(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
