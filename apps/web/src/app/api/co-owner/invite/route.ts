import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@pet-app/lib";
import { prisma } from "@pet-app/db";
import { sendEmail, coOwnerInvitedTemplate } from "@pet-app/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Invitar co-dueño desde mobile.
 *
 * Body: { animalId: string, email: string }
 * Auth: Bearer <access_token>
 *
 * Misma lógica que la Server Action `inviteCoOwner` pero como REST endpoint
 * para que la app nativa pueda llamarla.
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

  let body: { animalId?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const animalId = typeof body.animalId === "string" ? body.animalId : null;
  const emailRaw = typeof body.email === "string" ? body.email : null;
  if (!animalId || !emailRaw) {
    return NextResponse.json(
      { error: "animalId y email son requeridos" },
      { status: 400 },
    );
  }
  const cleanEmail = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Config faltante" }, { status: 500 });
  }

  // 1) Validar JWT y obtener user
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
    // 2) Verificar que el caller es el owner principal del animal
    const profile = await prisma.ownerProfile.findUnique({
      where: { user_id: user.id },
      select: { id: true, full_name: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
    }

    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      select: {
        id: true,
        name: true,
        species: true,
        photo_url: true,
        owner_id: true,
      },
    });
    if (!animal) {
      return NextResponse.json({ error: "Mascota no encontrada" }, { status: 404 });
    }
    if (animal.owner_id !== profile.id) {
      return NextResponse.json(
        { error: "Sólo el dueño principal puede invitar co-dueños." },
        { status: 403 },
      );
    }

    // 3) Buscar el email en auth.users
    const admin = createSupabaseAdminClient();
    const { data: usersData, error: listError } =
      await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) {
      console.error("[/api/co-owner/invite] listUsers:", listError);
      return NextResponse.json(
        { error: "No pudimos buscar el email." },
        { status: 500 },
      );
    }

    const invitedUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail,
    );

    let invitedProfile: { id: string; full_name: string } | null = null;
    let recipientHasAccount = false;

    if (invitedUser) {
      const op = await prisma.ownerProfile.findUnique({
        where: { user_id: invitedUser.id },
        select: { id: true, full_name: true },
      });
      if (op) {
        invitedProfile = op;
        recipientHasAccount = true;

        if (op.id === profile.id) {
          return NextResponse.json(
            { error: "No podés invitarte a vos mismo." },
            { status: 400 },
          );
        }

        const existing = await prisma.coOwner.findFirst({
          where: {
            animal_id: animalId,
            owner_id: op.id,
            status: { in: ["active", "pending"] },
          },
        });
        if (existing) {
          if (existing.status === "active") {
            return NextResponse.json(
              { error: "Esa persona ya es co-dueña de esta mascota." },
              { status: 409 },
            );
          }
          return NextResponse.json(
            { error: "Ya hay una invitación pendiente para esa persona." },
            { status: 409 },
          );
        }

        await prisma.coOwner.create({
          data: {
            animal_id: animalId,
            owner_id: op.id,
            added_by_owner_id: profile.id,
            status: "pending",
          },
        });
      }
    }

    // 4) Mandar email
    const tmpl = coOwnerInvitedTemplate({
      inviterName: profile.full_name,
      animalName: animal.name,
      animalSpecies: animal.species,
      animalPhotoUrl: animal.photo_url,
      inviteeName: invitedProfile?.full_name ?? null,
      recipientHasAccount,
    });

    const result = await sendEmail({
      to: cleanEmail,
      subject: tmpl.subject,
      html: tmpl.html,
    });

    if (!result.success) {
      console.error("[/api/co-owner/invite] email failed:", result.error);
      // Rollback de la fila pending si la creamos
      if (invitedProfile) {
        await prisma.coOwner.deleteMany({
          where: {
            animal_id: animalId,
            owner_id: invitedProfile.id,
            status: "pending",
          },
        });
      }
      return NextResponse.json(
        { error: "No pudimos enviar el email de invitación." },
        { status: 500 },
      );
    }

    // Push notification si el invitado ya tiene cuenta
    if (invitedUser) {
      const { sendPushToUser } = await import("@/lib/push");
      void sendPushToUser(invitedUser.id, {
        title: `${profile.full_name} te invitó a cuidar a ${animal.name}`,
        body: "Tocá para ver la invitación y aceptarla.",
        data: { screen: "invites" },
      });
    }

    return NextResponse.json({
      success: true,
      recipientHasAccount,
      message: recipientHasAccount
        ? "Listo, ya le mandamos el mail. Verá la invitación al iniciar sesión."
        : "Listo, le mandamos un mail invitándola a registrarse.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[/api/co-owner/invite] failed:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
