import { Brand } from "@pet-app/ui";
import { AlertTriangle } from "lucide-react";

/**
 * Skeleton para /lost — aparece instantáneo mientras se hace el fetch.
 * Antes: pantalla blanca 5s mientras Supabase US-East respondía.
 * Ahora: el usuario ve la estructura al instante y la data llena cuando llega.
 */
export default function LostLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand size="md" />
          <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
        </div>
      </header>

      <main className="container max-w-5xl py-8 md:py-12">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 md:size-14">
            <AlertTriangle className="size-6 md:size-7" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-md bg-secondary md:w-64" />
            <div className="h-4 w-72 animate-pulse rounded bg-secondary/60 md:w-96" />
            <div className="h-4 w-56 animate-pulse rounded bg-secondary/60" />
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card animate-pulse">
                <div className="aspect-[4/3] w-full bg-secondary" />
                <div className="space-y-2 p-4">
                  <div className="h-5 w-32 rounded bg-secondary" />
                  <div className="h-3 w-24 rounded bg-secondary/60" />
                  <div className="mt-3 h-3 w-40 rounded bg-secondary/60" />
                  <div className="h-3 w-20 rounded bg-secondary/60" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
