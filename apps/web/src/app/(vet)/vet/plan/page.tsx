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
} from "lucide-react";
import { getTranslations } from "next-intl/server";
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
import { activatePremiumFromPayment } from "@/lib/premium-activation";

export async function generateMetadata() {
  const t = await getTranslations("vetPlan");
  return { title: t("metaTitle") };
}
export const dynamic = "force-dynamic";

const ALL_FEATURES = [
  { gate: "unlimitedPatients", tKey: "featUnlimitedPatients" },
  { gate: "certificates", tKey: "featCertificates" },
  { gate: "brandedPrescriptions", tKey: "featBrandedPrescriptions" },
  { gate: "verificationBadge", tKey: "featVerificationBadge" },
  { gate: "practiceStats", tKey: "featPracticeStats" },
  { gate: "customTemplates", tKey: "featCustomTemplates" },
] as const;

export default async function VetPlanPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string;
    payment_id?: string;
    status?: string;
    collection_status?: string;
  }>;
}) {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) redirect("/onboarding/vet");
  const t = await getTranslations("vetPlan");

  const params = await searchParams;
  let checkoutFlash = params.checkout;

  // Al volver del checkout, MP agrega `payment_id` al redirect. Activamos
  // Premium acá mismo — así no dependemos de que el webhook llegue.
  const paymentId = params.payment_id;
  if (paymentId && paymentId !== "null") {
    const activation = await activatePremiumFromPayment(paymentId);
    if (activation.ok) {
      checkoutFlash = "success";
    } else if (
      activation.status === "not_approved" &&
      activation.detail !== "approved"
    ) {
      // pago rechazado o pendiente
      checkoutFlash =
        params.status === "pending" || params.collection_status === "pending"
          ? "pending"
          : "failure";
    }
  }

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

  const planLabelKey = {
    free: "planFree",
    trial: "planTrial",
    premium: "planPremium",
    expired: "planExpired",
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
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {checkoutFlash === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-4 text-sm">
          <Check className="size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              {t("flashSuccessTitle")}
            </p>
            <p className="mt-0.5 text-emerald-900/80 dark:text-emerald-100/80">
              {t("flashSuccessDesc")}
            </p>
          </div>
        </div>
      )}

      {checkoutFlash === "failure" && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-300/60 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900/40 p-4 text-sm">
          <X className="size-5 shrink-0 text-rose-700 dark:text-rose-400" />
          <div>
            <p className="font-semibold text-rose-900 dark:text-rose-200">
              {t("flashFailureTitle")}
            </p>
            <p className="mt-0.5 text-rose-900/80 dark:text-rose-100/80">
              {t("flashFailureDesc")}
            </p>
          </div>
        </div>
      )}

      {checkoutFlash === "pending" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 text-sm">
          <CalendarClock className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {t("flashPendingTitle")}
            </p>
            <p className="mt-0.5 text-amber-900/80 dark:text-amber-100/80">
              {t("flashPendingDesc")}
            </p>
          </div>
        </div>
      )}

      {/* ─── ESTADO ACTUAL ───────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={planColor} className="gap-1 text-xs">
                  {plan === "premium" && <Crown className="h-3 w-3" />}
                  {plan === "trial" && <Sparkles className="h-3 w-3" />}
                  {t("planBadge", { label: t(planLabelKey) })}
                </Badge>
                {profile.verified && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    {t("verifiedBadge")}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold">
                {plan === "premium" && t("statePremium")}
                {plan === "trial" &&
                  (daysLeft !== null
                    ? t("stateTrialDays", { days: daysLeft })
                    : t("stateTrial"))}
                {plan === "free" && t("stateFree")}
                {plan === "expired" && t("stateExpired")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {subscription?.expires_at && plan !== "free" && (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {plan === "expired"
                      ? t("expiredOn", {
                          date: formatDateLong(subscription.expires_at),
                        })
                      : t("expiresOn", {
                          date: formatDateLong(subscription.expires_at),
                        })}
                  </span>
                )}
                {plan === "free" && (
                  <span>{t("freeCapInfo", { cap: FREE_PATIENT_CAP })}</span>
                )}
              </p>
            </div>

            {plan === "free" || plan === "expired" ? (
              <UpgradeModal triggerLabel={t("ctaToPremium")} />
            ) : plan === "trial" ? (
              <UpgradeModal triggerLabel={t("ctaActivateNow")} />
            ) : (
              <UpgradeModal triggerLabel={t("ctaRenew")} />
            )}
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
              <h3 className="font-semibold">{t("verificationTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("verificationDesc")}
              </p>

              {profile.verified ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  {t("verificationVerified")}
                </div>
              ) : verificationRequest?.status === "pending" ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <CalendarClock className="h-4 w-4" />
                  {t("verificationPending")}
                </div>
              ) : verificationRequest?.status === "rejected" ? (
                <div className="mt-3">
                  <p className="text-sm text-destructive">
                    {verificationRequest.rejection_reason
                      ? t("verificationRejectedReason", {
                          reason: verificationRequest.rejection_reason,
                        })
                      : t("verificationRejected")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-2"
                  >
                    <Link href="/vet/plan/verify">
                      {t("verificationReapply")}
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" asChild className="mt-3">
                  <Link href="/vet/plan/verify">
                    {t("verificationRequest")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── BENEFICIOS ──────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("benefitsTitle")}
        </h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {ALL_FEATURES.map((f) => {
                const enabled = features[f.gate as keyof typeof features];
                return (
                  <li key={f.gate} className="flex items-start gap-3 p-4">
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
                        {t(f.tKey)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`${f.tKey}Desc`, { cap: FREE_PATIENT_CAP })}
                      </p>
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
            {t("paymentsTitle")}
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
                        {formatDateLong(p.paid_at)} ·{" "}
                        {p.method.replace("_", " ")} ·{" "}
                        {t("paymentMonths", { count: p.months_granted })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {t("paymentPaid")}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── CTA FINAL ───────────────────────────────────────── */}
      {plan !== "premium" && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <CardContent className="p-6 text-center">
            <Crown className="mx-auto h-10 w-10 text-amber-500" />
            <h3 className="mt-3 text-lg font-semibold">
              {plan === "trial" ? t("ctaTrialTitle") : t("ctaUpgradeTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {plan === "trial" ? t("ctaTrialDesc") : t("ctaUpgradeDesc")}
            </p>
            <div className="mt-4">
              <UpgradeModal
                triggerLabel={
                  plan === "trial"
                    ? t("ctaTrialButton")
                    : t("ctaUpgradeButton")
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
