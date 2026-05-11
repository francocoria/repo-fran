import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface VetPatient {
  access_id: string;
  animal_id: string;
  animal_name: string;
  animal_species: string;
  animal_breed: string | null;
  animal_photo_url: string | null;
  owner_name: string;
  owner_phone: string | null;
  archived: boolean;
}

export function useVetPatients() {
  return useQuery({
    queryKey: ["vet-patients"],
    queryFn: async (): Promise<VetPatient[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: profile } = await supabase
        .from("vet_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) return [];

      const { data } = await supabase
        .from("vet_access")
        .select(
          `id, archived_by_vet,
           animal:animals(id, name, species, breed, photo_url,
             owner_profile:owner_profiles(full_name, phone))`,
        )
        .eq("vet_id", profile.id)
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      return (data ?? []).map((row: any) => ({
        access_id: row.id,
        animal_id: row.animal.id,
        animal_name: row.animal.name,
        animal_species: row.animal.species,
        animal_breed: row.animal.breed,
        animal_photo_url: row.animal.photo_url,
        owner_name: row.animal.owner_profile?.full_name ?? "—",
        owner_phone: row.animal.owner_profile?.phone ?? null,
        archived: row.archived_by_vet,
      }));
    },
  });
}

export function useVetPlan() {
  return useQuery({
    queryKey: ["vet-plan"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from("vet_profiles")
        .select("id, full_name, clinic_name, verified")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) return null;

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("vet_id", profile.id)
        .maybeSingle();

      const { count: activeCount } = await supabase
        .from("vet_access")
        .select("id", { count: "exact", head: true })
        .eq("vet_id", profile.id)
        .eq("status", "approved")
        .eq("archived_by_vet", false);

      return {
        profile,
        subscription: sub,
        activeCount: activeCount ?? 0,
      };
    },
  });
}
