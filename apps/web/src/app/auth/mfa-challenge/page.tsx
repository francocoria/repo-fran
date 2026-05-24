import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { listFactors, getAuthLevel } from "@/lib/mfa";
import { MfaChallengeForm } from "@/components/mfa/mfa-challenge-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verificación · PetApp" };

export default async function MfaChallengePage() {
  await requireUser();

  // Si ya estamos en AAL2, no tiene sentido pedir challenge.
  const level = await getAuthLevel();
  if (level.current === "aal2") redirect("/app");

  const { data } = await listFactors();
  const verifiedTotp = (data?.totp ?? []).find(
    (f) => f.status === "verified",
  );
  // Si no hay factor verificado, no hay nada que challengear.
  if (!verifiedTotp) redirect("/app");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}>
        <MfaChallengeForm factorId={verifiedTotp.id} />
      </Suspense>
    </div>
  );
}
