import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Card } from "./card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Color del ícono. */
  accent?: string;
  sublabel?: string;
  /** 0–100 — si se pasa, muestra una barra de progreso. */
  progress?: number;
  progressColor?: string;
}

/** Tarjeta de métrica: label en mayúsculas, valor grande, ícono y progreso. */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "#78716c",
  sublabel,
  progress,
  progressColor = "#7c3aed",
}: StatCardProps) {
  return (
    <Card className="flex-1 p-3.5">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <Text className="text-[10.5px] font-semibold uppercase tracking-wider text-subtle">
            {label}
          </Text>
          <Text className="mt-1.5 font-mono text-[24px] font-semibold leading-none text-foreground">
            {value}
          </Text>
          {sublabel ? (
            <Text className="mt-1.5 text-[12px] text-muted">{sublabel}</Text>
          ) : null}
        </View>
        {Icon ? <Icon size={18} color={accent} /> : null}
      </View>
      {progress != null ? (
        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, progress))}%`,
              backgroundColor: progressColor,
            }}
          />
        </View>
      ) : null}
    </Card>
  );
}
