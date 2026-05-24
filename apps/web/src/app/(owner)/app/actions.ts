"use server";

import { revalidatePath } from "next/cache";
import { animalCreateSchema, animalUpdateSchema, weightEntrySchema } from "@pet-app/lib/validators";
import { validatePhoto, sanitizeFilename } from "@pet-app/lib/utils/files";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@pet-app/lib";
import { logError } from "@/lib/logger";

// ─── Helper: verify that current user owns or co-owns the animal ───
async function verifyAnimalAccess(animalId: string) {
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

// ─── CREATE ─────────────────────────────────────────────────────────
export async function createAnimal(formData: FormData) {
  try {
    const user = await requireUser();
    const profile = await getOwnerProfile(user.id);

    if (!profile) {
      return { success: false, error: "No se encontró el perfil de dueño." };
    }

    // Helper: FormData.get() devuelve null para campos vacios/ausentes.
    // Zod acepta undefined/"" pero NO null. Normalizamos.
    const str = (key: string): string | undefined => {
      const v = formData.get(key);
      if (v === null || v === undefined) return undefined;
      return String(v);
    };

    const weightRaw = str("weightKg");

    // Si el form duplica "species" via append, usar el ultimo valor
    const speciesValues = formData.getAll("species");
    const speciesValue =
      speciesValues.length > 0
        ? String(speciesValues[speciesValues.length - 1])
        : undefined;

    const payload = {
      name: str("name"),
      species: speciesValue,
      breed: str("breed"),
      sex: str("sex"),
      birthDate: str("birthDate"),
      birthDateApprox: formData.get("birthDateApprox") === "true",
      color: str("color"),
      distinctiveMarks: str("distinctiveMarks"),
      microchip: str("microchip"),
      weightKg: weightRaw ? Number(weightRaw) : undefined,
      neutered: formData.get("neutered") === "true",
      neuteredDate: str("neuteredDate"),
      notes: str("notes"),
    };

    const parsed = animalCreateSchema.safeParse(payload);

    if (!parsed.success) {
      console.error("createAnimal validation failed:", parsed.error.flatten());
      const firstError =
        Object.values(parsed.error.flatten().fieldErrors)
          .flat()
          .filter(Boolean)[0] ?? "Datos inválidos";
      return {
        success: false,
        error: firstError,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;
    const birthDateValue = data.birthDate ? new Date(data.birthDate) : null;
    const neuteredDateValue = data.neuteredDate ? new Date(data.neuteredDate) : null;
    const urlToken = crypto.randomUUID();

    const animal = await prisma.animal.create({
      data: {
        owner_id: profile.id,
        name: data.name,
        species: data.species,
        breed: data.breed || null,
        sex: data.sex,
        birth_date: birthDateValue,
        birth_date_approx: data.birthDateApprox,
        color: data.color || null,
        distinctive_marks: data.distinctiveMarks || null,
        microchip: data.microchip || null,
        weight_kg: data.weightKg || null,
        neutered: data.neutered,
        neutered_date: neuteredDateValue,
        notes: data.notes || null,
        url_token: urlToken,
        status: "active",
      },
    });

    revalidatePath("/app");
    return { success: true, animalId: animal.id, urlToken: animal.url_token };
  } catch (error: any) {
    logError("animal/create", error);
    return { success: false, error: "Ocurrió un error al crear la mascota." };
  }
}

// ─── UPDATE ─────────────────────────────────────────────────────────
export async function updateAnimal(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const payload: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key === "birthDateApprox" || key === "neutered") {
        payload[key] = value === "true";
      } else if (key === "weightKg" && value) {
        payload[key] = Number(value);
      } else {
        payload[key] = value;
      }
    }

    const parsed = animalUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos", errors: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.species !== undefined) updateData.species = data.species;
    if (data.breed !== undefined) updateData.breed = data.breed || null;
    if (data.sex !== undefined) updateData.sex = data.sex;
    if (data.birthDate !== undefined) updateData.birth_date = data.birthDate ? new Date(data.birthDate) : null;
    if (data.birthDateApprox !== undefined) updateData.birth_date_approx = data.birthDateApprox;
    if (data.color !== undefined) updateData.color = data.color || null;
    if (data.distinctiveMarks !== undefined) updateData.distinctive_marks = data.distinctiveMarks || null;
    if (data.microchip !== undefined) updateData.microchip = data.microchip || null;
    if (data.weightKg !== undefined) updateData.weight_kg = data.weightKg || null;
    if (data.neutered !== undefined) updateData.neutered = data.neutered;
    if (data.neuteredDate !== undefined) updateData.neutered_date = data.neuteredDate ? new Date(data.neuteredDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    await prisma.animal.update({
      where: { id: animalId },
      data: updateData,
    });

    revalidatePath(`/app/animals/${animalId}`);
    revalidatePath("/app");
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "No tenés permiso." };
    logError("animal/update", error);
    return { success: false, error: "No se pudo actualizar la mascota." };
  }
}

