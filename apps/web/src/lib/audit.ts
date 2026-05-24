import "server-only";
import { headers } from "next/headers";
import { prisma } from "@pet-app/db";
import { logError } from "@/lib/logger";

/**
 * Escribe una fila en `audit_log` para trazabilidad de acciones sensibles.
 *
 * Nunca debe romper el flujo principal: si falla, loguea pero no throwea.
 * Esto es deliberado — un audit log que tira excepciones puede convertir
 * una acción exitosa (ej. revocar acceso de vet) en un error visible al
 * usuario solo porque falló el log.
 *
 * Captura IP y user-agent automáticamente desde headers() — el caller
 * solo provee qué acción es.
 *
 * Convención de naming para `action`:
 *   `<verbo>.<resource>` en minúsculas con punto:
 *     "approve.vet_access", "revoke.vet_access", "verify.vet_license",
 *     "activate.premium", "suspend.subscription", "delete.account"
 *
 * `resourceType`: el tipo de entidad afectada (snake_case singular):
 *     "vet_access", "subscription", "animal", "auth_user", "vet_profile"
 */
export async function writeAuditLog(params: {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    const ip = xff
      ? (xff.split(",")[0]?.trim() ?? null)
      : (h.get("x-real-ip") ?? null);
    const ua = h.get("user-agent");

    await prisma.auditLog.create({
      data: {
        actor_id: params.actorId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId ?? null,
        metadata: params.metadata
          ? (params.metadata as object)
          : undefined,
        ip_address: ip,
        user_agent: ua?.slice(0, 200) ?? null,
      },
    });
  } catch (err) {
    logError("audit", err, {
      action: params.action,
      resourceType: params.resourceType,
    });
  }
}
