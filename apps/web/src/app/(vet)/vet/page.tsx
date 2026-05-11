import {
  Stethoscope,
  QrCode,
  Crown,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card, CardContent, Badge } from "@pet-app/ui";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import {
  effectivePlan,
  daysUntilExpiry,
  FREE_PATIENT_CAP,
} from "@pet-app/lib/utils/subscription";
import { formatDateLong } from "@pet-app/lib/utils/format";
import { UpgradeModal } from "@/components/vet/upgrade-modal";

export const metadata = { title: "Panel veterinario" };
export const dynamic = "force-dynamic";

export default async function VetDashboardPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);

  if (!profile) redirect("/onboarding/vet");

  // Datos en paralelo
  const [subscription, activeAccessCount, archivedAccessCount, recentRecords, pendingRequests] =
    await Promise.all([
      prisma.subscription.findUnique({ where: { vet_id: profile.id } }),
      prisma.vetAccess.count({
        where: {
          vet_id: profile.id,
          status: "approved",
          archived_by_vet: false,
        },
      }),
      prisma.vetAccess.count({
        where: {
          vet_id: profile.id,
          status: "approved",
          archived_by_vet: true,
        },
      }),
      prisma.medicalRecord.findMany({
        where: { vet_id: profile.id },
        include: {
          animal: { select: { id: true, name: true, species: true } },
        },
        orderBy: { visit_date: "desc" },
        take: 5,
      }),
      prisma.vetAccess.count({
        where: { vet_id: profile.id, status: "pending" },
      }),
    ]);

  const plan = effectivePlan(
    subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          expiresAt: subscription.expires_at,
        }
      : null,
  );

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
    <div className="animate-fade-up space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {profile.full_name.split(" ")[0]}
          </h1>
          {plan === "trial" && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Trial · {daysLeft ?? "?"} días restantes
            </Badge>
          )}
          {plan === "premium" && (
            <Badge className="gap-1 bg-amber-500 hover:bg-amber-500/90">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">
          Gestioná tus pacientes, consultas y plan.
        </p>
      </div>

      {/* ─── BANNERS DE ESTADO ─────────────────────────────────── */}
      {expired && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-destructive">
              Tu plan venció
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Volvés al plan gratis con cap de {FREE_PATIENT_CAP} pacientes.
              Tu historial sigue intacto, pero algunos features están bloqueados.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <UpgradeModal triggerLabel="Renovar Premium" />
              <Button variant="outline" size="sm" asChild>
                <Link href="/vet/plan">Ver mi plan</Link>
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
              Tu trial termina en {daysLeft} día{daysLeft !== 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
              Pasá a Premium ahora para no perder pacientes ilimitados ni los
              certificados.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <UpgradeModal triggerLabel="Activar Premium" />
              <Button variant="outline" size="sm" asChild>
                <Link href="/vet/plan">Ver beneficios</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {atCap && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Llegaste al límite del plan gratis</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeAccessCount} de {FREE_PATIENT_CAP} pacientes activos. Para
              vincular un nuevo paciente, archivá uno o pasá a Premium.
            </p>
            <div className="mt-3">
              <UpgradeModal triggerLabel="Quitar el límite" />
            </div>
          </div>
        </div>
      )}

      {nearCap && !atCap && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">
              Te queda 1 paciente disponible en tu plan gratis.
            </p>
            <p className="mt-1 text-muted-foreground">
              <UpgradeModal
                triggerLabel="Pasate a Premium"
                variant="link"
              />{" "}
              y olvidate del cap.
            </p>
          </div>
        </div>
      )}

      {/* ─── STATS ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Activos
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {activeAccessCount}
                  {!isPremium && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ {FREE_PATIENT_CAP}
                    </span>
                  )}
                </p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground/50" />
            </div>
            {!isPremium && (
              <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    atCap
                      ? "bg-destructive"
                      : nearCap
                        ? "bg-amber-500"
                        : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(100, (activeAccessCount / FREE_PATIENT_CAP) * 100)}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Archivados
                </p>
                <p className="mt-1 text-2xl font-bold">{archivedAccessCount}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No cuentan al cap free.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Pendientes
                </p>
                <p className="mt-1 text-2xl font-bold">{pendingRequests}</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Solicitudes esperando aprobación.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Plan
                </p>
                <p className="mt-1 text-2xl font-bold capitalize">
                  {plan === "expired" ? "Vencido" : plan}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {subscription?.expires_at
                ? `Vence ${formatDateLong(subscription.expires_at)}`
                : "Plan gratuito"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── ACCIONES RÁPIDAS (cards grandes) ────────────────── */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold">Acciones rápidas</h2>
          <p className="text-xs text-muted-foreground">
            Lo que más usás todos los días.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/vet/scan" className="group focus-ring rounded-2xl">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <QrCode className="size-[22px]" />
                </div>
                <h3 className="text-[15px] font-semibold">Escanear QR</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Apuntá la cámara al QR del animal y accedés al historial completo.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/vet/patients"
            className="group focus-ring rounded-2xl"
          >
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Users className="size-[22px]" />
                </div>
                <h3 className="text-[15px] font-semibold">Mis pacientes</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {activeAccessCount} activos · {archivedAccessCount}{" "}
                  archivados. Ver listado, filtrar o archivar.
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
      </div>

      {/* ─── CONSULTAS RECIENTES ────────────────────────────────── */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Stethoscope className="h-3.5 w-3.5" />
          Consultas recientes
        </h2>
        {recentRecords.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
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
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {r.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.animal.name} ·{" "}
                          {formatDateLong(r.visit_date)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
