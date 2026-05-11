import * as React from "react";
import { cn } from "@pet-app/lib/client";
import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

type BannerTone = "info" | "rose" | "amber" | "emerald" | "soft";

interface BannerProps {
  tone?: BannerTone;
  title?: React.ReactNode;
  icon?: LucideIcon;
  dense?: boolean;
  className?: string;
  cta?: React.ReactNode;
  children?: React.ReactNode;
}

const TONE_STYLES: Record<
  BannerTone,
  { container: string; iconColor: string; defaultIcon: LucideIcon }
> = {
  info: {
    container: "border-blue/25 bg-blue/5",
    iconColor: "text-blue",
    defaultIcon: Info,
  },
  rose: {
    container: "border-rose/30 bg-rose/5",
    iconColor: "text-rose",
    defaultIcon: AlertTriangle,
  },
  amber: {
    container: "border-amber/30 bg-amber/10 dark:bg-amber/15",
    iconColor: "text-amber-dark dark:text-amber",
    defaultIcon: AlertCircle,
  },
  emerald: {
    container: "border-emerald/30 bg-emerald/5",
    iconColor: "text-emerald",
    defaultIcon: CheckCircle2,
  },
  soft: {
    container: "border-border bg-surface-2",
    iconColor: "text-muted-foreground",
    defaultIcon: Info,
  },
};

export function Banner({
  tone = "info",
  title,
  icon,
  dense = false,
  className,
  cta,
  children,
}: BannerProps) {
  const style = TONE_STYLES[tone];
  const IconEl = icon ?? style.defaultIcon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border",
        dense ? "px-3 py-2.5" : "px-4 py-3.5",
        style.container,
        className,
      )}
    >
      <IconEl
        className={cn(
          "shrink-0 mt-px",
          dense ? "size-4" : "size-[18px]",
          style.iconColor,
        )}
        strokeWidth={2}
      />
      <div className="flex-1 min-w-0">
        {title && (
          <div
            className={cn(
              "font-semibold text-foreground",
              dense ? "text-[13px]" : "text-sm",
            )}
          >
            {title}
          </div>
        )}
        {children && (
          <div
            className={cn(
              "text-muted-foreground",
              dense ? "text-xs" : "text-[13px]",
              title ? "mt-0.5" : "",
            )}
          >
            {children}
          </div>
        )}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  );
}
