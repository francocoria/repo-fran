"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { createAnimal } from "../../actions";
import { Dog, Cat, Bird, Rabbit, AlertCircle, Loader2, Info } from "lucide-react";
import { ANIMAL_SPECIES, ANIMAL_SEX } from "@pet-app/lib/validators";

const speciesIcons: Record<string, React.ReactNode> = {
  dog: <Dog className="h-6 w-6" />,
  cat: <Cat className="h-6 w-6" />,
  bird: <Bird className="h-6 w-6" />,
  rabbit: <Rabbit className="h-6 w-6" />,
};

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

export default function NewAnimalPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [species, setSpecies] = useState<string>("dog");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("species", species); // Add selected species

    startTransition(async () => {
      const result = await createAnimal(formData);
      if (result.success) {
        router.push(`/app/animals/${result.animalId}`);
      } else {
        setError(result.error ?? "Error al registrar la mascota");
      }
    });
  }

  return (
    <div className="animate-fade-up max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Nueva mascota</h1>
        <p className="mt-1 text-muted-foreground">
          Ingresá los datos básicos para crear su perfil de salud.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Especie Selector (Visual) */}
            <div className="space-y-3">
              <Label>¿Qué especie es?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["dog", "cat", "bird", "rabbit"].map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpecies(sp)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      species === sp
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {speciesIcons[sp]}
                    <span className="text-sm font-medium">{speciesLabels[sp]}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ANIMAL_SPECIES.map((sp) => (
                    <option key={sp} value={sp}>
                      {speciesLabels[sp]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" name="name" required placeholder="Firu" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="breed">Raza</Label>
                <Input id="breed" name="breed" placeholder="Mestizo, Golden, etc." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <select
                  id="sex"
                  name="sex"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="male">Macho</option>
                  <option value="female">Hembra</option>
                  <option value="unknown">Desconocido</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Peso (kg)</Label>
                <Input id="weightKg" name="weightKg" type="number" step="0.1" placeholder="Ej: 12.5" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input id="birthDate" name="birthDate" type="date" />
              </div>

              <div className="flex items-center gap-2 mt-8">
                <input
                  type="checkbox"
                  id="birthDateApprox"
                  name="birthDateApprox"
                  value="true"
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="birthDateApprox" className="font-normal text-sm text-muted-foreground">
                  Es una fecha aproximada
                </Label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                <Label htmlFor="color">Color principal</Label>
                <Input id="color" name="color" placeholder="Negro y blanco, atigrado..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microchip">Número de Microchip</Label>
                <Input id="microchip" name="microchip" placeholder="Opcional" />
              </div>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4 border border-border flex items-start gap-3 mt-4">
               <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Podrás agregar historial médico, vacunas, e invitar a otros dueños después de crear el perfil de la mascota.
               </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Crear Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
