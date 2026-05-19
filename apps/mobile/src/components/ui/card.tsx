import { View } from "react-native";
import type { ViewProps } from "react-native";
import { cn } from "../../lib/cn";

interface CardProps extends ViewProps {
  className?: string;
  /** Quita la sombra suave (útil para tarjetas anidadas). */
  flat?: boolean;
}

/** Sombra suave estándar del design system (shadow-sm). */
export const cardShadow = {
  shadowColor: "#0c0a09",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
} as const;

export function Card({ className, children, style, flat, ...rest }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-[14px] border border-border bg-surface p-4",
        className,
      )}
      style={[flat ? null : cardShadow, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
