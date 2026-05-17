"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@pet-app/ui";
import { requestVerification } from "./actions";

export function VerifyForm() {
  const t = useTranslations("vetVerify");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function handleClear() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError(t("errorNoPhoto"));
      return;
    }

    const formData = new FormData();
    formData.append("license", file);

    startTransition(() => { void (async () => {
      const result = await requestVerification(formData);
      if (result.success) {
        router.push("/vet/plan");
        router.refresh();
      } else {
        setError(result.error ?? t("errorSend"));
      }
    })(); });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!previewUrl ? (
        <label
          htmlFor="license"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-12 transition-colors hover:border-primary/50 hover:bg-secondary/50"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">{t("uploadTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("uploadHint")}
            </p>
          </div>
        </label>
      ) : (
        <div className="relative rounded-xl border border-border overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={t("previewAlt")}
            className="w-full max-h-96 object-contain bg-secondary"
          />
          <button
            type="button"
            onClick={handleClear}
            disabled={isPending}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        id="license"
        name="license"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="submit"
          disabled={isPending || !file}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
