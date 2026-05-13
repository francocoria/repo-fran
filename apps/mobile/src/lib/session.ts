import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: "owner" | "vet" | null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data: owner } = await supabase
    .from("owner_profiles")
    .select("id, user_id, full_name, phone, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (owner) return { ...owner, role: "owner" };

  const { data: vet } = await supabase
    .from("vet_profiles")
    .select("id, user_id, full_name, phone, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (vet) return { ...vet, role: "vet" };

  return null;
}

/**
 * Hook que cachea el perfil del usuario por-sesión usando react-query.
 * Reemplaza llamadas múltiples a loadProfile en index + _layout + tabs
 * que hacían 3 round-trips por navegación.
 */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => (userId ? loadProfile(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 min — se refetchea solo al pasar este tiempo
    gcTime: 30 * 60 * 1000, // mantenemos en cache 30 min
  });
}

export async function signInWithOtp(email: string) {
  return supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
}

export async function verifyOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}
