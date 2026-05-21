import * as React from "react";
import { cn } from "@pet-app/lib/client";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  sublabel?: React.ReactNode;
  /** 0-100 — shows progress bar at bottom */
  progress?: number;
  progressTone?: "primary" | "amber" | "rose" | "emerald" | "accent";
  /** color of icon */
  accent?: "primary" | "accent" | "amber" | "rose" | "emerald" | "muted";
  className?: string;
}

const ACCENT_MAP: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "text-primary",
  accent: "text-accent",
  amber: "text-amber",
  rose: "text-rose",
  emerald: "text-emerald",
  muted: "text-muted-foreground",
};

const PROGRESS_MAP: Record<NonNullable<StatCardProps["progressTone"]>, string> =
  {
    primary: "bg-primary",
    accent: "bg-accent",
    amber: "bg-amber",
    rose: "bg-rose",
    emerald: "bg-emerald",
  };

export function StatCard({
  label,
  value,
  icon: Icon,
  sublabel,
  progress,
  progressTone = "primary",
  accent = "muted",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card/75 dark:bg-card/50 backdrop-blur-md p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-border/80",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
            {label}
          </p>
          <p className="mt-1.5 font-mono text-[28px] font-semibold leading-none">
            {value}
          </p>
          {sublabel && (
            <p className="mt-1.5 text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
        {Icon && (
          <Icon className={cn("size-5 shrink-0", ACCENT_MAP[accent])} />
        )}
      </div>
      {progress != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              PROGRESS_MAP[progressTone],
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
