import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@pet-app/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lista las invitaciones a co-dueño donde el usuario actual es el invitado
 * (status: pending). Mobile lo usa para el banner y la pantalla de invites.
 *
 * Auth: Bearer <access_token>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Falta token" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Token vacío" }, { status: 401 });
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
      return NextResponse.json({ invites: [], count: 0 });
    }

    const invites = await prisma.coOwner.findMany({
      where: { owner_id: profile.id, status: "pending" },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            photo_url: true,
          },
        },
      },
      orderBy: { added_at: "desc" },
    });

    const inviterIds = [...new Set(invites.map((i) => i.added_by_owner_id))];
    const inviters = inviterIds.length
      ? await prisma.ownerProfile.findMany({
          where: { id: { in: inviterIds } },
          select: { id: true, full_name: true },
        })
      : [];
    const inviterMap = new Map(inviters.map((i) => [i.id, i.full_name]));

    const result = invites.map((c) => ({
      id: c.id,
      invitedAt: c.added_at.toISOString(),
      animal: c.animal,
      inviter: { full_name: inviterMap.get(c.added_by_owner_id) ?? null },
    }));

    return NextResponse.json({ invites: result, count: result.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[/api/co-owner/pending] failed:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
