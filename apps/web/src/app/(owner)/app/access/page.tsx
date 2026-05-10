import { redirect } from "next/navigation";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { ShieldCheck, Stethoscope } from "lucide-react";
import {
  PendingAccessList,
  ApprovedAccessList,
  type AccessRow,
} from "./access-list";

export const metadata = { title: "Accesos" };

export default async function AccessPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) redirect("/onboarding/owner");

  // Animales del dueño + co-owned
  const ownedAnimalIds = await prisma.animal
    .findMany({
      where: { owner_id: profile.id },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  const coOwnedAnimalIds = await prisma.coOwner
    .findMany({
      where: { owner_id: profile.id, status: "active" },
      select: { animal_id: true },
    })
    .then((rows) => rows.map((r) => r.animal_id));

  const allAnimalIds = [...ownedAnimalIds, ...coOwnedAnimalIds];

  const allAccess = await prisma.vetAccess.findMany({
    where: { animal_id: { in: allAnimalIds } },
    include: {
      vet: {
        select: {
          full_name: true,
          specialty: true,
          clinic_name: true,
          verified: true,
        },
      },
      animal: {
        select: { id: true, name: true, photo_url: true },
      },
    },
    orderBy: { requested_at: "desc" },
  });

  const toRow = (a: (typeof allAccess)[number]): AccessRow => ({
    id: a.id,
    status: a.status,
    requested_at: a.requested_at.toISOString(),
    approved_at: a.approved_at?.toISOString() ?? null,
    vet: a.vet,
    animal: a.animal,
  });

  const pending = allAccess.filter((a) => a.status === "pending").map(toRow);
  const approved = allAccess.filter((a) => a.status === "approved").map(toRow);

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Accesos veterinarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aprobá o revocá quién puede ver el historial de tus mascotas.
        </p>
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Solicitudes pendientes
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                {pending.length}
              </span>
            )}
          </h2>
        </div>
        <PendingAccessList requests={pending} />
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Veterinarios con acceso
            {approved.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                {approved.length}
              </span>
            )}
          </h2>
        </div>
        <ApprovedAccessList accesses={approved} />
      </section>
    </div>
  );
}
