import { Resend } from "resend";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Override del FROM_EMAIL */
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

let _resend: Resend | null = null;
function getClient(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  _resend = new Resend(apiKey);
  return _resend;
}

/**
 * Envía un email usando Resend.
 * Si no hay RESEND_API_KEY, loggea y retorna success:false (no rompe).
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    console.warn(
      "[email] RESEND_API_KEY no configurada — email no enviado:",
      options.subject,
    );
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const fromAddress =
    options.from ??
    process.env.RESEND_FROM_EMAIL ??
    "PetApp <noreply@example.com>";

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo ?? process.env.RESEND_REPLY_TO,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("[email] Send failed:", err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
