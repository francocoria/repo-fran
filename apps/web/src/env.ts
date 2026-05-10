import { z } from "zod";

/**
 * Validación de env vars al boot del server.
 * Si falta algo crítico, la app falla rápido y claro.
 */

const envSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("PetApp"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Database
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Google
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),

  // Admin
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),

  // Cron
  CRON_SECRET: z.string().min(1).optional(),

  // Premium
  NEXT_PUBLIC_PREMIUM_WHATSAPP: z.string().optional(),
  NEXT_PUBLIC_PREMIUM_PRICE_USD_MONTHLY: z.coerce.number().default(10),
  NEXT_PUBLIC_PREMIUM_PRICE_USD_YEARLY: z.coerce.number().default(100),

  // Feature flags
  NEXT_PUBLIC_FEATURE_LOST_MODE: z.coerce.boolean().default(true),
  NEXT_PUBLIC_FEATURE_DIRECTORY: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_PREMIUM_WHATSAPP: process.env.NEXT_PUBLIC_PREMIUM_WHATSAPP,
  NEXT_PUBLIC_PREMIUM_PRICE_USD_MONTHLY:
    process.env.NEXT_PUBLIC_PREMIUM_PRICE_USD_MONTHLY,
  NEXT_PUBLIC_PREMIUM_PRICE_USD_YEARLY:
    process.env.NEXT_PUBLIC_PREMIUM_PRICE_USD_YEARLY,
  NEXT_PUBLIC_FEATURE_LOST_MODE: process.env.NEXT_PUBLIC_FEATURE_LOST_MODE,
  NEXT_PUBLIC_FEATURE_DIRECTORY: process.env.NEXT_PUBLIC_FEATURE_DIRECTORY,
});

if (!parsed.success) {
  console.error(
    "Variables de entorno inválidas:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Variables de entorno inválidas. Revisar .env.local");
}

export const env = parsed.data;
