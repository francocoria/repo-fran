"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { generatePublicSlug } from "@pet-app/lib/utils/slug";

// ─── Helper: verificar acceso owner/co-owner ────────────────────

async function verifyOwnerAccess(animalId: string) {
  const user = await requireUser();
  const profile = await getOwnerProfile(user.id);
  if (!profile) throw new Error("NO_PROFILE");

  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    include: {
      co_owners: { where: { owner_id: profile.id, status: "active" } },
    },
  });
  if (!animal) throw new Error("NOT_FOUND");

  const isOwner = animal.owner_id === profile.id;
  const isCoOwner = animal.co_owners.length > 0;
  if (!isOwner && !isCoOwner) throw new Error("FORBIDDEN");

  return { user, profile, animal, isOwner };
}

// ─── Activar modo perdido ──────────────────────────────────────

const activateSchema = z.object({
  contactName: z.string().trim().min(1).max(100),
  contactPhone: z.string().trim().min(5).max(30),
  contactEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  lastSeenLocation: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),
  lastSeenAt: z
    .string()
    .optional()
    .or(z.literal("")),
  rewardDescription: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),
  additionalInfo: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export async function activateLostMode(animalId: string, formData: FormData) {
  try {
    const { animal } = await verifyOwnerAccess(animalId);

    const payload = {
      contactName: formData.get("contactName"),
      contactPhone: formData.get("contactPhone"),
      contactEmail: formData.get("contactEmail") || "",
      lastSeenLocation: formData.get("lastSeenLocation") || "",
      lastSeenAt: formData.get("lastSeenAt") || "",
      rewardDescription: formData.get("rewardDescription") || "",
      additionalInfo: formData.get("additionalInfo") || "",
    };

    const parsed = activateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const d = parsed.data;

    // Generar slug único (retry on collision)
    let slug = generatePublicSlug();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.lostPetAlert.findUnique({
        where: { public_slug: slug },
      });
      if (!exists) break;
      slug = generatePublicSlug();
      attempts++;
    }

    const alert = await prisma.$transaction(async (tx) => {
      // Marcar cualquier alerta activa previa como cancelada
      await tx.lostPetAlert.updateMany({
        where: { animal_id: animalId, status: "active" },
        data: { status: "cancelled", resolved_at: new Date() },
      });

      // Crear nueva
      const created = await tx.lostPetAlert.create({
        data: {
          animal_id: animalId,
          public_slug: slug,
          contact_name: d.contactName,
          contact_phone: d.contactPhone,
          contact_email: d.contactEmail || null,
          last_seen_location: d.lastSeenLocation || null,
          last_seen_at: d.lastSeenAt ? new Date(d.lastSeenAt) : null,
          reward_description: d.rewardDescription || null,
          additional_info: d.additionalInfo || null,
        },
      });

      // Actualizar status del animal
      await tx.animal.update({
        where: { id: animalId },
        data: { status: "lost" },
      });

      return created;
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true, slug: alert.public_slug, alertId: alert.id };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Sin permiso." };
    }
    if (error.message === "NOT_FOUND") {
      return { success: false, error: "Mascota no encontrada." };
    }
    console.error("activateLostMode error:", error);
    return { success: false, error: "No se pudo activar." };
  }
}

// ─── Desactivar modo perdido (mascota encontrada o cancelado) ──

export async function deactivateLostMode(
  animalId: string,
  asFound: boolean = true,
) {
  try {
    await verifyOwnerAccess(animalId);

    await prisma.$transaction(async (tx) => {
      await tx.lostPetAlert.updateMany({
        where: { animal_id: animalId, status: "active" },
        data: {
          status: asFound ? "found" : "cancelled",
          resolved_at: new Date(),
        },
      });

      await tx.animal.update({
        where: { id: animalId },
        data: { status: "active" },
      });
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return { success: false, error: "Sin permiso." };
    }
    console.error("deactivateLostMode error:", error);
    return { success: false, error: "No se pudo desactivar." };
  }
}
