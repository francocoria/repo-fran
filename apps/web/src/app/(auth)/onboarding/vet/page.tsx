"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@pet-app/ui";
import { createVetProfile } from "../../actions";
import { Stethoscope, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function OnboardingVetPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await createVetProfile();
      if (result.success) {
        router.push("/vet");
      } else {
        setError(result.error ?? "Error al crear perfil");
      }
    });
  }

  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
        <Stethoscope className="h-10 w-10 text-accent" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">
        ¡Bienvenido, Doc!
      </h1>
      <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
        Tu cuenta profesional está casi lista. Hacé click para continuar y
        empezar a gestionar pacientes.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
        <Sparkles className="h-4 w-4" />
        30 días premium incluidos
      </div>

      <div className="mt-6 space-y-4 text-left max-w-xs mx-auto">
        {[
          "Accedé al historial completo de tus pacientes",
          "Creá consultas con plantillas profesionales",
          "Generá recetas y certificados digitales",
          "Notas privadas solo para vos",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        onClick={handleContinue}
        className="mt-8 w-full max-w-xs"
        size="lg"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Continuar al panel veterinario"
        )}
      </Button>
    </div>
  );
}
