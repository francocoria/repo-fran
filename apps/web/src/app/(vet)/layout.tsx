import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { requireUser, getVetProfile } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { prisma } from "@pet-app/db";
import { hasVerifiedTotp, requiresMfaChallenge } from "@/lib/mfa";

/**
 * Layout protegido para veterinarios.
 * Verifica sesión + perfil de vet + MFA obligatorio si Premium.
 *
 * MFA enforcement (audit ALTO-10):
 *  - Solo vets con suscripción Premium activa están forzados
 *  - Vets free pueden activar MFA opcionalmente sin enforcement
 *  - Bypass de enforcement en /vet/settings/mfa para evitar loop
 */
export default async function VetLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  const t = await getTranslations("vetLayout");

  if (!profile) {
    redirect("/onboarding");
  }

  // Enforcement MFA solo si el vet tiene Premium activo
  const sub = await prisma.subscription.findUnique({
    where: { vet_id: profile.id },
    select: { plan: true, status: true, expires_at: true },
  });
  const isPremium =
    sub?.status === "active" &&
    sub.plan !== "free" &&
    (sub.expires_at ? sub.expires_at > new Date() : true);

  const pathname =
    (await headers()).get("x-pathname") ??
    (await headers()).get("next-url") ??
    "";
  const isMfaSettings = pathname.includes("/vet/settings/mfa");

  if (isPremium && !isMfaSettings) {
    const hasTotp = await hasVerifiedTotp();
    if (!hasTotp) redirect("/vet/settings/mfa?required=1");
    if (await requiresMfaChallenge()) {
      redirect("/auth/mfa-challenge?redirectTo=/vet");
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Premium ambient light radial blur for PC layout */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none opacity-25 dark:opacity-15 blur-[90px] bg-gradient-to-b from-accent/10 via-transparent to-transparent -z-10" />

      <AppHeader
        userName={profile.full_name}
        userRole="vet"
        avatarUrl={profile.avatar_url}
      />
      <main className="container py-6 md:py-8 relative z-10">{children}</main>
      <MobileNav role="vet" fabHref="/vet/scan" fabIcon="scan" fabLabel={t("fabLabel")} />
    </div>
  );
}
