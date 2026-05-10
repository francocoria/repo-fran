"use server";

import { revalidatePath } from "next/cache";
import {
  vaccineCreateSchema,
  dewormingCreateSchema,
  medicationCreateSchema,
  allergyCreateSchema,
} from "@pet-app/lib/validators";
import { validateDocument, sanitizeFilename } from "@pet-app/lib/utils/files";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { createSupabaseServerClient } from "@pet-app/lib";

// ─── Helper: verify owner/co-owner access ───────────────────────────
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

// ═══════════════════════════════════════════════════════════════════
// VACUNAS
// ═══════════════════════════════════════════════════════════════════

export async function addVaccine(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const payload = {
      name: formData.get("name"),
      appliedDate: formData.get("appliedDate"),
      lotNumber: formData.get("lotNumber") || undefined,
      nextDoseDate: formData.get("nextDoseDate") || undefined,
      notes: formData.get("notes") || undefined,
    };

    const parsed = vaccineCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos.", errors: parsed.error.flatten().fieldErrors };
    }

    const d = parsed.data;
    await prisma.vaccine.create({
      data: {
        animal_id: animalId,
        name: d.name,
        applied_date: new Date(d.appliedDate),
        lot_number: d.lotNumber || null,
        next_dose_date: d.nextDoseDate ? new Date(d.nextDoseDate) : null,
        notes: d.notes || null,
      },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "Sin permiso." };
    console.error("Vaccine add error:", error);
    return { success: false, error: "No se pudo registrar la vacuna." };
  }
}

export async function deleteVaccine(animalId: string, vaccineId: string) {
  try {
    const { isOwner } = await verifyAnimalAccess(animalId);
    if (!isOwner) return { success: false, error: "Solo el dueño puede eliminar." };

    await prisma.vaccine.delete({ where: { id: vaccineId, animal_id: animalId } });
    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Vaccine delete error:", error);
    return { success: false, error: "No se pudo eliminar." };
  }
}

// ═══════════════════════════════════════════════════════════════════
// DESPARASITACIÓN
// ═══════════════════════════════════════════════════════════════════

export async function addDeworming(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const payload = {
      type: formData.get("type"),
      product: formData.get("product"),
      appliedDate: formData.get("appliedDate"),
      nextDate: formData.get("nextDate") || undefined,
      notes: formData.get("notes") || undefined,
    };

    const parsed = dewormingCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos.", errors: parsed.error.flatten().fieldErrors };
    }

    const d = parsed.data;
    await prisma.deworming.create({
      data: {
        animal_id: animalId,
        type: d.type,
        product: d.product,
        applied_date: new Date(d.appliedDate),
        next_date: d.nextDate ? new Date(d.nextDate) : null,
        notes: d.notes || null,
      },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "Sin permiso." };
    console.error("Deworming add error:", error);
    return { success: false, error: "No se pudo registrar." };
  }
}

export async function deleteDeworming(animalId: string, dewormingId: string) {
  try {
    const { isOwner } = await verifyAnimalAccess(animalId);
    if (!isOwner) return { success: false, error: "Solo el dueño puede eliminar." };

    await prisma.deworming.delete({ where: { id: dewormingId, animal_id: animalId } });
    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Deworming delete error:", error);
    return { success: false, error: "No se pudo eliminar." };
  }
}

// ═══════════════════════════════════════════════════════════════════
// MEDICACIÓN CRÓNICA
// ═══════════════════════════════════════════════════════════════════

export async function addMedication(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const payload = {
      name: formData.get("name"),
      dosage: formData.get("dosage"),
      frequency: formData.get("frequency"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate") || undefined,
      notes: formData.get("notes") || undefined,
    };

    const parsed = medicationCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos.", errors: parsed.error.flatten().fieldErrors };
    }

    const d = parsed.data;
    await prisma.medication.create({
      data: {
        animal_id: animalId,
        name: d.name,
        dosage: d.dosage,
        frequency: d.frequency,
        start_date: new Date(d.startDate),
        end_date: d.endDate ? new Date(d.endDate) : null,
        active: true,
        notes: d.notes || null,
      },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "Sin permiso." };
    console.error("Medication add error:", error);
    return { success: false, error: "No se pudo registrar." };
  }
}

