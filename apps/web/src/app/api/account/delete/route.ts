import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@pet-app/lib";
import { prisma } from "@pet-app/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Eliminación de cuenta para clientes nativos (mobile).
 *
 * Recibe el access token en `Authorization: Bearer <token>`. Lo valida
 * contra Supabase, borra los registros públicos del usuario y elimina
 * el row de `auth.users` con admin key.
 *
 * Apple Guideline 5.1.1(v) / Google Play Data deletion: requerido.
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Config faltante" }, { status: 500 });
  }

  // Cliente "scoped" al usuario para validar la sesión.
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
    const userId = user.id;

    // Borramos los registros propios primero (cascada vía Prisma).
    await prisma.ownerProfile.deleteMany({ where: { user_id: userId } });
    await prisma.vetProfile.deleteMany({ where: { user_id: userId } });
    await prisma.adminUser.deleteMany({ where: { user_id: userId } });

    // Después, el auth user con admin key.
    const admin = createSupabaseAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[/api/account/delete] auth.admin.deleteUser:", deleteError);
      return NextResponse.json(
        { error: "No pudimos eliminar la cuenta" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[/api/account/delete] failed:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
