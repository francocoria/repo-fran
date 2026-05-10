import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con SERVICE ROLE KEY — bypasea RLS.
 *
 * ⚠️ SOLO usar en server actions / API routes en operaciones que lo justifiquen:
 * - Bootstrap de admin inicial
 * - Operaciones de mantenimiento (cron jobs)
 * - Generación de slugs públicos
 * - Inserts de logs/notifications desde el servidor
 *
 * NUNCA exponer al cliente.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
