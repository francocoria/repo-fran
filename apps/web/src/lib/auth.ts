"use server";

import { createSupabaseServerClient } from "@pet-app/lib";
import { redirect } from "next/navigation";

/**
 * Obtiene el usuario autenticado actual.
 * Retorna null si no hay sesión.
 */
export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Obtiene el usuario o redirige a /login.
 * Usar en layouts/páginas protegidas.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Obtiene el perfil del owner desde la tabla owner_profiles.
 */
export async function getOwnerProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("owner_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

/**
 * Obtiene el perfil del vet desde la tabla vet_profiles.
 */
export async function getVetProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vet_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

/**
 * Verifica si el usuario es admin.
 */
export async function getAdminUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

/**
 * Detecta el rol del usuario actual.
 */
export async function getUserRole(userId: string): Promise<"owner" | "vet" | "admin" | null> {
  const [admin, vet, owner] = await Promise.all([
    getAdminUser(userId),
    getVetProfile(userId),
    getOwnerProfile(userId),
  ]);

  if (admin) return "admin";
  if (vet) return "vet";
  if (owner) return "owner";
  return null;
}
