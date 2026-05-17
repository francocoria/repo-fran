import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Stethoscope,
  Crown,
  ShieldCheck,
  Calendar,
  Phone,
  MapPin,
  Mail,
  Receipt,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, Badge } from "@pet-app/ui";
import { prisma } from "@pet-app/db";
import { effectivePlan } from "@pet-app/lib/utils/subscription";
import { formatDateLong } from "@pet-app/lib/utils/format";
import { createSupabaseAdminClient } from "@pet-app/lib/supabase/admin";
import { ActivatePremiumDialog } from "./activate-premium-dialog";

export async function generateMetadata() {
  const t = await getTranslations("adminVetDetail");
  return { title: t("metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function AdminVetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vet = await prisma.vetProfile.findUnique({
    where: { id },
    include: {
      subscription: {
        include: {
          payments: {
            orderBy: { paid_at: "desc" },
          },
        },
      },
      verification_requests: {
        orderBy: { created_at: "desc" },
        take: 5,
      },
      _count: {
        select: {
          vet_accesses: { where: { status: "approved" } },
          medical_records: true,
        },
      },
    },
  });

  if (!vet) notFound();

  const t = await getTranslations("adminVetDetail");
  const methodLabels: Record<string, string> = {
    transfer: t("methodTransfer"),
    cash: t("methodCash"),
    mp_external: t("methodMpExternal"),
    stripe_external: t("methodStripeExternal"),
    other: t("methodOther"),
  };

  // Email del usuario
  const admin = createSupabaseAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(vet.user_id);
  const email = userData?.user?.email ?? null;

  const subState = vet.subscription
    ? {
        plan: vet.subscription.plan,
        status: vet.subscription.status,
        expiresAt: vet.subscription.expires_at,
      }
    : null;
  const plan = effectivePlan(subState);

  return (
    <div className="animate-fade-up max-w-4xl space-y-6">
      <Link
        href="/admin/vets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Stethoscope className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {vet.full_name}
            </h1>
            {vet.verified && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                {t("badgeVerified")}
              </Badge>
            )}
            {plan === "premium" && (
              <Badge className="gap-1 bg-amber-500 hover:bg-amber-500/90">
                <Crown className="h-3 w-3" />
                {t("badgePremium")}
              </Badge>
            )}
            {plan === "trial" && (
              <Badge variant="secondary">{t("badgeTrial")}</Badge>
            )}
            {plan === "expired" && (
              <Badge variant="destructive">{t("badgeExpired")}</Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${email}`} className="hover:text-foreground">
                  {email}
                </a>
              </span>
            )}
            {vet.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {vet.phone}
              </span>
            )}
            {(vet.clinic_address || vet.clinic_city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[vet.clinic_address, vet.clinic_city]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {t("registeredAt", { date: formatDateLong(vet.created_at) })}
            </span>
          </div>

          {vet.bio && (
            <p className="mt-3 text-sm text-foreground/80 max-w-2xl">
              {vet.bio}
            </p>
          )}
        </div>

        <ActivatePremiumDialog
          vetId={vet.id}
          vetName={vet.full_name}
          currentExpiresAt={
            vet.subscription?.expires_at?.toISOString() ?? null
          }
        />
      </div>

      {/* ─── DATOS DE PRÁCTICA ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DataCell
          label={t("cellClinic")}
          value={vet.clinic_name ?? t("notDefined")}
        />
        <DataCell
          label={t("cellLicense")}
          value={
            vet.license_number
              ? t("licenseValue", {
                  number: vet.license_number,
                  country: vet.license_country ?? "AR",
                })
              : t("notDefined")
          }
        />
        <DataCell
          label={t("cellSpecialty")}
          value={vet.specialty ?? t("specialtyGeneral")}
        />
        <DataCell
          label={t("cellActivePatients")}
          value={`${vet._count.vet_accesses}`}
        />
      </div>

      {/* ─── SUSCRIPCIÓN ─────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sectionSubscription")}
        </h2>
        <Card>
          <CardContent className="p-5">
            {vet.subscription ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <DataCell
                  label={t("cellCurrentPlan")}
                  value={
                    plan === "expired"
                      ? t("planExpired")
                      : vet.subscription.plan.charAt(0).toUpperCase() +
                        vet.subscription.plan.slice(1)
                  }
                />
                <DataCell
                  label={t("cellStatus")}
                  value={vet.subscription.status}
                />
                <DataCell
                  label={t("cellExpires")}
                  value={
                    vet.subscription.expires_at
                      ? formatDateLong(vet.subscription.expires_at)
                      : t("noExpiry")
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noSubscription")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── HISTORIAL DE PAGOS ─────────────────────────────────── */}
      {vet.subscription && vet.subscription.payments.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Receipt className="h-3.5 w-3.5" />
            {t("sectionPayments")}
          </h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {vet.subscription.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateLong(p.paid_at)} ·{" "}
                        {methodLabels[p.method] ?? p.method.replace("_", " ")} ·{" "}
                        {t("paymentMonths", { count: p.months_granted })}
                      </p>
                    </div>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground italic max-w-xs truncate">
                        {p.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── VERIFICACIONES ─────────────────────────────────────── */}
      {vet.verification_requests.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sectionVerifications")}
          </h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {vet.verification_requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {t("requestLabel", {
                          date: formatDateLong(r.created_at),
                        })}
                      </p>
                      {r.rejection_reason && (
                        <p className="text-xs text-destructive mt-0.5">
                          {r.rejection_reason}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        r.status === "approved"
                          ? "default"
                          : r.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.status === "approved" && t("statusApproved")}
                      {r.status === "rejected" && t("statusRejected")}
                      {r.status === "pending" && t("statusPending")}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium truncate">{value}</p>
    </div>
  );
}
