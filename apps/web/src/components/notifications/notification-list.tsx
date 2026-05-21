"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  CheckCheck,
  Stethoscope,
  Crown,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Syringe,
  Pill,
} from "lucide-react";
import { Card, CardContent, Button } from "@pet-app/ui";
import { formatDateLong } from "@pet-app/lib/utils/format";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./actions";
import { cn } from "@pet-app/lib/client";

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

// Generar días de la semana (ej: L, M, M, J, V, S, D)
const WEEK_DAYS = [
  { day: "L", date: 15, active: false, hasDot: false },
  { day: "M", date: 16, active: false, hasDot: true },
  { day: "M", date: 17, active: false, hasDot: false },
  { day: "J", date: 18, active: true, hasDot: false }, // Today
  { day: "V", date: 19, active: false, hasDot: true },
  { day: "S", date: 20, active: false, hasDot: false },
  { day: "D", date: 21, active: false, hasDot: false },
];

const FILTERS = [
  { id: "all", label: "Todos", icon: null },
  { id: "vaccines", label: "Vacunas", icon: <Syringe className="size-3.5" /> },
  { id: "deworming", label: "Desparasitarios", icon: <Pill className="size-3.5" /> },
  { id: "vet", label: "Control", icon: <Stethoscope className="size-3.5" /> },
];

export function NotificationList({ notifications }: Props) {
  const router = useRouter();
  const t = useTranslations("ownerNotifications");
  const [isPending, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] = useState("all");
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleClick(n: NotificationItem) {
    if (!n.read) {
      startTransition(() => { void (async () => {
        await markNotificationAsRead(n.id);
        router.refresh();
      })(); });
    }
    if (n.link) {
      router.push(n.link);
    }
  }

  function handleMarkAllRead() {
    startTransition(() => { void (async () => {
      await markAllNotificationsAsRead();
      router.refresh();
    })(); });
  }

  return (
    <div className="animate-fade-up max-w-2xl space-y-6 mx-auto pb-8">
      {/* ─── HEADER V2 ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recordatorios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lo que se viene esta semana
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="gap-1.5 rounded-full"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* ─── CALENDAR STRIP V2 ─── */}
      <div className="flex justify-between items-center rounded-2xl bg-card border border-border p-4 shadow-sm overflow-x-auto gap-2">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="flex flex-col items-center min-w-[36px]">
            <span className={cn("text-[11px] font-semibold mb-1.5", d.active ? "text-primary" : "text-muted-foreground")}>
              {d.day}
            </span>
            <div className={cn(
              "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
              d.active ? "bg-primary text-white shadow-md shadow-primary/25" : "bg-transparent text-foreground hover:bg-secondary"
            )}>
              {d.date}
            </div>
            <div className="h-1.5 mt-1">
              {d.hasDot && <div className="size-1.5 rounded-full bg-primary" />}
            </div>
          </div>
        ))}
      </div>

      {/* ─── FILTERS V2 ─── */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors border",
              activeFilter === f.id
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:bg-secondary"
            )}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── LISTA DE EVENTOS ─── */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 py-12 text-center bg-card">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No hay recordatorios pendientes</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("emptyText")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left flex items-start gap-3 rounded-2xl p-4 transition-all border",
                  !n.read 
                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10" 
                    : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full",
                  !n.read ? "bg-primary/10" : "bg-secondary"
                )}>
                  {TYPE_ICONS[n.type] ?? <Bell className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("text-sm truncate", !n.read ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    {formatDateLong(n.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
