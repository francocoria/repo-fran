import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface AnimalListItem {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  birth_date: string | null;
  photo_url: string | null;
  status: string;
  weight_kg: number | null;
  microchip: string | null;
  color: string | null;
  url_token: string;
  has_severe_allergy: boolean;
  has_overdue_vaccine: boolean;
  active_meds_count: number;
}

export function useAnimals() {
  return useQuery({
    queryKey: ["animals"],
    queryFn: async (): Promise<AnimalListItem[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("owner_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) return [];

      const { data: animals } = await supabase
        .from("animals")
        .select(
          `id, name, species, breed, sex, birth_date, photo_url, status,
           weight_kg, microchip, color, url_token,
           allergies:allergies(severity),
           vaccines:vaccines(next_dose_date),
           medications:medications(active)`,
        )
        .eq("owner_id", profile.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (!animals) return [];

      const now = new Date();
      return animals.map((a: any) => ({
        id: a.id,
        name: a.name,
        species: a.species,
        breed: a.breed,
        sex: a.sex,
        birth_date: a.birth_date,
        photo_url: a.photo_url,
        status: a.status,
        weight_kg: a.weight_kg ? Number(a.weight_kg) : null,
        microchip: a.microchip,
        color: a.color,
        url_token: a.url_token,
        has_severe_allergy: (a.allergies ?? []).some(
          (x: any) => x.severity === "severe",
        ),
        has_overdue_vaccine: (a.vaccines ?? []).some(
          (v: any) => v.next_dose_date && new Date(v.next_dose_date) < now,
        ),
        active_meds_count: (a.medications ?? []).filter((m: any) => m.active)
          .length,
      }));
    },
  });
}

export function useAnimal(id: string) {
  return useQuery({
    queryKey: ["animal", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("animals")
        .select("*")
        .eq("id", id)
        .single();
      return data;
    },
  });
}
