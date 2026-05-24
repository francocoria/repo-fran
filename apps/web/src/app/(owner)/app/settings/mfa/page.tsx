import { requireUser } from "@/lib/auth";
import { listFactors } from "@/lib/mfa";
import { MfaSetup } from "@/components/mfa/mfa-setup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Autenticación de dos factores · PetApp" };

export default async function OwnerMfaSettingsPage() {
  await requireUser();

  const { data: factors } = await listFactors();
  const totp = (factors?.totp ?? []).map((f) => ({
    id: f.id,
    status: f.status as "verified" | "unverified",
    friendly_name: f.friendly_name,
  }));

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Autenticación de dos factores
        </h1>
        <p className="mt-1 text-muted-foreground">
          Opcional para dueños. Agregá una capa extra de seguridad si querés.
        </p>
      </div>
      <MfaSetup existingFactors={totp} required={false} />
    </div>
  );
}
