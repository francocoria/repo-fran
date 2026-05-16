import { getTranslations } from "next-intl/server";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
import { ThemePicker } from "./theme-picker";
import { DeleteAccountSection } from "@/components/delete-account-section";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("ownerSettings");
  return { title: t("metaTitle") };
}

export default async function OwnerSettingsPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  const t = await getTranslations("ownerSettings");

  if (!profile) return null;

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <SettingsForm
        email={user.email ?? ""}
        initialData={{
          fullName: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          address: profile.address,
        }}
      />

      <ThemePicker />

      <DeleteAccountSection />
    </div>
  );
}
