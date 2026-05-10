import { Dog, Cat, Bird, Rabbit, PlusCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { Button, Card, CardContent } from "@pet-app/ui";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { getAge } from "@pet-app/lib/utils/format";

const speciesIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-6 w-6" />,
  cat: <Cat className="h-6 w-6" />,
  bird: <Bird className="h-6 w-6" />,
  rabbit: <Rabbit className="h-6 w-6" />,
};

export default async function OwnerDashboardPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) return null;

  // Fetch owned animals and co-owned animals
  const ownedAnimals = await prisma.animal.findMany({
    where: { owner_id: profile.id, status: { not: "archived" } },
    orderBy: { created_at: "desc" },
  });

  const coOwnedAnimalsRel = await prisma.coOwner.findMany({
    where: { owner_id: profile.id, status: "active" },
    include: {
      animal: true,
    },
    orderBy: { added_at: "desc" },
  });

  const coOwnedAnimals = coOwnedAnimalsRel.map(co => co.animal).filter(a => a.status !== "archived");

  const allAnimals = [...ownedAnimals, ...coOwnedAnimals];

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis mascotas</h1>
          <p className="mt-1 text-muted-foreground">
            Gestioná la salud y datos de tus animales.
          </p>
        </div>
        {allAnimals.length > 0 && (
          <Button asChild>
            <Link href="/app/animals/new" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva mascota</span>
              <span className="sm:hidden">Nueva</span>
            </Link>
          </Button>
        )}
      </div>

      {allAnimals.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 py-16 px-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Dog className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">
            Todavía no registraste mascotas
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Empezá registrando a tu primera mascota para llevar el control de sus
            vacunas, turnos e historial médico.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/animals/new" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Registrar mi primera mascota
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allAnimals.map((animal) => {
            const ageText = animal.birth_date ? getAge(animal.birth_date) : "Edad desconocida";
            const Icon = speciesIcons[animal.species] || <Dog className="h-6 w-6" />;
            const isCoOwned = animal.owner_id !== profile.id;

            return (
              <Link key={animal.id} href={`/app/animals/${animal.id}`} className="group block focus-ring rounded-2xl">
                <Card className="transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] bg-secondary/50 rounded-t-2xl relative overflow-hidden flex items-center justify-center border-b">
                      {animal.photo_url ? (
                        <img 
                          src={animal.photo_url} 
                          alt={animal.name} 
                          className="object-cover w-full h-full transition-transform group-hover:scale-105" 
                        />
                      ) : (
                        <div className="text-muted-foreground/50 transition-transform group-hover:scale-110">
                           <div className="scale-150">{Icon}</div>
                        </div>
                      )}
                      {isCoOwned && (
                         <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md font-medium">
                           Compartida
                         </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{animal.name}</h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{ageText}</span>
                        {animal.breed && (
                           <>
                             <span>·</span>
                             <span className="truncate">{animal.breed}</span>
                           </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
