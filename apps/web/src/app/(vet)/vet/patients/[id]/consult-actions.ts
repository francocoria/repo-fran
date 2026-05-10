"use server";

import { revalidatePath } from "next/cache";
import { medicalRecordCreateSchema } from "@pet-app/lib/validators";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";

// ─── Helper: verifica acceso aprobado del vet al animal ────────────
async function verifyVetAccess(animalId: string) {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) throw new Error("NO_VET_PROFILE");

  const access = await prisma.vetAccess.findUnique({
    where: {
      animal_id_vet_id: { animal_id: animalId, vet_id: profile.id },
    },
  });

  if (!access || access.status !== "approved") {
    throw new Error("FORBIDDEN");
  }

  return { user, profile, access };
}

// ─── Listar plantillas disponibles (sistema + del vet) ─────────────

export async function getConsultTemplates() {
  try {
    const user = await requireUser();
    const profile = await getVetProfile(user.id);
    if (!profile) return [];

    const templates = await prisma.consultTemplate.findMany({
      where: {
        OR: [{ is_system: true }, { vet_id: profile.id }],
      },
      orderBy: [{ is_system: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        content: true,
        is_system: true,
      },
    });

    return templates;
  } catch (error) {
    console.error("getConsultTemplates error:", error);
    return [];
  }
}

// ─── Crear consulta ────────────────────────────────────────────────

export async function createConsult(animalId: string, formData: FormData) {
  try {
    const { profile } = await verifyVetAccess(animalId);

    const payload = {
      visitDate: formData.get("visitDate"),
      reason: formData.get("reason"),
      examination: formData.get("examination") || undefined,
      diagnosis: formData.get("diagnosis") || undefined,
      treatment: formData.get("treatment") || undefined,
      nextSteps: formData.get("nextSteps") || undefined,
      publicNotes: formData.get("publicNotes") || undefined,
      privateNotes: formData.get("privateNotes") || undefined,
    };

    const parsed = medicalRecordCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const d = parsed.data;

    const record = await prisma.medicalRecord.create({
      data: {
        animal_id: animalId,
        vet_id: profile.id,
        visit_date: new Date(d.visitDate),
        reason: d.reason,
        examination: d.examination || null,
        diagnosis: d.diagnosis || null,
        treatment: d.treatment || null,
        next_steps: d.nextSteps || null,
        public_notes: d.publicNotes || null,
        private_notes: d.privateNotes || null,
      },
      include: {
        animal: { select: { name: true, owner_id: true } },
      },
    });

    // Notificar al dueño que hay una nueva consulta
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { id: record.animal.owner_id },
      select: { user_id: true, id: true },
    });

    if (ownerProfile) {
      await prisma.notification.create({
        data: {
          user_id: ownerProfile.user_id,
          owner_profile_id: ownerProfile.id,
          type: "new_medical_record",
          title: "Nueva consulta veterinaria",
          body: `Se registró una nueva consulta para ${record.animal.name}.`,
          link: `/app/animals/${animalId}`,
        },
      });
    }

    revalidatePath(`/vet/patients/${animalId}`);
    revalidatePath(`/app/animals/${animalId}`);

    return { success: true, recordId: record.id };
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return { success: false, error: "No tenés acceso a este paciente." };
    }
    if (error.message === "NO_VET_PROFILE") {
      return { success: false, error: "Tu perfil de veterinario no está completo." };
    }
    console.error("createConsult error:", error);
    return { success: false, error: "No se pudo registrar la consulta." };
  }
}

// ─── Editar consulta (solo el vet que la creó, dentro de 24h) ─────

const EDIT_WINDOW_HOURS = 24;

export async function updateConsult(
  recordId: string,
  formData: FormData,
) {
  try {
    const user = await requireUser();
    const profile = await getVetProfile(user.id);
    if (!profile) return { success: false, error: "Perfil incompleto." };

    const existing = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: { id: true, vet_id: true, animal_id: true, created_at: true },
    });

    if (!existing) return { success: false, error: "Consulta no encontrada." };
    if (existing.vet_id !== profile.id) {
      return { success: false, error: "No podés editar esta consulta." };
    }

    const ageHours =
      (Date.now() - existing.created_at.getTime()) / (1000 * 60 * 60);
    if (ageHours > EDIT_WINDOW_HOURS) {
      return {
        success: false,
        error: `Solo se puede editar una consulta dentro de las primeras ${EDIT_WINDOW_HOURS} horas.`,
      };
    }

    const payload = {
      visitDate: formData.get("visitDate"),
      reason: formData.get("reason"),
      examination: formData.get("examination") || undefined,
      diagnosis: formData.get("diagnosis") || undefined,
      treatment: formData.get("treatment") || undefined,
      nextSteps: formData.get("nextSteps") || undefined,
      publicNotes: formData.get("publicNotes") || undefined,
      privateNotes: formData.get("privateNotes") || undefined,
    };

    const parsed = medicalRecordCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const d = parsed.data;

    await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        visit_date: new Date(d.visitDate),
        reason: d.reason,
        examination: d.examination || null,
        diagnosis: d.diagnosis || null,
        treatment: d.treatment || null,
        next_steps: d.nextSteps || null,
        public_notes: d.publicNotes || null,
        private_notes: d.privateNotes || null,
      },
    });

    revalidatePath(`/vet/patients/${existing.animal_id}`);
    revalidatePath(`/app/animals/${existing.animal_id}`);
    return { success: true };
  } catch (error) {
    console.error("updateConsult error:", error);
    return { success: false, error: "No se pudo actualizar." };
  }
}
