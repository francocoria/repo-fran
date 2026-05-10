import Link from "next/link";
import { ShieldCheck, Stethoscope, ChevronRight } from "lucide-react";
import { Card, CardContent, Badge } from "@pet-app/ui";
import { prisma } from "@pet-app/db";
import { formatDateLong } from "@pet-app/lib/utils/format";
import { createSupabaseAdminClient } from "@pet-app/lib/supabase/admin";
import { VerificationActions } from "./verification-actions";

export const metadata = { title: "Verificaciones" };
export const dynamic = "force-dynamic";

const LICENSE_BUCKET = "licenses";
const SIGNED_URL_TTL = 60 * 5; // 5 minutos

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filter } = await searchParams;
  const statusFilter =
    filter === "approved" || filter === "rejected" ? filter : "pending";

  const requests = await prisma.verificationRequest.findMany({
    where: { status: statusFilter },
    include: {
      vet: {
        select: {
          id: true,
          full_name: true,
          license_number: true,
          license_country: true,
          clinic_name: true,
          phone: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  // Generar signed URLs para las fotos de matrículas
  const admin = createSupabaseAdminClient();
  const requestsWithUrls = await Promise.all(
    requests.map(async (req) => {
      let signedUrl: string | null = null;
      if (req.license_photo_url) {
        // Convertir url completa a path si viene completa
        const parts = req.license_photo_url.split(`${LICENSE_BUCKET}/`);
        const path =
          parts.length > 1 ? (parts[1] ?? req.license_photo_url) : req.license_photo_url;

        const { data } = await admin.storage
          .from(LICENSE_BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL);
        signedUrl = data?.signedUrl ?? null;
      }
      return { ...req, signedUrl };
    }),
  );

  const counts = await Promise.all([
    prisma.verificationRequest.count({ where: { status: "pending" } }),
    prisma.verificationRequest.count({ where: { status: "approved" } }),
    prisma.verificationRequest.count({ where: { status: "rejected" } }),
  ]);

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Verificaciones de matrícula
        </h1>
        <p className="mt-1 text-muted-foreground">
          Revisá las solicitudes y aprobá o rechazá según corresponda.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill
          href="/admin/verifications"
          active={statusFilter === "pending"}
          label={`Pendientes (${counts[0]})`}
        />
        <FilterPill
          href="/admin/verifications?status=approved"
          active={statusFilter === "approved"}
          label={`Aprobadas (${counts[1]})`}
        />
        <FilterPill
          href="/admin/verifications?status=rejected"
          active={statusFilter === "rejected"}
          label={`Rechazadas (${counts[2]})`}
        />
      </div>

      {requestsWithUrls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              {statusFilter === "pending"
                ? "No hay solicitudes pendientes."
                : statusFilter === "approved"
                  ? "No hay solicitudes aprobadas."
                  : "No hay solicitudes rechazadas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requestsWithUrls.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-4">
                  {/* Imagen */}
                  <div className="w-full sm:w-64 shrink-0">
                    {req.signedUrl ? (
                      <a
                        href={req.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={req.signedUrl}
                          alt="Matrícula"
                          className="h-48 w-full rounded-lg border border-border object-cover bg-secondary hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ) : (
                      <div className="h-48 w-full rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                        Sin foto disponible
                      </div>
                    )}
                  </div>

                  {/* Info + acciones */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Stethoscope className="h-4 w-4 text-accent" />
                          <Link
                            href={`/admin/vets/${req.vet.id}`}
                            className="text-base font-semibold hover:underline underline-offset-2"
                          >
                            {req.vet.full_name}
                          </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {req.vet.clinic_name ?? "Sin clínica"}
                        </p>
                        {req.vet.license_number && (
                          <p className="text-xs text-muted-foreground/80 font-mono mt-1">
                            Matrícula: {req.vet.license_number}{" "}
                            ({req.vet.license_country ?? "AR"})
                          </p>
                        )}
                        {req.vet.phone && (
                          <p className="text-xs text-muted-foreground/80 mt-0.5">
                            Tel: {req.vet.phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Solicitada {formatDateLong(req.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          req.status === "approved"
                            ? "default"
                            : req.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {req.status === "approved" && "Aprobada"}
                        {req.status === "rejected" && "Rechazada"}
                        {req.status === "pending" && "Pendiente"}
                      </Badge>
                    </div>

                    {req.status === "rejected" && req.rejection_reason && (
                      <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-sm">
                        <p className="text-xs font-medium text-destructive mb-0.5">
                          Motivo del rechazo
                        </p>
                        <p className="text-foreground/90">
                          {req.rejection_reason}
                        </p>
                      </div>
                    )}

                    {req.status === "pending" && (
                      <VerificationActions requestId={req.id} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/50"
      }`}
    >
      {label}
    </Link>
  );
}
