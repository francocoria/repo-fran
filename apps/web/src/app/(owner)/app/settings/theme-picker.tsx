"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@pet-app/ui";
import { Palette, Check } from "lucide-react";
import {
  THEME_PALETTES,
  DEFAULT_THEME,
  getStoredThemeKey,
  setThemeColor,
} from "@/components/providers/theme-color-provider";

export function ThemePicker() {
  const [active, setActive] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    setActive(getStoredThemeKey());
  }, []);

  function handlePick(key: string) {
    setActive(key);
    setThemeColor(key);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          Personalización
        </CardTitle>
        <CardDescription>
          Elegí el color principal de tu app. Los cambios se aplican al instante
          en tu navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {THEME_PALETTES.map((p) => {
            const selected = active === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePick(p.key)}
                aria-label={`Tema ${p.label}`}
                className={`group relative flex aspect-square items-center justify-center rounded-xl border-2 transition-all hover:scale-105 ${
                  selected
                    ? "border-foreground shadow-md"
                    : "border-transparent"
                }`}
                style={{ background: p.hex }}
              >
                {selected && (
                  <Check
                    className="size-5 text-white drop-shadow"
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            Activo:{" "}
            <span className="font-medium text-foreground">
              {THEME_PALETTES.find((p) => p.key === active)?.label ?? "Violeta"}
            </span>
          </p>
          {active !== DEFAULT_THEME && (
            <button
              type="button"
              onClick={() => handlePick(DEFAULT_THEME)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Restablecer
            </button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          La preferencia se guarda en este navegador. Al loguearte en otro
          dispositivo verás el color por defecto.
        </p>
      </CardContent>
    </Card>
  );
}
