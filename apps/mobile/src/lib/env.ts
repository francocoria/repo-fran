import Constants from "expo-constants";

function read(key: string, fallback?: string): string {
  const value = process.env[key] ?? Constants.expoConfig?.extra?.[key];
  if (!value && fallback === undefined) {
    throw new Error(`Falta la variable de entorno ${key}`);
  }
  return value ?? fallback ?? "";
}

export const env = {
  SUPABASE_URL: read(
    "EXPO_PUBLIC_SUPABASE_URL",
    "https://xdsdsygewaxqcqggjgtr.supabase.co",
  ),
  SUPABASE_ANON_KEY: read("EXPO_PUBLIC_SUPABASE_ANON_KEY", ""),
  APP_URL: read("EXPO_PUBLIC_APP_URL", "https://petapp-one.vercel.app"),
  WHATSAPP_NUMBER: read("EXPO_PUBLIC_WHATSAPP_NUMBER", ""),
};
