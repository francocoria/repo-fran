import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@pet-app/lib";
import { prisma } from "@pet-app/db";
import { OwnerOnboardingForm } from "./owner-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bienvenido" };

/**
 * Si tenemos nombre en user_metadata (vino del /signup), creamos el perfil
 * en silencio y mandamos al dashboard. Solo mostramos el form cuando no
 * hay nombre disponible (ej: usuario que se logueo con OTP via /login).
 */
export default async function OnboardingOwnerPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const existing = await prisma.ownerProfile.findUnique({
    where: { user_id: user.id },
    select: { id: true },
  });
  if (existing) redirect("/app");

  const metadata = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    phone?: string;
    avatar_url?: string;
  };
  const knownName = metadata.full_name?.trim() || metadata.name?.trim() || "";

  if (knownName.length >= 2) {
    await prisma.ownerProfile.create({
      data: {
        user_id: user.id,
        full_name: knownName,
        phone: metadata.phone ?? null,
        avatar_url: metadata.avatar_url ?? null,
      },
    });
    redirect("/app");
  }

  // No tenemos nombre → form mínimo (cliente)
  return <OwnerOnboardingForm />;
}
