"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Badge } from "@pet-app/ui";
import {
  Sparkles,
  X,
  Check,
  Crown,
  Infinity as InfinityIcon,
  ShieldCheck,
  FileText,
  TrendingUp,
  Palette,
  CreditCard,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ModalPortal } from "@/components/modal-portal";

interface UpgradeModalProps {
  triggerLabel?: string;
  variant?: "button" | "link" | "inline";
  className?: string;
  /** Si se pasa, controla el modal externamente */
  externalOpen?: boolean;
  onExternalClose?: () => void;
}

const PRICE_MONTHLY_ARS = Number(
  process.env.NEXT_PUBLIC_PREMIUM_PRICE_ARS_MONTHLY ?? 9990,
);

const FEATURES = [
  { icon: InfinityIcon, key: "featUnlimitedPatients" },
  { icon: FileText, key: "featCertificates" },
  { icon: Palette, key: "featBrandedPrescriptions" },
  { icon: ShieldCheck, key: "featVerification" },
  { icon: TrendingUp, key: "featStats" },
  { icon: Sparkles, key: "featTemplates" },
] as const;

export function UpgradeModal({
  triggerLabel,
  variant = "button",
  className = "",
  externalOpen,
  onExternalClose,
}: UpgradeModalProps) {
  const t = useTranslations("upgradeModal");
  const [internalOpen, setInternalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = externalOpen ?? internalOpen;
  const close = onExternalClose ?? (() => setInternalOpen(false));
  const label = triggerLabel ?? t("defaultTrigger");

  async function handleMercadoPagoCheckout() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/checkout/create", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? t("errorCheckout"));
        setPaying(false);
        return;
      }
      // El backend ya nos devuelve la URL correcta (sandbox o prod).
      const target = body.checkoutUrl;
      if (!target) {
        setError(t("errorUnexpected"));
        setPaying(false);
        return;
      }
      window.location.href = target;
    } catch (err) {
      console.error("[checkout] failed:", err);
      setError(t("errorNetwork"));
      setPaying(false);
    }
  }

  const priceMonthly = PRICE_MONTHLY_ARS.toLocaleString("es-AR");

  const trigger =
    variant === "button" ? (
      <Button
        type="button"
        onClick={() => setInternalOpen(true)}
        className={`gap-2 ${className}`}
      >
        <Crown className="h-4 w-4" />
        {label}
      </Button>
    ) : variant === "link" ? (
      <button
        type="button"
        onClick={() => setInternalOpen(true)}
        className={`text-sm font-medium text-primary underline-offset-4 hover:underline ${className}`}
      >
        {label}
      </button>
    ) : null;

  return (
    <>
      {externalOpen === undefined && trigger}

      {open && (
        <ModalPortal>
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          <div className="flex min-h-full items-center justify-center py-4">
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 p-8 pb-6 border-b border-border">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
              <div className="relative">
                <Badge variant="secondary" className="gap-1 mb-3">
                  <Crown className="h-3 w-3 text-amber-500" />
                  {t("badge")}
                </Badge>
                <h2
                  id="upgrade-modal-title"
                  className="text-2xl font-bold tracking-tight"
                >
                  {t("heroTitle")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-lg">
                  {t("heroDesc")}
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="px-8 py-6 border-b border-border">
              <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 relative max-w-sm">
                <p className="text-xs text-primary font-medium uppercase tracking-wide">
                  {t("planMonthly")}
                </p>
                <p className="mt-1">
                  <span className="text-3xl font-bold">ARS {priceMonthly}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("perMonth")}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("noCommitment")}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="px-8 py-6">
              <h3 className="mb-3 text-sm font-semibold">
                {t("whatsIncluded")}
              </h3>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {FEATURES.map((f) => (
                  <li key={f.key} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{t(f.key)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(`${f.key}Desc`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="border-t border-border bg-secondary/30 px-8 py-5 space-y-3">
              <Button
                type="button"
                onClick={handleMercadoPagoCheckout}
                disabled={paying}
                className="w-full gap-2 h-11"
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {t("payWithMP")}
              </Button>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                {t("paymentInfo")}
              </p>
            </div>
          </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
}
