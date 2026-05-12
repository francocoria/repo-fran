"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";

const templateSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  examination: z.string().trim().max(2000).optional().or(z.literal("")),
  diagnosis: z.string().trim().max(2000).optional().or(z.literal("")),
  treatment: z.string().trim().max(2000).optional().or(z.literal("")),
  nextSteps: z.string().trim().max(1000).optional().or(z.literal("")),
});

async function requireVet() {
  const user = await requireUser();
  const profile = await getVetProfile(user.id);
  if (!profile) throw new Error("NO_VET_PROFILE");
  return { user, profile };
}

export async function listMyTemplates() {
  try {
    const { profile } = await requireVet();
    const templates = await prisma.consultTemplate.findMany({
      where: { vet_id: profile.id },
      orderBy: { created_at: "desc" },
      select: { id: true, name: true, content: true, created_at: true },
    });
    return { success: true, templates };
  } catch {
    return { success: false, templates: [] };
  }
}

export async function createConsultTemplate(formData: FormData) {
  try {
    const { profile } = await requireVet();

    const payload = {
      name: formData.get("name"),
      examination: formData.get("examination") || undefined,
      diagnosis: formData.get("diagnosis") || undefined,
      treatment: formData.get("treatment") || undefined,
      nextSteps: formData.get("nextSteps") || undefined,
    };
    const parsed = templateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }
    const d = parsed.data;

    const tpl = await prisma.consultTemplate.create({
      data: {
        vet_id: profile.id,
        name: d.name,
        is_system: false,
        content: {
          examination: d.examination ?? "",
          diagnosis: d.diagnosis ?? "",
          treatment: d.treatment ?? "",
          next_steps: d.nextSteps ?? "",
        },
      },
    });

    revalidatePath("/vet/templates");
    return { success: true, id: tpl.id };
  } catch (error: any) {
    if (error.message === "NO_VET_PROFILE") {
      return { success: false, error: "Perfil incompleto." };
    }
    console.error("createConsultTemplate error:", error);
    return { success: false, error: "No se pudo crear la plantilla." };
  }
}

export async function updateConsultTemplate(id: string, formData: FormData) {
  try {
    const { profile } = await requireVet();

    const existing = await prisma.consultTemplate.findUnique({ where: { id } });
    if (!existing || existing.vet_id !== profile.id) {
      return { success: false, error: "Plantilla no encontrada." };
    }
    if (existing.is_system) {
      return { success: false, error: "No se pueden editar plantillas del sistema." };
    }

    const payload = {
      name: formData.get("name"),
      examination: formData.get("examination") || undefined,
      diagnosis: formData.get("diagnosis") || undefined,
      treatment: formData.get("treatment") || undefined,
      nextSteps: formData.get("nextSteps") || undefined,
    };
    const parsed = templateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }
    const d = parsed.data;

    await prisma.consultTemplate.update({
      where: { id },
      data: {
        name: d.name,
        content: {
          examination: d.examination ?? "",
          diagnosis: d.diagnosis ?? "",
          treatment: d.treatment ?? "",
          next_steps: d.nextSteps ?? "",
        },
      },
    });

    revalidatePath("/vet/templates");
    return { success: true };
  } catch (error: any) {
    console.error("updateConsultTemplate error:", error);
    return { success: false, error: "No se pudo actualizar." };
  }
}

export async function deleteConsultTemplate(id: string) {
  try {
    const { profile } = await requireVet();

    const existing = await prisma.consultTemplate.findUnique({ where: { id } });
    if (!existing || existing.vet_id !== profile.id) {
      return { success: false, error: "Plantilla no encontrada." };
    }
    if (existing.is_system) {
      return { success: false, error: "No se pueden borrar plantillas del sistema." };
    }

    await prisma.consultTemplate.delete({ where: { id } });
    revalidatePath("/vet/templates");
    return { success: true };
  } catch (error) {
    console.error("deleteConsultTemplate error:", error);
    return { success: false, error: "No se pudo borrar." };
  }
}
