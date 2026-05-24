import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { requireUser, getAdminUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { hasVerifiedTotp, requiresMfaChallenge } from "@/lib/mfa";

/**
 * Layout protegido para admins.
 * Verifica sesión + entrada en admin_users + MFA TOTP obligatorio.
 *
 * MFA enforcement (audit ALTO-10):
 *  - Sin factor TOTP enrolled → redirect a /admin/settings/mfa
 *  - Con factor pero sesión AAL1 → redirect a /auth/mfa-challenge
 *
 * Para evitar loop infinito en la página de enrollment misma, hacemos
 * bypass cuando el pathname ya es /admin/settings/mfa.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const admin = await getAdminUser(user.id);

  if (!admin) {
    // No es admin — redirigir al dashboard normal
    redirect("/app");
  }

  // Bypass del enforcement en la página de enrollment para evitar loop.
  const pathname =
    (await headers()).get("x-pathname") ??
    (await headers()).get("next-url") ??
    "";
  const isMfaSettings = pathname.includes("/admin/settings/mfa");

  if (!isMfaSettings) {
    const hasTotp = await hasVerifiedTotp();
    if (!hasTotp) redirect("/admin/settings/mfa?required=1");
    if (await requiresMfaChallenge()) {
      redirect("/auth/mfa-challenge?redirectTo=/admin");
    }
  }

  const t = await getTranslations("adminLayout");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={t("userName")}
        userRole="admin"
      />
      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
}
