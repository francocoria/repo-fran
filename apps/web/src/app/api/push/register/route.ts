import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@pet-app/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registra (o actualiza) un token de Expo Push para el usuario actual.
 *
 * Body: { token: string, platform?: "ios" | "android", deviceName?: string }
 * Auth: Bearer <access_token>
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Falta token" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length).trim();

  let body: { token?: unknown; platform?: unknown; deviceName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const pushToken = typeof body.token === "string" ? body.token.trim() : null;
  if (!pushToken) {
    return NextResponse.json({ error: "token requerido" }, { status: 400 });
  }
  const platform =
    body.platform === "ios" || body.platform === "android"
      ? body.platform
      : "unknown";
  const deviceName =
    typeof body.deviceName === "string" ? body.deviceName.slice(0, 80) : null;

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
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  try {
    // upsert por token único — si ese device cambió de dueño, reasignamos
    await prisma.pushToken.upsert({
      where: { token: pushToken },
      create: {
        user_id: user.id,
        token: pushToken,
        platform,
        device_name: deviceName,
      },
      update: {
        user_id: user.id,
        platform,
        device_name: deviceName,
        last_used_at: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[/api/push/register] failed:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * Baja de un token (al cerrar sesión o desactivar notificaciones).
 * Body: { token: string }
 */
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Falta token" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length).trim();

  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const pushToken = typeof body.token === "string" ? body.token.trim() : null;
  if (!pushToken) {
    return NextResponse.json({ error: "token requerido" }, { status: 400 });
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
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  try {
    await prisma.pushToken.deleteMany({
      where: { token: pushToken, user_id: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[/api/push/register DELETE] failed:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
