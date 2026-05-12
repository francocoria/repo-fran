"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
        setError(result.error ?? "Error al enviar el código");
      }
    })(); });
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) {
      setError("Ingresá los 6 dígitos del email");
      return;
    }
    startTransition(() => { void (async () => {
      const result = await verifyOtpCode(email, code);
      if (result.success) {
        router.push((result.redirectTo ?? "/app") as never);
        router.refresh();
      } else {
        setError(result.error ?? "Código incorrecto. Probá de nuevo.");
      }
    })(); });
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const result = await loginWithMagicLink(email);
    setResending(false);
    if (!result.success) {
      setError(result.error ?? "No pudimos reenviar.");
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
          Cambiar email
        </button>

        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <KeyRound className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Revisá tu email</h1>
        <p className="mt-2 text-muted-foreground">
          Te mandamos un código de 6 dígitos a{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>

        <form onSubmit={handleCodeSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              ref={codeInputRef}
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
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
                Verificar y entrar
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
              {resending ? "Reenviando..." : "No me llegó, reenviar"}
            </button>
          </div>
        </form>

        <div className="mt-8 rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">¿Instalaste la app?</strong> Usá
            el código numérico que viene en el email — así te quedás dentro de
            la app instalada y no se abre el navegador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="mt-2 text-muted-foreground">
          Ingresá tu email y te mandamos un código de 6 dígitos.
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
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
              Enviar código
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
            ¿No tenés cuenta?
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" asChild className="w-full">
          <Link href="/signup">Crear cuenta como dueño</Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          className="w-full text-muted-foreground"
        >
          <Link href="/signup/vet">Soy veterinario →</Link>
        </Button>
      </div>
    </div>
  );
}
