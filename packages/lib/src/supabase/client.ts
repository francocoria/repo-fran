import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador.
 * Usa la anon key — RLS valida los permisos.
 *
 * Sesión configurada como persistente: cookies con max-age de 1 año,
 * refresh automático del token. La sesión sólo se cierra con signOut()
 * explícito.
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
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: true,
    },
  });
}
