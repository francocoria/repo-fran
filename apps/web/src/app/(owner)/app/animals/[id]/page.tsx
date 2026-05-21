import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { PhotoUpload } from "@/components/animal/photo-upload";
import { QRModal } from "@/components/animal/qr-modal";
import { WeightTracker } from "@/components/animal/weight-tracker";
import { CoOwnersManager } from "@/components/animal/co-owners-manager";
import { VaccineList } from "@/components/animal/vaccine-list";
import { AllergyList } from "@/components/animal/allergy-list";
import { MedicationList } from "@/components/animal/medication-list";
import { DewormingList } from "@/components/animal/deworming-list";
import { StudyList } from "@/components/animal/study-list";
import { MedicalHistoryList } from "@/components/animal/medical-history-list";
import { LostModeToggle } from "@/components/animal/lost-mode-toggle";
import { Crown, ArrowRight, ChevronLeft, Pencil, Download, QrCode, FileText } from "lucide-react";
import { Button, Banner, Card, CardContent } from "@pet-app/ui";
import { getAge } from "@pet-app/lib/utils/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animal = await prisma.animal.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: animal ? `${animal.name} - PetApp` : "Perfil - PetApp" };
}
export const dynamic = "force-dynamic";

const SPECIES_GRADIENTS: Record<string, string> = {
  dog: "from-violet-600 to-purple-600",
  cat: "from-teal-600 to-cyan-600",
  bird: "from-orange-500 to-amber-500",
  rabbit: "from-pink-600 to-rose-500",
  other: "from-blue-600 to-indigo-600",
};

