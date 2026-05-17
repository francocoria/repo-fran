import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser, getAdminUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

/**
 * Layout protegido para admins.
 * Verifica sesión + entrada en admin_users.
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