export async function toggleMedication(animalId: string, medicationId: string, active: boolean) {
  try {
    await verifyAnimalAccess(animalId);

    await prisma.medication.update({
      where: { id: medicationId, animal_id: animalId },
      data: { active, end_date: active ? null : new Date() },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Medication toggle error:", error);
    return { success: false, error: "No se pudo actualizar." };
  }
}

export async function deleteMedication(animalId: string, medicationId: string) {
  try {
    const { isOwner } = await verifyAnimalAccess(animalId);
    if (!isOwner) return { success: false, error: "Solo el dueño puede eliminar." };

    await prisma.medication.delete({ where: { id: medicationId, animal_id: animalId } });
    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Medication delete error:", error);
    return { success: false, error: "No se pudo eliminar." };
  }
}

// ═══════════════════════════════════════════════════════════════════
// ALERGIAS
// ═══════════════════════════════════════════════════════════════════

export async function addAllergy(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const payload = {
      type: formData.get("type"),
      allergen: formData.get("allergen"),
      severity: formData.get("severity"),
      notes: formData.get("notes") || undefined,
    };

    const parsed = allergyCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos.", errors: parsed.error.flatten().fieldErrors };
    }

    const d = parsed.data;
    await prisma.allergy.create({
      data: {
        animal_id: animalId,
        type: d.type,
        allergen: d.allergen,
        severity: d.severity,
        notes: d.notes || null,
      },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "Sin permiso." };
    console.error("Allergy add error:", error);
    return { success: false, error: "No se pudo registrar." };
  }
}

export async function deleteAllergy(animalId: string, allergyId: string) {
  try {
    const { isOwner } = await verifyAnimalAccess(animalId);
    if (!isOwner) return { success: false, error: "Solo el dueño puede eliminar." };

    await prisma.allergy.delete({ where: { id: allergyId, animal_id: animalId } });
    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Allergy delete error:", error);
    return { success: false, error: "No se pudo eliminar." };
  }
}

// ═══════════════════════════════════════════════════════════════════
// ESTUDIOS / DOCUMENTOS
// ═══════════════════════════════════════════════════════════════════

export async function uploadStudy(animalId: string, formData: FormData) {
  try {
    await verifyAnimalAccess(animalId);

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const studyDate = formData.get("studyDate") as string;
    const notes = formData.get("notes") as string | null;

    if (!file || file.size === 0) return { success: false, error: "Seleccioná un archivo." };
    if (!title?.trim()) return { success: false, error: "El título es requerido." };

    const validation = validateDocument(file);
    if (!validation.ok) return { success: false, error: validation.message };

    const supabase = await createSupabaseServerClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeName = sanitizeFilename(`${animalId}_${Date.now()}.${ext}`);
    const storagePath = `studies/${animalId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Study upload error:", uploadError);
      return { success: false, error: "Error al subir el archivo." };
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(storagePath);

    await prisma.study.create({
      data: {
        animal_id: animalId,
        title: title.trim(),
        type: "other",
        file_url: urlData.publicUrl,
        filename: file.name,
        file_type: file.type,
        study_date: studyDate ? new Date(studyDate) : new Date(),
        notes: notes?.trim() || null,
      },
    });

    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return { success: false, error: "Sin permiso." };
    console.error("Study upload error:", error);
    return { success: false, error: "No se pudo subir el estudio." };
  }
}

export async function deleteStudy(animalId: string, studyId: string) {
  try {
    const { isOwner } = await verifyAnimalAccess(animalId);
    if (!isOwner) return { success: false, error: "Solo el dueño puede eliminar." };

    await prisma.study.delete({ where: { id: studyId, animal_id: animalId } });
    revalidatePath(`/app/animals/${animalId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Study delete error:", error);
    return { success: false, error: "No se pudo eliminar." };
  }
}
