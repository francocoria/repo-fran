import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { Dog, Cat, Bird, Rabbit, Calendar, Activity, Info, Pencil } from "lucide-react";
import { Button, Badge } from "@pet-app/ui";
import { getAge } from "@pet-app/lib/utils/format";
import { PhotoUpload } from "@/components/animal/photo-upload";
import { WeightTracker } from "@/components/animal/weight-tracker";
import { CoOwnersManager } from "@/components/animal/co-owners-manager";
import { VaccineList } from "@/components/animal/vaccine-list";
import { AllergyList } from "@/components/animal/allergy-list";
import { MedicationList } from "@/components/animal/medication-list";
import { DewormingList } from "@/components/animal/deworming-list";
import { StudyList } from "@/components/animal/study-list";
import { QRModal } from "@/components/animal/qr-modal";
import { MedicalHistoryList } from "@/components/animal/medical-history-list";
import { LostModeToggle } from "@/components/animal/lost-mode-toggle";

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

export default async function AnimalProfilePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) return notFound();

  const animal = await prisma.animal.findUnique({
    where: { id: params.id },
    include: {
      co_owners: {
        where: { status: "active" },
        include: { owner_profile: { select: { full_name: true } } },
      },
      weight_entries: { orderBy: { recorded_at: "desc" }, take: 20 },
      vaccines: { orderBy: { applied_date: "desc" } },
      dewormings: { orderBy: { applied_date: "desc" } },
      medications: { orderBy: [{ active: "desc" }, { start_date: "desc" }] },
      allergies: { orderBy: { severity: "desc" } },
      studies: { orderBy: { study_date: "desc" } },
      medical_records: {
        select: {
          id: true,
          visit_date: true,
          reason: true,
          examination: true,
          diagnosis: true,
          treatment: true,
          next_steps: true,
          public_notes: true,
          // private_notes: NO se envía al cliente — es solo del vet que lo escribió
          vet: {
            select: {
              full_name: true,
              verified: true,
              clinic_name: true,
            },
          },
        },
        orderBy: { visit_date: "desc" },
      },
      lost_alerts: {
        where: { status: "active" },
        orderBy: { activated_at: "desc" },
        take: 1,
        select: {
          id: true,
          public_slug: true,
          activated_at: true,
          last_seen_location: true,
          contact_phone: true,
        },
      },
    },
  });

  if (!animal) return notFound();

  const isOwner = animal.owner_id === profile.id;
  const isCoOwner = animal.co_owners.some((co: any) => co.owner_id === profile.id);
  if (!isOwner && !isCoOwner) return notFound();

  const ageText = animal.birth_date ? getAge(animal.birth_date) : null;
  const severeAllergies = animal.allergies.filter((a: any) => a.severity === "severe");

  return (
    <div className="animate-fade-up max-w-5xl mx-auto">
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end bg-card border rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
        <PhotoUpload animalId={animal.id} currentPhotoUrl={animal.photo_url} animalName={animal.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>
            <Badge variant={animal.status === "active" ? "default" : "destructive"}>
              {animal.status === "active" ? "Activo" : animal.status === "lost" ? "🔴 Perdido" : animal.status}
            </Badge>
            {!isOwner && <Badge variant="outline">Co-dueño</Badge>}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-muted-foreground text-sm">
            <span className="flex items-center gap-1.5">
              <Info className="h-4 w-4 shrink-0" />
              {speciesLabels[animal.species] || animal.species}
              {animal.breed && <span className="opacity-60">· {animal.breed}</span>}
            </span>
            {ageText && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 shrink-0" />{ageText}{animal.birth_date_approx ? " (aprox.)" : ""}</span>}
            {animal.sex !== "unknown" && <span>{animal.sex === "male" ? "♂ Macho" : "♀ Hembra"}</span>}
            {animal.neutered && <span className="text-emerald-600 dark:text-emerald-400">✓ Castrado</span>}
          </div>
          {animal.microchip && <p className="mt-1 text-xs text-muted-foreground/60 font-mono">Chip: {animal.microchip}</p>}

          {/* Severe allergies banner */}
          {severeAllergies.length > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-medium">
              ⚠️ Alergias severas: {severeAllergies.map((a: any) => a.allergen).join(", ")}
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {isOwner && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/app/animals/${animal.id}/edit`}><Pencil className="h-3.5 w-3.5" />Editar</Link>
            </Button>
          )}
          <QRModal
            animalId={animal.id}
            animalName={animal.name}
            urlToken={animal.url_token}
          />
        </div>
      </div>

      {/* ─── INFO CARDS ──────────────────────────────────────── */}
      {(animal.color || animal.distinctive_marks || animal.notes) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {animal.color && (
            <div className="rounded-xl bg-card border px-4 py-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Color</p>
              <p className="text-sm font-medium">{animal.color}</p>
            </div>
          )}
          {animal.distinctive_marks && (
            <div className="rounded-xl bg-card border px-4 py-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Marcas</p>
              <p className="text-sm">{animal.distinctive_marks}</p>
            </div>
          )}
          {animal.notes && (
            <div className="rounded-xl bg-card border px-4 py-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Notas</p>
              <p className="text-sm">{animal.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── HEALTH GRID ─────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Column 1 */}
        <div className="space-y-4">
          <VaccineList
            animalId={animal.id}
            vaccines={animal.vaccines.map((v: any) => ({ ...v, applied_date: v.applied_date.toISOString(), next_dose_date: v.next_dose_date?.toISOString() || null }))}
            isOwner={isOwner}
            species={animal.species}
          />
          <MedicationList
            animalId={animal.id}
            medications={animal.medications.map((m: any) => ({ ...m, start_date: m.start_date.toISOString(), end_date: m.end_date?.toISOString() || null }))}
            isOwner={isOwner}
          />
          <StudyList
            animalId={animal.id}
            studies={animal.studies.map((s: any) => ({ ...s, study_date: s.study_date.toISOString() }))}
            isOwner={isOwner}
          />
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          <AllergyList
            animalId={animal.id}
            allergies={animal.allergies.map((a: any) => ({ ...a }))}
            isOwner={isOwner}
          />
          <DewormingList
            animalId={animal.id}
            dewormings={animal.dewormings.map((d: any) => ({ ...d, applied_date: d.applied_date.toISOString(), next_date: d.next_date?.toISOString() || null }))}
            isOwner={isOwner}
          />
          <WeightTracker
            animalId={animal.id}
            currentWeight={animal.weight_kg ? Number(animal.weight_kg) : null}
            entries={animal.weight_entries.map((e: any) => ({ id: e.id, weight_kg: Number(e.weight_kg), recorded_at: e.recorded_at.toISOString(), notes: e.notes }))}
            isOwner={isOwner}
          />
          <CoOwnersManager
            animalId={animal.id}
            coOwners={animal.co_owners.map((co: any) => ({ id: co.id, owner_profile: co.owner_profile ? { full_name: co.owner_profile.full_name } : null }))}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* ─── HISTORIAL MÉDICO (read-only) ─────────────────────── */}
      <div className="mt-4">
        <MedicalHistoryList
          records={animal.medical_records.map((r: any) => ({
            id: r.id,
            visit_date: r.visit_date.toISOString(),
            reason: r.reason,
            examination: r.examination,
            diagnosis: r.diagnosis,
            treatment: r.treatment,
            next_steps: r.next_steps,
            public_notes: r.public_notes,
            vet: {
              full_name: r.vet.full_name,
              verified: r.vet.verified,
              clinic_name: r.vet.clinic_name,
            },
          }))}
        />
      </div>

      {/* ─── MODO PERDIDO ─────────────────────────────────────── */}
      {isOwner && (
        <div className="mt-4">
          <LostModeToggle
            animalId={animal.id}
            animalName={animal.name}
            currentStatus={animal.status}
            activeAlert={
              animal.lost_alerts[0]
                ? {
                    id: animal.lost_alerts[0].id,
                    public_slug: animal.lost_alerts[0].public_slug,
                    activated_at:
                      animal.lost_alerts[0].activated_at.toISOString(),
                    last_seen_location:
                      animal.lost_alerts[0].last_seen_location,
                  }
                : null
            }
          />
        </div>
      )}
    </div>
  );
}
