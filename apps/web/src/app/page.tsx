import Link from "next/link";
import {
  Shield,
  Zap,
  QrCode,
  Heart,
  Stethoscope,
  Calendar,
  FileText,
  Bell,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Historial completo",
    description:
      "Vacunas, desparasitaciones, alergias y medicaciones en un solo lugar.",
    color: "text-rose-500 bg-rose-500/10",
  },
  {
    icon: QrCode,
    title: "Conexión por QR",
    description:
      "Tu vet escanea el QR de tu mascota y accede al historial en segundos.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Shield,
    title: "Privacidad primero",
    description:
      "Vos controlás quién ve la info. Aprobá o revocá accesos cuando quieras.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: FileText,
    title: "Recetas digitales",
    description:
      "Tu vet genera recetas y certificados profesionales desde la app.",
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    icon: Calendar,
    title: "Recordatorios",
    description:
      "Nunca más te olvides de una vacuna o turno. Te avisamos a tiempo.",
    color: "text-sky-500 bg-sky-500/10",
  },
  {
    icon: Zap,
    title: "Modo perdido",
    description:
      "Si tu mascota se pierde, activá una página pública con sus datos y QR.",
    color: "text-orange-500 bg-orange-500/10",
  },
];

const vetBenefits = [
  "Acceso al historial completo de tus pacientes",
  "Consultas con plantillas profesionales",
  "Recetas y certificados digitales",
  "Notas privadas que solo vos ves",
  "30 días premium gratis al registrarte",
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Navbar */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">🐾</span>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PetApp
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="focus-ring rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-[0.98]"
            >
              Empezar gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 pt-24 pb-16">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-accent/6 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm animate-fade-in">
            <Star className="h-3.5 w-3.5 text-accent" />
            Beta privada · Próximamente
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl animate-fade-up">
            <span className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent">
              El centro de control
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              de tu mascota.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl animate-fade-up" style={{ animationDelay: "100ms" }}>
            Vacunas, turnos, historial médico y comunicación con tu veterinario.
            Todo en un solo lugar, simple y profesional.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <Link
              href="/signup"
              className="focus-ring group flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
            >
              Empezar gratis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/signup/vet"
              className="focus-ring flex items-center gap-2 rounded-full border border-border bg-background/80 px-7 py-3.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-secondary hover:scale-105"
            >
              <Stethoscope className="h-4 w-4 text-accent" />
              Soy veterinario
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-8 w-5 rounded-full border-2 border-border p-1">
            <div className="h-2 w-1 mx-auto rounded-full bg-muted-foreground animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-secondary/30 py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que necesitás, nada que sobre.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Diseñada para dueños que se toman en serio la salud de sus
              animales y vets que quieren una herramienta profesional.
            </p>
          </div>
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color} transition-transform group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vet CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-background via-accent/5 to-primary/5 border p-8 md:p-12 lg:p-16">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Para veterinarios
                </div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Profesionalizá tu práctica
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Accedé al historial completo de tus pacientes, generá recetas
                  digitales y mantené notas privadas. Todo desde una sola
                  plataforma.
                </p>
                <Link
                  href="/signup/vet"
                  className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-all hover:scale-105 shadow-lg shadow-accent/25"
                >
                  Empezar gratis — 30 días premium
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {vetBenefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-3 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing hint */}
      <section className="border-t bg-secondary/30 py-20 md:py-28">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Gratis para siempre para dueños.
          </h2>
          <p className="mt-4 text-muted-foreground">
            PetApp es y siempre será gratuita para dueños de mascotas. Los
            veterinarios pueden usar el plan gratuito con hasta 5 pacientes, o
            desbloquear todo con el plan premium.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="focus-ring rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-all hover:scale-105"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">🐾</span>
            <span>PetApp © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
