import "server-only";
import { createSupabaseServerClient } from "@pet-app/lib";

/**
 * Helpers de MFA TOTP con Supabase Auth (audit ALTO-10).
 *
 * Patrón de uso:
 *
 *   const { data: factors } = await listFactors();
 *   const totp = factors?.totp?.find(f => f.status === "verified");
 *
 *   // Si quiero forzar AAL2 para una ruta:
 *   const level = await getAuthLevel();
 *   if (totp && level.current !== "aal2") redirect("/auth/mfa-challenge");
 *
 * Supabase MFA usa el concepto AAL (Authenticator Assurance Level):
 *   - aal1 = email + password / magic link (un solo factor)
 *   - aal2 = aal1 + TOTP verificado en esta sesión
 */

export async function listFactors() {
  const supabase = await createSupabaseServerClient();
  return supabase.auth.mfa.listFactors();
}

/**
 * Indica si la sesión actual está en AAL2 (MFA-verified).
 * Si el user NO tiene factores enrolled, current y next son ambos "aal1".
 */
export async function getAuthLevel(): Promise<{
  current: "aal1" | "aal2" | null;
  next: "aal1" | "aal2" | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    current: (data?.currentLevel as "aal1" | "aal2" | null) ?? null,
    next: (data?.nextLevel as "aal1" | "aal2" | null) ?? null,
  };
}

/**
 * `true` si el user tiene al menos un factor TOTP verificado.
 * Útil para mostrar/ocultar UI de "habilitar MFA".
 */
export async function hasVerifiedTotp(): Promise<boolean> {
  const { data } = await listFactors();
  const totp = data?.totp ?? [];
  return totp.some((f) => f.status === "verified");
}

/**
 * `true` si la sesión actual completó el challenge MFA (AAL2).
 * Si el user no tiene factors, también es true (no hay nada que challengear).
 * El gate para rutas sensibles es: requiresMfaChallenge() === true.
 */
export async function requiresMfaChallenge(): Promise<boolean> {
  const level = await getAuthLevel();
  // next === "aal2" significa "tenés factores enrolled y deberías estar en aal2"
  // current !== "aal2" significa "todavía no completaste el challenge"
  return level.next === "aal2" && level.current !== "aal2";
}
