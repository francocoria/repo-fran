import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth callback — Supabase redirige acá después de magic link / OAuth.
 *
 * Flujo:
 * 1. Intercambia el code por sesión
 * 2. Redirige a la URL indicada en `redirectTo`, o al onboarding si no tiene perfil
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/app";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Verificar si el usuario ya tiene perfil
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Verificar si ya tiene perfil — si no, mandarlo a onboarding
        const { data: ownerProfile } = await supabase
          .from("owner_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        const { data: vetProfile } = await supabase
          .from("vet_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!ownerProfile && !vetProfile) {
          // Usuario nuevo — elegir tipo de cuenta
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Si es vet y viene sin redirect específico, mandarlo a /vet
        if (vetProfile && redirectTo === "/app") {
          return NextResponse.redirect(`${origin}/vet`);
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Si falla el code, redirigir a login con error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
