"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe, Check, Loader2 } from "lucide-react";
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";

/**
 * Selector de idioma. Guarda la elección en cookie vía Server Action
 * y refresca la página para que los textos se re-rendericen.
 */
export function LanguageSwitcher({
  variant = "full",
}: {
  variant?: "full" | "icon";
}) {
  const current = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function choose(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    startTransition(() => {
      void (async () => {
        await setLocale(locale);
        router.refresh();
      })();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-3 disabled:opacity-50"
        aria-label="Cambiar idioma"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Globe className="size-4 text-muted-foreground" />
        )}
        {variant === "full" && (
          <span>
            {LOCALE_FLAGS[current]} {LOCALE_LABELS[current]}
          </span>
        )}
        {variant === "icon" && <span>{LOCALE_FLAGS[current]}</span>}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => choose(locale)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-2">
                <span>{LOCALE_FLAGS[locale]}</span>
                {LOCALE_LABELS[locale]}
              </span>
              {locale === current && (
                <Check className="size-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
