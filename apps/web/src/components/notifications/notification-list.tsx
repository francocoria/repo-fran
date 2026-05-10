"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Stethoscope,
  Crown,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, Button, Badge } from "@pet-app/ui";
import { formatDateLong } from "@pet-app/lib/utils/format";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./actions";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface Props {
  notifications: NotificationItem[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  vet_access_request: <Stethoscope className="h-4 w-4 text-accent" />,
  vet_access_approved: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  premium_activated: <Crown className="h-4 w-4 text-amber-500" />,
  premium_expired: <AlertTriangle className="h-4 w-4 text-destructive" />,
  premium_expiring_soon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  verification_approved: <ShieldCheck className="h-4 w-4 text-blue-500" />,
  verification_rejected: <AlertTriangle className="h-4 w-4 text-destructive" />,
  new_medical_record: <Stethoscope className="h-4 w-4 text-blue-500" />,
};

export function NotificationList({ notifications }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleClick(n: NotificationItem) {
    if (!n.read) {
      startTransition(async () => {
        await markNotificationAsRead(n.id);
        router.refresh();
      });
    }
    if (n.link) {
      router.push(n.link);
    }
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      router.refresh();
    });
  }

  return (
    <div className="animate-fade-up max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notifications.length === 0
              ? "Sin notificaciones"
              : unreadCount > 0
                ? `${unreadCount} sin leer`
                : "Todas leídas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Cuando haya algo nuevo, va a aparecer acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={
                    !n.read ? "bg-primary/[0.03]" : ""
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      {TYPE_ICONS[n.type] ?? <Bell className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} truncate`}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {formatDateLong(n.created_at)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
