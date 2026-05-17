import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser, getVetProfile } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

/**
 * Layout protegido para veterinarios.
 * Verifica sesión + perfil de vet.
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={profile.full_name}
        userRole="vet"
        avatarUrl={profile.avatar_url}
      />
      <main className="container py-6 md:py-8">{children}</main>
      <MobileNav role="vet" fabHref="/vet/scan" fabIcon="scan" fabLabel={t("fabLabel")} />
    </div>
  );
}
