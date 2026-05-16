/**
 * Service Worker servido como route handler (no archivo estático) para
 * poder inyectar el BUILD_ID en cada deploy.
 *
 * Por qué: en cada deploy el contenido del SW cambia (cambia el BUILD_ID)
 * → el browser detecta un SW nuevo → instala la versión nueva → el
 * componente SWRegister muestra el banner "Hay una actualización".
 *
 * Esto soluciona el problema crónico de la PWA iOS que cachea el HTML
 * y nunca veía los cambios sin reinstalar a mano.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// VERCEL_GIT_COMMIT_SHA cambia en cada deploy; fallback a timestamp del build.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.NEXT_PUBLIC_BUILD_ID ??
  String(Date.now());

const SW_SOURCE = `
// PetApp Service Worker — build ${BUILD_ID}
const BUILD_ID = ${JSON.stringify(BUILD_ID)};
const RUNTIME_CACHE = "petapp-runtime-" + BUILD_ID;

// Al instalar, activamos de inmediato (no esperamos a que se cierren tabs).
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Al activar, limpiamos caches viejos y tomamos control de las pestañas.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("petapp-") && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Network-first para navegaciones (HTML) — siempre intentamos traer lo
// más fresco; si no hay red, caemos al cache. Esto evita servir HTML
// viejo del cache de la PWA.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // No interceptamos API, server actions ni assets de _next con hash
  // (esos ya tienen cache-busting propio por el hash en el nombre).
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/sw.js")) return;

  const isNavigation =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || Response.error();
        }
      })(),
    );
  }
});

// El cliente nos avisa que quiere activar la versión nueva ya.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
`;

export async function GET() {
  return new Response(SW_SOURCE, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // El SW NUNCA debe cachearse — siempre se chequea contra el server.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
