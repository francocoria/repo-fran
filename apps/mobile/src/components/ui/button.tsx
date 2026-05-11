import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { cn } from "../../lib/cn";
import type { LucideIcon } from "lucide-react-native";

type ButtonVariant =
  | "primary"
  | "accent"
  | "outline"
  | "ghost"
  | "rose"
  | "whatsapp"
  | "dark";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const variantBg: Record<ButtonVariant, string> = {
  primary: "bg-primary active:bg-primary-600",
  accent: "bg-accent active:bg-accent-600",
  outline: "bg-transparent border border-border-strong active:bg-surface-2",
  ghost: "bg-transparent active:bg-surface-2",
  rose: "bg-rose active:opacity-90",
  whatsapp: "bg-whatsapp active:opacity-90",
  dark: "bg-foreground active:opacity-90",
};

const variantText: Record<ButtonVariant, string> = {
  primary: "text-white",
  accent: "text-white",
  outline: "text-foreground",
  ghost: "text-foreground",
  rose: "text-white",
  whatsapp: "text-white",
  dark: "text-background",
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; icon: number }> = {
  sm: { container: "h-9 px-3", text: "text-[13px]", icon: 14 },
  md: { container: "h-11 px-4", text: "text-[15px]", icon: 16 },
  lg: { container: "h-12 px-5", text: "text-[16px]", icon: 18 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sz = sizeStyles[size];
  const iconColor = variant === "outline" || variant === "ghost" ? "#0c0a09" : "#ffffff";

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={cn(
        "flex-row items-center justify-center rounded-lg",
        sz.container,
        variantBg[variant],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50" : "",
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : Icon ? (
        <View className="mr-2">
          <Icon size={sz.icon} color={iconColor} />
        </View>
      ) : null}
      <Text className={cn("font-medium", sz.text, variantText[variant])}>
        {label}
      </Text>
      {IconRight && !loading ? (
        <View className="ml-2">
          <IconRight size={sz.icon} color={iconColor} />
        </View>
      ) : null}
    </Pressable>
  );
}
