import type { ReactNode } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Layout de auth — pantalla limpia con branding mínimo.
 * Para: login, signup, onboarding.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel izquierdo: branding */}
      <div className="relative hidden lg:flex lg:flex-col lg:items-center lg:justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(158,64%,40%,0.12),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-md px-8 text-center">
          <Link href="/" className="mb-8 inline-block">
            <span className="text-4xl font-bold tracking-tight">
              🐾 <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">PetApp</span>
            </span>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-foreground/90">
            El centro de control de tu mascota
          </h2>
          <p className="mt-3 text-muted-foreground">
            Vacunas, turnos, historial médico y comunicación con tu veterinario.
            Todo en un solo lugar.
          </p>
          {/* Decorative elements */}
          <div className="mt-10 flex justify-center gap-6 text-5xl opacity-60">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>🐕</span>
            <span className="animate-bounce" style={{ animationDelay: "200ms" }}>🐈</span>
            <span className="animate-bounce" style={{ animationDelay: "400ms" }}>🐰</span>
          </div>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="relative flex items-center justify-center p-6 sm:p-8">
        <div className="absolute right-6 top-6 z-10">
          <LanguageSwitcher variant="icon" />
        </div>
        <div className="w-full max-w-[420px]">
          {/* Logo mobile */}
          <div className="mb-8 lg:hidden text-center">
            <Link href="/">
              <span className="text-2xl font-bold">
                🐾 <span className="text-primary">PetApp</span>
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
