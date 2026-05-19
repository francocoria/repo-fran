import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Contador opcional al lado del título (ej. cantidad de items). */
  count?: number;
  /** Acción a la derecha (ej. un botón "+"). */
  action?: ReactNode;
}

/** Encabezado de sección: ícono + título + contador + acción. */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  count,
  action,
}: SectionHeaderProps) {
  return (
    <View className="mb-3 flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        {Icon ? <Icon size={18} color="#7c3aed" /> : null}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-semibold text-foreground">
              {title}
            </Text>
            {count != null ? (
              <Text className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-subtle">
                {count}
              </Text>
            ) : null}
          </View>
          {subtitle ? (
            <Text className="mt-0.5 text-[12.5px] text-muted">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {action}
    </View>
  );
}
