"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@pet-app/ui";
import { Badge } from "@pet-app/ui";
import {
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
  Menu,
  X,
  Dog,
  Stethoscope,
  Shield,
  Bell,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { useState, useTransition } from "react";

type UserRole = "owner" | "vet" | "admin";

interface AppHeaderProps {
  userName: string;
  userRole: UserRole;
  avatarUrl?: string | null;
}

const roleConfig = {
  owner: {
    label: "Dueño",
    icon: Dog,
    color: "text-primary",
    basePath: "/app",
    navItems: [
      { label: "Mis mascotas", href: "/app" },
      { label: "Accesos", href: "/app/access" },
    ],
  },
  vet: {
    label: "Veterinario",
    icon: Stethoscope,
    color: "text-accent",
    basePath: "/vet",
    navItems: [
      { label: "Pacientes", href: "/vet" },
      { label: "Escanear QR", href: "/vet/scan" },
      { label: "Plantillas", href: "/vet/templates" },
      { label: "Mi plan", href: "/vet/plan" },
    ],
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-destructive",
    basePath: "/admin",
    navItems: [
      { label: "Dashboard", href: "/admin" },
      { label: "Vets", href: "/admin/vets" },
      { label: "Verificaciones", href: "/admin/verifications" },
      { label: "Pagos", href: "/admin/payments" },
    ],
  },
};

export function AppHeader({ userName, userRole, avatarUrl }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const config = roleConfig[userRole];
  const RoleIcon = config.icon;

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo + nav */}
        <div className="flex items-center gap-6">
          <Link
            href={config.basePath}
            className="flex items-center gap-2 font-bold text-lg"
          >
            <span>🐾</span>
            <span className="hidden sm:inline bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PetApp
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {config.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Role badge */}
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex gap-1 text-xs"
          >
            <RoleIcon className={`h-3 w-3 ${config.color}`} />
            {config.label}
          </Badge>

          {/* Notifications (placeholder) */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href={`${config.basePath}/notifications`}>
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notificaciones</span>
            </Link>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          {/* User menu - desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`${config.basePath}/settings`}
                className="gap-2"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="max-w-[120px] truncate text-sm">
                  {userName}
                </span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isPending}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t md:hidden animate-fade-in">
          <div className="container py-4 space-y-1">
            {config.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              href={`${config.basePath}/settings`}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Link>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
