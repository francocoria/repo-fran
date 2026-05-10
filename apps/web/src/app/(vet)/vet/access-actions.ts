"use server";

import { revalidatePath } from "next/cache";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import {
  checkPatientCap,
  effectivePlan,
  type SubscriptionState,
} from "@pet-app/lib/utils/subscription";

// ─── Helpers ────────────────────────────────────────────────────────

async function requireVetProfile() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) throw new Error("NO_VET_PROFILE");
  return { user, profile };
}

/// Cuenta pacientes activos (approved + no archivados) — para chequear cap free
async function countActivePatients(vetId: string): Promise<number> {
  return prisma.vetAccess.count({
    where: {
      vet_id: vetId,
      status: "approved",
      archived_by_vet: false,
    },
  });
}

async function getVetSubscription(
  vetId: string,
): Promise<SubscriptionState | null> {
  const sub = await prisma.subscription.findUnique({
    where: { vet_id: vetId },
  });
  if (!sub) return null;
  return {
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expires_at,
  };
}

// ─── Solicitar acceso a un animal por url_token (escaneo de QR) ─────

export async function requestAccessByToken(urlToken: string) {
  try {
    const { profile } = await requireVetProfile();

    // Buscar animal por token
    const animal = await prisma.animal.findUnique({
      where: { url_token: urlToken },
      select: { id: true, name: true, owner_id: true, photo_url: true, species: true },
    });

    if (!animal) {
      return { success: false, error: "QR inválido o animal no encontrado." };
    }

    // ¿Ya existe una relación previa?
    const existing = await prisma.vetAccess.findUnique({
      where: {
        animal_id_vet_id: {
          animal_id: animal.id,
          vet_id: profile.id,
        },
      },
    });

    if (existing) {
      if (existing.status === "approved") {
        return {
          success: true,
          alreadyApproved: true,
          animalId: animal.id,
          animalName: animal.name,
        };
      }
      if (existing.status === "pending") {
        return {
          success: false,
          error: "Ya solicitaste acceso a este animal. Esperá la aprobación del dueño.",
        };
      }
    }

    // Check de cap: si el vet ya está en el límite, bloquear nueva solicitud.
    // Pendings no cuentan, solo approved + no archivados.
    const sub = await getVetSubscription(profile.id);
    const activeCount = await countActivePatients(profile.id);
    const cap = checkPatientCap(sub, activeCount);
    if (!cap.canAdd) {
      return {
        success: false,
        capReached: true,
        error: `Llegaste al límite de ${cap.limit} pacientes de tu plan. Pasá a Premium para pacientes ilimitados.`,
      };
    }

    if (existing) {
      // Reabrir un acceso revocado
      await prisma.vetAccess.update({
        where: { id: existing.id },
        data: {
          status: "pending",
          requested_at: new Date(),
          revoked_at: null,
          archived_by_vet: false,
          archived_at: null,
        },
      });
    } else {
      await prisma.vetAccess.create({
        data: {
          animal_id: animal.id,
          vet_id: profile.id,
          status: "pending",
        },
      });
    }

    // Notificar al dueño
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { id: animal.owner_id },
      select: { user_id: true },
    });

    if (ownerProfile) {
      await prisma.notification.create({
        data: {
          user_id: ownerProfile.user_id,
          owner_profile_id: animal.owner_id,
          type: "vet_access_request",
          title: "Nueva solicitud de acceso",
          body: `Un veterinario solicitó acceder al perfil de ${animal.name}.`,
          link: "/app/access",
        },
      });
    }

    revalidatePath("/vet");
    revalidatePath("/vet/patients");

    return {
      success: true,
      animalId: animal.id,
      animalName: animal.name,
      animalSpecies: animal.species,
      animalPhoto: animal.photo_url,
    };
  } catch (error: any) {
    if (error.message === "NO_VET_PROFILE") {
      return { success: false, error: "Tu perfil de veterinario no está completo." };
    }
    console.error("requestAccessByToken error:", error);
    return { success: false, error: "No se pudo solicitar acceso." };
  }
}

// ─── Aprobar / rechazar solicitud (lado dueño) ───────────────────────

