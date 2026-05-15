import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@pet-app/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Aceptar o rechazar una invitación a co-dueño (para mobile).
 *
 * Body: { coOwnerId: string, action: "accept" | "decline" }
 * Auth: Bearer <access_token>
 *
 * Mismas garantías que las Server Actions equivalentes:
 *  - El usuario tiene que ser el invitado (owner_id de la fila).
 *  - La invitación tiene que estar en status pending.
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

  let body: { coOwnerId?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const coOwnerId =
    typeof body.coOwnerId === "string" ? body.coOwnerId : null;
  const action = body.action;
  if (!coOwnerId || (action !== "accept" && action !== "decline")) {
    return NextResponse.json(
      { error: "coOwnerId y action (accept|decline) requeridos" },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Config faltante" }, { status: 500 });
  }

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
    const profile = await prisma.ownerProfile.findUnique({
      where: { user_id: user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
    }

    const invite = await prisma.coOwner.findUnique({
      where: { id: coOwnerId },
      select: { id: true, owner_id: true, animal_id: true, status: true },
    });
    if (!invite || invite.owner_id !== profile.id) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }
    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Esta invitación ya fue procesada." },
        { status: 409 },
      );
    }

    await prisma.coOwner.update({
      where: { id: coOwnerId },
      data: { status: action === "accept" ? "active" : "removed" },
    });

    return NextResponse.json({
      success: true,
      action,
      animalId: invite.animal_id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[/api/co-owner/respond] failed:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
