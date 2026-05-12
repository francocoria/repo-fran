"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { createAnimal } from "../../actions";
import {
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  PawPrint,
  Plus,
  AlertCircle,
  Loader2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { ANIMAL_SPECIES } from "@pet-app/lib/validators";
import { COMMON_BREEDS, SPECIES_LABELS } from "@pet-app/lib/constants";

interface SpeciesOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

const SPECIES_GRID: SpeciesOption[] = [
  { value: "dog", label: "Perro", icon: Dog },
  { value: "cat", label: "Gato", icon: Cat },
  { value: "bird", label: "Ave", icon: Bird },
  { value: "rabbit", label: "Conejo", icon: Rabbit },
  { value: "rodent", label: "Roedor", icon: PawPrint },
  { value: "reptile", label: "Reptil", icon: PawPrint },
  { value: "fish", label: "Pez", icon: Fish },
  { value: "other", label: "Otra", icon: Plus },
];

export default function NewAnimalPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [species, setSpecies] = useState<string>("dog");
  const [customSpecies, setCustomSpecies] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("species", species);

    // Si eligió "other" y escribió nombre custom, lo metemos en breed (o lo prepending)
    if (species === "other" && customSpecies.trim()) {
      const breedInput = formData.get("breed");
      const trimmedBreed = breedInput ? String(breedInput).trim() : "";
      formData.set(
        "breed",
        trimmedBreed
          ? `${customSpecies.trim()} · ${trimmedBreed}`
          : customSpecies.trim(),
      );
    }

    startTransition(() => { void (async () => {
      const result = await createAnimal(formData);
      if (result.success && result.animalId) {
        router.push(`/app/animals/${result.animalId}` as `/app/animals/${string}`);
      } else {
        setError(result.error ?? "Error al registrar la mascota");
      }
    })(); });
  }

  const breedSuggestions = COMMON_BREEDS[species] ?? [];

  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Nueva mascota</h1>
        <p className="mt-1 text-muted-foreground">
          Ingresá los datos básicos para crear su perfil de salud.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* ─── Especie selector visual ─── */}
            <div className="space-y-3">
              <Label>¿Qué especie es?</Label>
              <div className="grid grid-cols-4 gap-2.5">
                {SPECIES_GRID.map((sp) => {
                  const Icon = sp.icon;
                  const selected = species === sp.value;
                  return (
                    <button
                      key={sp.value}
                      type="button"
                      onClick={() => setSpecies(sp.value)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                        selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                    >
                      <Icon className="size-5" />
                      <span className="text-[12.5px] font-medium">
                        {sp.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Si eligió "Otra", aparece input para el nombre custom */}
              {species === "other" && (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="customSpecies" className="text-xs">
                    Especificá la especie
                  </Label>
                  <Input
                    id="customSpecies"
                    placeholder="Ej: Hurón, Tortuga, Erizo africano..."
                    value={customSpecies}
                    onChange={(e) => setCustomSpecies(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Lo guardamos en el campo Raza para que quede registrado.
                  </p>
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* ─── Datos básicos ─── */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input id="name" name="name" required placeholder="Firu" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Raza</Label>
                <Input
                  id="breed"
                  name="breed"
                  list={`breeds-${species}`}
                  placeholder={
                    breedSuggestions.length > 0
                      ? `Ej: ${breedSuggestions[0]}`
                      : "Escribí libremente"
                  }
                  maxLength={80}
                />
                {breedSuggestions.length > 0 && (
                  <datalist id={`breeds-${species}`}>
                    {breedSuggestions.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                )}
                {breedSuggestions.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Empezá a escribir para ver sugerencias. Si no está, podés
                    escribirla a mano.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <select
                  id="sex"
                  name="sex"
                  defaultValue="unknown"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="male">Macho</option>
                  <option value="female">Hembra</option>
                  <option value="unknown">Desconocido</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Peso (kg)</Label>
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 12.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input id="birthDate" name="birthDate" type="date" />
              </div>

              <div className="mt-8 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="birthDateApprox"
                  name="birthDateApprox"
                  value="true"
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label
                  htmlFor="birthDateApprox"
                  className="text-sm font-normal text-muted-foreground"
                >
                  Es una fecha aproximada
                </Label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="color">Color principal</Label>
                <Input
                  id="color"
                  name="color"
                  placeholder="Negro y blanco, atigrado..."
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microchip">Número de Microchip</Label>
                <Input
                  id="microchip"
                  name="microchip"
                  placeholder="Opcional"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
              <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Podrás agregar historial médico, vacunas e invitar a otros
                dueños después de crear el perfil.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Crear perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
