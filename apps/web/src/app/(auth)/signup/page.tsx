"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@pet-app/ui";
import { Input } from "@pet-app/ui";
import { Label } from "@pet-app/ui";
import { signupOwner, verifyOtpCode } from "../actions";
import {
  User,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  ArrowRight,
  KeyRound,
  ChevronLeft,
} from "lucide-react";

export default function SignupOwnerPage() {
  const t = useTranslations("signup");
  const router = useRouter();
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== "code") return;
    const t = setTimeout(() => codeInputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [step]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get("email") ?? "");
    setEmail(emailValue);

    startTransition(() => {
      void (async () => {
        const result = await signupOwner(formData);
        if (result.success) {
          setStep("code");
        } else {
          setError(result.error ?? t("errorCreateAccount"));
        }
      })();
    });
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) {
      setError(t("errorCodeIncomplete"));
      return;
    }
    startTransition(() => {
      void (async () => {
        const result = await verifyOtpCode(email, code);
        if (result.success) {
          router.push((result.redirectTo ?? "/app") as never);
          router.refresh();
        } else {
          setError(result.error ?? t("errorCodeWrong"));
        }
      })();
    });
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    // Re-sender vía login OTP (mismo flujo, mismo template)
    const { loginWithMagicLink } = await import("../actions");
    const result = await loginWithMagicLink(email);
    setResending(false);
    if (!result.success) {
      setError(result.error ?? t("errorResend"));
    }
  }

  if (step === "code") {
    return (
      <div className="animate-fade-up">
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setCode("");
            setError(null);
          }}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {t("changeData")}
        </button>

        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <KeyRound className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("codeStepTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t.rich("codeStepSubtitle", {
            email,
            strong: (chunks) => (
              <span className="font-medium text-foreground">{chunks}</span>
            ),
          })}
        </p>

        <form onSubmit={handleCodeSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code">{t("codeLabel")}</Label>
            <Input
              ref={codeInputRef}
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t("codePlaceholder")}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="text-center font-mono text-2xl tracking-[0.5em]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending || code.length < 6}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {t("confirmAndEnter")}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || isPending}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resending ? t("resending") : t("resend")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              name="fullName"
              placeholder={t("fullNamePlaceholder")}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className="pl-10"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
              autoComplete="email"
              className="pl-10"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Teléfono (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            {t("phoneLabel")}{" "}
            <span className="text-muted-foreground font-normal">
              {t("optional")}
            </span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder={t("phonePlaceholder")}
              autoComplete="tel"
              className="pl-10"
            />
          </div>
        </div>

        {/* Términos */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            value="true"
            required
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <Label htmlFor="acceptTerms" className="text-sm leading-relaxed font-normal">
            <span>
              {t.rich("acceptTerms", {
                terms: (chunks) => (
                  <Link href="/terms" className="text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" className="text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </Label>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t("submit")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          {t("signIn")}
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        <Link href="/signup/vet" className="text-primary hover:underline">
          {t("isVet")}
        </Link>
      </p>
    </div>
  );
}
