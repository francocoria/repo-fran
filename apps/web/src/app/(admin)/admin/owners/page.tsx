import { Users, Search } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@pet-app/ui";
import { prisma } from "@pet-app/db";
import { formatDateLong } from "@pet-app/lib/utils/format";

export const metadata = { title: "Dueños" };
export const dynamic = "force-dynamic";

export default async function AdminOwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const owners = await prisma.ownerProfile.findMany({
    where,
    include: {
      _count: { select: { animals: true } },
    },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dueños</h1>
        <p className="mt-1 text-muted-foreground">
          {owners.length} resultado{owners.length !== 1 ? "s" : ""}
        </p>
      </div>

      <form>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, teléfono o ciudad..."
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </form>

      {owners.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Sin resultados.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {owners.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{o.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[o.city, o.phone].filter(Boolean).join(" · ") || "—"}{" "}
                      · {o._count.animals} mascota
                      {o._count.animals !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="hidden sm:block text-xs text-muted-foreground shrink-0">
                    {formatDateLong(o.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
