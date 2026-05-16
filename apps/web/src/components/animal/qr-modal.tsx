"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { Button } from "@pet-app/ui";
import { QrCode, Download, X, Copy, Check, Loader2 } from "lucide-react";
import { useCopyFeedback } from "@/lib/use-copy-feedback";
import { ModalPortal } from "@/components/modal-portal";

interface QRModalProps {
  animalId: string;
  animalName: string;
  urlToken: string;
}

/// Modal con QR del animal para que el vet escanee.
/// El QR codifica una URL del tipo `${origin}/vet/scan?token=${url_token}`.
/// Al escanear con cámara común redirige al vet a confirmar la solicitud.
export function QRModal({ animalId, animalName, urlToken }: QRModalProps) {
  const t = useTranslations("qrModal");
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { copied, copy } = useCopyFeedback();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scanUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/vet/scan?token=${urlToken}`
      : `/vet/scan?token=${urlToken}`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(scanUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [open, scanUrl]);

  function handleDownload() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${animalName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
  }

  async function handleCopy() {
    const ok = await copy(scanUrl);
    if (!ok) {
      console.error("Copy failed");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <QrCode className="h-3.5 w-3.5" />
        {t("showQr")}
      </Button>

      {open && (
        <ModalPortal>
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="flex min-h-full items-center justify-center py-4">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={t("close")}
            >
              <X className="size-4" />
            </button>

            {/* Hero con gradient */}
            <div className="bg-grad-brand px-6 pt-6 pb-12 text-center text-white">
              <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <QrCode className="size-6" />
              </div>
              <h2
                id="qr-modal-title"
                className="text-xl font-semibold tracking-tight"
              >
                {t("title", { name: animalName })}
              </h2>
              <p className="mt-1 text-sm text-white/85">
                {t("subtitle")}
              </p>
            </div>

            {/* QR card flotante */}
            <div className="-mt-8 flex justify-center px-6">
              <div className="rounded-2xl border-2 border-white bg-white p-4 shadow-xl">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={t("imageAlt")}
                    className="size-64"
                  />
                ) : (
                  <div className="flex size-64 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 pt-4">
              <p className="rounded-lg bg-surface-2 px-3 py-2 text-center text-xs text-muted-foreground">
                {t.rich("hint", {
                  b: (c) => (
                    <span className="font-semibold text-foreground">{c}</span>
                  ),
                })}
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleCopy}
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" />
                      {t("copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      {t("copyLink")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="default"
                  onClick={handleDownload}
                  disabled={!qrDataUrl}
                  className="flex-1"
                >
                  <Download className="size-4" />
                  {t("download")}
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>
        </ModalPortal>
      )}
      {/* Canvas oculto reservado para futuras impresiones */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