// ─── PHOTO UPLOAD ───────────────────────────────────────────────────
export async function uploadAnimalPhoto(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const file = formData.get("photo") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No se seleccionó ninguna foto." };
    }

    const validation = validatePhoto(file);
    if (!validation.ok) {
      return { success: false, error: validation.message };
    }

    console.log("[uploadAnimalPhoto] file received", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Convertimos a Buffer explicitamente: en Server Actions el File de FormData
    // a veces no se streaming-uploadea bien a Supabase Storage y queda colgado.
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = sanitizeFilename(`${animalId}_${Date.now()}.${ext}`);
    const storagePath = `animals/${animalId}/${safeName}`;

    // Usamos admin client (service role) para evitar problemas de RLS en
    // el bucket cuando el cookie de auth no se propaga al call de Storage.
    const admin = createSupabaseAdminClient();

    console.log("[uploadAnimalPhoto] uploading to bucket", { storagePath });

    const { error: uploadError } = await admin.storage
      .from("animal-photos")
      .upload(storagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[uploadAnimalPhoto] storage upload error:", uploadError);
      return {
        success: false,
        error: `Error al subir la foto: ${uploadError.message}`,
      };
    }

    const { data: urlData } = admin.storage
      .from("animal-photos")
      .getPublicUrl(storagePath);

    console.log("[uploadAnimalPhoto] uploaded, updating db", {
      url: urlData.publicUrl,
    });

    await prisma.animal.update({
      where: { id: animalId },
      data: { photo_url: urlData.publicUrl },
    });

    revalidatePath(`/app/animals/${animalId}`);
    revalidatePath("/app");
    return { success: true, url: urlData.publicUrl };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    if (msg === "FORBIDDEN") return { success: false, error: "No tenés permiso." };
    logError("uploadAnimalPhoto", error);
    return { success: false, error: `No se pudo subir la foto: ${msg}` };
  }
}

// ─── WEIGHT TRACKING ────────────────────────────────────────────────
export async function addWeightEntry(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const payload = {
      weightKg: Number(formData.get("weightKg")),
      notes: formData.get("notes") || undefined,
    };

    const parsed = weightEntrySchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Peso inválido." };
    }

    await prisma.weightEntry.create({
      data: {
        animal_id: animalId,
        weight_kg: parsed.data.weightKg,
        notes: parsed.data.notes || null,
      },
    });

    // Also update the animal's current weight
    await prisma.animal.update({
      where: { id: animalId },
      data: { weight_kg: parsed.data.weightKg },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "No tenés permiso." };
    logError("weight/entry", error);
    return { success: false, error: "No se pudo registrar el peso." };
  }
}

