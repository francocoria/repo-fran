import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Middleware — dos responsabilidades:
 *  1. CSP con nonce dinámico por request (sin 'unsafe-inline' en scripts)
 *  2. Refresca sesión Supabase y protege rutas autenticadas
 *
 * Reglas de auth:
 * - /app/**            → requiere sesión (dueños y vets)
 * - /vet/**            → requiere sesión + rol vet
 * - /admin/**          → requiere sesión + admin_users
 * - /auth/**, /lost/** → públicas
 *
 * El check de rol fino se hace en cada layout/page con server actions
 * que leen RLS — el middleware solo bloquea acceso anónimo.
 */

/**
 * Genera CSP con nonce per-request. 'strict-dynamic' permite a Next.js
 * cargar sus chunks de runtime con el mismo nonce sin tener que
 * whitelistear cada hash. style-src mantiene 'unsafe-inline' porque
 * CSS injection no es vector de XSS y muchos frameworks lo necesitan.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.supabase.co https://maps.googleapis.com https://*.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com https://maps.googleapis.com https://maps.gstatic.com https://images.unsplash.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://places.googleapis.com https://api.resend.com",
    "frame-src 'self' https://*.supabase.co",
    "media-src 'self' blob: https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  // Generamos nonce ANTES de pasar el request a Supabase para que esté
  // disponible en server components vía headers().get('x-nonce').
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  // Exponemos el pathname a los server components (los layouts lo usan
  // para bypassear enforcement de MFA en la propia página de settings).
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Falla cerrada: si no hay env vars, no permitas avanzar a rutas protegidas
    if (isProtectedRoute(request.nextUrl.pathname)) {
      const r = NextResponse.redirect(new URL("/login", request.url));
      r.headers.set("Content-Security-Policy", csp);
      return r;
    }
    response.headers.set("Content-Security-Policy", csp);
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
    const r = NextResponse.redirect(url);
    r.headers.set("Content-Security-Policy", csp);
    return r;
  }

  // CSP al final — Supabase puede haber reasignado `response` en setAll(),
  // así que seteamos el header acá para garantizar que llegue.
  response.headers.set("Content-Security-Policy", csp);
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
