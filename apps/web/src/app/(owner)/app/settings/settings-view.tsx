"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, ChevronLeft, User, Mail, Shield, Palette, Globe, LogOut } from "lucide-react";
import { SettingsForm } from "./settings-form";
import { ThemePicker } from "./theme-picker";
import { DeleteAccountSection } from "@/components/delete-account-section";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@pet-app/lib/client";

interface SettingsViewProps {
  email: string;
  initialData: {
    fullName: string;
    phone: string | null;
    city: string | null;
    address: string | null;
  };
  petCount: number;
}

type ViewState = "menu" | "profile" | "email" | "security" | "theme" | "language";

export function SettingsView({ email, initialData, petCount }: SettingsViewProps) {
  const t = useTranslations("ownerSettings");
  const [view, setView] = useState<ViewState>("menu");

  const renderMenu = () => (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto pb-10">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configuración</h1>
      </div>

      {/* ─── V2 PROFILE HEADER CARD ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/90 to-fuchsia-600/90 p-6 shadow-md text-white">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-2xl font-bold shadow-sm border-2 border-white/30">
            {initialData.fullName.substring(0, 2).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold tracking-tight">{initialData.fullName}</h2>
          <p className="text-white/80 text-sm mb-4">{email}</p>
          
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              {petCount} {petCount === 1 ? "mascota" : "mascotas"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── CUENTA GROUP ─── */}
      <div>
        <h3 className="mb-3 ml-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Cuenta</h3>
        <div className="overflow-hidden rounded-2xl bg-card border border-border shadow-sm">
          <MenuRow 
            icon={<User className="size-5" />} 
            label="Datos personales" 
            onClick={() => setView("profile")} 
          />
          <MenuRow 
            icon={<Mail className="size-5" />} 
            label="Email" 
            onClick={() => setView("email")} 
            value={email}
          />
          <MenuRow 
            icon={<Shield className="size-5" />} 
            label="Seguridad" 
            onClick={() => setView("security")} 
            isLast
          />
        </div>
      </div>

      {/* ─── PREFERENCIAS GROUP ─── */}
      <div>
        <h3 className="mb-3 ml-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferencias</h3>
        <div className="overflow-hidden rounded-2xl bg-card border border-border shadow-sm">
          <MenuRow 
            icon={<Palette className="size-5" />} 
            label="Tema visual" 
            onClick={() => setView("theme")} 
          />
          <MenuRow 
            icon={<Globe className="size-5" />} 
            label="Idioma" 
            onClick={() => setView("language")} 
          />
          <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <LogOut className="size-5" />
              </div>
              <span className="font-medium">Cerrar sesión</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackHeader = (title: string) => (
    <div className="mb-6 flex items-center gap-3">
      <button 
        onClick={() => setView("menu")}
        className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
    </div>
  );

  return (
    <div className="w-full">
      {view === "menu" && renderMenu()}
      
      {view === "profile" && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          {renderBackHeader("Datos personales")}
          <SettingsForm email={email} initialData={initialData} />
        </div>
      )}

      {view === "email" && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          {renderBackHeader("Email")}
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Mail className="mx-auto size-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Dirección de correo</h3>
            <p className="text-muted-foreground text-sm mb-4">Tu cuenta está vinculada a {email}</p>
            <p className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg">
              Para cambiar tu dirección de correo electrónico, por favor contactá a soporte.
            </p>
          </div>
        </div>
      )}

      {view === "security" && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          {renderBackHeader("Seguridad")}
          <DeleteAccountSection />
        </div>
      )}

      {view === "theme" && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          {renderBackHeader("Tema visual")}
          <ThemePicker />
        </div>
      )}

      {view === "language" && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          {renderBackHeader("Idioma")}
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Globe className="mx-auto size-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Configuración de Idioma</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Actualmente el sistema detecta el idioma automáticamente o podés forzarlo por URL (/es o /en).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({ 
  icon, 
  label, 
  value, 
  onClick, 
  isLast 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value?: string; 
  onClick: () => void; 
  isLast?: boolean; 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left",
        !isLast && "border-b border-border/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground">
          {icon}
        </div>
        <span className="font-medium text-sm sm:text-base">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        {value && <span className="text-sm truncate max-w-[120px] sm:max-w-none">{value}</span>}
        <ChevronRight className="size-4" />
      </div>
    </button>
  );
}
