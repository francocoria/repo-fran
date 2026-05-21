import { getTranslations } from "next-intl/server";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { SettingsView } from "./settings-view";
import { prisma } from "@pet-app/db";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("ownerSettings");
  return { title: t("metaTitle") };
}

export default async function OwnerSettingsPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) return null;

  const petCount = await prisma.animal.count({
    where: { owner_id: profile.id },
  });

  return (
    <div className="animate-fade-up w-full">
      <SettingsView
        email={user.email ?? ""}
        initialData={{
          fullName: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          address: profile.address,
        }}
        petCount={petCount}
      />
    </div>
  );
}
