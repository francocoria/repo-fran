import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUser, getUserRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accedé a tu cuenta de PetApp con tu código de 6 dígitos.",
};

export const dynamic = "force-dynamic";

/**
 * Si el usuario ya tiene sesión, lo mandamos al dashboard de su rol.
 * Sirve para evitar que un usuario logueado vea la pantalla de login
 * (caso típico: PWA en cache, link viejo, etc).
 */
export default async function LoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();
  if (user) {
    const role = await getUserRole(user.id);
    if (role === "admin") redirect("/admin");
    if (role === "vet") redirect("/vet");
    if (role === "owner") redirect("/app");
    redirect("/onboarding");
  }
  return children;
}
