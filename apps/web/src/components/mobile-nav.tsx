"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dog,
  Bell,
  User,
  Users,
  Crown,
  QrCode,
  ScanLine,
  Shield,
  ShieldCheck,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@pet-app/lib/client";

type Role = "owner" | "vet" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const OWNER_TABS: NavItem[] = [
  { label: "Inicio", href: "/app", icon: Home },
  { label: "Mascotas", href: "/app", icon: Dog },
  // [FAB QR] va acá en el medio visual
  { label: "Avisos", href: "/app/notifications", icon: Bell },
  { label: "Yo", href: "/app/settings", icon: User },
];

const VET_TABS: NavItem[] = [
  { label: "Inicio", href: "/vet", icon: Home },
  { label: "Pacientes", href: "/vet/patients", icon: Users },
  // [FAB Escanear] va acá en el medio
  { label: "Plan", href: "/vet/plan", icon: Crown },
  { label: "Yo", href: "/vet/settings", icon: User },
];

const ADMIN_TABS: NavItem[] = [
  { label: "Inicio", href: "/admin", icon: Home },
  { label: "Vets", href: "/admin/vets", icon: ShieldCheck },
  // [FAB] va acá en el medio
  { label: "Pagos", href: "/admin/payments", icon: CreditCard },
  { label: "Avisos", href: "/admin/notifications", icon: Bell },
];

function isActive(currentPath: string, target: string): boolean {
  if (target === "/app" && currentPath.startsWith("/app")) {
    return currentPath === "/app" || currentPath.startsWith("/app/animals");
  }
  if (target === "/vet" && currentPath === "/vet") return true;
  if (target === "/admin" && currentPath === "/admin") return true;
  return currentPath === target || currentPath.startsWith(target + "/");
}

interface MobileNavProps {
  role: Role;
  fabHref: string;
  fabIcon: "qr" | "scan";
  fabLabel: string;
}

/**
 * Bottom navigation bar para móvil — 4 tabs + FAB redondo flotante en el centro.
 * Estilo apps de banco / Mercado Pago — el FAB sobresale del nav con sombra glow.
 *
 * Renderizado solo en mobile (`md:hidden`).
 */
export function MobileNav({ role, fabHref, fabIcon, fabLabel }: MobileNavProps) {
  const pathname = usePathname() || "/";
  const tabs =
    role === "vet" ? VET_TABS : role === "admin" ? ADMIN_TABS : OWNER_TABS;

  const accentColor = role === "vet" ? "accent" : "primary";
  const fabBg =
    role === "vet"
      ? "linear-gradient(135deg, hsl(189 94% 43%) 0%, hsl(192 91% 36%) 100%)"
      : "linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(189 94% 43%) 100%)";
  const FabIcon = fabIcon === "scan" ? ScanLine : QrCode;
  const fabShadow =
    role === "vet" ? "shadow-fab-accent" : "shadow-fab";

  // First 2 tabs left, last 2 tabs right (notch in the middle for the FAB)
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  return (
    <>
      {/* Spacer to prevent content overlap */}
      <div aria-hidden className="h-20 md:hidden" />

      {/* Nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        aria-label="Navegación principal"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 border-t border-border bg-background/85 backdrop-blur-xl"
          aria-hidden
        />

        {/* Tabs (4 tabs distribuidos 2 izquierda + notch + 2 derecha) */}
        <div className="relative grid grid-cols-5 items-end pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-1">
          {leftTabs.map((tab) => (
            <NavTab
              key={tab.href + tab.label}
              item={tab}
              active={isActive(pathname, tab.href)}
              accentColor={accentColor}
            />
          ))}

          {/* Spacer for FAB */}
          <div aria-hidden className="flex justify-center" />

          {rightTabs.map((tab) => (
            <NavTab
              key={tab.href + tab.label}
              item={tab}
              active={isActive(pathname, tab.href)}
              accentColor={accentColor}
            />
          ))}
        </div>

        {/* FAB QR — botón redondo flotante en el centro */}
        <Link
          href={fabHref}
          aria-label={fabLabel}
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -top-5 flex size-16 items-center justify-center rounded-full text-white transition-transform active:scale-95 hover:scale-105",
            fabShadow,
          )}
          style={{ background: fabBg }}
        >
          <FabIcon className="size-7" strokeWidth={2.2} />
          {/* Subtle inner ring */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-background/40"
            aria-hidden
          />
        </Link>
      </nav>
    </>
  );
}

function NavTab({
  item,
  active,
  accentColor,
}: {
  item: NavItem;
  active: boolean;
  accentColor: "primary" | "accent";
}) {
  const ActiveIcon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-1.5 transition-colors",
        active
          ? accentColor === "accent"
            ? "text-accent"
            : "text-primary"
          : "text-subtle hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <ActiveIcon
        className="size-[22px]"
        strokeWidth={active ? 2.4 : 2}
      />
      <span
        className={cn(
          "text-[10.5px] leading-none",
          active ? "font-semibold" : "font-medium",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
