import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { cn } from "../../lib/cn";

type BadgeTone =
  | "primary"
  | "accent"
  | "rose"
  | "amber"
  | "emerald"
  | "blue"
  | "neutral"
  | "gold";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
}

const toneStyles: Record<BadgeTone, { container: string; text: string; iconColor: string }> = {
  primary: { container: "bg-primary/10 border-primary/25", text: "text-primary", iconColor: "#6d28d9" },
  accent: { container: "bg-accent/10 border-accent/25", text: "text-accent", iconColor: "#0891b2" },
  rose: { container: "bg-rose/10 border-rose/25", text: "text-rose", iconColor: "#e11d48" },
  amber: { container: "bg-amber/15 border-amber/30", text: "text-amber", iconColor: "#b45309" },
  emerald: { container: "bg-emerald/10 border-emerald/25", text: "text-emerald", iconColor: "#047857" },
  blue: { container: "bg-blue/10 border-blue/25", text: "text-blue", iconColor: "#3b82f6" },
  neutral: { container: "bg-surface-2 border-border", text: "text-muted", iconColor: "#57534e" },
  gold: { container: "bg-amber border-amber", text: "text-white", iconColor: "#ffffff" },
};

export function Badge({ label, tone = "neutral", icon: Icon }: BadgeProps) {
  const styles = toneStyles[tone];
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 rounded-md border px-2 py-0.5",
        styles.container,
      )}
    >
      {Icon && <Icon size={12} color={styles.iconColor} />}
      <Text className={cn("text-[11px] font-medium", styles.text)}>{label}</Text>
    </View>
  );
}
