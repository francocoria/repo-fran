"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@pet-app/db";

export async function markNotificationAsRead(id: string) {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { id, user_id: user.id },
      data: { read: true },
    });
    revalidatePath("/app/notifications");
    revalidatePath("/vet/notifications");
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { user_id: user.id, read: false },
      data: { read: true },
    });
    revalidatePath("/app/notifications");
    revalidatePath("/vet/notifications");
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (error) {
    console.error("markAllNotificationsAsRead error:", error);
    return { success: false };
  }
}
