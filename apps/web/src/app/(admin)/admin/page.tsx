import Link from "next/link";
import {
  Users,
  Stethoscope,
  Crown,
  ShieldCheck,
  Receipt,
  TrendingUp,
  Dog,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, Badge } from "@pet-app/ui";
import { prisma } from "@pet-app/db";
import { formatDateLong } from "@pet-app/lib/utils/format";

export const metadata = { title: "Panel admin" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalOwners,
    totalVets,
    totalAnimals,
    totalConsults,
    activePremium,
    activeTrials,
    expiredCount,
    pendingVerifications,
    paymentsLast30,
    recentSignupsVets,
    recentSignupsOwners,
  ] = await Promise.all([
    prisma.ownerProfile.count(),
    prisma.vetProfile.count(),
    prisma.animal.count(),
    prisma.medicalRecord.count(),
    prisma.subscription.count({
      where: { plan: "premium", status: "active", expires_at: { gt: now } },
    }),
    prisma.subscription.count({
      where: { plan: "trial", status: "active", expires_at: { gt: now } },
    }),
    prisma.subscription.count({
      where: {
        OR: [
          { status: "expired" },
          { status: "active", expires_at: { lte: now }, plan: { not: "free" } },
        ],
      },
    }),
    prisma.verificationRequest.count({ where: { status: "pending" } }),
    prisma.manualPayment.aggregate({
      where: { paid_at: { gte: last30 } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.vetProfile.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: { id: true, full_name: true, clinic_name: true, created_at: true },
    }),
    prisma.ownerProfile.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: { id: true, full_name: true, city: true, created_at: true },
    }),
  ]);

  const revenueLast30 = paymentsLast30._sum.amount
    ? Number(paymentsLast30._sum.amount).toFixed(2)
    : "0.00";

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel admin</h1>
        <p className="mt-1 text-muted-foreground">
          Vista general de la plataforma.
        </p>
      </div>

      {/* ─── ALERTS ─────────────────────────────────────────────── */}
      {pendingVerifications > 0 && (
        <Link
          href="/admin/verifications"
          className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/30 p-4 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">
              {pendingVerifications} verificación
              {pendingVerifications !== 1 ? "es" : ""} pendiente
              {pendingVerifications !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
              Hay solicitudes esperando tu revisión.
            </p>
          </div>
        </Link>
      )}

      {/* ─── STATS GRID ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Dueños"
          value={totalOwners}
          color="primary"
        />
        <StatCard
          icon={<Stethoscope className="h-5 w-5" />}
          label="Veterinarios"
          value={totalVets}
          color="accent"
        />
        <StatCard
          icon={<Dog className="h-5 w-5" />}
          label="Mascotas"
          value={totalAnimals}
          color="primary"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Consultas registradas"
          value={totalConsults}
          color="accent"
        />
      </div>

      {/* ─── PREMIUM STATS ─────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Suscripciones
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Crown className="h-5 w-5" />}
            label="Premium activos"
            value={activePremium}
            color="amber"
          />
          <StatCard
            icon={<Crown className="h-5 w-5" />}
            label="En trial"
            value={activeTrials}
            color="primary"
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5" />}
            label="Vencidos"
            value={expiredCount}
            color="destructive"
          />
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Ingresos 30 días
                  </p>
                  <p className="mt-1 text-2xl font-bold">USD {revenueLast30}</p>
                </div>
                <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {paymentsLast30._count} pago
                {paymentsLast30._count !== 1 ? "s" : ""} registrado
                {paymentsLast30._count !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── QUICK ACTIONS ──────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Gestión
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminLink
            href="/admin/vets"
            icon={<Stethoscope className="h-5 w-5" />}
            title="Veterinarios"
            desc="Activar premium, ver detalles"
          />
          <AdminLink
            href="/admin/verifications"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Verificaciones"
            desc="Cola de matrículas pendientes"
            badge={pendingVerifications}
          />
          <AdminLink
            href="/admin/payments"
            icon={<Receipt className="h-5 w-5" />}
            title="Pagos manuales"
            desc="Historial completo"
          />
          <AdminLink
            href="/admin/owners"
            icon={<Users className="h-5 w-5" />}
            title="Dueños"
            desc="Lista de cuentas"
          />
        </div>
      </div>

      {/* ─── RECENT SIGNUPS ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentList
          title="Vets recientes"
          icon={<Stethoscope className="h-3.5 w-3.5" />}
          items={recentSignupsVets.map((v) => ({
            id: v.id,
            href: `/admin/vets/${v.id}`,
            primary: v.full_name,
            secondary: v.clinic_name ?? "Sin clínica",
            date: v.created_at,
          }))}
        />
        <RecentList
          title="Dueños recientes"
          icon={<Users className="h-3.5 w-3.5" />}
          items={recentSignupsOwners.map((o) => ({
            id: o.id,
            href: undefined,
            primary: o.full_name,
            secondary: o.city ?? "Sin ciudad",
            date: o.created_at,
          }))}
        />
      </div>
    </div>
  );
}

// ─── COMPONENTES INTERNOS ─────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: "primary" | "accent" | "amber" | "destructive";
}) {
  const colorMap = {
    primary: "text-primary",
    accent: "text-accent",
    amber: "text-amber-600 dark:text-amber-400",
    destructive: "text-destructive",
  };
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          <div className={colorMap[color]}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminLink({
  href,
  icon,
  title,
  desc,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{title}</h3>
              {badge && badge > 0 ? (
                <Badge className="text-[10px] px-1.5 h-4">{badge}</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground truncate">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface RecentItem {
  id: string;
  href?: string;
  primary: string;
  secondary: string;
  date: Date;
}

function RecentList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: RecentItem[];
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Todavía no hay registros.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((it) => {
                const inner = (
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{it.primary}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {it.secondary}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDateLong(it.date)}
                    </p>
                  </div>
                );
                return (
                  <li key={it.id}>
                    {it.href ? (
                      <Link
                        href={it.href}
                        className="block hover:bg-secondary/40 transition-colors"
                      >
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
