"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "@pet-app/lib";
import { ownerSignupSchema, vetSignupSchema } from "@pet-app/lib";
import { prisma } from "@pet-app/db";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// ─── Tipos de retorno ───

type AuthResult = {
  success: boolean;
  error?: string;
};

// ─── Login con magic link / OTP code ───

export async function loginWithMagicLink(email: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function verifyOtpCode(
  email: string,
  token: string,
): Promise<AuthResult & { redirectTo?: string }> {
  const supabase = await createSupabaseServerClient();
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  // Probamos tipo "email" (usuarios existentes con magic link OTP)
  let { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: "email",
  });

  // Si fallo por token invalido, fallback a tipo "signup"
  // (Supabase manda OTP "signup" cuando el usuario es nuevo)
  if (error) {
    console.error("[verifyOtp/email] failed:", {
      code: (error as { code?: string }).code,
      status: (error as { status?: number }).status,
      message: error.message,
    });

    const signupResult = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: "signup",
    });

    if (signupResult.error) {
      console.error("[verifyOtp/signup] failed:", {
        code: (signupResult.error as { code?: string }).code,
        status: (signupResult.error as { status?: number }).status,
        message: signupResult.error.message,
      });
      return { success: false, error: signupResult.error.message };
    }

    data = signupResult.data;
    error = null;
  }

  const userId = data.user?.id;
  if (!userId) {
    return { success: true, redirectTo: "/onboarding" };
  }

  const { data: vet } = await supabase
    .from("vet_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (vet) return { success: true, redirectTo: "/vet" };

  const { data: owner } = await supabase
    .from("owner_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (owner) {
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (admin) return { success: true, redirectTo: "/admin" };
    return { success: true, redirectTo: "/app" };
  }

  return { success: true, redirectTo: "/onboarding" };
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

export async function createOwnerProfile(
  fullNameFromForm?: string,
): Promise<AuthResult> {
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

    // Prioridad: form input → metadata → derivar de email → "Sin nombre"
    const resolvedName =
      fullNameFromForm?.trim() ||
      (metadata.full_name as string) ||
      (metadata.name as string) ||
      user.email?.split("@")[0] ||
      "Sin nombre";

    await prisma.ownerProfile.create({
      data: {
        user_id: user.id,
        full_name: resolvedName,
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

export async function createVetProfile(input?: {
  fullName?: string;
  licenseNumber?: string;
  clinicName?: string;
  phone?: string;
}): Promise<AuthResult> {
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

    const resolvedName =
      input?.fullName?.trim() ||
      (metadata.full_name as string) ||
      (metadata.name as string) ||
      user.email?.split("@")[0] ||
      "Sin nombre";

    await prisma.$transaction(async (tx) => {
      const vet = await tx.vetProfile.create({
        data: {
          user_id: user.id,
          full_name: resolvedName,
          license_number:
            input?.licenseNumber?.trim() ||
            (metadata.license_number as string) ||
            null,
          clinic_name:
            input?.clinicName?.trim() ||
            (metadata.clinic_name as string) ||
            null,
          phone:
            input?.phone?.trim() || (metadata.phone as string) || null,
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

// ─── Eliminar cuenta ──────────────────────────────────────
// Apple Guideline 5.1.1(v) y Google Play Data deletion policy:
// debe poder borrarse la cuenta desde la app, sin email ni soporte.
//
// Borra el user de Supabase Auth (con admin client). Por las foreign keys
// con onDelete: Cascade del schema Prisma, eso arrastra owner_profile,
// vet_profile, animales, vacunas, alergias, accesos, suscripciones, etc.

export async function deleteAccount(
  confirmation: string,
): Promise<AuthResult> {
  if (confirmation !== "ELIMINAR") {
    return {
      success: false,
      error: 'Para confirmar, escribí exactamente "ELIMINAR" (en mayúsculas).',
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado." };
    }

    const userId = user.id;

    // Primero borramos los registros propios via Prisma para asegurar la
    // cascada (Supabase Auth no siempre cascadea hacia public schema).
    await prisma.ownerProfile.deleteMany({ where: { user_id: userId } });
    await prisma.vetProfile.deleteMany({ where: { user_id: userId } });
    await prisma.adminUser.deleteMany({ where: { user_id: userId } });

    // Después borramos el usuario de auth.users con admin key.
    const admin = createSupabaseAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[deleteAccount] auth.admin.deleteUser failed:", deleteError);
      return {
        success: false,
        error:
          "No pudimos eliminar la cuenta. Reintentá o escribinos a 1133985163f@gmail.com",
      };
    }

    // Cerramos la sesión local.
    await supabase.auth.signOut();

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[deleteAccount] failed:", msg);
    return {
      success: false,
      error: "Hubo un problema. Reintentá en unos minutos.",
    };
  }
}
