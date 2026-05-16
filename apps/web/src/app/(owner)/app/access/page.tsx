import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { ShieldCheck, Stethoscope, UserPlus } from "lucide-react";
import {
  PendingAccessList,
  ApprovedAccessList,
  type AccessRow,
} from "./access-list";
import {
  CoOwnerInvitesList,
  type CoOwnerInviteRow,
} from "./co-owner-invites-list";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("ownerAccess");
  return { title: t("metaTitle") };
}

export default async function AccessPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  const t = await getTranslations("ownerAccess");

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

  // Invitaciones a co-dueño donde YO soy el invitado (status: pending).
  const coOwnerInvitesRaw = await prisma.coOwner.findMany({
    where: { owner_id: profile.id, status: "pending" },
    include: {
      animal: {
        select: { id: true, name: true, species: true, breed: true, photo_url: true },
      },
    },
    orderBy: { added_at: "desc" },
  });

  // El schema no tiene relación con nombre para added_by_owner_id, fetcheamos
  // los perfiles de los que invitaron en una sola query.
  const inviterIds = [
    ...new Set(coOwnerInvitesRaw.map((c) => c.added_by_owner_id)),
  ];
  const inviters = inviterIds.length
    ? await prisma.ownerProfile.findMany({
        where: { id: { in: inviterIds } },
        select: { id: true, full_name: true },
      })
    : [];
  const inviterMap = new Map(inviters.map((i) => [i.id, i.full_name]));

  const coOwnerInvites: CoOwnerInviteRow[] = coOwnerInvitesRaw.map((c) => ({
    id: c.id,
    invitedAt: c.added_at.toISOString(),
    animal: c.animal,
    inviter: { full_name: inviterMap.get(c.added_by_owner_id) ?? null },
  }));

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {coOwnerInvites.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("coOwnerInvitesTitle")}
              <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                {coOwnerInvites.length}
              </span>
            </h2>
          </div>
          <CoOwnerInvitesList invites={coOwnerInvites} />
        </section>
      )}

      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("pendingTitle")}
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
            {t("vetsWithAccessTitle")}
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
