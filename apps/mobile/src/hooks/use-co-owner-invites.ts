import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { env } from "../lib/env";

export interface CoOwnerInvite {
  id: string;
  invitedAt: string;
  animal: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    photo_url: string | null;
  };
  inviter: { full_name: string | null };
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sin sesión");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export function usePendingCoOwnerInvites() {
  return useQuery<{ invites: CoOwnerInvite[]; count: number }>({
    queryKey: ["co-owner-invites", "pending"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(`${env.APP_URL}/api/co-owner/pending`, {
        headers,
      });
      if (!res.ok) throw new Error("No pudimos cargar invitaciones");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useRespondCoOwnerInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      coOwnerId,
      action,
    }: {
      coOwnerId: string;
      action: "accept" | "decline";
    }) => {
      const headers = await getAuthHeader();
      const res = await fetch(`${env.APP_URL}/api/co-owner/respond`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ coOwnerId, action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Error al procesar");
      return body as { success: true; action: "accept" | "decline"; animalId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["co-owner-invites"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
    },
  });
}
