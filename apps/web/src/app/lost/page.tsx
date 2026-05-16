import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
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

export async function generateMetadata() {
  const t = await getTranslations("lost");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

// Cacheamos el listado por 60s. Una mascota nueva tarda max 1 min en
// aparecer en el feed — aceptable y dramaticamente mas rapido que
// force-dynamic (que hacia hit a Supabase US-East en cada nav, ~3-5s).
export const revalidate = 60;

const speciesIcons: Record<string, React.ComponentType<{ className?: string }>> =
  {
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
  // Paralelizamos: el fetch de alerts (cacheable 60s) corre en paralelo
  // con el check de auth del visitante. Antes era secuencial: getUser ->
  // getUserRole -> alerts (3 round-trips Argentina <-> Supabase).
  const [user, alerts] = await Promise.all([
    getUser(),
    prisma.lostPetAlert.findMany({
      where: { status: "active" },
      orderBy: { activated_at: "desc" },
      take: 100,
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
  const dashboardHref =
    role === "vet" ? "/vet" : role === "admin" ? "/admin" : "/app";

  const t = await getTranslations("lost");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href={user ? dashboardHref : "/"}
            aria-label={t("homeAriaLabel")}
          >
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
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("signIn")}
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
              {t("heroTitle")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground md:text-[15px]">
              {alerts.length === 0
                ? t("heroEmpty")
                : alerts.length === 1
                  ? t("heroCountOne", { count: alerts.length })
                  : t("heroCountOther", { count: alerts.length })}
            </p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 py-16 text-center">
            <PawPrint className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("emptyState")}
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
                            {t("cardLostBadge")}
                          </Badge>
                        </div>
                        {alert.reward_description && (
                          <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10.5px] font-semibold text-white shadow">
                            {t("cardReward")}
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
                          {speciesLabel(t, alert.animal.species)}
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
                              {formatRelativeDate(
                                t,
                                new Date(alert.activated_at),
                              )}
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
                <h2 className="font-semibold">{t("loggedInTitle")}</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {t("loggedInText")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {t("loggedInCta")}
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
                <h2 className="font-semibold">{t("loggedOutTitle")}</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {t("loggedOutText")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {t("loggedOutCtaSignIn")}
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    {t("loggedOutCtaSignUp")}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
          <span>{t("footerTagline")}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              {t("footerPrivacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {t("footerTerms")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
