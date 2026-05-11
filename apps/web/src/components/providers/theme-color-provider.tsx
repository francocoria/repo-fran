"use client";

import { useEffect } from "react";

/**
 * ThemeColorProvider — lee el color preferido del user de localStorage
 * y lo aplica como CSS variables override en :root.
 *
 * Se monta en el layout root y aplica el color en todas las pages.
 * Para cambiar el color, usar el helper `setThemeColor(hsl)` desde settings.
 */

export interface ThemePalette {
  key: string;
  label: string;
  primary: string; // HSL "262 83% 58%"
  primary600: string;
  primary50: string;
  /** Color hex para preview circle */
  hex: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    key: "violet",
    label: "Violeta",
    primary: "262 83% 58%",
    primary600: "263 70% 50%",
    primary50: "270 100% 95%",
    hex: "#7c3aed",
  },
  {
    key: "cyan",
    label: "Cyan",
    primary: "189 94% 43%",
    primary600: "192 91% 36%",
    primary50: "186 100% 94%",
    hex: "#06b6d4",
  },
  {
    key: "emerald",
    label: "Esmeralda",
    primary: "160 84% 39%",
    primary600: "161 94% 30%",
    primary50: "152 81% 96%",
    hex: "#10b981",
  },
  {
    key: "rose",
    label: "Rosa",
    primary: "350 89% 60%",
    primary600: "347 77% 50%",
    primary50: "356 100% 95%",
    hex: "#f43f5e",
  },
  {
    key: "amber",
    label: "Naranja",
    primary: "32 95% 53%",
    primary600: "30 92% 45%",
    primary50: "33 100% 96%",
    hex: "#f97316",
  },
  {
    key: "indigo",
    label: "Índigo",
    primary: "239 84% 67%",
    primary600: "243 75% 59%",
    primary50: "226 100% 97%",
    hex: "#6366f1",
  },
  {
    key: "teal",
    label: "Turquesa",
    primary: "168 78% 41%",
    primary600: "172 85% 32%",
    primary50: "166 76% 97%",
    hex: "#14b8a6",
  },
  {
    key: "pink",
    label: "Fucsia",
    primary: "330 81% 60%",
    primary600: "333 71% 51%",
    primary50: "327 73% 97%",
    hex: "#ec4899",
  },
];

export const DEFAULT_THEME = "violet";
const STORAGE_KEY = "petapp-theme-color";

export function getStoredThemeKey(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function setThemeColor(paletteKey: string): void {
  if (typeof window === "undefined") return;
  const palette =
    THEME_PALETTES.find((p) => p.key === paletteKey) ?? THEME_PALETTES[0]!;
  applyPalette(palette);
  try {
    localStorage.setItem(STORAGE_KEY, palette.key);
  } catch {
    // Ignored — localStorage may be disabled
  }
}

function applyPalette(palette: ThemePalette): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--primary-600", palette.primary600);
  root.style.setProperty("--primary-50", palette.primary50);
  root.style.setProperty("--ring", palette.primary);
}

/**
 * Provider que aplica el color guardado al montar.
 * Se ejecuta en cliente para evitar flash — el SSR usa la default.
 */
export function ThemeColorProvider() {
  useEffect(() => {
    const key = getStoredThemeKey();
    const palette =
      THEME_PALETTES.find((p) => p.key === key) ?? THEME_PALETTES[0]!;
    applyPalette(palette);
  }, []);

  return null;
}
