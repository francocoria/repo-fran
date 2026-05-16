import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { Dog, Cat, Bird, Rabbit, ScanLine, Archive, AlertCircle } from "lucide-react";
import { Button, Badge } from "@pet-app/ui";
import { effectivePlan, FREE_PATIENT_CAP } from "@pet-app/lib/utils/subscription";
import { PatientsSearch } from "./patients-search";

const speciesIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-5 w-5" />,
  cat: <Cat className="h-5 w-5" />,
  bird: <Bird className="h-5 w-5" />,
  rabbit: <Rabbit className="h-5 w-5" />,
};

const speciesLabels: Record<string, string> = {
  dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo",
  rodent: "Roedor", reptile: "Reptil", fish: "Pez", exotic: "Exótico", other: "Otro",
};

export const metadata = { title: "Mis pacientes" };
export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);

  if (!profile) redirect("/onboarding/vet");

  const subscription = await prisma.subscription.findUnique({
    where: { vet_id: profile.id },
  });

  const plan = effectivePlan(
    subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          expiresAt: subscription.expires_at,
        }
      : null,
  );

  const accesses = await prisma.vetAccess.findMany({
    where: {
      vet_id: profile.id,
      status: "approved",
    },
    include: {
      animal: {
        include: {
          allergies: { where: { severity: "severe" }, select: { id: true } },
          owner_profile: { select: { full_name: true, phone: true } },
        },
      },
    },
    orderBy: [{ archived_by_vet: "asc" }, { approved_at: "desc" }],
  });

  // Última consulta de este vet por cada paciente — para mostrar "hace X".
  const animalIds = accesses.map((a) => a.animal.id);
  const lastVisits = animalIds.length
    ? await prisma.medicalRecord.groupBy({
        by: ["animal_id"],
        where: { vet_id: profile.id, animal_id: { in: animalIds } },
        _max: { visit_date: true },
      })
    : [];
  const lastVisitMap = new Map(
    lastVisits.map((v) => [v.animal_id, v._max.visit_date]),
  );

  const active = accesses.filter((a) => !a.archived_by_vet);
  const archived = accesses.filter((a) => a.archived_by_vet);

  const isPremium = plan === "premium" || plan === "trial";
  const atCap = !isPremium && active.length >= FREE_PATIENT_CAP;

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis pacientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length} activos
            {!isPremium && (
              <>
                {" "}
                de {FREE_PATIENT_CAP} ·{" "}
                <Link href="/vet/plan" className="underline-offset-4 hover:underline">
                  Pasar a premium
                </Link>
              </>
            )}
            {archived.length > 0 && ` · ${archived.length} archivados`}
          </p>
        </div>
        <Button asChild>
          <Link href="/vet/scan" className="gap-2">
            <ScanLine className="h-4 w-4" />
            Escanear QR
          </Link>
        </Button>
      </div>

      {atCap && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Llegaste al límite de tu plan gratis.</p>
            <p className="mt-1 text-muted-foreground">
              Estás usando {active.length} de {FREE_PATIENT_CAP} pacientes activos. Podés archivar
              alguno o{" "}
              <Link href="/vet/plan" className="underline underline-offset-2 hover:text-foreground">
                pasar a Premium
              </Link>{" "}
              para pacientes ilimitados.
            </p>
          </div>
        </div>
      )}

      <PatientsSearch
        accesses={[...active, ...archived].map((a) => ({
          id: a.id,
          animal: {
            id: a.animal.id,
            name: a.animal.name,
            species: a.animal.species,
            breed: a.animal.breed,
            photo_url: a.animal.photo_url,
            severeAllergiesCount: a.animal.allergies.length,
            owner_full_name: a.animal.owner_profile.full_name,
            owner_phone: a.animal.owner_profile.phone,
          },
          archived: a.archived_by_vet,
          lastVisit:
            lastVisitMap.get(a.animal.id)?.toISOString() ?? null,
        }))}
      />

      {accesses.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <ScanLine className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">Sin pacientes todavía</h2>
          <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
            Pedile al dueño que te muestre el QR de su mascota desde la app y escaneálo desde acá.
          </p>
          <Button asChild className="mt-5 gap-2">
            <Link href="/vet/scan">
              <ScanLine className="h-4 w-4" />
              Escanear QR
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
