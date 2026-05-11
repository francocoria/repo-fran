import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@pet-app/lib/client";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-border bg-surface-2 text-muted-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        outline: "text-foreground border-border",
        // Tones (color-tinted, soft)
        primary:
          "bg-primary/10 text-primary-600 border-primary/25 dark:text-primary",
        accent:
          "bg-accent/10 text-accent-600 border-accent/25 dark:text-accent",
        rose:
          "bg-rose/10 text-rose border-rose/25",
        amber:
          "bg-amber/15 text-amber-dark border-amber/30 dark:text-amber",
        emerald:
          "bg-emerald/10 text-emerald border-emerald/25",
        blue:
          "bg-blue/10 text-blue border-blue/25",
        dark:
          "bg-foreground text-background border-foreground",
        gold:
          "border-transparent bg-gradient-to-br from-amber to-amber-dark text-white shadow-sm",
      },
      size: {
        default: "text-[11px] px-2 py-0.5",
        sm: "text-[11px] px-2 py-0.5",
        xs: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
