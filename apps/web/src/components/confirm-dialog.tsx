"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@pet-app/ui";
import { X, AlertTriangle } from "lucide-react";
import { ModalPortal } from "./modal-portal";

type Tone = "default" | "destructive" | "rose";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  loading?: boolean;
}

const TONE_STYLES: Record<Tone, { iconBg: string; iconColor: string }> = {
  default: { iconBg: "bg-primary/10", iconColor: "text-primary" },
  destructive: { iconBg: "bg-destructive/10", iconColor: "text-destructive" },
  rose: { iconBg: "bg-rose/10", iconColor: "text-rose" },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  loading = false,
}: ConfirmDialogProps) {
  const t = useTranslations("common");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, loading]);

  if (!open) return null;

  const style = TONE_STYLES[tone];
  const confirmVariant =
    tone === "destructive" || tone === "rose" ? "destructive" : "default";

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-50"
          aria-label={t("close")}
        >
          <X className="size-4" />
        </button>

        <div
          className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl ${style.iconBg}`}
        >
          <AlertTriangle className={`size-6 ${style.iconColor}`} />
        </div>

        <h2
          id="confirm-dialog-title"
          className="text-center text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel ?? t("cancel")}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "..." : (confirmLabel ?? t("confirm"))}
          </Button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
