import Constants from "expo-constants";

function read(key: string, fallback?: string): string {
  const value = process.env[key] ?? Constants.expoConfig?.extra?.[key];
  if (!value && fallback === undefined) {
    throw new Error(`Falta la variable de entorno ${key}`);
  }
  return value ?? fallback ?? "";
}

// SUPABASE_URL y ANON_KEY se requieren obligatoriamente desde EAS Secrets.
// No usamos fallback con valor real del proyecto por seguridad: si alguien
// hace fork o las env vars no se setean, la app debe fallar al boot, no
// conectarse silenciosamente a la base de producción.
export const env = {
  SUPABASE_URL: read("EXPO_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: read("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  APP_URL: read("EXPO_PUBLIC_APP_URL", "https://pet-friendly.fun"),
};
