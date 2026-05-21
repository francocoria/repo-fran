import Link from "next/link";
import {
  PlusCircle,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Syringe,
  Pill,
  Dog,
  PawPrint,
  Users,
  Scale,
  Shield,
  Bell,
  QrCode,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  StatCard,
} from "@pet-app/ui";
import { getTranslations } from "next-intl/server";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { getAge, formatDateLong } from "@pet-app/lib/utils/format";
import { QRModal } from "@/components/animal/qr-modal";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("ownerHome");
  return { title: t("metaTitle") };
}

const SPECIES_GRADIENT: Record<string, [string, string]> = {
  dog: ["#7c3aed", "#a855f7"],   // Violet to Purple (matching screenshot 2 Pepe card)
  cat: ["#0d9488", "#14b8a6"],   // Teal
  bird: ["#f59e0b", "#fb923c"],  // Amber/Orange
  rabbit: ["#a78bfa", "#8b5cf6"], // Violet
  rodent: ["#fb7185", "#f43f5e"], // Rose
  reptile: ["#84cc16", "#65a30d"], // Lime
  fish: ["#38bdf8", "#0ea5e9"],   // Sky
  exotic: ["#c084fc", "#a855f7"], // Purple
  other: ["#64748b", "#475569"],  // Slate
};

