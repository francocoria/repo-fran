import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, PlusCircle } from "lucide-react";
import { Button, Card, CardContent, PetAvatar } from "@pet-app/ui";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { QRModal } from "@/components/animal/qr-modal";

export const metadata = { title: "Mostrar QR" };
export const dynamic = "force-dynamic";

const speciesLabels: Record<string, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  rodent: "Roedor",
  reptile: "Reptil",
  fish: "Pez",
  exotic: "Exótico",
  other: "Otro",
};

export default async function QrPickerPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  if (!profile) redirect("/onboarding");

  const animals = await prisma.animal.findMany({
    where: { owner_id: profile.id, status: { not: "archived" } },
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      photo_url: true,
      url_token: true,
    },
    orderBy: { created_at: "asc" },
  });

  if (animals.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <QrCode className="size-7" />
        </div>
        <h1 className="text-xl font-semibold">Todavía no tenés mascotas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Agregá una para generar su QR y compartirlo con tu veterinario.
        </p>
        <Button asChild className="mt-6">
          <Link href="/app/animals/new">
            <PlusCircle className="size-4" />
            Agregar mascota
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mostrar QR</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elegí la mascota y mostrale el código al veterinario para que lo
          escanee con su cámara.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {animals.map((animal) => (
          <Card key={animal.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <PetAvatar
                    name={animal.name}
                    photoUrl={animal.photo_url}
                    species={animal.species}
                    size={56}
                    radius={14}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{animal.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {speciesLabels[animal.species] ?? animal.species}
                    {animal.breed && ` · ${animal.breed}`}
                  </p>
                </div>
                <QRModal
                  animalId={animal.id}
                  animalName={animal.name}
                  urlToken={animal.url_token}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface-2/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">¿Cómo funciona?</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed">
          <li>Tocá "Mostrar QR" en la mascota que querés compartir.</li>
          <li>El veterinario escanea el QR con la cámara de su celular.</li>
          <li>Aprobás la solicitud desde la pestaña "Accesos".</li>
        </ol>
      </div>
    </div>
  );
}
