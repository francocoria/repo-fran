import Link from "next/link";
import {
  Stethoscope,
  Crown,
  ShieldCheck,
  Search,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, Badge } from "@pet-app/ui";
import { prisma } from "@pet-app/db";
import { effectivePlan } from "@pet-app/lib/utils/subscription";
import { formatDateLong } from "@pet-app/lib/utils/format";

export const metadata = { title: "Veterinarios" };
export const dynamic = "force-dynamic";

export default async function AdminVetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { clinic_name: { contains: q, mode: "insensitive" } },
      { license_number: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filter === "verified") where.verified = true;
  if (filter === "unverified") where.verified = false;

  const vets = await prisma.vetProfile.findMany({
    where,
    include: {
      subscription: true,
      _count: {
        select: { vet_accesses: { where: { status: "approved" } } },
      },
    },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Veterinarios</h1>
        <p className="mt-1 text-muted-foreground">
          {vets.length} resultado{vets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search + filters */}
      <form className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, clínica o matrícula..."
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterPill href="/admin/vets" active={!filter} label="Todos" />
          <FilterPill
            href="/admin/vets?filter=verified"
            active={filter === "verified"}
            label="Verificados"
          />
          <FilterPill
            href="/admin/vets?filter=unverified"
            active={filter === "unverified"}
            label="Sin verificar"
          />
        </div>
      </form>

      {/* List */}
      {vets.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Sin veterinarios para mostrar.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {vets.map((v) => {
                const plan = effectivePlan(
                  v.subscription
                    ? {
                        plan: v.subscription.plan,
                        status: v.subscription.status,
                        expiresAt: v.subscription.expires_at,
                      }
                    : null,
                );
                return (
                  <li key={v.id}>
                    <Link
                      href={`/admin/vets/${v.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium truncate">
                            {v.full_name}
                          </p>
                          {v.verified && (
                            <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-1.5 h-4">
                              <ShieldCheck className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                              Verificado
                            </Badge>
                          )}
                          {plan === "premium" && (
                            <Badge className="gap-1 text-[10px] py-0 px-1.5 h-4 bg-amber-500 hover:bg-amber-500/90">
                              <Crown className="h-2.5 w-2.5" />
                              Premium
                            </Badge>
                          )}
                          {plan === "trial" && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                              Trial
                            </Badge>
                          )}
                          {plan === "expired" && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                              Vencido
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {v.clinic_name ?? "Sin clínica"}
                          {v.license_number && ` · Mat. ${v.license_number}`}
                          {" · "}
                          {v._count.vet_accesses} paciente
                          {v._count.vet_accesses !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="hidden sm:block text-xs text-muted-foreground shrink-0">
                        Alta {formatDateLong(v.created_at)}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/50"
      }`}
    >
      {label}
    </Link>
  );
}
