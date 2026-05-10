"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@pet-app/ui";
import { Input } from "@pet-app/ui";
import { Label } from "@pet-app/ui";
import { loginWithMagicLink } from "../actions";
import { Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await loginWithMagicLink(email);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Error al enviar el enlace");
      }
    });
  }

  if (sent) {
    return (
      <div className="text-center animate-fade-up">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">¡Revisá tu email!</h1>
        <p className="mt-3 text-muted-foreground">
          Te enviamos un enlace mágico a{" "}
          <span className="font-medium text-foreground">{email}</span>.
          <br />
          Hacé click en el enlace para iniciar sesión.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          ¿No lo ves?{" "}
          <button
            onClick={() => setSent(false)}
            className="text-primary hover:underline font-medium"
          >
            Reenviar
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="mt-2 text-muted-foreground">
          Ingresá tu email y te enviamos un enlace mágico.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Enviar enlace mágico
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
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
          <Link href="/signup">
            Crear cuenta como dueño
          </Link>
        </Button>
        <Button variant="ghost" asChild className="w-full text-muted-foreground">
          <Link href="/signup/vet">
            Soy veterinario →
          </Link>
        </Button>
      </div>
    </div>
  );
}
