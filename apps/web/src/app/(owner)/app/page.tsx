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
} from "lucide-react";
import { Button, Badge, Card, CardContent, PetAvatar } from "@pet-app/ui";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { getAge } from "@pet-app/lib/utils/format";

export const metadata = { title: "Mis mascotas" };
export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) return null;

  const ownedAnimals = await prisma.animal.findMany({
    where: { owner_id: profile.id, status: { not: "archived" } },
    include: {
      allergies: { where: { severity: "severe" }, select: { id: true } },
      vaccines: {
        select: { id: true, next_dose_date: true },
        orderBy: { next_dose_date: "asc" },
      },
      medications: {
        where: { active: true },
        select: { id: true },
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
            select: { id: true, next_dose_date: true },
            orderBy: { next_dose_date: "asc" },
          },
          medications: {
            where: { active: true },
            select: { id: true },
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

  // Stats globales
  const now = new Date();
  const lostCount = allAnimals.filter((a) => a.status === "lost").length;
  const allDoneCount = allAnimals.filter((a) => {
    const severeAllergy = a.allergies.length > 0;
    const overdueVaccine = a.vaccines.some(
      (v) => v.next_dose_date && new Date(v.next_dose_date) < now,
    );
    return !severeAllergy && !overdueVaccine && a.status === "active";
  }).length;

  return (
    <div className="animate-fade-up space-y-8">
      {/* Header — greeting style */}
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

      {/* Section header */}
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

            {/* Add card */}
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

      {/* Empty state */}
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

/* ────────────────────────────────────────────────────── */
/* PetCard — card visual con avatar, info y estado          */
/* ────────────────────────────────────────────────────── */
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

  // Estado primario
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
        <CardContent className="p-4">
          <div className="relative">
            <div className="mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-2">
              <PetAvatar
                name={animal.name}
                species={animal.species}
                photoUrl={animal.photoUrl}
                size={160}
                radius={0}
                lost={isLost}
                className="size-full"
              />
            </div>
            {isLost && (
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md bg-rose px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white animate-pulse-rose">
                ● Perdida
              </span>
            )}
            {animal.isCoOwned && (
              <span className="absolute right-2.5 top-2.5 inline-block rounded-md border border-border bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                Compartida
              </span>
            )}
          </div>

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
        </CardContent>
      </Card>
    </Link>
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
