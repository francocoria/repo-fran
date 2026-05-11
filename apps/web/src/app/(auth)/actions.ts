"use server";

import { createSupabaseServerClient } from "@pet-app/lib";
import { ownerSignupSchema, vetSignupSchema } from "@pet-app/lib";
import { prisma } from "@pet-app/db";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// ─── Tipos de retorno ───

type AuthResult = {
  success: boolean;
  error?: string;
};

// ─── Login con magic link ───

export async function loginWithMagicLink(email: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Login con Google OAuth ───

export async function loginWithGoogle(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return null;
  }

  return data.url;
}

// ─── Signup dueño ───

export async function signupOwner(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    acceptTerms: formData.get("acceptTerms") === "true",
  };

  const parsed = ownerSignupSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Datos inválidos";
    return { success: false, error: firstError };
  }

  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  // Enviar magic link y guardar metadata para el callback
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?redirectTo=/onboarding/owner`,
      data: {
        role: "owner",
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Signup vet ───

export async function signupVet(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    licenseNumber: formData.get("licenseNumber") || undefined,
    clinicName: formData.get("clinicName") || undefined,
    phone: formData.get("phone") || undefined,
    acceptTerms: formData.get("acceptTerms") === "true",
  };

  const parsed = vetSignupSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Datos inválidos";
    return { success: false, error: firstError };
  }

  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?redirectTo=/onboarding/vet`,
      data: {
        role: "vet",
        full_name: parsed.data.fullName,
        license_number: parsed.data.licenseNumber,
        clinic_name: parsed.data.clinicName,
        phone: parsed.data.phone,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Crear perfil después del primer login ───

export async function createOwnerProfile(): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const metadata = user.user_metadata ?? {};

    // Usar Prisma — bypasea RLS (service role) y genera UUIDs nativamente.
    const existing = await prisma.ownerProfile.findUnique({
      where: { user_id: user.id },
      select: { id: true },
    });

    if (existing) {
      return { success: true };
    }

    await prisma.ownerProfile.create({
      data: {
        user_id: user.id,
        full_name:
          (metadata.full_name as string) ??
          (metadata.name as string) ??
          "Sin nombre",
        phone: (metadata.phone as string) ?? null,
        avatar_url: (metadata.avatar_url as string) ?? null,
      },
    });

    // Bootstrap admin si corresponde
    const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
    if (adminEmail && user.email === adminEmail) {
      await prisma.adminUser.upsert({
        where: { user_id: user.id },
        create: { user_id: user.id, role: "superadmin" },
        update: { role: "superadmin" },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("createOwnerProfile error:", error);
    return {
      success: false,
      error: error?.message ?? "No se pudo crear el perfil.",
    };
  }
}

export async function createVetProfile(): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const metadata = user.user_metadata ?? {};

    const existing = await prisma.vetProfile.findUnique({
      where: { user_id: user.id },
      select: { id: true },
    });

    if (existing) {
      return { success: true };
    }

    // Crear perfil + trial subscription en una transacción
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    await prisma.$transaction(async (tx) => {
      const vet = await tx.vetProfile.create({
        data: {
          user_id: user.id,
          full_name:
            (metadata.full_name as string) ??
            (metadata.name as string) ??
            "Sin nombre",
          license_number: (metadata.license_number as string) ?? null,
          clinic_name: (metadata.clinic_name as string) ?? null,
          phone: (metadata.phone as string) ?? null,
          avatar_url: (metadata.avatar_url as string) ?? null,
        },
      });

      await tx.subscription.create({
        data: {
          vet_id: vet.id,
          plan: "trial",
          status: "active",
          starts_at: new Date(),
          expires_at: trialEnd,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("createVetProfile error:", error);
    return {
      success: false,
      error: error?.message ?? "No se pudo crear el perfil.",
    };
  }
}

// ─── Logout ───

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