export default async function AnimalView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) notFound();

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      owner_profile: true,
      co_owners: { include: { owner_profile: true } },
      vaccines: { orderBy: { applied_date: "desc" } },
      allergies: { orderBy: { severity: "desc" } },
      medications: { orderBy: { start_date: "desc" } },
      dewormings: { orderBy: { applied_date: "desc" } },
      studies: { orderBy: { study_date: "desc" } },
      weight_entries: { orderBy: { recorded_at: "desc" } },
      lost_alerts: { where: { status: "active" } },
      medical_records: {
        orderBy: { visit_date: "desc" },
        include: { vet: { select: { full_name: true, verified: true, clinic_name: true } } },
      },
    },
  });

  if (!animal) notFound();

  const isMainOwner = animal.owner_id === profile.id;
  const isCoOwner = animal.co_owners.some((co) => co.owner_id === profile.id);
  const isOwner = isMainOwner || isCoOwner;
  if (!isOwner) notFound();

  const t = await getTranslations("animalDetail");

  const speciesLabels: Record<string, string> = {
    dog: t("speciesDog"),
    cat: t("speciesCat"),
    bird: t("speciesBird"),
    rabbit: t("speciesRabbit"),
    rodent: t("speciesRodent"),
    reptile: t("speciesReptile"),
    fish: t("speciesFish"),
    exotic: t("speciesExotic"),
    other: t("speciesOther"),
  };

  const ageText = animal.birth_date ? getAge(animal.birth_date) : null;
  const severeAllergies = animal.allergies.filter((a) => a.severity === "severe");

  const bgGradient = SPECIES_GRADIENTS[animal.species] || SPECIES_GRADIENTS.other;

  return (
    <div className="animate-fade-up max-w-5xl mx-auto pb-10">
      {/* ─── V2 MOBILE FULL-BLEED HEADER ─── */}
      <div className="relative -mx-4 -mt-6 sm:-mx-6 sm:-mt-8 md:mx-0 md:mt-0 md:rounded-3xl overflow-hidden bg-muted mb-4 md:mb-6">
        <div className="relative aspect-[16/10] md:aspect-[21/9] w-full">
          {animal.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={animal.photo_url}
              alt={animal.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />
          )}
          {/* Overlay oscuro para lectura */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

          {/* Botón Volver flotante en móvil */}
          <Link
            href="/app"
            className="absolute left-4 top-4 md:top-6 md:left-6 z-10 flex h-9 items-center justify-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md px-4 text-sm font-medium text-white transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="-ml-1 size-4" />
            {t("breadcrumb")}
          </Link>

          {/* Editar en top right */}
          {isOwner && (
            <Link
              href={`/app/animals/${animal.id}/edit`}
              className="absolute right-4 top-4 md:top-6 md:right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white transition-colors hover:bg-black/50"
              aria-label={t("edit")}
            >
              <Pencil className="size-4" />
            </Link>
          )}

          {/* Info Principal centrada */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center">
            {/* Foto Circular con Upload */}
            <div className="mb-4">
              <PhotoUpload
                animalId={animal.id}
                currentPhotoUrl={animal.photo_url}
                animalName={animal.name}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── WHITE CARD CONTAINER (Info & Acciones) ─── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6">
          <Card className="rounded-2xl border-none shadow-sm md:border-solid md:border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-4">
                  <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    ✓ Activa
                  </span>
                </div>
                
                <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground mb-6">
                  <span>{speciesLabels[animal.species] ?? animal.species}</span>
                  {animal.breed && <span>· {animal.breed}</span>}
                  {ageText && <span>· {ageText}</span>}
                  {animal.sex !== "unknown" && (
                    <span>· {animal.sex === "male" ? t("sexMale") : t("sexFemale")}</span>
                  )}
                  {animal.weight_kg && (
                    <span>· {Number(animal.weight_kg).toFixed(1)} kg</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <QRModal animalId={animal.id} animalName={animal.name} urlToken={animal.url_token}>
                    <Button variant="outline" className="rounded-full gap-2 h-10 px-5 bg-card hover:bg-secondary border-border shadow-sm">
                      <QrCode className="size-4 text-primary" />
                      {t("showQr")}
                    </Button>
                  </QRModal>
                  {isOwner && (
                    <Button variant="outline" asChild className="rounded-full gap-2 h-10 px-5 bg-card hover:bg-secondary border-border shadow-sm">
                      <Link href={`/app/animals/${animal.id}/edit`}>
                        <Pencil className="size-4" />
                        {t("edit")}
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild className="rounded-full gap-2 h-10 px-5 bg-card hover:bg-secondary border-border shadow-sm">
                    <a href={`/app/animals/${animal.id}/export`} target="_blank" rel="noopener noreferrer">
                      <FileText className="size-4" />
                      {t("historyPdf")}
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── ALERTAS ─── */}
          {severeAllergies.length > 0 && (
            <Banner tone="rose" title={t("severeAllergiesTitle")}>
              {t("severeAllergiesText", {
                allergens: severeAllergies.map((a: any) => a.allergen).join(" · "),
              })}
            </Banner>
          )}

          {/* ─── INFO SECUNDARIA ─── */}
          {(animal.color || animal.distinctive_marks || animal.notes || animal.microchip) && (
            <Card className="rounded-2xl border-none shadow-sm md:border-solid md:border-border overflow-hidden">
              <div className="divide-y divide-border/50">
                {animal.color && (
                  <div className="flex items-center justify-between p-4 bg-card">
                    <span className="text-sm font-semibold text-muted-foreground">{t("chipColor")}</span>
                    <span className="text-sm font-medium">{animal.color}</span>
                  </div>
                )}
                {animal.distinctive_marks && (
                  <div className="flex items-center justify-between p-4 bg-card">
                    <span className="text-sm font-semibold text-muted-foreground">{t("chipMarks")}</span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{animal.distinctive_marks}</span>
                  </div>
                )}
                {animal.microchip && (
                  <div className="flex items-center justify-between p-4 bg-card">
                    <span className="text-sm font-semibold text-muted-foreground">{t("specMicrochip")}</span>
                    <span className="text-sm font-mono font-medium">{animal.microchip}</span>
                  </div>
                )}
                {animal.notes && (
                  <div className="flex flex-col gap-1 p-4 bg-card">
                    <span className="text-sm font-semibold text-muted-foreground">{t("chipNotes")}</span>
                    <span className="text-sm">{animal.notes}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ─── SALUD (V2 Style Cards) ─── */}
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
          <DewormingList
            animalId={animal.id}
            dewormings={animal.dewormings.map((d: any) => ({ ...d, applied_date: d.applied_date.toISOString(), next_date: d.next_date?.toISOString() || null }))}
            isOwner={isOwner}
          />
          <AllergyList
            animalId={animal.id}
            allergies={animal.allergies.map((a: any) => ({ ...a }))}
            isOwner={isOwner}
          />
          <StudyList
            animalId={animal.id}
            studies={animal.studies.map((s: any) => ({ ...s, study_date: s.study_date.toISOString() }))}
            isOwner={isOwner}
          />
          
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
        </div>

        {/* ─── SIDEBAR / BOTTOM (Desktop: Sidebar, Mobile: Abajo) ─── */}
        <div className="space-y-4 md:space-y-6">
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

          {isOwner && (
            <LostModeToggle
              animalId={animal.id}
              animalName={animal.name}
              currentStatus={animal.status}
              activeAlert={
                animal.lost_alerts[0]
                  ? {
                      id: animal.lost_alerts[0].id,
                      public_slug: animal.lost_alerts[0].public_slug,
                      activated_at: animal.lost_alerts[0].activated_at.toISOString(),
                      last_seen_location: animal.lost_alerts[0].last_seen_location,
                    }
                  : null
              }
            />
          )}

          <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-grad-gold text-white shadow-sm">
                <Crown className="size-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t("upgradeTitle")}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t("upgradeText")}</p>
              </div>
              <Button variant="dark" size="default" asChild className="w-full sm:w-auto">
                <Link href="/signup/vet">
                  {t("upgradeCta")}
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
