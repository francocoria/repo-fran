import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { QrCode, PlusCircle } from "lucide-react";
import { Button, Card, CardContent, PetAvatar } from "@pet-app/ui";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { QRModal } from "@/components/animal/qr-modal";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("ownerQr");
  return { title: t("metaTitle") };
}

const SPECIES_KEYS: Record<string, string> = {
  dog: "speciesDog",
  cat: "speciesCat",
  bird: "speciesBird",
  rabbit: "speciesRabbit",
  rodent: "speciesRodent",
  reptile: "speciesReptile",
  fish: "speciesFish",
  exotic: "speciesExotic",
  other: "speciesOther",
};

export default async function QrPickerPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  const t = await getTranslations("ownerQr");
  const tc = await getTranslations("ownerCommon");
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
        <h1 className="text-xl font-semibold">{t("emptyTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("emptyText")}
        </p>
        <Button asChild className="mt-6">
          <Link href="/app/animals/new">
            <PlusCircle className="size-4" />
            {t("addPet")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle")}
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
                    {SPECIES_KEYS[animal.species]
                      ? tc(
                          SPECIES_KEYS[animal.species] as Parameters<
                            typeof tc
                          >[0],
                        )
                      : animal.species}
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
        <p className="font-medium text-foreground">{t("howTitle")}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed">
          <li>{t("howStep1")}</li>
          <li>{t("howStep2")}</li>
          <li>{t("howStep3")}</li>
        </ol>
      </div>
    </div>
  );
}
