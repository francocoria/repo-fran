import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components / Server Actions / Route Handlers.
 * Lee cookies para mantener la sesión.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o ANON_KEY");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: true,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Ignorado: setAll falla en Server Components puros (read-only).
          // El middleware se encarga de refrescar cookies en esos casos.
        }
      },
    },
  });
}
