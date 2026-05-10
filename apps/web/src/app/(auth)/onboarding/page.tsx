"use client";

import Link from "next/link";
import { Dog, Stethoscope, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@pet-app/ui";

/**
 * Onboarding — elegir tipo de cuenta después del primer login.
 * Solo se muestra si el usuario no tiene perfil creado.
 */
export default function OnboardingPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          ¿Cómo vas a usar PetApp?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Elegí tu tipo de cuenta para personalizar tu experiencia.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Owner */}
        <Link href="/onboarding/owner" className="group">
          <Card className="transition-all hover:border-primary/50 hover:shadow-md hover:shadow-primary/5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Dog className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Soy dueño de mascota</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Registrá a tus animales, llevá su historial de salud y
                  compartí con tu veterinario.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </CardContent>
          </Card>
        </Link>

        {/* Vet */}
        <Link href="/onboarding/vet" className="group">
          <Card className="transition-all hover:border-accent/50 hover:shadow-md hover:shadow-accent/5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Soy veterinario</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Accedé al historial de tus pacientes, creá consultas y
                  prescripciones digitales.
                  <span className="ml-1 text-accent font-medium">
                    30 días premium gratis.
                  </span>
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
