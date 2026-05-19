import { Text, View } from "react-native";
import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { cn } from "../../lib/cn";

type BannerTone = "info" | "rose" | "amber" | "emerald" | "soft";

const TONES: Record<
  BannerTone,
  { box: string; icon: string; defaultIcon: LucideIcon }
> = {
  info: { box: "bg-blue/5 border-blue/25", icon: "#3b82f6", defaultIcon: Info },
  rose: {
    box: "bg-rose/5 border-rose/30",
    icon: "#e11d48",
    defaultIcon: AlertTriangle,
  },
  amber: {
    box: "bg-amber/10 border-amber/30",
    icon: "#b45309",
    defaultIcon: AlertCircle,
  },
  emerald: {
    box: "bg-emerald/5 border-emerald/30",
    icon: "#047857",
    defaultIcon: CheckCircle2,
  },
  soft: {
    box: "bg-surface-2 border-border",
    icon: "#57534e",
    defaultIcon: Info,
  },
};

interface BannerProps {
  tone?: BannerTone;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  dense?: boolean;
}

/** Aviso contextual con tono de color e ícono. */
export function Banner({
  tone = "info",
  title,
  description,
  icon,
  dense = false,
}: BannerProps) {
  const t = TONES[tone];
  const Icon = icon ?? t.defaultIcon;
  return (
    <View
      className={cn(
        "flex-row items-start gap-3 rounded-xl border",
        dense ? "p-2.5" : "p-3.5",
        t.box,
      )}
    >
      <Icon size={dense ? 16 : 18} color={t.icon} strokeWidth={2} />
      <View className="flex-1">
        {title ? (
          <Text
            className={cn(
              "font-semibold text-foreground",
              dense ? "text-[13px]" : "text-[14px]",
            )}
          >
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text
            className={cn(
              "text-muted",
              dense ? "text-[12.5px]" : "text-[13px]",
              title ? "mt-0.5" : "",
            )}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
