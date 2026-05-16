"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Input, Label, Card, CardContent } from "@pet-app/ui";
import { updateAnimal } from "../../../actions";
import { AlertCircle, Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const SPECIES_OPTIONS: { value: string; key: Parameters<
  ReturnType<typeof useTranslations<"ownerCommon">>
>[0] }[] = [
  { value: "dog", key: "speciesDog" },
  { value: "cat", key: "speciesCat" },
  { value: "bird", key: "speciesBird" },
  { value: "rabbit", key: "speciesRabbit" },
  { value: "rodent", key: "speciesRodent" },
  { value: "reptile", key: "speciesReptile" },
  { value: "fish", key: "speciesFish" },
  { value: "exotic", key: "speciesExotic" },
  { value: "other", key: "speciesOther" },
];

const SEX_OPTIONS: { value: string; key: Parameters<
  ReturnType<typeof useTranslations<"ownerCommon">>
>[0] }[] = [
  { value: "male", key: "sexMale" },
  { value: "female", key: "sexFemale" },
  { value: "unknown", key: "sexUnknown" },
];

// For the edit page we need to fetch the animal data client-side
// since we need both client interactivity and pre-filled data
export default function EditAnimalPage() {
  const router = useRouter();
  const t = useTranslations("animalEdit");
  const tc = useTranslations("ownerCommon");
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [animal, setAnimal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the animal data via an API-less approach:
    // We fetch the page HTML, but actually we just use a simple fetch to a
    // lightweight API endpoint. For now, we embed the data loading inline.
    // TODO: create a lightweight API route or use React Server Components pattern
    fetch(`/api/animals/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.animal) setAnimal(data.animal);
        else setError(t("errorNotFound"));
      })
      .catch(() => setError(t("errorLoad")))
      .finally(() => setLoading(false));
  }, [id]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(() => { void (async () => {
      const result = await updateAnimal(id, formData);
      if (result.success) {
        router.push(`/app/animals/${id}`);
      } else {
        setError(result.error ?? t("errorUpdate"));
      }
    })(); });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">{error || t("notFound")}</p>
        <Button asChild className="mt-4">
          <Link href="/app">{t("backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/app/animals/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title", { name: animal.name })}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input id="name" name="name" required defaultValue={animal.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="species">{t("species")}</Label>
                <select
                  id="species"
                  name="species"
                  defaultValue={animal.species}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SPECIES_OPTIONS.map((sp) => (
                    <option key={sp.value} value={sp.value}>{tc(sp.key)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">{t("breed")}</Label>
                <Input id="breed" name="breed" defaultValue={animal.breed || ""} placeholder={t("breedPlaceholder")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">{t("sex")}</Label>
                <select
                  id="sex"
                  name="sex"
                  defaultValue={animal.sex}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SEX_OPTIONS.map((sx) => (
                    <option key={sx.value} value={sx.value}>{tc(sx.key)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">{t("birthDate")}</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={animal.birth_date ? new Date(animal.birth_date).toISOString().split('T')[0] : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">{t("weight")}</Label>
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.1"
                  defaultValue={animal.weight_kg || ""}
                  placeholder="12.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">{t("color")}</Label>
                <Input id="color" name="color" defaultValue={animal.color || ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="microchip">{t("microchip")}</Label>
                <Input id="microchip" name="microchip" defaultValue={animal.microchip || ""} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distinctiveMarks">{t("distinctiveMarks")}</Label>
              <Input id="distinctiveMarks" name="distinctiveMarks" defaultValue={animal.distinctive_marks || ""} placeholder={t("distinctiveMarksPlaceholder")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={animal.notes || ""}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder={t("notesPlaceholder")}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="neutered"
                  name="neutered"
                  value="true"
                  defaultChecked={animal.neutered}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="neutered" className="font-normal text-sm">{t("neutered")}</Label>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("saveChanges")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
