"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Input, Label } from "@pet-app/ui";
import { loginWithMagicLink, verifyOtpCode } from "../actions";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
  ChevronLeft,
} from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
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

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(() => { void (async () => {
      const result = await loginWithMagicLink(email);
      if (result.success) {
        setStep("code");
      } else {
        setError(result.error ?? t("errorSendCode"));
      }
    })(); });
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) {
      setError(t("errorCodeIncomplete"));
      return;
    }
    startTransition(() => { void (async () => {
      const result = await verifyOtpCode(email, code);
      if (result.success) {
        router.push((result.redirectTo ?? "/app") as never);
        router.refresh();
      } else {
        setError(result.error ?? t("errorCodeWrong"));
      }
    })(); });
  }

  async function handleResend() {
    setResending(true);
    setError(null);
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
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {t("changeEmail")}
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
                {t("verifyAndEnter")}
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

        <div className="mt-8 rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">
              {t("installedHintTitle")}
            </strong>{" "}
            {t("installedHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="pl-10"
            />
          </div>
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
          disabled={isPending || !email.trim()}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {t("sendCode")}
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("noAccount")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" asChild className="w-full">
          <Link href="/signup">{t("createOwner")}</Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          className="w-full text-muted-foreground"
        >
          <Link href="/signup/vet">{t("isVet")}</Link>
        </Button>
      </div>
    </div>
  );
}
