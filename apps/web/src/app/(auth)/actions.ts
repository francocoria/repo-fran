"use server";

import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@pet-app/lib";
import { ownerSignupSchema, vetSignupSchema } from "@pet-app/lib";
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const metadata = user.user_metadata;

  // Verificar que no exista ya
  const { data: existing } = await supabase
    .from("owner_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: true }; // Ya existe
  }

  const { error } = await supabase.from("owner_profiles").insert({
    id: randomUUID(),
    user_id: user.id,
    full_name: metadata.full_name ?? metadata.name ?? "Sin nombre",
    phone: metadata.phone ?? null,
    avatar_url: metadata.avatar_url ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Check si es el email de admin bootstrap
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (adminEmail && user.email === adminEmail) {
    await supabase.from("admin_users").upsert(
      {
        id: randomUUID(),
        user_id: user.id,
        role: "superadmin",
      },
      { onConflict: "user_id" },
    );
  }

  return { success: true };
}

export async function createVetProfile(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const metadata = user.user_metadata;

  // Verificar que no exista ya
  const { data: existing } = await supabase
    .from("vet_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: true };
  }

  // Crear perfil vet
  const vetProfileId = randomUUID();
  const { error: vetError } = await supabase
    .from("vet_profiles")
    .insert({
      id: vetProfileId,
      user_id: user.id,
      full_name: metadata.full_name ?? metadata.name ?? "Sin nombre",
      license_number: metadata.license_number ?? null,
      clinic_name: metadata.clinic_name ?? null,
      phone: metadata.phone ?? null,
      avatar_url: metadata.avatar_url ?? null,
    });

  if (vetError) {
    return { success: false, error: vetError.message };
  }

  // Crear subscription trial 30 días
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);

  await supabase.from("subscriptions").insert({
    id: randomUUID(),
    vet_id: vetProfileId,
    plan: "trial",
    status: "active",
    starts_at: new Date().toISOString(),
    expires_at: trialEnd.toISOString(),
  });

  return { success: true };
}

// ─── Logout ───

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
