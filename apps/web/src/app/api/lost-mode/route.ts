import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@pet-app/db";
import { generatePublicSlug } from "@pet-app/lib/utils/slug";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Modo perdido desde mobile.
 *
 * POST con Bearer <access_token>.
 * Body activar:  { animalId, action: "activate", contactName, contactPhone,
 *                  contactEmail?, lastSeenLocation?, lastSeenAt?,
 *                  rewardDescription?, additionalInfo? }
 * Body desactivar: { animalId, action: "deactivate", asFound? }
 *
 * Misma lógica que las Server Actions `activateLostMode` /
 * `deactivateLostMode` pero como REST endpoint para la app nativa.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Falta token" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Token vacío" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const animalId = typeof body.animalId === "string" ? body.animalId : null;
  const action = body.action === "deactivate" ? "deactivate" : "activate";
  if (!animalId) {
    return NextResponse.json(
      { error: "animalId es requerido" },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Config faltante" }, { status: 500 });
  }

  // 1) Validar JWT
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { error: "Sesión inválida o expirada" },
      { status: 401 },
    );
  }

  try {
    // 2) Verificar acceso owner/co-owner al animal
    const profile = await prisma.ownerProfile.findUnique({
      where: { user_id: user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 403 },
      );
    }

    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        co_owners: {
          where: { owner_id: profile.id, status: "active" },
          select: { id: true },
        },
      },
    });
    if (!animal) {
      return NextResponse.json(
        { error: "Mascota no encontrada" },
        { status: 404 },
      );
    }
    const hasAccess =
      animal.owner_id === profile.id || animal.co_owners.length > 0;
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No tenés permiso sobre esta mascota." },
        { status: 403 },
      );
    }

    // ─── Desactivar ───────────────────────────────────────────────
    if (action === "deactivate") {
      const asFound = body.asFound !== false; // default: encontrada
      await prisma.$transaction(async (tx) => {
        await tx.lostPetAlert.updateMany({
          where: { animal_id: animalId, status: "active" },
          data: {
            status: asFound ? "found" : "cancelled",
            resolved_at: new Date(),
          },
        });
        await tx.animal.update({
          where: { id: animalId },
          data: { status: "active" },
        });
      });
      return NextResponse.json({ success: true, status: "active" });
    }

    // ─── Activar ──────────────────────────────────────────────────
    const contactName =
      typeof body.contactName === "string" ? body.contactName.trim() : "";
    const contactPhone =
      typeof body.contactPhone === "string" ? body.contactPhone.trim() : "";
    if (contactName.length < 1 || contactPhone.length < 5) {
      return NextResponse.json(
        { error: "Nombre y teléfono de contacto son obligatorios." },
        { status: 400 },
      );
    }
    const str = (k: string): string | null => {
      const v = body[k];
      return typeof v === "string" && v.trim() ? v.trim() : null;
    };
    const lastSeenAtRaw = str("lastSeenAt");
    const lastSeenAt = lastSeenAtRaw ? new Date(lastSeenAtRaw) : null;

    // Slug único (retry on collision)
    let slug = generatePublicSlug();
    for (let attempts = 0; attempts < 5; attempts++) {
      const exists = await prisma.lostPetAlert.findUnique({
        where: { public_slug: slug },
        select: { id: true },
      });
      if (!exists) break;
      slug = generatePublicSlug();
    }

    const alert = await prisma.$transaction(async (tx) => {
      await tx.lostPetAlert.updateMany({
        where: { animal_id: animalId, status: "active" },
        data: { status: "cancelled", resolved_at: new Date() },
      });
      const created = await tx.lostPetAlert.create({
        data: {
          animal_id: animalId,
          public_slug: slug,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_email: str("contactEmail"),
          last_seen_location: str("lastSeenLocation"),
          last_seen_at:
            lastSeenAt && !Number.isNaN(lastSeenAt.getTime())
              ? lastSeenAt
              : null,
          reward_description: str("rewardDescription"),
          additional_info: str("additionalInfo"),
        },
      });
      await tx.animal.update({
        where: { id: animalId },
        data: { status: "lost" },
      });
      return created;
    });

    return NextResponse.json({
      success: true,
      status: "lost",
      slug: alert.public_slug,
      alertId: alert.id,
    });
  } catch (error: unknown) {
    logError("api/lost-mode", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