export default async function OwnerDashboardPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  const t = await getTranslations("ownerHome");
  const tc = await getTranslations("ownerCommon");

  if (!profile) return null;

  const now = new Date();
  const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const ownedAnimals = await prisma.animal.findMany({
    where: { owner_id: profile.id, status: { not: "archived" } },
    include: {
      allergies: { where: { severity: "severe" }, select: { id: true } },
      vaccines: {
        select: { id: true, name: true, next_dose_date: true },
        orderBy: { next_dose_date: "asc" },
      },
      dewormings: {
        select: { id: true, product: true, next_date: true },
        orderBy: { next_date: "asc" },
      },
      medications: {
        where: { active: true },
        select: { id: true },
      },
      weight_entries: { select: { id: true } },
      co_owners: {
        where: { status: "active" },
        select: { id: true, owner_profile: { select: { full_name: true } } },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const coOwnedAnimalsRel = await prisma.coOwner.findMany({
    where: { owner_id: profile.id, status: "active" },
    include: {
      animal: {
        include: {
          allergies: { where: { severity: "severe" }, select: { id: true } },
          vaccines: {
            select: { id: true, name: true, next_dose_date: true },
            orderBy: { next_dose_date: "asc" },
          },
          dewormings: {
            select: { id: true, product: true, next_date: true },
            orderBy: { next_date: "asc" },
          },
          medications: {
            where: { active: true },
            select: { id: true },
          },
          weight_entries: { select: { id: true } },
          co_owners: {
            where: { status: "active" },
            select: {
              id: true,
              owner_profile: { select: { full_name: true } },
            },
          },
        },
      },
    },
    orderBy: { added_at: "desc" },
  });

  // Invitaciones a co-dueño pendientes
  const pendingInvitesCount = await prisma.coOwner.count({
    where: { owner_id: profile.id, status: "pending" },
  });

  const coOwnedAnimals = coOwnedAnimalsRel
    .map((co) => co.animal)
    .filter((a) => a.status !== "archived");

  const allAnimals = [
    ...ownedAnimals.map((a) => ({ ...a, isCoOwned: false })),
    ...coOwnedAnimals.map((a) => ({ ...a, isCoOwned: true })),
  ];

  const firstAnimal = allAnimals[0];

  // ─── Stats ────────────────────────────────────────────────
  const lostCount = allAnimals.filter((a) => a.status === "lost").length;
  const allDoneCount = allAnimals.filter((a) => {
    const severeAllergy = a.allergies.length > 0;
    const overdueVaccine = a.vaccines.some(
      (v) => v.next_dose_date && new Date(v.next_dose_date) < now,
    );
    return !severeAllergy && !overdueVaccine && a.status === "active";
  }).length;

  // Próxima vacuna (la más cercana en el futuro)
  let nextVaccine: { animal: string; name: string; date: Date } | null = null;
  for (const a of allAnimals) {
    for (const v of a.vaccines) {
      if (v.next_dose_date && new Date(v.next_dose_date) >= now) {
        const d = new Date(v.next_dose_date);
        if (!nextVaccine || d < nextVaccine.date) {
          nextVaccine = { animal: a.name, name: v.name, date: d };
        }
      }
    }
  }

  const totalWeightEntries = allAnimals.reduce(
    (sum, a) => sum + a.weight_entries.length,
    0,
  );
  const totalCoOwners = allAnimals.reduce(
    (sum, a) => sum + a.co_owners.length,
    0,
  );
  const firstCoOwner = allAnimals
    .flatMap((a) => a.co_owners)
    .find((co) => co.owner_profile)?.owner_profile?.full_name;

  // ─── Próximos eventos ─────────────────────────────────────
  type UpcomingEvent = {
    id: string;
    icon: LucideIcon;
    tone: "primary" | "amber" | "rose";
    title: string;
    subtitle: string;
    date: Date;
    overdue: boolean;
  };

  const upcoming: UpcomingEvent[] = [];

  for (const a of allAnimals) {
    for (const v of a.vaccines) {
      if (!v.next_dose_date) continue;
      const d = new Date(v.next_dose_date);
      const overdue = d < now;
      if (!overdue && d > in60days) continue;
      upcoming.push({
        id: `vac-${v.id}`,
        icon: overdue ? AlertTriangle : Syringe,
        tone: overdue ? "rose" : "primary",
        title: `${a.name} — ${v.name}`,
        subtitle: overdue ? t("vaccineOverdue") : t("vaccineNextDose"),
        date: d,
        overdue,
      });
    }
    for (const dw of a.dewormings) {
      if (!dw.next_date) continue;
      const d = new Date(dw.next_date);
      const overdue = d < now;
      if (!overdue && d > in60days) continue;
      upcoming.push({
        id: `dw-${dw.id}`,
        icon: overdue ? AlertTriangle : Shield,
        tone: overdue ? "amber" : "primary",
        title: `${a.name} — ${dw.product}`,
        subtitle: overdue
          ? t("dewormingOverdue")
          : t("dewormingNext"),
        date: d,
        overdue,
      });
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcomingTop = upcoming.slice(0, 5);

  return (
    <div className="animate-fade-up space-y-6 md:space-y-8">
      {/* ─── HEADER GREETING (V2 layout) ───────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted-foreground font-medium">{t("greeting")}</p>
          <h1 className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight text-foreground md:text-[32px]">
            {profile.full_name.split(" ")[0]} 👋
          </h1>
          {allAnimals.length > 0 && (
            <p className="mt-1 text-[13px] text-muted-foreground font-medium">
              {allAnimals.length === 1
                ? "1 mascota"
                : `${allAnimals.length} mascotas`}
              {" · "}
              {lostCount > 0 ? (
                <span className="font-semibold text-rose">
                  {t(lostCount === 1 ? "lostOne" : "lostOther", { count: lostCount })}
                </span>
              ) : (
                <span className="lowercase">{t("allInOrder")}</span>
              )}
            </p>
          )}
        </div>

        {/* Notifications & Add Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="relative h-10 w-10 shrink-0 rounded-full border border-border bg-card shadow-sm"
            asChild
          >
            <Link href="/app/notifications">
              <Bell className="h-5 w-5 text-foreground" />
              {lostCount > 0 && (
                <span className="absolute right-3 top-3 flex h-2 w-2 rounded-full bg-rose animate-pulse" />
              )}
            </Link>
          </Button>

          <Button asChild className="hidden md:flex gap-1.5 rounded-xl">
            <Link href="/app/animals/new">
              <PlusCircle className="size-4" />
              {t("addPet")}
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── CO-OWNER INVITATION BANNER ────────────────────────── */}
      {pendingInvitesCount > 0 && (
        <Link
          href="/app/access"
          className="flex items-center justify-between rounded-2xl bg-primary/10 border border-primary/20 p-4 transition-all hover:bg-primary/15"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t(
                  pendingInvitesCount === 1 ? "invitesPendingOne" : "invitesPendingOther",
                  { count: pendingInvitesCount }
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("invitesHint")}
              </p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      )}

      {/* ─── QUICK STATS STRIP (hidden on mobile) ──────────────── */}
      {allAnimals.length > 0 && (
        <div className="hidden md:grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("statPets")}
            value={allAnimals.length}
            icon={PawPrint}
            accent="primary"
          />
          <StatCard
            label={t("statNextVaccine")}
            value={nextVaccine ? nextVaccine.animal : "—"}
            sublabel={
              nextVaccine
                ? `${nextVaccine.name} · ${formatDateLong(nextVaccine.date)}`
                : t("statNothingScheduled")
            }
            icon={Syringe}
            accent={nextVaccine ? "primary" : "muted"}
          />
          <StatCard
            label={t("statWeighings")}
            value={totalWeightEntries}
            sublabel={
              totalWeightEntries === 0
                ? t("statNoRecords")
                : t("statEntries", { count: totalWeightEntries })
            }
            icon={Scale}
            accent="accent"
          />
          <StatCard
            label={t("statCoOwners")}
            value={totalCoOwners}
            sublabel={firstCoOwner ?? t("statNoCoOwners")}
            icon={Users}
            accent="muted"
          />
        </div>
      )}

      {/* ─── SECTION: MIS MASCOTAS ───────────────────────────── */}
      {allAnimals.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-baseline justify-between md:hidden">
            <div>
              <h2 className="text-lg font-semibold">{t("myPetsTitle")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("myPetsSubtitle")}
              </p>
            </div>
            <span className="font-mono text-xs text-subtle">
              {allAnimals.length} ·{" "}
              <span className="text-emerald">
                {t("upToDateCount", { count: allDoneCount })}
              </span>
            </span>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {allAnimals.map((animal) => (
              <PetCard
                key={animal.id}
                t={t}
                tc={tc}
                animal={{
                  id: animal.id,
                  name: animal.name,
                  species: animal.species,
                  breed: animal.breed,
                  sex: animal.sex,
                  birthDate: animal.birth_date,
                  photoUrl: animal.photo_url,
                  status: animal.status,
                  isCoOwned: animal.isCoOwned,
                  severeAllergiesCount: animal.allergies.length,
                  overdueVaccinesCount: animal.vaccines.filter(
                    (v) => v.next_dose_date && new Date(v.next_dose_date) < now,
                  ).length,
                  activeMedsCount: animal.medications.length,
                  weightKg: animal.weight_kg ? Number(animal.weight_kg) : null,
                  urlToken: animal.url_token,
                }}
              />
            ))}

            {/* Dotted premium Add Pet card (desktop only) */}
            <Link
              href="/app/animals/new"
              className="hidden md:flex group flex-col items-center justify-center gap-2 rounded-[32px] border-2 border-dashed border-border bg-secondary/20 p-5 text-center transition-all hover:bg-secondary/30 hover:border-primary/50 aspect-[4/3] w-full max-w-md mx-auto"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <PlusCircle className="size-6" strokeWidth={2} />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-foreground">{t("addAnotherTitle")}</h4>
              <p className="text-xs text-muted-foreground">{t("addAnotherDesc")}</p>
            </Link>
          </div>

          {/* ─── SUGGESTIONS ROW (only if 1 pet) ───────────────── */}
          {firstAnimal && allAnimals.length === 1 && (
            <SuggestionsRow
              t={t}
              animal={{
                id: firstAnimal.id,
                name: firstAnimal.name,
                photoUrl: firstAnimal.photo_url,
                species: firstAnimal.species,
              }}
            />
          )}

          {/* ─── Mobile Add Pet Row (mobile only) ───────────────── */}
          <div className="pt-2 md:hidden">
            <Link
              href="/app/animals/new"
              className="flex items-center gap-4 rounded-[24px] border border-border bg-card p-4 transition-all hover:bg-secondary/30 active:scale-[0.99] duration-150"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PlusCircle className="size-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-foreground leading-snug">{t("addAnotherTitle")}</h4>
                <p className="text-xs text-muted-foreground leading-normal">{t("addAnotherDesc")}</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ─── SECTION: PRÓXIMAMENTE ───────────────────────────── */}
      {upcomingTop.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-baseline gap-2">
            <Calendar className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">{t("upcomingTitle")}</h2>
            <span className="text-xs text-muted-foreground">
              {t("upcomingSubtitle")}
            </span>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {upcomingTop.map((event) => (
                  <UpcomingRow key={event.id} event={event} t={t} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── EMPTY STATE ─────────────────────────────────────── */}
      {allAnimals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-border px-6 py-20 text-center bg-card">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Dog className="size-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("emptyText")}
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/app/animals/new">
              <PlusCircle className="size-4" />
              {t("emptyCta")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* SuggestionsRow                                              */
/* ─────────────────────────────────────────────────────────── */
interface SuggestionsRowProps {
  animal: {
    id: string;
    name: string;
    photoUrl: string | null;
    species: string;
  };
  t: any;
}

function SuggestionsRow({ animal, t }: SuggestionsRowProps) {
  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">
        {t("completeProfile", { name: animal.name })}
      </h3>
      <div className="grid gap-3 grid-cols-3 overflow-x-auto pb-2 no-scrollbar">
        {/* Card 1: Cargar vacunas */}
        <Link
          href={`/app/animals/${animal.id}`}
          className="flex flex-col justify-between p-4 rounded-2xl border border-indigo-100 bg-[#f5f7ff] transition-all hover:bg-indigo-50 min-h-[140px]"
        >
          <div className="size-9 rounded-xl bg-indigo-100 flex items-center justify-center text-[#4f46e5]">
            <Syringe className="size-4.5" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-foreground leading-tight">
              {t("suggVaccines")}
            </p>
            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#4f46e5]">
              Empezar <ChevronRight className="size-3" />
            </span>
          </div>
        </Link>

        {/* Card 2: Subir foto */}
        <Link
          href={`/app/animals/${animal.id}`}
          className="flex flex-col justify-between p-4 rounded-2xl border border-teal-100 bg-[#f0fdfa] transition-all hover:bg-teal-50 min-h-[140px]"
        >
          <div className="size-9 rounded-xl bg-teal-100 flex items-center justify-center text-[#0d9488]">
            <PawPrint className="size-4.5" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-foreground leading-tight">
              {t("suggPhoto")}
            </p>
            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#0d9488]">
              Empezar <ChevronRight className="size-3" />
            </span>
          </div>
        </Link>

        {/* Card 3: Antiparasitarios */}
        <Link
          href={`/app/animals/${animal.id}`}
          className="flex flex-col justify-between p-4 rounded-2xl border border-amber-100 bg-[#fffbeb] transition-all hover:bg-amber-50 min-h-[140px]"
        >
          <div className="size-9 rounded-xl bg-amber-100 flex items-center justify-center text-[#d97706]">
            <Shield className="size-4.5" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-foreground leading-tight">
              {t("suggDewormings")}
            </p>
            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#d97706]">
              Empezar <ChevronRight className="size-3" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* PetCard                                                     */
/* ─────────────────────────────────────────────────────────── */
interface PetCardData {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  birthDate: Date | null;
  photoUrl: string | null;
  status: string;
  isCoOwned: boolean;
  severeAllergiesCount: number;
  overdueVaccinesCount: number;
  activeMedsCount: number;
  weightKg: number | null;
  urlToken: string;
}

function PetCard({
  animal,
  t,
  tc,
}: {
  animal: PetCardData;
  t: Awaited<ReturnType<typeof getTranslations<"ownerHome">>>;
  tc: Awaited<ReturnType<typeof getTranslations<"ownerCommon">>>;
}) {
  const ageText = animal.birthDate ? getAge(animal.birthDate) : null;
  const isLost = animal.status === "lost";

  const stateBadge = isLost
    ? { variant: "rose" as const, label: t("petBadgeLost") }
    : animal.severeAllergiesCount > 0
      ? { variant: "amber" as const, label: t("petBadgeSevereAllergy") }
      : animal.overdueVaccinesCount > 0
        ? { variant: "rose" as const, label: t("petBadgeOverdueVaccine") }
        : { variant: "emerald" as const, label: "AL DÍA" };

  const gradient = (SPECIES_GRADIENT[animal.species] || SPECIES_GRADIENT.other) as [string, string];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[32px] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md aspect-[4/3] w-full max-w-md mx-auto">
      {/* Invisible link covering card, except header actions */}
      <Link
        href={`/app/animals/${animal.id}`}
        className="absolute inset-0 z-10"
        aria-label={animal.name}
      />

      <div
        className="absolute inset-0 bg-cover bg-center flex flex-col justify-between p-6"
        style={
          animal.photoUrl
            ? { backgroundImage: `url(${animal.photoUrl})` }
            : {
                background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
              }
        }
      >
        {/* Tint overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/25" />

        {/* Top Overlays */}
        <div className="relative z-20 flex w-full items-center justify-between">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold text-white tracking-wider border-none shadow-sm uppercase"
            style={{
              backgroundColor:
                stateBadge.variant === "emerald"
                  ? "#22c55e"
                  : stateBadge.variant === "rose"
                    ? "#ef4444"
                    : "#f59e0b",
            }}
          >
            {stateBadge.variant === "emerald" && "✓ "}
            {stateBadge.label}
          </span>

          <QRModal
            animalId={animal.id}
            animalName={animal.name}
            urlToken={animal.urlToken}
          >
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-md border border-white/10"
            >
              <QrCode className="size-5" />
            </button>
          </QRModal>
        </div>

        {/* Bottom Info */}
        <div className="relative z-20 text-white">
          {animal.isCoOwned && (
            <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm mb-2 uppercase">
              {t("petShared")}
            </span>
          )}
          <h3 className="text-3xl font-extrabold leading-none tracking-tight">
            {animal.name}
          </h3>
          <p className="mt-2 text-sm text-white/90 font-medium">
            {animal.breed ?? speciesLabel(animal.species, tc)}
            {animal.sex !== "unknown" && (
              <> · {animal.sex === "male" ? "♂" : "♀"}</>
            )}
            {ageText && <> · {ageText}</>}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* UpcomingRow                                                 */
/* ─────────────────────────────────────────────────────────── */
function UpcomingRow({
  event,
  t,
}: {
  event: {
    icon: LucideIcon;
    tone: "primary" | "amber" | "rose";
    title: string;
    subtitle: string;
    date: Date;
    overdue: boolean;
  };
  t: Awaited<ReturnType<typeof getTranslations<"ownerHome">>>;
}) {
  const Icon = event.icon;
  const toneBg = {
    primary: "bg-primary/12 text-primary",
    amber: "bg-amber/15 text-amber-dark dark:text-amber",
    rose: "bg-rose/12 text-rose",
  }[event.tone];

  return (
    <li className="flex items-center gap-3.5 px-4 py-3.5">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${toneBg}`}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{event.title}</p>
        <p className="text-xs text-muted-foreground">{event.subtitle}</p>
      </div>
      {event.overdue ? (
        <Badge variant="rose" size="xs">
          {t("badgeOverdue")}
        </Badge>
      ) : (
        <span className="shrink-0 whitespace-nowrap font-mono text-xs font-medium text-muted-foreground">
          {formatDateLong(event.date)}
        </span>
      )}
    </li>
  );
}

function speciesLabel(
  s: string,
  tc: Awaited<ReturnType<typeof getTranslations<"ownerCommon">>>,
): string {
  return (
    {
      dog: tc("speciesDog"),
      cat: tc("speciesCat"),
      bird: tc("speciesBird"),
      rabbit: tc("speciesRabbit"),
      rodent: tc("speciesRodent"),
      reptile: tc("speciesReptile"),
      fish: tc("speciesFish"),
      exotic: tc("speciesExotic"),
      other: tc("speciesOther"),
    }[s] ?? s
  );
}
