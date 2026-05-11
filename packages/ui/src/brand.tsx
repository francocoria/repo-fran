import * as React from "react";
import { cn } from "@pet-app/lib/client";
import { PawPrint } from "lucide-react";

interface BrandProps {
  /** "lg" 36px logo · "md" 32px · "sm" 28px */
  size?: "lg" | "md" | "sm";
  /** Hide the wordmark, show only the icon */
  iconOnly?: boolean;
  className?: string;
  /** Color override for the wordmark (when on dark hero etc) */
  invert?: boolean;
}

export function Brand({
  size = "md",
  iconOnly = false,
  className,
  invert = false,
}: BrandProps) {
  const dim = {
    lg: { box: 36, icon: 20, font: 22 },
    md: { box: 32, icon: 18, font: 18 },
    sm: { box: 28, icon: 16, font: 16 },
  }[size];

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="PetApp"
    >
      <div
        className="inline-flex shrink-0 items-center justify-center text-white"
        style={{
          width: dim.box,
          height: dim.box,
          borderRadius: dim.box * 0.28,
          background:
            "linear-gradient(135deg, hsl(168 76% 64%) 0%, hsl(189 94% 43%) 100%)",
          boxShadow: "inset 0 -4px 8px rgb(0 0 0 / 0.1)",
        }}
      >
        <PawPrint size={dim.icon} strokeWidth={2.2} />
      </div>
      {!iconOnly && (
        <span
          className={cn(
            "font-bold tracking-tight",
            invert ? "text-white" : "text-foreground",
          )}
          style={{ fontSize: dim.font, letterSpacing: "-0.01em" }}
        >
          Pet<span className={invert ? "text-white/80" : "text-primary"}>App</span>
        </span>
      )}
    </div>
  );
}
