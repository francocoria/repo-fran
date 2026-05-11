import { requireUser, getOwnerProfile } from "@/lib/auth";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function OwnerSettingsPage() {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);

  if (!profile) return null;

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Gestioná tu información personal.
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
    </div>
  );
}
