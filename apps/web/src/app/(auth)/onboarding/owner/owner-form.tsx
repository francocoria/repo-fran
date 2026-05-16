"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Input, Label } from "@pet-app/ui";
import { createOwnerProfile } from "../../actions";
import { Dog, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Form fallback que pide el nombre cuando no vino del signup.
 * Sólo se muestra si /onboarding/owner/page.tsx no pudo derivarlo del
 * metadata del usuario.
 */
export function OwnerOnboardingForm() {
  const t = useTranslations("onboardingOwner");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError(t("errorName"));
      return;
    }
    startTransition(() => {
      void (async () => {
        const result = await createOwnerProfile(fullName.trim());
        if (result.success) {
          router.push("/app");
        } else {
          setError(result.error ?? t("errorCreateProfile"));
        }
      })();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-up text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Dog className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
        {t("subtitle")}
      </p>

      <div className="mx-auto mt-6 max-w-xs space-y-2 text-left">
        <Label htmlFor="fullName">
          {t("nameLabel")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder={t("namePlaceholder")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={100}
          autoFocus
          required
        />
      </div>

      <div className="mx-auto mt-6 max-w-xs space-y-3 text-left text-sm">
        {[t("benefit1"), t("benefit2"), t("benefit3")].map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mx-auto mt-6 flex max-w-xs items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span className="text-left">{error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="mt-8 w-full max-w-xs"
        size="lg"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
