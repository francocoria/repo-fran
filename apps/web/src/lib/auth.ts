import * as React from "react";
import { createSupabaseServerClient } from "@pet-app/lib";
import { redirect } from "next/navigation";

// React 19 expone `cache` pero los tipos en @types/react@18.3 todavía no lo
// reflejan. En runtime existe — sólo hacemos el cast para TypeScript.
const cache = (
  React as unknown as {
    cache: <T extends (...args: never[]) => unknown>(fn: T) => T;
  }
).cache;

/**
 * Helpers de auth para server components, server actions y middleware.
 *
 * Todos están wrapeados con React.cache para deduplicar queries dentro
 * de un mismo request. Esto evita el patrón típico de layout + page
 * haciendo getUser() dos veces seguidas (2 round-trips innecesarios).
 */

/**
 * Obtiene el usuario autenticado actual.
 * Retorna null si no hay sesión.
 */
export const getUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Obtiene el usuario o redirige a /login.
 * Usar en layouts/páginas protegidas.
 */
export const requireUser = cache(async () => {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

/**
 * Obtiene el perfil del owner desde la tabla owner_profiles.
 */
export const getOwnerProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("owner_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
});

/**
 * Obtiene el perfil del vet desde la tabla vet_profiles.
 */
export const getVetProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vet_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
});

/**
 * Verifica si el usuario es admin.
 */
export const getAdminUser = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
});

/**
 * Detecta el rol del usuario actual. Hace los 3 lookups en paralelo.
 */
export const getUserRole = cache(
  async (
    userId: string,
  ): Promise<"owner" | "vet" | "admin" | null> => {
    const [admin, vet, owner] = await Promise.all([
      getAdminUser(userId),
      getVetProfile(userId),
      getOwnerProfile(userId),
    ]);

    if (admin) return "admin";
    if (vet) return "vet";
    if (owner) return "owner";
    return null;
  },
);
