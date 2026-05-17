"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Banner discreto que sugiere instalar la PWA.
 *
 * Sólo aparece si:
 *  - El usuario está en mobile
 *  - La app NO está ya instalada (no es display-mode: standalone)
 *  - El usuario no la descartó (localStorage)
 *
 * En Android usa el `beforeinstallprompt` para mostrar el diálogo nativo.
 * En iOS muestra instrucciones (Apple no permite trigger programático).
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "petapp-install-dismissed";
const DISMISS_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 días

export function InstallPrompt() {
  const t = useTranslations("installPrompt");
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ya instalada como PWA? — no mostrar
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // iOS PWA detecta diferente
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone)
      return;

    // Dismiss reciente?
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DURATION) return;
    }

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIos || isAndroid;
    if (!isMobile) return;

    setPlatform(isIos ? "ios" : "android");

    if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }

    // iOS — mostramos directamente (no hay evento)
    // Esperamos un poco para que no aparezca apenas carga la página
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setVisible(false);
    setShowIosInstructions(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
  }

  async function handleInstall() {
    if (platform === "ios") {
      setShowIosInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  if (showIosInstructions) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-[60] animate-fade-up md:hidden"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={dismiss}
        />
        <div className="relative mx-3 mb-3 rounded-2xl border border-border bg-card p-5 shadow-2xl">
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
            aria-label={t("closeAria")}
          >
            <X className="size-4" />
          </button>
          <h2 className="text-base font-semibold">{t("iosTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("iosSubtitle")}
          </p>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              <span>
                {t("iosStep1Pre")}
                <Share className="-mt-0.5 inline size-4 text-primary" />{" "}
                <strong>{t("iosStep1Action")}</strong>
                {t("iosStep1Post")}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              <span>
                {t("iosStep2Pre")}
                <strong>&quot;{t("iosStep2Action")}&quot;</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              <span>
                {t("iosStep3Pre")}
                <strong>&quot;{t("iosStep3Action")}&quot;</strong>
                {t("iosStep3Post")}
              </span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 animate-fade-up md:hidden">
      <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-xl">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-tight">
            {t("bannerTitle")}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-tight text-muted-foreground">
            {t("bannerDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("install")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
          aria-label={t("dismissAria")}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
