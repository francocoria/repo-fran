import Link from "next/link";
import { Brand } from "@pet-app/ui";

export const metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Brand size="md" />
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Volver
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold tracking-tight">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última actualización: 11 de mayo de 2026</p>

        <div className="prose-petapp mt-8 space-y-6 text-[15px] leading-relaxed">
          <Section title="Quiénes somos">
            <p>
              PetApp es una plataforma de gestión de salud para mascotas
              operada por Franco Coria, con domicilio en Buenos Aires, Argentina.
              Email de contacto: <a href="mailto:1133985163f@gmail.com" className="text-primary underline-offset-2 hover:underline">1133985163f@gmail.com</a>
            </p>
          </Section>

          <Section title="Qué datos recolectamos">
            <p>Cuando usás PetApp recolectamos:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>Datos de identidad: email, nombre completo, teléfono (opcional), ciudad (opcional)</li>
              <li>Datos de tus mascotas: nombre, especie, raza, fecha de nacimiento, peso, color, microchip, fotos, alergias, vacunas, medicaciones, historial médico</li>
              <li>Datos profesionales (veterinarios): matrícula, clínica, especialidad</li>
              <li>Datos técnicos: dirección IP, sistema operativo, versión de la app</li>
            </ul>
          </Section>

          <Section title="Cómo usamos tus datos">
            <p>Usamos tus datos exclusivamente para:</p>
            <ol className="ml-5 mt-2 list-decimal space-y-1">
              <li>Proveer el servicio (mostrarte el perfil de tu mascota, etc.)</li>
              <li>Permitir el vínculo con veterinarios cuando vos lo autorizás</li>
              <li>Enviarte avisos relacionados con la salud de tu mascota</li>
              <li>Mejorar el servicio (estadísticas agregadas, sin identificarte)</li>
            </ol>
            <p className="mt-3 font-semibold">No vendemos tus datos a terceros. Nunca.</p>
          </Section>

          <Section title="Quién tiene acceso">
            <ul className="ml-5 list-disc space-y-1">
              <li>Vos, dueño de la cuenta</li>
              <li>Los veterinarios a los que aprobaste acceso (podés revocar cuando quieras)</li>
              <li>Los co-dueños que invitaste</li>
              <li>Nuestros proveedores técnicos (Supabase, Vercel, Resend) bajo contratos de confidencialidad</li>
            </ul>
          </Section>

          <Section title="Tus derechos">
            <p>Podés en cualquier momento:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>Acceder a todos los datos que tenemos sobre vos</li>
              <li>Modificar o corregir tu información</li>
              <li>Eliminar tu cuenta y todos los datos asociados</li>
              <li>Exportar tu historial completo en PDF o JSON</li>
              <li>Revocar el acceso de cualquier veterinario</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos escribinos a{" "}
              <a href="mailto:1133985163f@gmail.com" className="text-primary underline-offset-2 hover:underline">
                1133985163f@gmail.com
              </a>.
            </p>
          </Section>

          <Section title="Almacenamiento">
            <p>
              Los datos están almacenados en servidores de Supabase (AWS,
              región US-West) con encriptación en tránsito (TLS) y en reposo.
              Las fotos están en buckets privados con URLs firmadas que expiran.
            </p>
          </Section>

          <Section title="Niños">
            <p>
              PetApp no está dirigida a menores de 13 años. No recolectamos
              datos de niños conscientemente. Si descubrís que un menor creó
              una cuenta, contactanos para eliminarla.
            </p>
          </Section>

          <Section title="Cambios">
            <p>
              Si hacemos cambios significativos te avisamos por email y en la
              app antes de que entren en vigor.
            </p>
          </Section>

          <Section title="Contacto">
            <p>
              ¿Dudas?{" "}
              <a href="mailto:1133985163f@gmail.com" className="text-primary underline-offset-2 hover:underline">
                1133985163f@gmail.com
              </a>
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}
