import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Brand } from "@pet-app/ui";
import {
  AlertTriangle,
  MapPin,
  Calendar,
  Search,
  Dog,
  Cat,
  Bird,
  Rabbit,
  PawPrint,
  ChevronLeft,
  MessageCircle,
  Map,
  List,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@pet-app/db";
import { getUser, getUserRole } from "@/lib/auth";

export async function generateMetadata() {
  const t = await getTranslations("lost");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export const revalidate = 60;

const speciesIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  rabbit: Rabbit,
};

type LostTranslator = Awaited<ReturnType<typeof getTranslations>>;

const speciesLabelKeys: Record<string, string> = {
  dog: "speciesDog",
  cat: "speciesCat",
  bird: "speciesBird",
  rabbit: "speciesRabbit",
  rodent: "speciesRodent",
  reptile: "speciesReptile",
  fish: "speciesFish",
  exotic: "speciesExotic",
  other: "speciesOther",
};

function speciesLabel(t: LostTranslator, species: string): string {
  const key = speciesLabelKeys[species];
  return key ? t(key as never) : species;
}

function formatRelativeDate(t: LostTranslator, d: Date): string {
  const now = Date.now();
  const ms = now - d.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return t("relativeToday");
  if (days === 1) return t("relativeYesterday");
  if (days < 7) return t("relativeDays", { days });
  if (days < 30) return t("relativeWeeks", { weeks: Math.floor(days / 7) });
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default async function LostFeedPage() {
  const [user, alerts] = await Promise.all([
    getUser(),
    prisma.lostPetAlert.findMany({
      where: { status: "active" },
      orderBy: { activated_at: "desc" },
      take: 100,
      // PII (phone, full_name del dueño) NO se cargan acá — esta página
      // es pública y crawleable. El contacto solo aparece en la página
      // individual /lost/[slug] que requiere conocer el slug random
      // (nanoid 10 chars, ~8.7×10¹⁴ combinaciones).
      select: {
        id: true,
        public_slug: true,
        activated_at: true,
        last_seen_location: true,
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
    }),
  ]);

  const role = user ? await getUserRole(user.id) : null;
  const dashboardHref = role === "vet" ? "/vet" : role === "admin" ? "/admin" : "/app";

  const t = await getTranslations("lost");

  const [featuredAlert, ...restAlerts] = alerts;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href={user ? dashboardHref : "/"} aria-label={t("homeAriaLabel")}>
            <Brand size="md" />
          </Link>
          {user ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              {t("back")}
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t("signIn")}
            </Link>
          )}
        </div>
      </header>

      <main className="container max-w-5xl py-6 md:py-10">
        {/* ─── V2 HERO ─── */}
        <div className="mb-6 flex flex-col items-center text-center">
          {alerts.length > 0 && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
              {alerts.length === 1 ? t("heroCountOne", { count: alerts.length }) : t("heroCountOther", { count: alerts.length }).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Ayudá a que vuelvan a casa
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
            Mascotas perdidas en tu zona. Cualquier información es valiosa.
          </p>
        </div>

        {/* ─── V2 FEED SELECTOR ─── */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
            <button className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors">
              <List className="size-4" />
              Lista
            </button>
            <button className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Map className="size-4" />
              Mapa
            </button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 py-16 text-center">
            <PawPrint className="mx-auto size-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ─── FEATURED CARD V2 ─── */}
            {featuredAlert && (
              <div className="overflow-hidden rounded-3xl border-2 border-rose-500/20 bg-card shadow-lg md:flex transition-all hover:border-rose-500/40">
                <div className="relative aspect-square md:aspect-auto md:w-2/5 shrink-0 bg-secondary">
                  {featuredAlert.animal.photo_url ? (
                    <Image
                      src={featuredAlert.animal.photo_url}
                      alt={featuredAlert.animal.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                      <PawPrint className="size-16" />
                    </div>
                  )}
                  {/* Banner superior destacado */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pt-4">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-md uppercase">
                      <AlertTriangle className="size-3" />
                      Perdido hace {Math.max(1, Math.floor((Date.now() - new Date(featuredAlert.activated_at).getTime()) / (1000 * 60 * 60 * 24)))} días
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">{featuredAlert.animal.name}</h2>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {speciesLabel(t, featuredAlert.animal.species)}
                      {featuredAlert.animal.breed && ` · ${featuredAlert.animal.breed}`}
                    </p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3 rounded-xl bg-secondary/50 p-3">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Última vez visto</p>
                          <p className="text-sm font-medium">{featuredAlert.last_seen_location || "Ubicación desconocida"}</p>
                        </div>
                      </div>
                      
                      {featuredAlert.reward_description && (
                        <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
                          <div className="mt-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">$</div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500">Recompensa</p>
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-400">{featuredAlert.reward_description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {/* El botón WhatsApp directo vivía acá, pero exponía
                        el teléfono del dueño en el HTML del feed público
                        (scrapeable). Ahora hay que entrar al perfil para
                        obtener el contacto (BAJO-4). */}
                    <Link
                      href={`/lost/${featuredAlert.public_slug}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
                    >
                      <MessageCircle className="size-4" />
                      Tengo información
                    </Link>
                    <Link
                      href={`/lost/${featuredAlert.public_slug}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold transition-colors hover:bg-secondary"
                    >
                      Ver perfil completo
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ─── REST OF GRID ─── */}
            {restAlerts.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {restAlerts.map((alert) => {
                  const Icon = speciesIcons[alert.animal.species] ?? PawPrint;
                  return (
                    <li key={alert.id}>
                      <Link href={`/lost/${alert.public_slug}`} className="group block h-full focus-ring rounded-3xl">
                        <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-rose-300/60 hover:shadow-lg dark:hover:border-rose-800/50">
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                            {alert.animal.photo_url ? (
                              <Image
                                src={alert.animal.photo_url}
                                alt={alert.animal.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                                <Icon className="size-12" />
                              </div>
                            )}
                            <div className="absolute left-3 top-3">
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white shadow uppercase tracking-wide">
                                <AlertTriangle className="size-3" />
                                Perdido
                              </div>
                            </div>
                            {alert.reward_description && (
                              <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow uppercase tracking-wide">
                                Recompensa
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h2 className="truncate text-lg font-bold tracking-tight">
                                {alert.animal.name}
                              </h2>
                              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </div>
                            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                              {speciesLabel(t, alert.animal.species)}
                              {alert.animal.breed && ` · ${alert.animal.breed}`}
                            </p>

                            <div className="mt-4 flex flex-col gap-2 text-[12.5px] text-muted-foreground flex-1">
                              {alert.last_seen_location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="size-3.5 shrink-0 text-foreground/50" />
                                  <span className="truncate font-medium">
                                    {alert.last_seen_location}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="size-3.5 shrink-0 text-foreground/50" />
                                <span className="font-medium">
                                  Hace {Math.max(1, Math.floor((Date.now() - new Date(alert.activated_at).getTime()) / (1000 * 60 * 60 * 24)))} días
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
          </div>
        )}
      </main>
    </div>
  );
}
