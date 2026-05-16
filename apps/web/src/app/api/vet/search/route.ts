import { NextResponse, type NextRequest } from "next/server";
import { getUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Buscador global del panel vet.
 * Busca entre los pacientes del vet (animales con acceso aprobado) por
 * nombre de la mascota o nombre del dueño.
 *
 * GET /api/vet/search?q=...
 */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const vetProfile = await getVetProfile(user.id);
  if (!vetProfile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const accesses = await prisma.vetAccess.findMany({
    where: {
      vet_id: vetProfile.id,
      status: "approved",
      animal: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          {
            owner_profile: {
              full_name: { contains: q, mode: "insensitive" },
            },
          },
        ],
      },
    },
    select: {
      archived_by_vet: true,
      animal: {
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          photo_url: true,
          owner_profile: { select: { full_name: true } },
        },
      },
    },
    orderBy: [{ archived_by_vet: "asc" }, { approved_at: "desc" }],
    take: 8,
  });

  const results = accesses.map((a) => ({
    animalId: a.animal.id,
    name: a.animal.name,
    species: a.animal.species,
    breed: a.animal.breed,
    photoUrl: a.animal.photo_url,
    ownerName: a.animal.owner_profile.full_name,
    archived: a.archived_by_vet,
  }));

  return NextResponse.json({ results });
}
