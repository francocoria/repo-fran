import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Crown,
  Check,
  X,
  CalendarClock,
  Sparkles,
  ShieldCheck,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { Button, Card, CardContent, Badge } from "@pet-app/ui";
import {
  effectivePlan,
  daysUntilExpiry,
  getFeatureGates,
  FREE_PATIENT_CAP,
} from "@pet-app/lib/utils/subscription";
import { formatDateLong } from "@pet-app/lib/utils/format";
import { UpgradeModal } from "@/components/vet/upgrade-modal";

export const metadata = { title: "Mi plan" };
export const dynamic = "force-dynamic";

const ALL_FEATURES = [
  {
    key: "unlimitedPatients",
    label: "Pacientes ilimitados",
    desc: `En el plan gratis tenés un cap de ${FREE_PATIENT_CAP} pacientes activos.`,
  },
  {
    key: "certificates",
    label: "Certificados profesionales",
    desc: "Salud, antirrábico, viaje. PDFs con tu branding.",
  },
  {
    key: "brandedPrescriptions",
    label: "Recetas sin marca de agua",
    desc: "Logo y datos de tu clínica en cada receta.",
  },
  {
    key: "verificationBadge",
    label: "Verificación de matrícula",
    desc: "Badge azul visible para que los dueños te elijan con confianza.",
  },
  {
    key: "practiceStats",
    label: "Estadísticas de práctica",
    desc: "Pacientes, consultas, vacunaciones del mes.",
  },
  {
    key: "customTemplates",
    label: "Plantillas propias",
    desc: "Guardá tus diagnósticos y tratamientos más usados.",
  },
] as const;

export default async function VetPlanPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) redirect("/onboarding/vet");

  const subscription = await prisma.subscription.findUnique({
    where: { vet_id: profile.id },
    include: {
      payments: {
        orderBy: { paid_at: "desc" },
        take: 10,
      },
    },
  });

  const subState = subscription
    ? {
        plan: subscription.plan,
        status: subscription.status,
        expiresAt: subscription.expires_at,
      }
    : null;
  const plan = effectivePlan(subState);
  const isPremium = plan === "premium" || plan === "trial";
  const daysLeft = daysUntilExpiry(subscription?.expires_at ?? null);
  const features = getFeatureGates(subState);

  // Verificación de matrícula — buscar request pendiente/aprobada
  const verificationRequest = await prisma.verificationRequest.findFirst({
    where: { vet_id: profile.id },
    orderBy: { created_at: "desc" },
  });

  const planLabel = {
    free: "Gratis",
    trial: "Trial",
    premium: "Premium",
    expired: "Vencido",
  }[plan];

  const planColor = {
    free: "secondary",
    trial: "secondary",
    premium: "default",
    expired: "destructive",
  }[plan] as "secondary" | "default" | "destructive";

  return (
    <div className="animate-fade-up max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi plan</h1>
        <p className="mt-1 text-muted-foreground">
          Gestioná tu plan, beneficios y pagos.
        </p>
      </div>

      {/* ─── ESTADO ACTUAL ───────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={planColor} className="gap-1 text-xs">
                  {plan === "premium" && <Crown className="h-3 w-3" />}
                  {plan === "trial" && <Sparkles className="h-3 w-3" />}
                  Plan {planLabel}
                </Badge>
                {profile.verified && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    Matrícula verificada
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold">
                {plan === "premium" && "Premium activo"}
                {plan === "trial" &&
                  `Trial activo${daysLeft !== null ? ` · ${daysLeft} días` : ""}`}
                {plan === "free" && "Plan gratuito"}
                {plan === "expired" && "Tu plan venció"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {subscription?.expires_at && plan !== "free" && (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {plan === "expired" ? "Venció" : "Vence"} el{" "}
                    {formatDateLong(subscription.expires_at)}
                  </span>
                )}
                {plan === "free" && (
                  <span>
                    Hasta {FREE_PATIENT_CAP} pacientes activos. Sin límite de
                    tiempo.
                  </span>
                )}
              </p>
            </div>

            {!isPremium && <UpgradeModal triggerLabel="Pasar a Premium" />}
          </div>
        </CardContent>
      </Card>

      {/* ─── VERIFICACIÓN DE MATRÍCULA ────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">Verificación de matrícula</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Subí una foto de tu matrícula profesional. Una vez aprobada
                manualmente, vas a tener un badge azul visible para los dueños.
              </p>

              {profile.verified ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  Tu matrícula está verificada.
                </div>
              ) : verificationRequest?.status === "pending" ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <CalendarClock className="h-4 w-4" />
                  En revisión — te avisamos cuando esté aprobada.
                </div>
              ) : verificationRequest?.status === "rejected" ? (
                <div className="mt-3">
                  <p className="text-sm text-destructive">
                    Solicitud rechazada
                    {verificationRequest.rejection_reason && (
                      <>: {verificationRequest.rejection_reason}</>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-2"
                  >
                    <Link href="/vet/plan/verify">Volver a solicitar</Link>
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" asChild className="mt-3">
                  <Link href="/vet/plan/verify">Solicitar verificación</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── BENEFICIOS ──────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Beneficios incluidos
        </h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {ALL_FEATURES.map((f) => {
                const enabled = features[f.key as keyof typeof features];
                return (
                  <li key={f.key} className="flex items-start gap-3 p-4">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                        enabled
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground/60"
                      }`}
                    >
                      {enabled ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${enabled ? "" : "text-muted-foreground"}`}
                      >
                        {f.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ─── HISTORIAL DE PAGOS ──────────────────────────────── */}
      {subscription && subscription.payments.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Receipt className="h-3.5 w-3.5" />
            Historial de pagos
          </h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {subscription.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {formatDateLong(p.paid_at)} · {p.method.replace("_", " ")}{" "}
                        · {p.months_granted} mes
                        {p.months_granted !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Pagado
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── CTA FINAL ───────────────────────────────────────── */}
      {!isPremium && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <CardContent className="p-6 text-center">
            <Crown className="mx-auto h-10 w-10 text-amber-500" />
            <h3 className="mt-3 text-lg font-semibold">
              Llevá tu práctica al siguiente nivel
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Premium te permite atender a todos tus pacientes sin restricciones
              y emitir documentos profesionales.
            </p>
            <div className="mt-4">
              <UpgradeModal triggerLabel="Quiero pasarme a Premium" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
