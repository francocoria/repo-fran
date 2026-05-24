import { requireUser, getAdminUser } from "@/lib/auth";
import { listFactors } from "@/lib/mfa";
import { MfaSetup } from "@/components/mfa/mfa-setup";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Autenticación de dos factores · Admin" };

export default async function AdminMfaSettingsPage() {
  const user = await requireUser();
  const admin = await getAdminUser(user.id);
  if (!admin) redirect("/app");

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
          MFA es obligatorio para todos los administradores. Activalo antes de
          seguir usando el panel.
        </p>
      </div>
      <MfaSetup existingFactors={totp} required={true} />
    </div>
  );
}
