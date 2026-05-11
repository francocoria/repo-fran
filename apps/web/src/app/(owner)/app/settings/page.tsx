import { requireUser, getOwnerProfile } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
import { ThemePicker } from "./theme-picker";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function OwnerSettingsPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) return null;

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Gestioná tu información personal y personalizá la app.
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
    </div>
  );
}
