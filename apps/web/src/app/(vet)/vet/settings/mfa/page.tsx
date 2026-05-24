import { requireUser, getVetProfile } from "@/lib/auth";
import { listFactors } from "@/lib/mfa";
import { prisma } from "@pet-app/db";
import { MfaSetup } from "@/components/mfa/mfa-setup";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Autenticación de dos factores · PetApp" };

export default async function VetMfaSettingsPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) redirect("/onboarding/vet");

  const { data: factors } = await listFactors();
  const totp = (factors?.totp ?? []).map((f) => ({
    id: f.id,
    status: f.status as "verified" | "unverified",
    friendly_name: f.friendly_name,
  }));

  // MFA es obligatorio para vets con suscripción Premium activa
  const sub = await prisma.subscription.findUnique({
    where: { vet_id: profile.id },
    select: { plan: true, status: true, expires_at: true },
  });
  const isPremium =
    sub?.status === "active" &&
    sub.plan !== "free" &&
    (sub.expires_at ? sub.expires_at > new Date() : true);

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Autenticación de dos factores
        </h1>
        <p className="mt-1 text-muted-foreground">
          Agregá una capa extra de seguridad a tu cuenta usando una app de
          autenticación.
        </p>
      </div>
      <MfaSetup existingFactors={totp} required={isPremium} />
    </div>
  );
}
