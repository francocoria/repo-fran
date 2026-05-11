"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";

const updateOwnerSchema = z.object({
  fullName: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  address: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  city: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type UpdateOwnerResult = {
  success: boolean;
  error?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function updateOwnerProfile(
  formData: FormData,
): Promise<UpdateOwnerResult> {
  try {
    const user = await requireUser();
    const profile = await getOwnerProfile(user.id);
    if (!profile) {
      return { success: false, error: "Perfil no encontrado" };
    }

    const payload = {
      fullName: formData.get("fullName"),
      phone: formData.get("phone") || "",
      address: formData.get("address") || "",
      city: formData.get("city") || "",
    };

    const parsed = updateOwnerSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: "Datos inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const d = parsed.data;
    await prisma.ownerProfile.update({
      where: { id: profile.id },
      data: {
        full_name: d.fullName,
        phone: d.phone ?? null,
        address: d.address ?? null,
        city: d.city ?? null,
      },
    });

    revalidatePath("/app");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (error: any) {
    console.error("updateOwnerProfile error:", error);
    return {
      success: false,
      error: error?.message ?? "No se pudo guardar.",
    };
  }
}
