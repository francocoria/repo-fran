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
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={profile.full_name}
        userRole="owner"
        avatarUrl={profile.avatar_url}
      />
      <main className="container py-6 md:py-8">{children}</main>
      <MobileNav role="owner" fabHref="/app/qr" fabIcon="qr" fabLabel={t("fabShowQr")} />
    </div>
  );
}
