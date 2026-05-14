"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@pet-app/ui";
import {
  AlertCircle,
  Check,
  Loader2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface PhotoCropDialogProps {
  /** Imagen original que el usuario seleccionó del file picker */
  imageSrc: string;
  /** Cuando el usuario confirma el crop, devuelve un Blob recortado en aspect 1:1 */
  onComplete: (blob: Blob) => void;
  /** Cuando el usuario cancela el dialog */
  onCancel: () => void;
  /** Tamaño en pixeles del blob final (default 1024) */
  outputSize?: number;
}

/**
 * Modal de crop tipo WhatsApp/Instagram. Drag + pinch/slider para zoom.
 * Aspect lockeado 1:1. Devuelve un JPEG cuadrado al confirmar.
 *
 * Robustez:
 *  - Pre-carga la imagen y muestra spinner hasta que esté lista. Si falla
 *    (típicamente HEIC en browsers que no soportan), muestra un error claro.
 *  - Container del Cropper con altura explícita (no aspect-ratio CSS, que
 *    a veces colapsa en mobile dentro de flex/fixed).
 */
export function PhotoCropDialog({
  imageSrc,
  onComplete,
  onCancel,
  outputSize = 1024,
}: PhotoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Pre-cargar la imagen — si HEIC u otro formato falla, lo detectamos acá
  // en vez de quedar con fondo negro infinito.
  useEffect(() => {
    setImageReady(false);
    setLoadError(false);
    const img = new Image();
    img.onload = () => setImageReady(true);
    img.onerror = () => setLoadError(true);
    img.src = imageSrc;
  }, [imageSrc]);

  // Bloquear scroll del body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !processing) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, processing]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, outputSize);
      onComplete(blob);
    } catch (err) {
      console.error("[PhotoCropDialog] getCroppedBlob failed:", err);
      setLoadError(true);
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Recortar foto"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">
            Encuadrá la foto
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-50"
            aria-label="Cancelar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Crop area — altura explícita (no aspect-ratio) para evitar colapso */}
        <div
          className="relative w-full bg-black"
          style={{ height: 320 }}
        >
          {loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white">
              <AlertCircle className="size-8 text-rose-400" />
              <p className="text-sm font-medium">
                No pudimos abrir esta foto
              </p>
              <p className="text-xs text-white/70">
                Probá con un JPG o PNG. Si la sacaste con iPhone, en Ajustes →
                Cámara → Formatos elegí "Compatible".
              </p>
            </div>
          ) : !imageReady ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="cover"
              style={{
                containerStyle: { background: "#0c0a09" },
                cropAreaStyle: { border: "2px solid #ffffff" },
              }}
            />
          )}
        </div>

        {/* Zoom slider — sólo si la imagen cargó OK */}
        {imageReady && !loadError && (
          <div className="border-t border-border bg-surface-2/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                disabled={processing}
                className="flex-1 accent-primary"
                aria-label="Zoom"
              />
              <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
              Arrastrá para mover · Pellizcá o usá el slider para zoom
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border bg-background px-4 py-3">
          {imageReady && !loadError && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={processing}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Reiniciar
            </Button>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={processing}
          >
            {loadError ? "Cerrar" : "Cancelar"}
          </Button>
          {!loadError && (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={!croppedAreaPixels || processing || !imageReady}
              className="gap-1.5"
            >
              {processing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Listo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper: dado el image src + crop area en pixels, devuelve un Blob ───

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob falló"));
      },
      "image/jpeg",
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
