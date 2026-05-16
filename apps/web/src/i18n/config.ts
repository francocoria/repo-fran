/**
 * Configuración de i18n compartida.
 * 3 idiomas: español (default), inglés, portugués.
 */
export const LOCALES = ["es", "en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: "🇦🇷",
  en: "🇺🇸",
  pt: "🇧🇷",
};

/** Cookie donde guardamos el idioma elegido por el usuario. */
export const LOCALE_COOKIE = "petapp-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Detecta el mejor idioma desde el header Accept-Language.
 * Ej: "pt-BR,pt;q=0.9,es;q=0.8" → "pt"
 */
export function detectLocaleFromHeader(
  acceptLanguage: string | null | undefined,
): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const langs = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().slice(0, 2).toLowerCase());
  for (const lang of langs) {
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}