export async function approveAccess(accessId: string) {
  try {
    const user = await requireUser();

    // Verificar que el dueño actual sea el owner del animal asociado al access
    const access = await prisma.vetAccess.findUnique({
      where: { id: accessId },
      include: {
        animal: { select: { owner_id: true, name: true } },
        vet: {
          select: { full_name: true, user_id: true },
        },
      },
    });

    if (!access) return { success: false, error: "Solicitud no encontrada." };

    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { user_id: user.id },
      select: { id: true },
    });

    if (!ownerProfile || access.animal.owner_id !== ownerProfile.id) {
      return { success: false, error: "No tenés permiso." };
    }

    if (access.status !== "pending") {
      return { success: false, error: "Esta solicitud ya fue procesada." };
    }

    await prisma.vetAccess.update({
      where: { id: accessId },
      data: {
        status: "approved",
        approved_at: new Date(),
      },
    });

    // Notificar al vet
    await prisma.notification.create({
      data: {
        user_id: access.vet.user_id,
        type: "vet_access_approved",
        title: "Acceso aprobado",
        body: `${access.animal.name} ahora aparece en tus pacientes.`,
        link: "/vet/patients",
      },
    });

    revalidatePath("/app/access");
    return { success: true };
  } catch (error) {
    console.error("approveAccess error:", error);
    return { success: false, error: "No se pudo aprobar." };
  }
}

export async function rejectAccess(accessId: string) {
  try {
    const user = await requireUser();

    const access = await prisma.vetAccess.findUnique({
      where: { id: accessId },
      include: { animal: { select: { owner_id: true } } },
    });

    if (!access) return { success: false, error: "Solicitud no encontrada." };

    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { user_id: user.id },
      select: { id: true },
    });

    if (!ownerProfile || access.animal.owner_id !== ownerProfile.id) {
      return { success: false, error: "No tenés permiso." };
    }

    await prisma.vetAccess.update({
      where: { id: accessId },
      data: {
        status: "revoked",
        revoked_at: new Date(),
      },
    });

    revalidatePath("/app/access");
    return { success: true };
  } catch (error) {
    console.error("rejectAccess error:", error);
    return { success: false, error: "No se pudo rechazar." };
  }
}

export async function revokeAccess(accessId: string) {
  // Mismo flow que reject, pero conceptualmente para accesos ya aprobados
  return rejectAccess(accessId);
}

// ─── Lado vet: archivar paciente (no cuenta al cap free) ────────────

export async function archivePatient(accessId: string) {
  try {
    const { profile } = await requireVetProfile();

    const access = await prisma.vetAccess.findUnique({
      where: { id: accessId },
    });

    if (!access || access.vet_id !== profile.id) {
      return { success: false, error: "Acceso no encontrado." };
    }

    await prisma.vetAccess.update({
      where: { id: accessId },
      data: {
        archived_by_vet: true,
        archived_at: new Date(),
      },
    });

    revalidatePath("/vet/patients");
    return { success: true };
  } catch (error: any) {
    if (error.message === "NO_VET_PROFILE") {
      return { success: false, error: "Perfil incompleto." };
    }
    console.error("archivePatient error:", error);
    return { success: false, error: "No se pudo archivar." };
  }
}

export async function unarchivePatient(accessId: string) {
  try {
    const { profile } = await requireVetProfile();

    const access = await prisma.vetAccess.findUnique({
      where: { id: accessId },
    });

    if (!access || access.vet_id !== profile.id) {
      return { success: false, error: "Acceso no encontrado." };
    }

    // ¿Hay espacio en el cap antes de desarchivar?
    const sub = await getVetSubscription(profile.id);
    const activeCount = await countActivePatients(profile.id);
    const cap = checkPatientCap(sub, activeCount);

    if (!cap.canAdd) {
      return {
        success: false,
        error: `Llegaste al límite de ${cap.limit} pacientes activos. Pasá a Premium o archivá otro paciente para poder reactivar este.`,
      };
    }

    await prisma.vetAccess.update({
      where: { id: accessId },
      data: {
        archived_by_vet: false,
        archived_at: null,
      },
    });

    revalidatePath("/vet/patients");
    return { success: true };
  } catch (error: any) {
    if (error.message === "NO_VET_PROFILE") {
      return { success: false, error: "Perfil incompleto." };
    }
    console.error("unarchivePatient error:", error);
    return { success: false, error: "No se pudo desarchivar." };
  }
}

// ─── Helper de UI: estado del plan + cap (para mostrar barras y warnings) ─

export async function getVetPlanStatus() {
  const { profile } = await requireVetProfile();
  const sub = await getVetSubscription(profile.id);
  const activeCount = await countActivePatients(profile.id);
  const cap = checkPatientCap(sub, activeCount);
  return {
    plan: effectivePlan(sub),
    expiresAt: sub?.expiresAt ?? null,
    activePatients: activeCount,
    limit: cap.limit,
    canAddPatient: cap.canAdd,
  };
}
