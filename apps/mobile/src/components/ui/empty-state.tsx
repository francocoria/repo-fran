import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaIcon?: LucideIcon;
}

/** Estado vacío ilustrado: ícono en chip, título, descripción y CTA opcional. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaIcon,
}: EmptyStateProps) {
  return (
    <View className="items-center gap-3 px-6 py-12">
      <View className="mb-1 size-16 items-center justify-center rounded-[18px] bg-surface-2">
        <Icon size={28} color="#78716c" strokeWidth={1.5} />
      </View>
      <Text className="text-center text-[17px] font-semibold text-foreground">
        {title}
      </Text>
      {description ? (
        <Text className="max-w-[320px] text-center text-[14px] text-muted">
          {description}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <View className="mt-2">
          <Button label={ctaLabel} onPress={onCta} icon={ctaIcon} />
        </View>
      ) : null}
    </View>
  );
}
