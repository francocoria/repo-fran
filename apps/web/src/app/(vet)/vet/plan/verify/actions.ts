"use server";

import { revalidatePath } from "next/cache";
import { requireUser, getVetProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { createSupabaseAdminClient } from "@pet-app/lib/supabase/admin";
import { validatePhoto, sanitizeFilename } from "@pet-app/lib/utils/files";

const LICENSE_BUCKET = "licenses";

export async function requestVerification(formData: FormData) {
  try {
    const user = await requireUser();
    const profile = await getVetProfile(user.id);
    if (!profile) {
      return { success: false, error: "Perfil incompleto." };
    }

    if (profile.verified) {
      return { success: false, error: "Tu matrícula ya está verificada." };
    }

    const file = formData.get("license") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "Subí una foto de tu matrícula." };
    }

    const validation = validatePhoto(file);
    if (!validation.ok) {
      return {
        success: false,
        error: validation.message ?? "Imagen no válida.",
      };
    }

    // Verificar que no haya solicitudes pendientes
    const existingPending = await prisma.verificationRequest.findFirst({
      where: { vet_id: profile.id, status: "pending" },
    });
    if (existingPending) {
      return {
        success: false,
        error:
          "Ya tenés una solicitud pendiente. Esperá a que sea revisada.",
      };
    }

    // Subir a Storage privado
    const admin = createSupabaseAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${profile.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from(LICENSE_BUCKET)
      .upload(filename, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload license error:", uploadError);
      return { success: false, error: "No se pudo subir la imagen." };
    }

    // Guardar request — almacenamos solo el path, no la URL
    await prisma.verificationRequest.create({
      data: {
        vet_id: profile.id,
        license_photo_url: filename,
      },
    });

    revalidatePath("/vet/plan");
    return { success: true };
  } catch (error) {
    console.error("requestVerification error:", error);
    return { success: false, error: "No se pudo enviar la solicitud." };
  }
}
