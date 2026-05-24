"use server";

import { createSupabaseServerClient } from "@pet-app/lib";
import { requireUser } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { writeAuditLog } from "@/lib/audit";
import { otpVerify, ipKey, rateLimit } from "@/lib/rate-limit";

/**
 * Server actions para MFA TOTP (audit ALTO-10).
 *
 * Flujo de enrollment:
 *   1. enrollTotp() → devuelve QR code + secret + factorId
 *   2. usuario escanea QR con Google Authenticator / Authy / 1Password
 *   3. ingresa código de 6 dígitos → verifyTotpEnrollment(factorId, code)
 *   4. listo: factor pasa a status="verified" y la sesión sube a AAL2
 *
 * Flujo de challenge (post-login si el user ya tiene MFA):
 *   1. verifyOtpCode() exitoso, sesión queda en AAL1
 *   2. middleware/layout detecta requiresMfaChallenge() y redirige
 *      a /auth/mfa-challenge
 *   3. usuario ingresa código → verifyTotpChallenge(factorId, code)
 *   4. sesión sube a AAL2, redirect a la ruta original
 */

type Result<T> = { success: true; data: T } | { success: false; error: string };

export async function enrollTotp(): Promise<
  Result<{ factorId: string; qrCode: string; secret: string }>
> {
  try {
    await requireUser();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `PetApp · ${new Date().toLocaleDateString("es-AR")}`,
    });

    if (error || !data) {
      logError("mfa/enroll", error);
      return {
        success: false,
        error:
          error?.message?.includes("already") || error?.message?.includes("exists")
            ? "Ya tenés un factor pendiente. Cancelalo y empezá de nuevo."
            : "No pudimos generar el código. Reintentá.",
      };
    }

    return {
      success: true,
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code, // SVG data URI
        secret: data.totp.secret, // por si no puede escanear QR
      },
    };
  } catch (error) {
    logError("mfa/enroll", error);
    return { success: false, error: "Error inesperado." };
  }
}

export async function verifyTotpEnrollment(
  factorId: string,
  code: string,
): Promise<Result<{ verified: true }>> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    // Rate limit anti brute-force del 6-digit code
    const ip = await ipKey();
    const limited = await rateLimit(otpVerify, `mfa-enroll:${ip}:${user.id}`);
    if (limited) return { success: false, error: limited };

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challengeData) {
      logError("mfa/verifyEnrollment/challenge", challengeError);
      return { success: false, error: "No pudimos iniciar la verificación." };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.replace(/\s/g, ""),
    });
    if (verifyError) {
      logError("mfa/verifyEnrollment/verify", verifyError);
      return { success: false, error: "Código inválido. Probá de nuevo." };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "enroll.mfa_totp",
      resourceType: "auth_user",
      resourceId: user.id,
      metadata: { factorId },
    });

    return { success: true, data: { verified: true } };
  } catch (error) {
    logError("mfa/verifyEnrollment", error);
    return { success: false, error: "Error inesperado." };
  }
}

export async function verifyTotpChallenge(
  factorId: string,
  code: string,
): Promise<Result<{ verified: true }>> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    // Rate limit del challenge (más estricto que el enroll, es de login)
    const ip = await ipKey();
    const limited = await rateLimit(otpVerify, `mfa-challenge:${ip}:${user.id}`);
    if (limited) return { success: false, error: limited };

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challengeData) {
      logError("mfa/challenge", challengeError);
      return { success: false, error: "No pudimos iniciar el challenge." };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: code.replace(/\s/g, ""),
    });
    if (verifyError) {
      logError("mfa/verify", verifyError);
      return { success: false, error: "Código inválido o expirado." };
    }

    return { success: true, data: { verified: true } };
  } catch (error) {
    logError("mfa/challenge", error);
    return { success: false, error: "Error inesperado." };
  }
}

export async function unenrollTotp(
  factorId: string,
): Promise<Result<{ removed: true }>> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      logError("mfa/unenroll", error);
      return { success: false, error: "No pudimos desactivar MFA." };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "unenroll.mfa_totp",
      resourceType: "auth_user",
      resourceId: user.id,
      metadata: { factorId },
    });

    return { success: true, data: { removed: true } };
  } catch (error) {
    logError("mfa/unenroll", error);
    return { success: false, error: "Error inesperado." };
  }
}
