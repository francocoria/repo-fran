import {
  Stethoscope,
  QrCode,
  Crown,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Syringe,
  CalendarClock,
  FileCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  CalendarDays,
  Inbox,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button, Card, CardContent, Badge, StatCard, PetAvatar } from "@pet-app/ui";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import {
  effectivePlan,
  daysUntilExpiry,
  getFeatureGates,
  FREE_PATIENT_CAP,
} from "@pet-app/lib/utils/subscription";
import { formatDateLong } from "@pet-app/lib/utils/format";
import { UpgradeModal } from "@/components/vet/upgrade-modal";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("vetDashboard");
  return { title: t("metaTitle") };
}

/** Teaser para una sección bloqueada en plan gratis — empuja a Premium. */
function LockedSection({
  title,
  desc,
  cta,
}: {
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Card className="border-dashed bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/15">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lock className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {desc}
          </p>
        </div>
        <UpgradeModal triggerLabel={cta} />
      </CardContent>
    </Card>
  );
}

/** Sublabel con comparación mes-a-mes para las StatCard de métricas. */
function MonthDelta({
  current,
  prev,
  sameLabel,
  vsLabel,
}: {
  current: number;
  prev: number;
  sameLabel: string;
  vsLabel: string;
}) {
  const diff = current - prev;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="size-3" />
        {sameLabel}
      </span>
    );
  }
  const up = diff > 0;
  const pct = prev === 0 ? null : Math.round((Math.abs(diff) / prev) * 100);
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        up
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      {up ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {up ? "+" : "−"}
      {Math.abs(diff)}
      {pct !== null ? ` (${pct}%)` : ""} {vsLabel}
    </span>
  );
}

