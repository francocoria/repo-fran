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
