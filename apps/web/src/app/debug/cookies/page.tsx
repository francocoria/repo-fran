import { cookies, headers } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Debug · Cookies" };

/**
 * Página de diagnóstico para inspeccionar las cookies del request.
 * Muestra los nombres y attributes (NO los valores) de las cookies sb-*
 * y permite verificar si están persistiendo correctamente.
 */
export default async function DebugCookiesPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter((c) => c.name.startsWith("sb-"));

  const userAgent = headerStore.get("user-agent") ?? "?";
  const host = headerStore.get("host") ?? "?";
  const referer = headerStore.get("referer") ?? "-";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-bold">Debug · Cookies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta página muestra qué cookies de auth llegan al server en este
          request. Si la sesión no persiste, comparar antes y después de cerrar
          la app.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Request</h2>
        <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs">
          <dt className="font-medium text-muted-foreground">Host</dt>
          <dd className="font-mono break-all">{host}</dd>
          <dt className="font-medium text-muted-foreground">Referer</dt>
          <dd className="font-mono break-all">{referer}</dd>
          <dt className="font-medium text-muted-foreground">User-Agent</dt>
          <dd className="font-mono break-all">{userAgent}</dd>
          <dt className="font-medium text-muted-foreground">Timestamp</dt>
          <dd className="font-mono">{new Date().toISOString()}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">
          Cookies de Supabase ({authCookies.length})
        </h2>
        {authCookies.length === 0 ? (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            No hay cookies sb-* en este request. Vas a ser deslogueado en la
            próxima navegación a una ruta protegida.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {authCookies.map((c) => (
              <li
                key={c.name}
                className="rounded-lg border border-border bg-surface-2/40 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    {c.value.length} chars
                  </span>
                </div>
                <p className="mt-1 break-all font-mono text-[10.5px] text-muted-foreground">
                  {c.value.slice(0, 60)}...
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Otras cookies ({allCookies.length - authCookies.length})</h2>
        {allCookies.length - authCookies.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Ninguna.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs font-mono">
            {allCookies
              .filter((c) => !c.name.startsWith("sb-"))
              .map((c) => (
                <li key={c.name} className="truncate text-muted-foreground">
                  {c.name}
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
        <h3 className="font-semibold text-amber-900 dark:text-amber-200">
          Cómo usar
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-amber-900/80 dark:text-amber-200/80">
          <li>Logueate normal en /login</li>
          <li>Andá a esta página → tomá nota: deberían aparecer 1-2 cookies sb-*</li>
          <li>Cerrá completamente la PWA / navegador</li>
          <li>Reabrila → navegá directo a /debug/cookies (sin pasar por /login)</li>
          <li>
            Si las cookies todavía están → el problema es el middleware o la
            sesión (auth.getUser falla). Si las cookies desaparecieron →
            iOS/browser está borrando las cookies persistentes.
          </li>
        </ol>
      </section>
    </div>
  );
}
