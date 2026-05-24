import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Middleware — refresca sesión Supabase y protege rutas autenticadas.
 *
 * Reglas:
 * - /app/**            → requiere sesión (dueños y vets)
 * - /vet/**            → requiere sesión + rol vet
 * - /admin/**          → requiere sesión + admin_users
 * - /auth/**, /lost/** → públicas
 *
 * El check de rol fino se hace en cada layout/page con server actions
 * que leen RLS — el middleware solo bloquea acceso anónimo.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Falla cerrada: si no hay env vars, no permitas avanzar a rutas protegidas
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Sesión de 30 días con refresh automático (audit ALTO-9).
  // Reducido desde 365 días — Supabase refrescará el access token cada hora.
  // Si el usuario está inactivo 30+ días, debe re-loguearse.
  const PERSISTENT_MAX_AGE = 60 * 60 * 24 * 30; // 30 días en segundos

  // SameSite=Lax es OBLIGATORIO para que el callback OAuth de Google
  // funcione (top-level POST cross-site desde accounts.google.com).
  // Strict bloquearía el flujo de login federado.
  const SAME_SITE: "lax" | "strict" = "lax";

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      maxAge: PERSISTENT_MAX_AGE,
      sameSite: SAME_SITE,
      secure: true,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        // Forzamos maxAge en cada cookie. El Supabase SDK a veces setea
        // cookies sin Max-Age (cookies de sesión que se borran al cerrar
        // el navegador / PWA). Con este override garantizamos persistencia.
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            maxAge: PERSISTENT_MAX_AGE,
            sameSite: SAME_SITE,
            secure: true,
          }),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && isProtectedRoute(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  return response;
}

function isProtectedRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/app") ||
    pathname.startsWith("/vet") ||
    pathname.startsWith("/admin")
  );
}

export const config = {
  matcher: [
    /*
     * Excluir:
     * - _next/static, _next/image (assets de Next)
     * - favicon, robots, sitemap
     * - imágenes y archivos estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
