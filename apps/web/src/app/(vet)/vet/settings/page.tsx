import { Card, CardContent } from "@pet-app/ui";
import { ShieldCheck, Mail, FileBadge, Phone, Building2 } from "lucide-react";
import { requireUser, getVetProfile } from "@/lib/auth";
import { DeleteAccountSection } from "@/components/delete-account-section";
import { LogoutButton } from "@/components/logout-button";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function VetSettingsPage() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) return null;

  const verified = profile.verification_status === "approved";

  return (
    <div className="animate-fade-up max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi cuenta</h1>
        <p className="mt-1 text-muted-foreground">
          Información profesional y configuración de cuenta.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold">Perfil profesional</h2>

          <div className="space-y-3 text-sm">
            <Row icon={ShieldCheck} label="Nombre" value={profile.full_name} />
            <Row icon={Mail} label="Email" value={user.email ?? "—"} mono />
            <Row
              icon={FileBadge}
              label="Matrícula"
              value={profile.license_number ?? "—"}
              badge={
                verified
                  ? { text: "Verificada", tone: "emerald" }
                  : profile.verification_status === "pending"
                    ? { text: "En revisión", tone: "amber" }
                    : profile.verification_status === "rejected"
                      ? { text: "Rechazada", tone: "rose" }
                      : null
              }
            />
            {profile.clinic_name && (
              <Row icon={Building2} label="Clínica" value={profile.clinic_name} />
            )}
            {profile.phone && (
              <Row icon={Phone} label="Teléfono" value={profile.phone} mono />
            )}
          </div>

          <p className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            Para editar nombre, matrícula o datos de la clínica, escribinos a{" "}
            <a
              href="mailto:1133985163f@gmail.com"
              className="text-primary hover:underline"
            >
              1133985163f@gmail.com
            </a>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <h2 className="font-semibold">Sesión</h2>
          <p className="text-sm text-muted-foreground">
            Cerrá tu sesión activa en este dispositivo.
          </p>
          <LogoutButton />
        </CardContent>
      </Card>

      <DeleteAccountSection />
    </div>
  );
}

interface RowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  badge?: { text: string; tone: "emerald" | "amber" | "rose" } | null;
}

function Row({ icon: Icon, label, value, mono, badge }: RowProps) {
  const toneClass = badge
    ? {
        emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
      }[badge.tone]
    : "";
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span
            className={`text-sm text-foreground ${mono ? "font-mono break-all" : ""}`}
          >
            {value}
          </span>
          {badge && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${toneClass}`}
            >
              {badge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
