import Link from "next/link";
import Image from "next/image";
import { Brand, Badge } from "@pet-app/ui";
import {
  AlertTriangle,
  MapPin,
  Calendar,
  ChevronRight,
  Search,
  Dog,
  Cat,
  Bird,
  Rabbit,
  PawPrint,
  ChevronLeft,
} from "lucide-react";
import { prisma } from "@pet-app/db";
import { getUser, getUserRole } from "@/lib/auth";

export const metadata = {
  title: "Mascotas perdidas",
  description:
    "Mascotas reportadas como perdidas. Si viste alguna, contactá al dueño directamente.",
};

export const dynamic = "force-dynamic";

const speciesLabels: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  rodent: "Roedor",
  reptile: "Reptil",
  fish: "Pez",
  exotic: "Exótico",
  other: "Otro",
};

const speciesIcons: Record<string, React.ComponentType<{ className?: string }>> =
  {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
  };

function formatRelativeDate(d: Date): string {
  const now = Date.now();
  const ms = now - d.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default async function LostFeedPage() {
  // Detectamos si el visitante tiene sesión para adaptar el header
  // (mostrar "Volver a tu panel" en vez de "Iniciar sesión").
  const user = await getUser();
  const role = user ? await getUserRole(user.id) : null;
  const dashboardHref =
    role === "vet" ? "/vet" : role === "admin" ? "/admin" : "/app";

  const alerts = await prisma.lostPetAlert.findMany({
    where: { status: "active" },
    orderBy: { activated_at: "desc" },
    take: 100,
    select: {
      id: true,
      public_slug: true,
      activated_at: true,
      last_seen_location: true,
      contact_name: true,
      reward_description: true,
      animal: {
        select: {
          name: true,
          species: true,
          breed: true,
          photo_url: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href={user ? dashboardHref : "/"} aria-label="Inicio">
            <Brand size="md" />
          </Link>
          {user ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Volver
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      <main className="container max-w-5xl py-8 md:py-12">
        {/* Hero */}
        <div className="mb-8 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 md:size-14">
            <AlertTriangle className="size-6 md:size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Mascotas perdidas
            </h1>
            <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground md:text-[15px]">
              {alerts.length === 0
                ? "Por suerte, no hay mascotas reportadas como perdidas en este momento."
                : `${alerts.length} ${alerts.length === 1 ? "mascota está" : "mascotas están"} buscando volver a casa. Si viste alguna, abrí su perfil y contactá al dueño.`}
            </p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 py-16 text-center">
            <PawPrint className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Esta página se actualiza en tiempo real. Volvé más tarde.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => {
              const Icon = speciesIcons[alert.animal.species] ?? PawPrint;
              return (
                <li key={alert.id}>
                  <Link
                    href={`/lost/${alert.public_slug}`}
                    className="group block focus-ring rounded-2xl"
                  >
                    <article className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-rose-300/60 hover:shadow-lg dark:hover:border-rose-800/50">
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                        {alert.animal.photo_url ? (
                          <Image
                            src={alert.animal.photo_url}
                            alt={alert.animal.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                            <Icon className="size-12" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3">
                          <Badge variant="rose" size="md" className="shadow">
                            <AlertTriangle className="size-3" />
                            PERDIDA
                          </Badge>
                        </div>
                        {alert.reward_description && (
                          <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10.5px] font-semibold text-white shadow">
                            Recompensa
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="truncate text-[17px] font-semibold tracking-tight">
                            {alert.animal.name}
                          </h2>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {speciesLabels[alert.animal.species] ??
                            alert.animal.species}
                          {alert.animal.breed && ` · ${alert.animal.breed}`}
                        </p>

                        <div className="mt-3 space-y-1 text-[12.5px] text-muted-foreground">
                          {alert.last_seen_location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3.5 shrink-0" />
                              <span className="truncate">
                                {alert.last_seen_location}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 shrink-0" />
                            <span>
                              {formatRelativeDate(new Date(alert.activated_at))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {user ? (
          <section className="mt-12 rounded-2xl border border-border bg-surface-2/40 p-5">
            <div className="flex items-start gap-3">
              <Search className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold">
                  ¿Perdiste a una de tus mascotas?
                </h2>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  Andá al perfil de tu mascota y activá el modo perdido.
                  Genera una página pública con tus datos para que cualquiera
                  que la encuentre pueda contactarte.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Ir a mis mascotas
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-12 rounded-2xl border border-border bg-surface-2/40 p-5">
            <div className="flex items-start gap-3">
              <Search className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold">¿Perdiste a tu mascota?</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  Si tenés una cuenta, entrá a tu mascota y activá el modo
                  perdido. Genera una página pública con tus datos para que
                  cualquiera que la encuentre pueda contactarte. Si todavía no
                  te registraste, podés hacerlo gratis y activar el modo
                  perdido en segundos.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    Crear cuenta gratis
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
          <span>PetApp · Centro de salud para tu mascota</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Términos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
