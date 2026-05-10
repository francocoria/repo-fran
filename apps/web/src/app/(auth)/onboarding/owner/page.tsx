"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@pet-app/ui";
import { createOwnerProfile } from "../../actions";
import { Dog, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function OnboardingOwnerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await createOwnerProfile();
      if (result.success) {
        router.push("/app");
      } else {
        setError(result.error ?? "Error al crear perfil");
      }
    });
  }

  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Dog className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">
        ¡Bienvenido a PetApp!
      </h1>
      <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
        Tu cuenta de dueño está casi lista. Hacé click para continuar y empezar
        a registrar a tus mascotas.
      </p>

      <div className="mt-8 space-y-4 text-left max-w-xs mx-auto">
        {[
          "Registrá todas tus mascotas",
          "Llevá su historial de salud al día",
          "Compartí con tu veterinario vía QR",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
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
          "Continuar al dashboard"
        )}
      </Button>
    </div>
  );
}
