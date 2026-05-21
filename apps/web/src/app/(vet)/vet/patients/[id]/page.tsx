import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { Button, Badge, PetAvatar } from "@pet-app/ui";
import {
  Calendar,
  AlertTriangle,
  Pill,
  Stethoscope,
  FileText,
  Plus,
  ChevronLeft,
  Activity,
  MessageCircle,
} from "lucide-react";
import { getAge, formatDateLong } from "@pet-app/lib/utils/format";

const severityColor: Record<string, string> = {
  severe: "bg-destructive/15 text-destructive border-destructive/30",
  moderate: "bg-warning/15 text-warning border-warning/30",
  mild: "bg-secondary text-foreground border-border",
};

export default async function VetPatientView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getVetProfile(user.id);

  if (!profile) notFound();

  // Verificar acceso aprobado (incluye archivados — el vet puede leer)
  const access = await prisma.vetAccess.findUnique({
    where: {
      animal_id_vet_id: { animal_id: id, vet_id: profile.id },
    },
  });

  if (!access || access.status !== "approved") notFound();

  const animal = await prisma.animal.findUnique({
    where: { id },
    include: {
      owner_profile: {
        select: { full_name: true, phone: true, city: true },
      },
      allergies: { orderBy: { severity: "desc" } },
      vaccines: { orderBy: { applied_date: "desc" } },
      medications: {
        where: { active: true },
        orderBy: { start_date: "desc" },
      },
      medical_records: {
        select: {
          id: true,
          visit_date: true,
          reason: true,
          diagnosis: true,
          treatment: true,
          public_notes: true,
          // private_notes: solo si la consulta la escribió el vet actual.
          // Al filtrar acá retorna a TODOS (para mostrar/no mostrar lo decide el render).
          private_notes: true,
          vet_id: true,
          vet: { select: { full_name: true, verified: true } },
          created_at: true,
        },
        orderBy: { visit_date: "desc" },
      },
    },
  });

  if (!animal) notFound();

  const t = await getTranslations("vetPatientDetail");

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

  const allergyTypeLabels: Record<string, string> = {
    food: t("allergyFood"),
    medication: t("allergyMedication"),
    environmental: t("allergyEnvironmental"),
    other: t("allergyOther"),
  };

  // Filtrar private_notes: si NO es del vet actual → null
  const records = animal.medical_records.map((r) => ({
    ...r,
    private_notes: r.vet_id === profile.id ? r.private_notes : null,
    is_mine: r.vet_id === profile.id,
  }));

  const severeAllergies = animal.allergies.filter((a) => a.severity === "severe");
  const otherAllergies = animal.allergies.filter((a) => a.severity !== "severe");
  const ageText = animal.birth_date ? getAge(animal.birth_date) : null;

  return (
    <div className="animate-fade-up max-w-5xl mx-auto pb-10">
      <Link
        href="/vet/patients"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        {t("backToPatients")}
      </Link>

      {/* ─── HEADER PACIENTE V2 ─── */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 rounded-3xl border border-border/50 bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-5">
          <PetAvatar
            name={animal.name}
            species={animal.species}
            photoUrl={animal.photo_url}
            size={96}
            radius={9999}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {animal.name}
              </h1>
              {access.archived_by_vet && (
                <div className="inline-flex h-6 items-center rounded-full bg-secondary/80 px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("badgeArchived")}
                </div>
              )}
            </div>
            
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full">
                {speciesLabels[animal.species] ?? animal.species}
                {animal.breed && ` · ${animal.breed}`}
              </span>
              {ageText && (
                <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full">
                  <Calendar className="size-3.5" />
                  {ageText}
                </span>
              )}
              {animal.sex !== "unknown" && (
                <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full">
                  {animal.sex === "male" ? t("sexMale") : t("sexFemale")}
                </span>
              )}
              {animal.weight_kg && (
                <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full">
                  <Activity className="size-3.5" />
                  <span className="font-mono">
                    {Number(animal.weight_kg).toFixed(1)} kg
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        <Button asChild className="shrink-0 rounded-full h-12 px-6 shadow-sm shadow-primary/25 w-full md:w-auto" variant="default">
          <Link href={`/vet/patients/${animal.id}/consults/new`}>
            <Plus className="size-4 mr-2" />
            {t("newConsult")}
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          {/* ─── ALERTAS DESTACADAS V2 ─── */}
          {(severeAllergies.length > 0 || animal.medications.length > 0) && (
            <section className="space-y-4">
              {severeAllergies.length > 0 && (
                <div className="rounded-3xl border border-rose-500/10 bg-rose-500/5 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600">
                      <AlertTriangle className="size-4" />
                    </div>
                    <h2 className="text-[15px] font-bold text-rose-600 dark:text-rose-400">
                      {t("severeAllergiesTitle")}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {severeAllergies.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs text-rose-700 dark:text-rose-300 font-medium"
                      >
                        <span className="font-bold">{a.allergen}</span>
                        <span className="opacity-70">
                          ({allergyTypeLabels[a.type] ?? a.type})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {animal.medications.length > 0 && (
                <div className="rounded-3xl border border-violet-500/10 bg-violet-500/5 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-600">
                      <Pill className="size-4" />
                    </div>
                    <h2 className="text-[15px] font-bold text-violet-700 dark:text-violet-400">
                      {t("activeMedication")}
                    </h2>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {animal.medications.map((m) => (
                      <li key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-2 gap-y-1 bg-violet-500/5 px-4 py-3 rounded-2xl">
                        <span className="font-bold text-violet-900 dark:text-violet-200">{m.name}</span>
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-600/80 dark:text-violet-400/80">
                          {m.dosage} · {m.frequency}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* ─── HISTORIAL DE CONSULTAS V2 ─── */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("consultHistory")} ({records.length})
              </h2>
            </div>

            {records.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/60 bg-surface-2/40 px-6 py-12 text-center">
                <FileText className="mx-auto size-12 text-muted-foreground/30" />
                <p className="mt-4 text-[15px] font-medium text-muted-foreground">
                  {t("noConsultsTitle")}
                </p>
                <Button asChild size="default" className="mt-5 rounded-full px-6 shadow-sm" variant="outline">
                  <Link href={`/vet/patients/${animal.id}/consults/new`}>
                    <Plus className="mr-2 size-4" />
                    {t("createFirstConsult")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((r) => (
                  <article
                    key={r.id}
                    className={`rounded-3xl border border-border/40 p-5 shadow-sm transition-all hover:shadow-md ${
                      r.is_mine ? "bg-primary/[0.03] border-primary/20" : "bg-card"
                    }`}
                  >
                    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-foreground">{r.reason}</p>
                        <p className="mt-1 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                          <Calendar className="size-3.5" />
                          {formatDateLong(r.visit_date)} 
                          <span className="inline-block size-1 rounded-full bg-border"></span>
                          {r.is_mine
                            ? t("consultByYou")
                            : t("consultByVet", { name: r.vet.full_name })}
                        </p>
                      </div>
                      {r.is_mine && (
                        <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                          {t("badgeMine")}
                        </div>
                      )}
                    </header>

                    {r.diagnosis && (
                      <div className="mt-3 rounded-2xl bg-secondary/60 p-4">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("diagnosis")}</p>
                        <p className="text-[14px] leading-relaxed font-medium">{r.diagnosis}</p>
                      </div>
                    )}

                    {r.treatment && (
                      <div className="mt-3 rounded-2xl bg-secondary/60 p-4">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("treatment")}</p>
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium">{r.treatment}</p>
                      </div>
                    )}

                    {r.private_notes && (
                      <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 p-4 shadow-sm">
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="size-3" />
                          {t("privateNotesTitle")}
                        </p>
                        <p className="text-[14px] leading-relaxed text-amber-900 dark:text-amber-200 whitespace-pre-wrap font-medium">
                          {r.private_notes}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─── SIDEBAR ─── */}
        <div className="space-y-6">
          {/* OWNER CARD */}
          <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Responsable</h2>
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-sm shadow-sm border border-accent/20">
                {animal.owner_profile.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold truncate">
                  {animal.owner_profile.full_name}
                </p>
                {animal.owner_profile.phone && (
                  <p className="font-mono text-[13px] text-muted-foreground mt-0.5">
                    {animal.owner_profile.phone}
                  </p>
                )}
              </div>
              {animal.owner_profile.phone && (
                <Button
                  asChild
                  size="icon"
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shrink-0"
                  aria-label={t("whatsappAria")}
                >
                  <a
                    href={`https://wa.me/${animal.owner_profile.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* ÚLTIMAS VACUNAS */}
          {animal.vaccines.length > 0 && (
            <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("lastVaccines")}
              </h2>
              <ul className="space-y-3">
                {animal.vaccines.slice(0, 5).map((v) => (
                  <li key={v.id} className="flex flex-col gap-1.5 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="font-bold text-[14px]">{v.name}</span>
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
                      <span className="bg-secondary/60 text-muted-foreground px-2 py-0.5 rounded-full">{formatDateLong(v.applied_date)}</span>
                      {v.next_dose_date && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {t("nextDose", { date: formatDateLong(v.next_dose_date) })}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* OTRAS ALERGIAS */}
          {otherAllergies.length > 0 && (
            <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("otherAllergies")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherAllergies.map((a) => (
                  <span
                    key={a.id}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${severityColor[a.severity] ?? severityColor.moderate}`}
                  >
                    {a.allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