export async function deleteWeightEntry(animalId: string, entryId: string) {
  try {
    const { isOwner } = await verifyAnimalAccess(animalId);
    if (!isOwner) return { success: false, error: "Solo el dueño puede eliminar registros." };

    await prisma.weightEntry.delete({
      where: { id: entryId, animal_id: animalId },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    logError("weight/delete", error);
    return { success: false, error: "No se pudo eliminar el registro." };
  }
}

// ─── CO-OWNERS ──────────────────────────────────────────────────────
export async function inviteCoOwner(animalId: string, email: string) {
  try {
    const { isOwner, profile, animal } = await verifyAnimalAccess(animalId);
    if (!isOwner) {
      return {
        success: false,
        error: "Solo el dueño principal puede invitar co-dueños.",
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: "Email inválido." };
    }

    // 1) Lookup directo a auth.users + owner_profiles por email (audit
    // ALTO-1). Antes listábamos 1000 usuarios con service_role y
    // filtrábamos en memoria — exponía emails de otros, era O(N) y
    // rompía a partir de 1000+ usuarios.
    type AuthLookupRow = {
      user_id: string;
      owner_id: string | null;
      owner_full_name: string | null;
    };
    const rows = await prisma.$queryRaw<AuthLookupRow[]>`
      SELECT
        u.id::text       AS user_id,
        op.id::text      AS owner_id,
        op.full_name     AS owner_full_name
      FROM auth.users u
      LEFT JOIN public.owner_profiles op ON op.user_id = u.id
      WHERE lower(u.email) = ${cleanEmail}
      LIMIT 1
    `;
    const invitedUser = rows[0] ? { id: rows[0].user_id } : null;

    let invitedProfile: { id: string; full_name: string } | null = null;
    let recipientHasAccount = false;

    if (invitedUser && rows[0]?.owner_id) {
      const op = {
        id: rows[0].owner_id,
        full_name: rows[0].owner_full_name ?? "",
      };
      invitedProfile = op;
      recipientHasAccount = true;

      // No se puede invitar al dueño principal a su propia mascota
      if (op.id === profile.id) {
        return {
          success: false,
          error: "No podés invitarte a vos mismo.",
        };
      }

      // ¿Ya existe co-dueño activo/pending para este animal?
      const existing = await prisma.coOwner.findFirst({
        where: {
          animal_id: animalId,
          owner_id: op.id,
          status: { in: ["active", "pending"] },
        },
      });
      if (existing) {
        if (existing.status === "active") {
          return {
            success: false,
            error: "Esa persona ya es co-dueña de esta mascota.",
          };
        }
        return {
          success: false,
          error: "Ya hay una invitación pendiente para esa persona.",
        };
      }

      // Crear el CoOwner pending — al aceptar lo pasamos a active.
      await prisma.coOwner.create({
        data: {
          animal_id: animalId,
          owner_id: op.id,
          added_by_owner_id: profile.id,
          status: "pending",
        },
      });
    }

    // 2) Mandamos el email branded via Resend, con CTA distinto según
    //    si la persona ya tiene cuenta o no.
    const { sendEmail, coOwnerInvitedTemplate } = await import(
      "@pet-app/emails"
    );
    const tmpl = coOwnerInvitedTemplate({
      inviterName: profile.full_name,
      animalName: animal.name,
      animalSpecies: animal.species,
      animalPhotoUrl: animal.photo_url,
      inviteeName: invitedProfile?.full_name ?? null,
      recipientHasAccount,
    });

    const result = await sendEmail({
      to: cleanEmail,
      subject: tmpl.subject,
      html: tmpl.html,
    });

    if (!result.success) {
      console.error("[inviteCoOwner] sendEmail failed:", result.error);
      // Si creamos el coOwner pending pero falló el mail, lo revertimos
      // para no dejar invitaciones huérfanas.
      if (invitedProfile) {
        await prisma.coOwner.deleteMany({
          where: {
            animal_id: animalId,
            owner_id: invitedProfile.id,
            status: "pending",
          },
        });
      }
      return {
        success: false,
        error: "No pudimos enviar el email de invitación.",
      };
    }

    // Si el invitado ya tiene cuenta, mandamos también push notification.
    if (invitedUser) {
      const { sendPushToUser } = await import("@/lib/push");
      void sendPushToUser(invitedUser.id, {
        title: `${profile.full_name} te invitó a cuidar a ${animal.name}`,
        body: "Tocá para ver la invitación y aceptarla.",
        data: { screen: "invites" },
      });
    }

    revalidatePath(`/app/animals/${animalId}`);
    return {
      success: true,
      recipientHasAccount,
      message: recipientHasAccount
        ? "Listo, ya le mandamos el mail. Verá la invitación al iniciar sesión."
        : "Listo, le mandamos un mail invitándola a registrarse. Cuando lo haga, ya tendrá acceso.",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    if (msg === "FORBIDDEN")
      return { success: false, error: "No tenés permiso." };
    logError("inviteCoOwner", error);
    return { success: false, error: "No se pudo enviar la invitación." };
  }
}

// ─── Aceptar invitación de co-dueño ────────────────────────────────
export async function acceptCoOwnerInvite(coOwnerId: string) {
  try {
    const user = await requireUser();
    const profile = await getOwnerProfile(user.id);
    if (!profile) return { success: false, error: "No se encontró tu perfil." };

    const invite = await prisma.coOwner.findUnique({
      where: { id: coOwnerId },
      select: { id: true, owner_id: true, animal_id: true, status: true },
    });

    if (!invite || invite.owner_id !== profile.id) {
      return { success: false, error: "Invitación no encontrada." };
    }
    if (invite.status !== "pending") {
      return {
        success: false,
        error: "Esta invitación ya fue procesada.",
      };
    }

    await prisma.coOwner.update({
      where: { id: coOwnerId },
      data: { status: "active" },
    });

    revalidatePath("/app/access");
    revalidatePath("/app");
    revalidatePath(`/app/animals/${invite.animal_id}`);
    return { success: true };
  } catch (error: unknown) {
    logError("acceptCoOwnerInvite", error);
    return { success: false, error: "No se pudo aceptar la invitación." };
  }
}

// ─── Rechazar invitación de co-dueño ───────────────────────────────
export async function declineCoOwnerInvite(coOwnerId: string) {
  try {
    const user = await requireUser();
    const profile = await getOwnerProfile(user.id);
    if (!profile) return { success: false, error: "No se encontró tu perfil." };

    const invite = await prisma.coOwner.findUnique({
      where: { id: coOwnerId },
      select: { id: true, owner_id: true, status: true },
    });

    if (!invite || invite.owner_id !== profile.id) {
      return { success: false, error: "Invitación no encontrada." };
    }
    if (invite.status !== "pending") {
      return {
        success: false,
        error: "Esta invitación ya fue procesada.",
      };
    }

    await prisma.coOwner.update({
      where: { id: coOwnerId },
      data: { status: "removed" },
    });

    revalidatePath("/app/access");
    return { success: true };
  } catch (error: unknown) {
    logError("declineCoOwnerInvite", error);
    return { success: false, error: "No se pudo rechazar la invitación." };
  }
}

export async function removeCoOwner(animalId: string, coOwnerId: string) {
  try {
    const { isOwner } = await verifyAnimalAccess(animalId);
    if (!isOwner) {
      return { success: false, error: "Solo el dueño principal puede remover co-dueños." };
    }

    await prisma.coOwner.update({
      where: { id: coOwnerId, animal_id: animalId },
      data: { status: "removed" },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    logError("coOwner/remove", error);
    return { success: false, error: "No se pudo remover el co-dueño." };
  }
}
