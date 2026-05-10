import { requireUser } from "@/lib/auth";
import { prisma } from "@pet-app/db";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata = { title: "Notificaciones" };
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return (
    <NotificationList
      notifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: n.read,
        created_at: n.created_at.toISOString(),
      }))}
    />
  );
}