export default async function VetDashboardPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) redirect("/onboarding/vet");
  const t = await getTranslations("vetDashboard");

  const vetId = profile.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Solo fecha (sin hora) para columnas @db.Date
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const agendaUntil = new Date(today);
  agendaUntil.setDate(agendaUntil.getDate() + 45);
  const overdueFrom = new Date(today);
  overdueFrom.setDate(overdueFrom.getDate() - 60);

  // ── Batch 1: estado, contadores, métricas del mes, pacientes ──────
  const [
    subscription,
    activeAccessCount,
    archivedAccessCount,
    pendingRequests,
    consultsThisMonth,
    consultsPrevMonth,
    vaccinesThisMonth,
    vaccinesPrevMonth,
    newPatientsThisMonth,
    newPatientsPrevMonth,
    certsThisMonth,
    recentRecords,
    patientAccess,
  ] = await Promise.all([
    prisma.subscription.findUnique({ where: { vet_id: vetId } }),
    prisma.vetAccess.count({
      where: { vet_id: vetId, status: "approved", archived_by_vet: false },
    }),
    prisma.vetAccess.count({
      where: { vet_id: vetId, status: "approved", archived_by_vet: true },
    }),
    prisma.vetAccess.count({ where: { vet_id: vetId, status: "pending" } }),
    prisma.medicalRecord.count({
      where: { vet_id: vetId, visit_date: { gte: startOfMonth } },
    }),
    prisma.medicalRecord.count({
      where: {
        vet_id: vetId,
        visit_date: { gte: startOfPrevMonth, lt: startOfMonth },
      },
    }),
    prisma.vaccine.count({
      where: { applied_by_vet_id: vetId, applied_date: { gte: startOfMonth } },
    }),
    prisma.vaccine.count({
      where: {
        applied_by_vet_id: vetId,
        applied_date: { gte: startOfPrevMonth, lt: startOfMonth },
      },
    }),
    prisma.vetAccess.count({
      where: {
        vet_id: vetId,
        status: "approved",
        approved_at: { gte: startOfMonth },
      },
    }),
    prisma.vetAccess.count({
      where: {
        vet_id: vetId,
        status: "approved",
        approved_at: { gte: startOfPrevMonth, lt: startOfMonth },
      },
    }),
    prisma.certificate.count({
      where: { vet_id: vetId, issue_date: { gte: startOfMonth } },
    }),
    prisma.medicalRecord.findMany({
      where: { vet_id: vetId },
      include: { animal: { select: { id: true, name: true, species: true } } },
      orderBy: { visit_date: "desc" },
      take: 5,
    }),
    prisma.vetAccess.findMany({
      where: { vet_id: vetId, status: "approved", archived_by_vet: false },
      select: { animal_id: true },
    }),
  ]);

  const patientIds = patientAccess.map((a) => a.animal_id);

  // ── Batch 2: agenda — vacunas a vencer + turnos próximos ──────────
  const [upcomingVaccines, upcomingAppointments] = await Promise.all([
    patientIds.length
      ? prisma.vaccine.findMany({
          where: {
            animal_id: { in: patientIds },
            next_dose_date: { gte: overdueFrom, lte: agendaUntil },
          },
          include: {
            animal: { select: { id: true, name: true, species: true } },
          },
          orderBy: { next_dose_date: "asc" },
          take: 12,
        })
      : Promise.resolve([]),
    prisma.appointment.findMany({
      where: {
        vet_id: vetId,
        status: "scheduled",
        scheduled_at: { gte: now },
      },
      include: {
        animal: { select: { id: true, name: true, species: true } },
      },
      orderBy: { scheduled_at: "asc" },
      take: 8,
    }),
  ]);

  // Unificamos vacunas + turnos en una sola agenda ordenada por fecha.
  type AgendaItem = {
    id: string;
    kind: "vaccine" | "appointment";
    date: Date;
    animalId: string;
    animalName: string;
    species: string;
    label: string;
  };
  const agenda: AgendaItem[] = [
    ...upcomingVaccines.map((v) => ({
      id: `v-${v.id}`,
      kind: "vaccine" as const,
      date: v.next_dose_date as Date,
      animalId: v.animal.id,
      animalName: v.animal.name,
      species: v.animal.species,
      label: t("agendaVaccineLabel", { name: v.name }),
    })),
    ...upcomingAppointments.map((a) => ({
      id: `a-${a.id}`,
      kind: "appointment" as const,
      date: a.scheduled_at,
      animalId: a.animal.id,
      animalName: a.animal.name,
      species: a.animal.species,
      label: a.reason?.trim() || t("agendaAppointmentLabel"),
    })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 8);

  const subState = subscription
    ? {
        plan: subscription.plan,
        status: subscription.status,
        expiresAt: subscription.expires_at,
      }
    : null;
  const plan = effectivePlan(subState);
  const features = getFeatureGates(subState);

  const isPremium = plan === "premium" || plan === "trial";
  const daysLeft = daysUntilExpiry(subscription?.expires_at ?? null);
  const trialEndingSoon = plan === "trial" && daysLeft !== null && daysLeft <= 7;
  const expired = plan === "expired";
  const atCap = !isPremium && activeAccessCount >= FREE_PATIENT_CAP;
  const nearCap =
    !isPremium &&
    activeAccessCount >= FREE_PATIENT_CAP - 1 &&
    activeAccessCount < FREE_PATIENT_CAP;

  return (
    <div className="animate-fade-up space-y-7">
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("greeting", { name: profile.full_name.split(" ")[0] ?? "" })}
          </h1>
          {plan === "trial" && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {t("trialBadge", { days: daysLeft ?? "?" })}
            </Badge>
          )}
          {plan === "premium" && (
            <Badge className="gap-1 bg-amber-500 hover:bg-amber-500/90">
              <Crown className="h-3 w-3" />
              {t("premiumBadge")}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">
          {t("subtitle", {
            month: now.toLocaleDateString("es-AR", {
              month: "long",
              year: "numeric",
            }),
          })}
        </p>
      </div>

      {/* ─── BANNERS DE ESTADO ─────────────────────────────────── */}
      {expired && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-destructive">
              {t("expiredTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("expiredDesc", { cap: FREE_PATIENT_CAP })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <UpgradeModal triggerLabel={t("expiredRenew")} />
              <Button variant="outline" size="sm" asChild>
                <Link href="/vet/plan">{t("expiredViewPlan")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {trialEndingSoon && !expired && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 p-4">
          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {t("trialEndingTitle", { count: daysLeft ?? 0 })}
            </p>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
              {t("trialEndingDesc")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <UpgradeModal triggerLabel={t("trialActivate")} />
              <Button variant="outline" size="sm" asChild>
                <Link href="/vet/plan">{t("trialViewBenefits")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {atCap && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{t("atCapTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("atCapDesc", {
                current: activeAccessCount,
                cap: FREE_PATIENT_CAP,
              })}
            </p>
            <div className="mt-3">
              <UpgradeModal triggerLabel={t("atCapCta")} />
            </div>
          </div>
        </div>
      )}

      {nearCap && !atCap && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">{t("nearCapTitle")}</p>
            <p className="mt-1 text-muted-foreground">
              <UpgradeModal triggerLabel={t("nearCapCta")} variant="link" />
              {t("nearCapSuffix")}
            </p>
          </div>
        </div>
      )}

      {pendingRequests > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Inbox className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {t("pendingRequests", { count: pendingRequests })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("pendingRequestsDesc")}
            </p>
          </div>
        </div>
      )}

      {/* ─── MÉTRICAS DEL MES ───────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("monthSummary")}
        </h2>
        {features.practiceStats ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("statConsults")}
              value={consultsThisMonth}
              icon={Stethoscope}
              accent="primary"
              sublabel={
                <MonthDelta
                  current={consultsThisMonth}
                  prev={consultsPrevMonth}
                  sameLabel={t("deltaSame")}
                  vsLabel={t("deltaVs")}
                />
              }
            />
            <StatCard
              label={t("statVaccines")}
              value={vaccinesThisMonth}
              icon={Syringe}
              accent="emerald"
              sublabel={
                <MonthDelta
                  current={vaccinesThisMonth}
                  prev={vaccinesPrevMonth}
                  sameLabel={t("deltaSame")}
                  vsLabel={t("deltaVs")}
                />
              }
            />
            <StatCard
              label={t("statNewPatients")}
              value={newPatientsThisMonth}
              icon={Users}
              accent="accent"
              sublabel={
                <MonthDelta
                  current={newPatientsThisMonth}
                  prev={newPatientsPrevMonth}
                  sameLabel={t("deltaSame")}
                  vsLabel={t("deltaVs")}
                />
              }
            />
            <StatCard
              label={t("statCertificates")}
              value={certsThisMonth}
              icon={FileCheck}
              accent="amber"
              sublabel={
                <span className="text-muted-foreground">
                  {t("certsSublabel")}
                </span>
              }
            />
          </div>
        ) : (
          <LockedSection
            title={t("lockedStatsTitle")}
            desc={t("lockedStatsDesc")}
            cta={t("lockedCta")}
          />
        )}
      </section>

      {/* ─── ACCIONES RÁPIDAS ───────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Acciones rápidas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/vet/scan" className="group focus-ring rounded-2xl">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <QrCode className="size-[22px]" />
                </div>
                <h3 className="text-[15px] font-semibold">Escanear QR</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Apuntá la cámara al QR del animal y registrá la consulta al
                  instante.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vet/patients" className="group focus-ring rounded-2xl">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Users className="size-[22px]" />
                </div>
                <h3 className="text-[15px] font-semibold">Mis pacientes</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {activeAccessCount} activos · {archivedAccessCount}{" "}
                  archivados. Buscá, filtrá o archivá.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vet/plan" className="group focus-ring rounded-2xl">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-amber/60 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-grad-gold text-white shadow-sm">
                  <Crown className="size-[22px]" />
                </div>
                <h3 className="text-[15px] font-semibold">Mi plan</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {isPremium
                    ? "Premium activo. Pacientes ilimitados y recetas con tu marca."
                    : "Pacientes ilimitados, recetas y verificación de matrícula."}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* ─── AGENDA + CONSULTAS RECIENTES ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agenda */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Agenda · próximos 45 días
          </h2>
          {!features.practiceStats ? (
            <LockedSection
              title={t("lockedAgendaTitle")}
              desc={t("lockedAgendaDesc")}
              cta={t("lockedCta")}
            />
          ) : agenda.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <CalendarClock className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Sin vacunas ni turnos próximos. Cuando registres una vacuna
                  con refuerzo, aparece acá.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border/60">
                  {agenda.map((item) => {
                    const overdue = item.date < today;
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/vet/patients/${item.animalId}`}
                          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
                        >
                          <PetAvatar
                            name={item.animalName}
                            species={item.species}
                            size={40}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-sm font-medium">
                              {item.kind === "vaccine" ? (
                                <Syringe className="size-3.5 shrink-0 text-emerald-500" />
                              ) : (
                                <CalendarClock className="size-3.5 shrink-0 text-primary" />
                              )}
                              <span className="truncate">{item.label}</span>
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.animalName}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-medium ${
                              overdue
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {overdue ? "Vencida · " : ""}
                            {item.date.toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Consultas recientes */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            Consultas recientes
          </h2>
          {recentRecords.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Clock className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Cuando registres una consulta, va a aparecer acá.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border/60">
                  {recentRecords.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/vet/patients/${r.animal.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
                      >
                        <PetAvatar
                          name={r.animal.name}
                          species={r.animal.species}
                          size={40}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {r.reason}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.animal.name} · {formatDateLong(r.visit_date)}
                          </p>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
