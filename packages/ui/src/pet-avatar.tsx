import * as React from "react";
import { cn } from "@pet-app/lib/client";
import {
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  PawPrint,
  type LucideIcon,
} from "lucide-react";

type Species =
  | "dog"
  | "cat"
  | "bird"
  | "rabbit"
  | "rodent"
  | "reptile"
  | "fish"
  | "exotic"
  | "other"
  | string;

interface PetAvatarProps {
  name?: string | null;
  species?: Species;
  /** Photo URL if exists — takes priority over gradient */
  photoUrl?: string | null;
  size?: number;
  /** Border radius (px) — default size*0.22 */
  radius?: number;
  /** Show pulse if pet is in "lost" mode */
  lost?: boolean;
  className?: string;
}

const SPECIES_STYLES: Record<
  string,
  { gradient: string; icon: LucideIcon }
> = {
  dog: {
    gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    icon: Dog,
  },
  cat: {
    gradient: "linear-gradient(135deg, #0d9488, #14b8a6)",
    icon: Cat,
  },
  bird: {
    gradient: "linear-gradient(135deg, #f59e0b, #fb923c)",
    icon: Bird,
  },
  rabbit: {
    gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    icon: Rabbit,
  },
  fish: {
    gradient: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
    icon: Fish,
  },
  rodent: {
    gradient: "linear-gradient(135deg, #fb7185, #f43f5e)",
    icon: PawPrint,
  },
  reptile: {
    gradient: "linear-gradient(135deg, #84cc16, #65a30d)",
    icon: PawPrint,
  },
  exotic: {
    gradient: "linear-gradient(135deg, #c084fc, #a855f7)",
    icon: PawPrint,
  },
  other: {
    gradient: "linear-gradient(135deg, #64748b, #475569)",
    icon: PawPrint,
  },
};

export function PetAvatar({
  name,
  species = "other",
  photoUrl,
  size = 56,
  radius,
  lost = false,
  className,
}: PetAvatarProps) {
  const style = SPECIES_STYLES[species] ?? SPECIES_STYLES.other!;
  const Icon = style.icon;
  const initial = (name ?? "?").trim().charAt(0).toUpperCase();
  const r = radius ?? Math.round(size * 0.22);

  // If there's a photo, render it instead of gradient + initial
  if (photoUrl) {
    return (
      <div
        className={cn("relative shrink-0 overflow-hidden", className)}
        style={{ width: size, height: size, borderRadius: r }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={name ?? "Mascota"}
          className="size-full object-cover"
        />
        {lost && (
          <span
            className="absolute -top-1 -right-1 size-4 rounded-full bg-rose border-2 border-background animate-pulse-rose"
            aria-hidden
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 flex items-center justify-center text-white font-semibold select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: style.gradient,
        fontSize: Math.round(size * 0.42),
        letterSpacing: "0.02em",
        boxShadow:
          "inset 0 -8px 16px rgb(0 0 0 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.2)",
      }}
    >
      <span style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.15)" }}>
        {initial}
      </span>
      <div
        className="absolute flex items-center justify-center rounded-full bg-white/20"
        style={{
          right: Math.max(3, size * 0.07),
          bottom: Math.max(3, size * 0.07),
          width: size * 0.28,
          height: size * 0.28,
        }}
      >
        <Icon
          style={{ width: size * 0.18, height: size * 0.18 }}
          strokeWidth={2}
        />
      </div>
      {lost && (
        <span
          className="absolute -top-1 -right-1 size-4 rounded-full bg-rose border-2 border-background animate-pulse-rose"
          aria-hidden
        />
      )}
    </div>
  );
}
