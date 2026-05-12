import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import {
  Calendar,
  Pencil,
  ChevronLeft,
  Share2,
  Image as ImageIcon,
  Sparkles,
  Bookmark,
  Crown,
  ArrowRight,
  AlertTriangle,
  Palette,
  Microchip,
  CheckCircle2,
  Download,
} from "lucide-react";
import {
  Button,
  Badge,
  Banner,
  PetAvatar,
} from "@pet-app/ui";
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

const speciesLabels: Record<string, string> = {
  dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo",
  rodent: "Roedor", reptile: "Reptil", fish: "Pez", exotic: "Exótico", other: "Otro",
};

export default async function AnimalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) return notFound();

  const animal = await prisma.animal.findUnique({
    where: { id },
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

  const isLost = animal.status === "lost";

  return (
    <div className="animate-fade-up mx-auto max-w-5xl">
      {/* ─── BREADCRUMB ─────────────────────────────────────── */}
      <Link
        href="/app"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Mis mascotas
      </Link>

      {/* ─── HEADER CARD ────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border bg-card p-6 shadow-sm md:p-7">
        <div className="flex flex-wrap items-start gap-5">
          <PhotoUpload
            animalId={animal.id}
            currentPhotoUrl={animal.photo_url}
            animalName={animal.name}
          />

          <div className="min-w-0 flex-1">
            {/* Name + status badges */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[32px] font-bold leading-tight tracking-tight md:text-[36px]">
                {animal.name}
              </h1>
              {isLost ? (
                <Badge variant="rose" size="md">
                  <AlertTriangle className="size-3" />
                  MODO PERDIDO
                </Badge>
              ) : (
                <Badge variant="emerald" size="md">
                  <CheckCircle2 className="size-3" />
                  Activa
                </Badge>
              )}
              {!isOwner && (
                <Badge variant="secondary" size="md">
                  Co-dueño
                </Badge>
              )}
            </div>

            {/* Spec grid 6 cells */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Spec label="Especie" value={speciesLabels[animal.species] ?? animal.species} />
              {animal.breed && <Spec label="Raza" value={animal.breed} />}
              {ageText && (
                <Spec
                  label="Edad"
                  value={`${ageText}${animal.birth_date_approx ? " (aprox.)" : ""}`}
                />
              )}
              {animal.sex !== "unknown" && (
                <Spec
                  label="Sexo"
                  value={animal.sex === "male" ? "♂ Macho" : "♀ Hembra"}
                />
              )}
              {animal.weight_kg && (
                <Spec
                  label="Peso actual"
                  value={
                    <span className="font-mono">
                      {Number(animal.weight_kg).toFixed(1)} kg
                    </span>
                  }
                />
              )}
              {animal.microchip && (
                <Spec
                  label="Microchip"
                  value={
                    <span className="font-mono text-xs">{animal.microchip}</span>
                  }
                />
              )}
            </div>
          </div>

          {/* Actions stacked */}
          <div className="flex shrink-0 flex-col gap-2">
            <QRModal
              animalId={animal.id}
              animalName={animal.name}
              urlToken={animal.url_token}
            />
            {isOwner && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/animals/${animal.id}/edit`}>
                  <Pencil className="size-3.5" />
                  Editar
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`/app/animals/${animal.id}/export`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-3.5" />
                Historial PDF
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── BANNER ALERGIAS SEVERAS ────────────────────────── */}
      {severeAllergies.length > 0 && (
        <Banner
          tone="rose"
          title="Alergias severas"
          className="mb-5"
        >
          {severeAllergies.map((a: any) => a.allergen).join(" · ")} — informá esto siempre al vet.
        </Banner>
      )}

      {/* ─── INFO CHIPS ─────────────────────────────────────── */}
      {(animal.color || animal.distinctive_marks || animal.notes) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {animal.color && (
            <InfoChip icon={Palette} label="Color" value={animal.color} />
          )}
          {animal.distinctive_marks && (
            <InfoChip
              icon={Sparkles}
              label="Marcas"
              value={animal.distinctive_marks}
            />
          )}
          {animal.notes && (
            <InfoChip icon={Bookmark} label="Notas" value={animal.notes} />
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

      {/* ─── UPGRADE CALLOUT ────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-grad-gold text-white shadow-sm">
            <Crown className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">¿Sos veterinario?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Probá Premium 30 días gratis — recetas, certificados, pacientes
              ilimitados.
            </p>
          </div>
          <Button variant="dark" size="default" asChild>
            <Link href="/signup/vet">
              Ver Premium
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────── */

function Spec({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
            {label}
          </p>
          <p className="mt-0.5 text-sm">{value}</p>
        </div>
      </div>
    </div>
  );
}
