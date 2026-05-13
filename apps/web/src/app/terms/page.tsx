import Link from "next/link";
import { Brand } from "@pet-app/ui";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Términos y condiciones",
  description: "Términos de uso del servicio PetApp.",
};

const LAST_UPDATED = "13 de mayo de 2026";

export default function TermsPage() {
  return (
    <div className="bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Brand size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-10 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Términos y condiciones
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: {LAST_UPDATED}
        </p>

        <div className="prose prose-stone mt-8 max-w-none dark:prose-invert">
          <Section title="1. Aceptación">
            <p>
              Al crear una cuenta o usar PetApp aceptás estos términos. Si no
              estás de acuerdo, no uses el servicio. Podemos actualizar estos
              términos en el futuro y, si lo hacemos, te avisaremos por email
              o dentro de la app.
            </p>
          </Section>

          <Section title="2. Qué es PetApp">
            <p>
              PetApp es una plataforma web y móvil que permite a dueños de
              mascotas guardar el historial de salud (vacunas, peso, alergias,
              estudios, medicaciones), compartirlo con veterinarios mediante
              un código QR, y activar una página pública en caso de pérdida
              del animal.
            </p>
            <p>
              El servicio incluye un plan gratuito para dueños y planes
              gratuito y premium para veterinarios. Las funcionalidades de
              cada plan están descriptas en la app.
            </p>
          </Section>

          <Section title="3. Tu cuenta">
            <ul>
              <li>Sos responsable de mantener seguro el acceso a tu email.</li>
              <li>
                No te suplantamos: si alguien obtiene acceso a tu casilla,
                podrá entrar a tu cuenta y ver el historial de tus mascotas.
              </li>
              <li>
                Podés cerrar tu cuenta cuando quieras desde Configuración. Al
                cerrarla, eliminamos tus datos personales y los de tus
                mascotas dentro de los 30 días siguientes, excepto lo que
                debamos conservar por obligación legal.
              </li>
            </ul>
          </Section>

          <Section title="4. Veterinarios">
            <p>
              Los veterinarios deben verificar su matrícula profesional con
              foto de la credencial para mostrar un badge de "verificado" a
              los dueños. La verificación es manual y puede tardar hasta 72hs.
            </p>
            <p>
              El acceso al historial de un animal por parte de un veterinario
              requiere aprobación explícita del dueño (escaneo de QR + click
              de confirmación). El dueño puede revocar el acceso en cualquier
              momento desde la sección "Accesos".
            </p>
          </Section>

          <Section title="5. Datos médicos y responsabilidad">
            <p>
              PetApp es una herramienta para registrar y compartir información
              sanitaria. <strong>No reemplaza al veterinario.</strong> Las
              recomendaciones de vacunación, recordatorios y alertas son
              estimaciones basadas en datos cargados por el dueño y/o el
              veterinario, no son consejos médicos.
            </p>
            <p>
              Ante cualquier urgencia de salud animal, contactá a un
              veterinario matriculado.
            </p>
          </Section>

          <Section title="6. Modo perdido">
            <p>
              Cuando activás el modo perdido, generamos una URL pública con la
              foto, nombre, datos de contacto y última ubicación de tu
              mascota. Esta URL es accesible por cualquiera que la reciba. Vos
              decidís qué datos incluir y a quién compartirla.
            </p>
            <p>
              Cuando marcás a la mascota como encontrada, la URL deja de
              funcionar inmediatamente.
            </p>
          </Section>

          <Section title="7. Uso aceptable">
            <p>
              No podés usar PetApp para subir información falsa, vender
              animales, hacer spam, vulnerar la privacidad de terceros, ni
              para fines ilegales. Nos reservamos el derecho de suspender
              cuentas que violen estos términos.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              PetApp se ofrece "tal cual" sin garantías de disponibilidad
              ininterrumpida o ausencia de errores. No nos hacemos
              responsables por pérdida de datos derivada de causas fuera de
              nuestro control, ni por decisiones médicas tomadas en base a la
              información cargada en la plataforma.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Si tenés dudas, escribinos a{" "}
              <a
                href="mailto:hola@pet-friendly.fun"
                className="text-primary hover:underline"
              >
                hola@pet-friendly.fun
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-12 flex justify-between border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Política de privacidad &rarr;
          </Link>
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-foreground/85">
        {children}
      </div>
    </section>
  );
}
