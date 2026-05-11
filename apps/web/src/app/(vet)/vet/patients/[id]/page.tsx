import Link from "next/link";
import { notFound } from "next/navigation";
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
  User,
  Phone,
  Activity,
  MessageCircle,
} from "lucide-react";
import { getAge, formatDateLong } from "@pet-app/lib/utils/format";

const speciesLabels: Record<string, string> = {
  dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo",
  rodent: "Roedor", reptile: "Reptil", fish: "Pez", exotic: "Exótico", other: "Otro",
};

const allergyTypeLabels: Record<string, string> = {
  food: "alimentaria",
  medication: "medicamento",
  environmental: "ambiental",
  other: "otra",
};

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
    <div className="animate-fade-up max-w-4xl">
      <Link
        href="/vet/patients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Mis pacientes
      </Link>

      {/* ─── HEADER PACIENTE ────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-start gap-4">
        <PetAvatar
          name={animal.name}
          species={animal.species}
          photoUrl={animal.photo_url}
          size={88}
          radius={20}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-3xl">
              {animal.name}
            </h1>
            {access.archived_by_vet && (
              <Badge variant="secondary">Archivado</Badge>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {speciesLabels[animal.species] ?? animal.species}
              {animal.breed && ` · ${animal.breed}`}
            </span>
            {ageText && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {ageText}
              </span>
            )}
            {animal.sex !== "unknown" && (
              <span>{animal.sex === "male" ? "♂ Macho" : "♀ Hembra"}</span>
            )}
            {animal.weight_kg && (
              <span className="flex items-center gap-1">
                <Activity className="size-3.5" />
                <span className="font-mono">
                  {Number(animal.weight_kg).toFixed(1)} kg
                </span>
              </span>
            )}
          </div>

          {animal.microchip && (
            <p className="mt-1 font-mono text-[11px] text-subtle">
              Chip: {animal.microchip}
            </p>
          )}
        </div>

        <Button asChild className="shrink-0" variant="accent">
          <Link href={`/vet/patients/${animal.id}/consults/new`}>
            <Plus className="size-4" />
            Nueva consulta
          </Link>
        </Button>
      </div>

      {/* ─── OWNER CARD CON WHATSAPP ────────────────────────── */}
      <div className="mb-5 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-xs font-semibold">
            {animal.owner_profile.full_name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">
              {animal.owner_profile.full_name}
            </p>
            {animal.owner_profile.phone && (
              <p className="font-mono text-[11.5px] text-subtle">
                {animal.owner_profile.phone}
              </p>
            )}
            {animal.owner_profile.city && (
              <p className="text-[11.5px] text-muted-foreground">
                {animal.owner_profile.city}
              </p>
            )}
          </div>
          {animal.owner_profile.phone && (
            <Button
              asChild
              size="icon"
              variant="whatsapp"
              aria-label="WhatsApp al dueño"
            >
              <a
                href={`https://wa.me/${animal.owner_profile.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ─── ALERTAS DESTACADAS ─────────────────────────────────── */}
      {(severeAllergies.length > 0 || animal.medications.length > 0) && (
        <section className="mb-6 space-y-3">
          {severeAllergies.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-semibold text-destructive">
                  Alergias severas — leer antes de prescribir
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {severeAllergies.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-background px-2.5 py-1 text-xs"
                  >
                    <span className="font-semibold">{a.allergen}</span>
                    <span className="text-muted-foreground">
                      ({allergyTypeLabels[a.type] ?? a.type})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {animal.medications.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-semibold">Medicación activa</h2>
              </div>
              <ul className="space-y-1.5 text-sm">
                {animal.medications.map((m) => (
                  <li key={m.id} className="flex flex-wrap gap-x-2">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground">
                      {m.dosage} · {m.frequency}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ─── ALERGIAS NO SEVERAS ────────────────────────────────── */}
      {otherAllergies.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Otras alergias
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherAllergies.map((a) => (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${severityColor[a.severity] ?? severityColor.moderate}`}
              >
                {a.allergen}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ─── ÚLTIMAS VACUNAS ────────────────────────────────────── */}
      {animal.vaccines.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Últimas vacunas
          </h2>
          <ul className="space-y-1 text-sm">
            {animal.vaccines.slice(0, 5).map((v) => (
              <li key={v.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{v.name}</span>
                <span className="text-muted-foreground">{formatDateLong(v.applied_date)}</span>
                {v.next_dose_date && (
                  <span className="text-muted-foreground">
                    · próx. {formatDateLong(v.next_dose_date)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── HISTORIAL DE CONSULTAS ─────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Stethoscope className="h-4 w-4" />
            Historial de consultas
          </h2>
          <span className="text-xs text-muted-foreground">{records.length}</span>
        </div>

        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 px-6 py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Todavía no hay consultas registradas.
            </p>
            <Button asChild size="sm" className="mt-4 gap-2">
              <Link href={`/vet/patients/${animal.id}/consults/new`}>
                <Plus className="h-3.5 w-3.5" />
                Crear primera consulta
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <article
                key={r.id}
                className={`rounded-xl border p-4 ${
                  r.is_mine ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{r.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLong(r.visit_date)} ·{" "}
                      {r.is_mine ? "Vos" : `Dr/a. ${r.vet.full_name}`}
                    </p>
                  </div>
                  {r.is_mine && (
                    <Badge variant="default" className="text-[10px]">
                      Tuya
                    </Badge>
                  )}
                </header>

                {r.diagnosis && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground">Diagnóstico</p>
                    <p className="text-sm">{r.diagnosis}</p>
                  </div>
                )}

                {r.treatment && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground">Tratamiento</p>
                    <p className="text-sm whitespace-pre-wrap">{r.treatment}</p>
                  </div>
                )}

                {r.private_notes && (
                  <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Notas privadas (solo vos)
                    </p>
                    <p className="mt-1 text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
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
  );
}
