"use client";

import { useState, useRef, useTransition } from "react";
import { uploadAnimalPhoto } from "@/app/(owner)/app/actions";
import { Camera, Loader2, X } from "lucide-react";
import { PhotoCropDialog } from "./photo-crop-dialog";

interface PhotoUploadProps {
  animalId: string;
  currentPhotoUrl: string | null;
  animalName: string;
}

/**
 * Subida de foto con UX tipo WhatsApp:
 *  1. Click → file picker
 *  2. Se abre el dialog de crop (drag + zoom) con la foto recién elegida
 *  3. El usuario encuadra y confirma → se sube el blob recortado 1024×1024 JPEG
 *
 * El crop se hace 100% en el cliente con canvas, así el backend recibe una
 * imagen ya cuadrada y optimizada (~200kb en vez de 5-12MB del original).
 */
export function PhotoUpload({
  animalId,
  currentPhotoUrl,
  animalName,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Validación temprana del tamaño original (antes del crop)
    if (file.size > 20 * 1024 * 1024) {
      setError("La foto es muy grande (máx 20 MB).");
      e.target.value = "";
      return;
    }

    // Abrimos el dialog de crop con la imagen elegida
    const url = URL.createObjectURL(file);
    setCropSrc(url);

    // Reset del input para que onChange dispare aunque elija la misma foto
    e.target.value = "";
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function handleCropComplete(blob: Blob) {
    // Limpio el objectURL del original — ya tenemos el blob recortado
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    // Preview optimista con el blob recortado
    const previewUrl = URL.createObjectURL(blob);
    setPreview(previewUrl);

    const formData = new FormData();
    formData.append("photo", blob, "photo.jpg");

    startTransition(() => {
      void (async () => {
        const result = await uploadAnimalPhoto(animalId, formData);
        URL.revokeObjectURL(previewUrl);
        if (result.success && result.url) {
          setPreview(result.url);
        } else {
          setError(result.error ?? "Error al subir.");
          setPreview(currentPhotoUrl);
        }
      })();
    });
  }

  return (
    <>
      <div className="relative group">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isPending}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="h-24 w-24 md:h-32 md:w-32 bg-secondary rounded-full flex items-center justify-center text-muted-foreground border-4 border-background shrink-0 shadow-sm relative overflow-hidden cursor-pointer transition-transform hover:scale-105 disabled:opacity-50"
          aria-label={preview ? "Cambiar foto" : "Agregar foto"}
        >
          {isPending ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={animalName}
              className="object-cover w-full h-full"
            />
          ) : (
            <Camera className="h-8 w-8 opacity-40" />
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>

        {error && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-destructive flex items-center gap-1">
            <X className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>

      {cropSrc && (
        <PhotoCropDialog
          imageSrc={cropSrc}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
