"use client";

import { useState, useRef, useTransition } from "react";
import { uploadAnimalPhoto } from "@/app/(owner)/app/actions";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@pet-app/ui";

interface PhotoUploadProps {
  animalId: string;
  currentPhotoUrl: string | null;
  animalName: string;
}

export function PhotoUpload({ animalId, currentPhotoUrl, animalName }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size check (client-side)
    if (file.size > 8 * 1024 * 1024) {
      setError("La foto no puede superar 8 MB.");
      return;
    }

    // Preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setError(null);

    // Upload
    const formData = new FormData();
    formData.append("photo", file);

    startTransition(async () => {
      const result = await uploadAnimalPhoto(animalId, formData);
      if (result.success && result.url) {
        setPreview(result.url);
      } else {
        setError(result.error ?? "Error al subir.");
        setPreview(currentPhotoUrl);
      }
    });
  }

  return (
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
      >
        {isPending ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : preview ? (
          <img src={preview} alt={animalName} className="object-cover w-full h-full" />
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
  );
}
