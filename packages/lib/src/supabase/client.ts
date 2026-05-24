import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador.
 * Usa la anon key — RLS valida los permisos.
 *
 * Sesión persistente de 30 días con refresh automático del access token.
 * Reducido desde 1 año (audit ALTO-9). Si el usuario está inactivo 30+
 * días, debe volver a loguearse.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o ANON_KEY");
  }

  return createBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: "lax", // requerido para OAuth callback (Google)
      secure: true,
    },
  });
}
