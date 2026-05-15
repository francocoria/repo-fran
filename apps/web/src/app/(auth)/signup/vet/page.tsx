"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@pet-app/ui";
import { Input } from "@pet-app/ui";
import { Label } from "@pet-app/ui";
import { signupVet, verifyOtpCode } from "../../actions";
import {
  Stethoscope,
  User,
  Mail,
  Phone,
  Building2,
  Hash,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  KeyRound,
  ChevronLeft,
} from "lucide-react";

export default function SignupVetPage() {
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
        const result = await signupVet(formData);
        if (result.success) {
          setStep("code");
        } else {
          setError(result.error ?? "Error al crear la cuenta");
        }
      })();
    });
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) {
      setError("Ingresá los 6 dígitos del email.");
      return;
    }
    startTransition(() => {
      void (async () => {
        const result = await verifyOtpCode(email, code);
        if (result.success) {
          // El vet redirect default es /vet (manejado por verifyOtpCode segun rol)
          router.push((result.redirectTo ?? "/vet") as never);
          router.refresh();
        } else {
          setError(result.error ?? "Código incorrecto. Probá de nuevo.");
        }
      })();
    });
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const { loginWithMagicLink } = await import("../../actions");
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
            setStep("form");
            setCode("");
            setError(null);
          }}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Cambiar datos
        </button>

        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent/10">
          <KeyRound className="size-6 text-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Revisá tu email</h1>
        <p className="mt-2 text-muted-foreground">
          Te mandamos un código de 6 dígitos a{" "}
          <span className="font-medium text-foreground">{email}</span> para
          activar tu cuenta profesional.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
          <Sparkles className="h-4 w-4" />
          Incluye 30 días premium gratis
        </div>

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
                Confirmar y entrar
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || isPending}
              className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
            >
              {resending ? "Reenviando..." : "No me llegó, reenviar"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Stethoscope className="h-3.5 w-3.5" />
          Cuenta profesional
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Registro veterinario
        </h1>
        <p className="mt-2 text-muted-foreground">
          Accedé a historial completo, recetas digitales y más. Incluye{" "}
          <span className="font-medium text-accent">30 días premium gratis</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              name="fullName"
              placeholder="Dr./Dra. Nombre Apellido"
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
          <Label htmlFor="email">Email profesional</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="veterinario@clinica.com"
              required
              autoComplete="email"
              className="pl-10"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Matrícula y Clínica */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">
              Matrícula{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="licenseNumber"
                name="licenseNumber"
                placeholder="MP 1234"
                maxLength={50}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicName">
              Clínica{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="clinicName"
                name="clinicName"
                placeholder="Nombre de la clínica"
                maxLength={150}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Teléfono{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+54 11 1234-5678"
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
          <Label
            htmlFor="acceptTerms"
            className="text-sm leading-relaxed font-normal"
          >
            Acepto los{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
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
              Crear cuenta profesional
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          Iniciá sesión
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        <Link href="/signup" className="text-primary hover:underline">
          ← Soy dueño de mascota
        </Link>
      </p>
    </div>
  );
}
