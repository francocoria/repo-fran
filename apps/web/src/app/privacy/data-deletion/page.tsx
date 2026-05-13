import Link from "next/link";
import { Brand, Card, CardContent } from "@pet-app/ui";
import {
  ChevronLeft,
  Trash2,
  Smartphone,
  Mail,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Eliminación de datos",
  description:
    "Cómo eliminar tu cuenta PetApp y los datos asociados, desde la app o solicitándolo por email.",
};

const LAST_UPDATED = "13 de mayo de 2026";
const SUPPORT_EMAIL = "1133985163f@gmail.com";

/**
 * Página pública de eliminación de datos.
 *
 * Google Play exige una URL accesible SIN login donde cualquiera pueda
 * encontrar las instrucciones para solicitar la eliminación de su cuenta
 * y los datos asociados. Esta es esa página.
 */
export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand size="md" />
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Privacidad
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-10 md:py-14">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Eliminar tu cuenta y datos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Última actualización: {LAST_UPDATED}
            </p>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-foreground/85">
          Tenés dos formas de eliminar tu cuenta de PetApp. Ambas borran de
          forma permanente tu perfil, todas tus mascotas, vacunas, alergias,
          medicaciones, estudios, accesos a veterinarios, suscripciones y
          cualquier historial médico asociado a tu cuenta. La acción es
          irreversible y no se puede deshacer.
        </p>

        <div className="mt-8 grid gap-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Smartphone className="size-5" />
                </div>
                <h2 className="text-lg font-semibold">
                  Opción 1 — Desde la app (recomendado)
                </h2>
              </div>
              <ol className="ml-5 list-decimal space-y-2 text-[14.5px] leading-relaxed">
                <li>
                  Iniciá sesión en{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    pet-friendly.fun
                  </Link>{" "}
                  o en la app instalada en tu celular.
                </li>
                <li>
                  Andá a <strong>Configuración</strong> (o <strong>Yo</strong>{" "}
                  en mobile).
                </li>
                <li>
                  Scroll hasta el fondo → tarjeta roja{" "}
                  <strong>"Eliminar mi cuenta"</strong>.
                </li>
                <li>Confirmá escribiendo "ELIMINAR" en mayúsculas.</li>
                <li>
                  En menos de 30 segundos tu cuenta y todos los datos quedan
                  eliminados.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Mail className="size-5" />
                </div>
                <h2 className="text-lg font-semibold">
                  Opción 2 — Solicitud por email
                </h2>
              </div>
              <p className="text-[14.5px] leading-relaxed">
                Si perdiste acceso a tu cuenta o tenés un problema técnico,
                mandanos un email a{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Eliminaci%C3%B3n%20de%20cuenta%20PetApp`}
                  className="text-primary hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                desde el email asociado a tu cuenta de PetApp.
              </p>
              <p className="text-[14.5px] leading-relaxed">
                Incluí en el asunto:{" "}
                <span className="font-mono text-[13px]">
                  Eliminación de cuenta PetApp
                </span>
              </p>
              <p className="text-[14.5px] leading-relaxed">
                Te respondemos dentro de las 72hs y procesamos la eliminación
                en menos de 7 días hábiles. Te confirmamos por email cuando
                queda hecho.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Qué se elimina
          </h2>
          <ul className="ml-5 list-disc space-y-1.5 text-[14.5px] leading-relaxed text-foreground/85">
            <li>Perfil personal (nombre, email, teléfono, foto, ciudad)</li>
            <li>Todas tus mascotas y su historial completo</li>
            <li>Vacunas, antiparasitarios, alergias, medicaciones</li>
            <li>Pesos, fotos, estudios y consultas médicas</li>
            <li>Accesos otorgados a veterinarios</li>
            <li>
              Suscripciones premium (vet) — si tenés una activa, se cancela
              automáticamente al borrar la cuenta
            </li>
            <li>Notificaciones, recordatorios y preferencias</li>
            <li>Cookies y datos de sesión locales</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Qué conservamos (y por qué)
          </h2>
          <p className="text-[14.5px] leading-relaxed">
            Por requisitos legales y de seguridad básica, conservamos algunos
            datos anonimizados o agregados después de la eliminación:
          </p>
          <ul className="ml-5 list-disc space-y-1.5 text-[14.5px] leading-relaxed text-foreground/85">
            <li>
              <strong>Logs de seguridad anonimizados</strong> (90 días) — para
              detectar abusos.
            </li>
            <li>
              <strong>Registros médicos creados por un veterinario sobre tu
              mascota</strong> — los conserva el profesional según la legislación
              aplicable (típicamente 5 años para protección del propio
              veterinario). Estos quedan en la cuenta del vet, sin asociación
              identificable a vos como dueño.
            </li>
          </ul>
        </section>

        <Card className="mt-10 border-emerald-300/40 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                Tus derechos
              </h3>
            </div>
            <p className="text-[14px] leading-relaxed text-emerald-900/85 dark:text-emerald-100/85">
              También podés solicitarnos una copia exportable de tus datos
              (en formato JSON) antes de la eliminación. Pedila por email a{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="underline underline-offset-2"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-2/40 p-4 text-[13.5px]">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">In-app: instantáneo</p>
              <p className="mt-0.5 text-muted-foreground">
                Tu cuenta deja de existir en segundos.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-2/40 p-4 text-[13.5px]">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Por email: hasta 7 días hábiles</p>
              <p className="mt-0.5 text-muted-foreground">
                Te confirmamos cuando se completa.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            &larr; Política de privacidad
          </Link>
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
