import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { ConsultForm } from "./consult-form";

export const metadata = { title: "Nueva consulta" };
export const dynamic = "force-dynamic";

export default async function NewConsultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) notFound();

  // Verificar acceso aprobado
  const access = await prisma.vetAccess.findUnique({
    where: {
      animal_id_vet_id: { animal_id: id, vet_id: profile.id },
    },
  });
  if (!access || access.status !== "approved") notFound();

  const animal = await prisma.animal.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      photo_url: true,
      birth_date: true,
      allergies: {
        where: { severity: "severe" },
        select: { id: true, allergen: true, type: true },
      },
    },
  });

  if (!animal) notFound();

  const templates = await prisma.consultTemplate.findMany({
    where: {
      OR: [{ is_system: true }, { vet_id: profile.id }],
    },
    orderBy: [{ is_system: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      content: true,
      is_system: true,
    },
  });

  return (
    <div className="animate-fade-up max-w-3xl">
      <Link
        href={`/vet/patients/${animal.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al paciente
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nueva consulta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paciente: <span className="font-medium text-foreground">{animal.name}</span>
          {animal.breed && <> · {animal.breed}</>}
        </p>
      </div>

      {animal.allergies.length > 0 && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            ⚠️ Alergias severas registradas
          </p>
          <p className="mt-2 text-sm">
            {animal.allergies.map((a) => a.allergen).join(", ")}
          </p>
        </div>
      )}

      <ConsultForm
        animalId={animal.id}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          content: t.content as Record<string, string>,
          is_system: t.is_system,
        }))}
      />
    </div>
  );
}
