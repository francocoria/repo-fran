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
import { Card, CardContent, Badge } from "@pet-app/ui";
import { prisma } from "@pet-app/db";
import { effectivePlan } from "@pet-app/lib/utils/subscription";
import { formatDateLong } from "@pet-app/lib/utils/format";
import { createSupabaseAdminClient } from "@pet-app/lib/supabase/admin";
import { ActivatePremiumDialog } from "./activate-premium-dialog";

export const metadata = { title: "Detalle vet" };
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
        Veterinarios
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
                Verificado
              </Badge>
            )}
            {plan === "premium" && (
              <Badge className="gap-1 bg-amber-500 hover:bg-amber-500/90">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            )}
            {plan === "trial" && (
              <Badge variant="secondary">Trial</Badge>
            )}
            {plan === "expired" && (
              <Badge variant="destructive">Vencido</Badge>
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
              Alta {formatDateLong(vet.created_at)}
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
          label="Clínica"
          value={vet.clinic_name ?? "Sin definir"}
        />
        <DataCell
          label="Matrícula"
          value={
            vet.license_number
              ? `${vet.license_number} (${vet.license_country ?? "AR"})`
              : "Sin definir"
          }
        />
        <DataCell label="Especialidad" value={vet.specialty ?? "General"} />
        <DataCell
          label="Pacientes activos"
          value={`${vet._count.vet_accesses}`}
        />
      </div>

      {/* ─── SUSCRIPCIÓN ─────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Suscripción
        </h2>
        <Card>
          <CardContent className="p-5">
            {vet.subscription ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <DataCell
                  label="Plan actual"
                  value={
                    plan === "expired"
                      ? "Vencido"
                      : vet.subscription.plan.charAt(0).toUpperCase() +
                        vet.subscription.plan.slice(1)
                  }
                />
                <DataCell
                  label="Estado"
                  value={vet.subscription.status}
                />
                <DataCell
                  label="Vence"
                  value={
                    vet.subscription.expires_at
                      ? formatDateLong(vet.subscription.expires_at)
                      : "Sin fecha"
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin suscripción registrada (plan free).
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
            Historial de pagos
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
                      <p className="text-xs text-muted-foreground capitalize">
                        {formatDateLong(p.paid_at)} ·{" "}
                        {p.method.replace("_", " ")} · {p.months_granted} mes
                        {p.months_granted !== 1 ? "es" : ""}
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
            Solicitudes de verificación
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
                        Solicitud · {formatDateLong(r.created_at)}
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
                      {r.status === "approved" && "Aprobada"}
                      {r.status === "rejected" && "Rechazada"}
                      {r.status === "pending" && "Pendiente"}
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
