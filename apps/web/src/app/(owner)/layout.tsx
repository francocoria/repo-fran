import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

/**
 * Layout protegido para dueños de mascotas.
 * Verifica sesión + perfil de owner.
 */
export default async function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  const t = await getTranslations("ownerCommon");

  if (!profile) {
    // Tiene sesión pero no perfil de owner — redirigir a onboarding
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Premium ambient light radial blur for PC layout */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none opacity-25 dark:opacity-15 blur-[90px] bg-gradient-to-b from-primary/10 via-transparent to-transparent -z-10" />

      <AppHeader
        userName={profile.full_name}
        userRole="owner"
        avatarUrl={profile.avatar_url}
      />
      <main className="container py-6 md:py-8 relative z-10">{children}</main>
      <MobileNav role="owner" fabHref="/app/qr" fabIcon="qr" fabLabel={t("fabShowQr")} />
    </div>
  );
}
