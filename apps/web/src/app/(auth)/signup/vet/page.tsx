"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@pet-app/ui";
import { Input } from "@pet-app/ui";
import { Label } from "@pet-app/ui";
import { signupVet } from "../../actions";
import {
  Stethoscope,
  User,
  Mail,
  Phone,
  Building2,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function SignupVetPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(() => { void (async () => {
      const result = await signupVet(formData);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Error al crear la cuenta");
      }
    })(); });
  }

  if (sent) {
    return (
      <div className="text-center animate-fade-up">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">¡Revisá tu email!</h1>
        <p className="mt-3 text-muted-foreground">
          Te enviamos un enlace a{" "}
          <span className="font-medium text-foreground">{email}</span> para
          activar tu cuenta profesional.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
          <Sparkles className="h-4 w-4" />
          Incluye 30 días premium gratis
        </div>
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
