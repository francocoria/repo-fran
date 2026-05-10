"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@pet-app/ui";
import { QrCode, Download, X, Copy, Check, Loader2 } from "lucide-react";

interface QRModalProps {
  animalId: string;
  animalName: string;
  urlToken: string;
}

/// Modal con QR del animal para que el vet escanee.
/// El QR codifica una URL del tipo `${origin}/vet/scan?token=${url_token}`.
/// Al escanear con cámara común redirige al vet a confirmar la solicitud.
export function QRModal({ animalId, animalName, urlToken }: QRModalProps) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    try {
      await navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
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
        Mostrar QR
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <QrCode className="h-6 w-6" />
              </div>
              <h2 id="qr-modal-title" className="text-xl font-semibold tracking-tight">
                QR de {animalName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Mostralo al veterinario para que solicite acceso al historial.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="rounded-xl border border-border bg-white p-4 shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR del animal"
                    className="h-64 w-64"
                  />
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-secondary/40 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                El veterinario escanea con la cámara de su celular o desde la app.
                Después tenés que aprobar la solicitud desde{" "}
                <span className="font-medium text-foreground">Accesos</span>.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar link
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="flex-1 gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Canvas oculto reservado para futuras impresiones */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
