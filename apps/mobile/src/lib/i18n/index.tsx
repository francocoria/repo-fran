import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import { es } from "./es";
import { en } from "./en";
import { pt } from "./pt";

export type Locale = "es" | "en" | "pt";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
];

const MESSAGES: Record<Locale, Record<string, unknown>> = { es, en, pt };
const STORAGE_KEY = "petapp-locale";

type TParams = Record<string, string | number>;

function deviceLocale(): Locale {
  const code = Localization.getLocales()[0]?.languageCode;
  if (code === "en" || code === "pt") return code;
  return "es";
}

function resolve(obj: Record<string, unknown>, path: string): string | null {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as object)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return typeof cur === "string" ? cur : null;
}

// Soporte ICU mínimo: {count, plural, one{...} other{...}} + {var}
function format(raw: string, params?: TParams): string {
  let out = raw.replace(
    /\{(\w+),\s*plural,\s*one\{([^}]*)\}\s*other\{([^}]*)\}\}/g,
    (_m, key: string, one: string, other: string) => {
      const n = Number(params?.[key] ?? 0);
      const chosen = n === 1 ? one : other;
      return chosen.replace(/#/g, String(n));
    },
  );
  if (params) {
    out = out.replace(/\{(\w+)\}/g, (_m, key: string) =>
      key in params ? String(params[key]) : `{${key}}`,
    );
  }
  return out;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);

  useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === "es" || stored === "en" || stored === "pt") {
        setLocaleState(stored);
      }
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void SecureStore.setItemAsync(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, params?: TParams) => {
      const raw = resolve(MESSAGES[locale], key) ?? resolve(MESSAGES.es, key);
      if (raw == null) return key;
      return format(raw, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation debe usarse dentro de I18nProvider");
  }
  return ctx;
}
