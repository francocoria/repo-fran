"use server";

import { revalidatePath } from "next/cache";
import { animalCreateSchema, animalUpdateSchema, weightEntrySchema } from "@pet-app/lib/validators";
import { validatePhoto, sanitizeFilename } from "@pet-app/lib/utils/files";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { createSupabaseServerClient } from "@pet-app/lib";

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

    const payload = {
      name: formData.get("name"),
      species: formData.get("species"),
      breed: formData.get("breed"),
      sex: formData.get("sex"),
      birthDate: formData.get("birthDate"),
      birthDateApprox: formData.get("birthDateApprox") === "true",
      color: formData.get("color"),
      distinctiveMarks: formData.get("distinctiveMarks"),
      microchip: formData.get("microchip"),
      weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : undefined,
      neutered: formData.get("neutered") === "true",
      neuteredDate: formData.get("neuteredDate"),
      notes: formData.get("notes"),
    };

    const parsed = animalCreateSchema.safeParse(payload);

    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos",
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
    return { success: true, animalId: animal.id };
  } catch (error: any) {
    console.error("Animal create error:", error);
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
    console.error("Animal update error:", error);
    return { success: false, error: "No se pudo actualizar la mascota." };
  }
}

// ─── PHOTO UPLOAD ───────────────────────────────────────────────────
export async function uploadAnimalPhoto(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const file = formData.get("photo") as File;
    if (!file || file.size === 0) {
      return { success: false, error: "No se seleccionó ninguna foto." };
    }

    const validation = validatePhoto(file);
    if (!validation.ok) {
      return { success: false, error: validation.message };
    }

    const supabase = await createSupabaseServerClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = sanitizeFilename(`${animalId}_${Date.now()}.${ext}`);
    const storagePath = `animals/${animalId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("animal-photos")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: "Error al subir la foto." };
    }

    const { data: urlData } = supabase.storage
      .from("animal-photos")
      .getPublicUrl(storagePath);

    // Update animal photo_url
    await prisma.animal.update({
      where: { id: animalId },
      data: { photo_url: urlData.publicUrl },
    });

    revalidatePath(`/app/animals/${animalId}`);
    revalidatePath("/app");
    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "No tenés permiso." };
    console.error("Photo upload error:", error);
    return { success: false, error: "No se pudo subir la foto." };
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
    console.error("Weight entry error:", error);
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
    console.error("Weight delete error:", error);
    return { success: false, error: "No se pudo eliminar el registro." };
  }
}

// ─── CO-OWNERS ──────────────────────────────────────────────────────
export async function inviteCoOwner(animalId: string, email: string) {
  try {
    const { isOwner, profile } = await verifyAnimalAccess(animalId);
    if (!isOwner) {
      return { success: false, error: "Solo el dueño principal puede invitar co-dueños." };
    }

    // Find the owner profile by email (lookup in auth.users then owner_profiles)
    const supabase = await createSupabaseServerClient();

    // Look up user by email through owner_profiles joined with auth
    // We search by full_name or phone — but the simplest way is through
    // the owner_profiles table which has the user_id
    const { data: profiles } = await supabase
      .from("owner_profiles")
      .select("id, user_id, full_name")
      .neq("id", profile.id);

    // For now we'll check if there's a matching user by searching the auth users
    // This is a simplified approach — in production we'd send an invite email
    if (!profiles || profiles.length === 0) {
      return { success: false, error: "No se encontró un usuario con ese email." };
    }

    // Check if already a co-owner
    const existing = await prisma.coOwner.findFirst({
      where: { animal_id: animalId, status: "active" },
    });

    // For MVP: create a pending invitation that the other user accepts
    // We store the email and the co-owner status as "pending"
    // TODO: implement email-based lookup when Supabase is connected
    return {
      success: false,
      error: "La invitación por email estará disponible cuando se configure Supabase Auth. Por ahora, los co-owners se asignan manualmente.",
    };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "No tenés permiso." };
    console.error("Co-owner invite error:", error);
    return { success: false, error: "No se pudo enviar la invitación." };
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
    console.error("Co-owner remove error:", error);
    return { success: false, error: "No se pudo remover el co-dueño." };
  }
}
