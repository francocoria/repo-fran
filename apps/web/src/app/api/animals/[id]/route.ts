import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnerProfile } from "@/lib/auth";
import { prisma } from "@pet-app/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const profile = await getOwnerProfile(user.id);

    if (!profile) {
      return NextResponse.json({ error: "No profile" }, { status: 403 });
    }

    const animal = await prisma.animal.findUnique({
      where: { id: params.id },
      include: {
        co_owners: {
          where: { owner_id: profile.id, status: "active" },
        },
        weight_entries: {
          orderBy: { recorded_at: "desc" },
          take: 20,
        },
      },
    });

    if (!animal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = animal.owner_id === profile.id;
    const isCoOwner = animal.co_owners.length > 0;

    if (!isOwner && !isCoOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ animal, isOwner });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
