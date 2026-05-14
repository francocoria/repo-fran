import Link from "next/link";
import Image from "next/image";
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
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  PetAvatar,
  StatCard,
} from "@pet-app/ui";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { getAge, formatDateLong } from "@pet-app/lib/utils/format";

export const metadata = { title: "Mis mascotas" };
export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

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

  const coOwnedAnimals = coOwnedAnimalsRel
    .map((co) => co.animal)
    .filter((a) => a.status !== "archived");

  const allAnimals = [
    ...ownedAnimals.map((a) => ({ ...a, isCoOwned: false })),
    ...coOwnedAnimals.map((a) => ({ ...a, isCoOwned: true })),
  ];

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
        subtitle: overdue ? "Vacuna vencida" : "Próxima dosis",
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
          ? "Desparasitación vencida"
          : "Próxima desparasitación",
        date: d,
        overdue,
      });
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcomingTop = upcoming.slice(0, 5);

  return (
    <div className="animate-fade-up space-y-8">
      {/* ─── HEADER GREETING ──────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted-foreground">Hola de nuevo,</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-[32px]">
            {profile.full_name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {allAnimals.length === 0
              ? "Empezá registrando tu primera mascota."
              : `Tenés ${allAnimals.length} ${allAnimals.length === 1 ? "mascota" : "mascotas"} registrada${allAnimals.length === 1 ? "" : "s"}.`}
            {lostCount > 0 && (
              <>
                {" "}
                <span className="font-medium text-rose">
                  Hay {lostCount === 1 ? "una" : `${lostCount}`} en modo perdido.
                </span>
              </>
            )}
            {lostCount === 0 && allAnimals.length > 0 && (
              <> Todo en orden.</>
            )}
          </p>
        </div>
        {allAnimals.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="default" asChild>
              <Link href="/app/notifications">
                <Calendar className="size-4" />
                Avisos
              </Link>
            </Button>
            <Button asChild>
              <Link href="/app/animals/new">
                <PlusCircle className="size-4" />
                <span className="hidden sm:inline">Agregar mascota</span>
                <span className="sm:hidden">Nueva</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ─── QUICK STATS STRIP (4 cols) ──────────────────────── */}
      {allAnimals.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Mascotas"
            value={allAnimals.length}
            icon={PawPrint}
            accent="primary"
          />
          <StatCard
            label="Próxima vacuna"
            value={nextVaccine ? nextVaccine.animal : "—"}
            sublabel={
              nextVaccine
                ? `${nextVaccine.name} · ${formatDateLong(nextVaccine.date)}`
                : "Nada agendado"
            }
            icon={Syringe}
            accent={nextVaccine ? "primary" : "muted"}
          />
          <StatCard
            label="Pesajes"
            value={totalWeightEntries}
            sublabel={
              totalWeightEntries === 0
                ? "Sin registros"
                : `${totalWeightEntries} entradas`
            }
            icon={Scale}
            accent="accent"
          />
          <StatCard
            label="Co-dueños"
            value={totalCoOwners}
            sublabel={firstCoOwner ?? "Sin co-dueños"}
            icon={Users}
            accent="muted"
          />
        </div>
      )}

      {/* ─── SECTION: MIS MASCOTAS ───────────────────────────── */}
      {allAnimals.length > 0 && (
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold">Mis mascotas</h2>
              <p className="text-xs text-muted-foreground">
                Tocá una para ver el perfil completo.
              </p>
            </div>
            <span className="font-mono text-xs text-subtle">
              {allAnimals.length} ·{" "}
              <span className="text-emerald">{allDoneCount} al día</span>
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allAnimals.map((animal) => (
              <PetCard
                key={animal.id}
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
                }}
              />
            ))}

            <Link
              href="/app/animals/new"
              className="group flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong p-5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <PlusCircle className="size-7" strokeWidth={1.5} />
              <span className="font-medium">Agregar mascota</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── SECTION: PRÓXIMAMENTE ───────────────────────────── */}
      {upcomingTop.length > 0 && (
        <div>
          <div className="mb-4 flex items-baseline gap-2">
            <Calendar className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Próximamente</h2>
            <span className="text-xs text-muted-foreground">
              Lo que se viene
            </span>
          </div>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {upcomingTop.map((event) => (
                  <UpcomingRow key={event.id} event={event} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── EMPTY STATE ─────────────────────────────────────── */}
      {allAnimals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-strong px-6 py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Dog className="size-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">
            Todavía no registraste mascotas
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Empezá registrando a tu primera mascota para llevar el control de
            sus vacunas, turnos e historial médico.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/animals/new">
              <PlusCircle className="size-4" />
              Registrar mi primera mascota
            </Link>
          </Button>
        </div>
      )}
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
}

function PetCard({ animal }: { animal: PetCardData }) {
  const ageText = animal.birthDate ? getAge(animal.birthDate) : null;
  const isLost = animal.status === "lost";

  const stateBadge = isLost
    ? { variant: "rose" as const, icon: AlertTriangle, label: "PERDIDA" }
    : animal.severeAllergiesCount > 0
      ? {
          variant: "amber" as const,
          icon: AlertTriangle,
          label: "Alergia severa",
        }
      : animal.overdueVaccinesCount > 0
        ? {
            variant: "rose" as const,
            icon: AlertTriangle,
            label: "Vacuna vencida",
          }
        : {
            variant: "emerald" as const,
            icon: CheckCircle2,
            label: "Todo al día",
          };

  const StateIcon = stateBadge.icon;

  return (
    <Link
      href={`/app/animals/${animal.id}`}
      className="group block focus-ring rounded-2xl"
    >
      <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="p-0">
          {/* Photo hero — full bleed top of card */}
          <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
            {animal.photoUrl ? (
              <Image
                src={animal.photoUrl}
                alt={animal.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <PetAvatar
                  name={animal.name}
                  species={animal.species}
                  size={120}
                  lost={isLost}
                />
              </div>
            )}
            {isLost && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-rose px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white shadow animate-pulse-rose">
                ● Perdida
              </span>
            )}
            {animal.isCoOwned && (
              <span className="absolute right-3 top-3 inline-block rounded-md border border-border bg-background/85 px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur-sm">
                Compartida
              </span>
            )}
          </div>

          {/* Info block */}
          <div className="p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-base font-semibold">{animal.name}</h3>
            {ageText && (
              <span className="shrink-0 text-xs text-subtle">{ageText}</span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {animal.breed ?? speciesLabel(animal.species)}
            {animal.sex !== "unknown" && (
              <> · {animal.sex === "male" ? "♂" : "♀"}</>
            )}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Badge variant={stateBadge.variant} size="sm">
              <StateIcon className="size-3" />
              {stateBadge.label}
            </Badge>
            <div className="flex items-center gap-2">
              {animal.activeMedsCount > 0 && (
                <span
                  className="inline-flex items-center text-subtle"
                  title={`${animal.activeMedsCount} medicación${animal.activeMedsCount !== 1 ? "es" : ""} activa${animal.activeMedsCount !== 1 ? "s" : ""}`}
                >
                  <Pill className="size-3.5" />
                </span>
              )}
              <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* UpcomingRow                                                 */
/* ─────────────────────────────────────────────────────────── */
function UpcomingRow({
  event,
}: {
  event: {
    icon: LucideIcon;
    tone: "primary" | "amber" | "rose";
    title: string;
    subtitle: string;
    date: Date;
    overdue: boolean;
  };
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
          VENCIDA
        </Badge>
      ) : (
        <span className="shrink-0 whitespace-nowrap font-mono text-xs font-medium text-muted-foreground">
          {formatDateLong(event.date)}
        </span>
      )}
    </li>
  );
}

function speciesLabel(s: string): string {
  return (
    {
      dog: "Perro",
      cat: "Gato",
      bird: "Ave",
      rabbit: "Conejo",
      rodent: "Roedor",
      reptile: "Reptil",
      fish: "Pez",
      exotic: "Exótico",
      other: "Otro",
    }[s] ?? s
  );
}
