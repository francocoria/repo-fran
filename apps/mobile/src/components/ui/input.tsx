import { TextInput, View, Text } from "react-native";
import type { TextInputProps } from "react-native";
import { cn } from "../../lib/cn";

interface InputProps extends Omit<TextInputProps, "className"> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function Input({ label, hint, error, required, ...rest }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-[13px] font-medium text-foreground">
          {label}
          {required && <Text className="text-rose"> *</Text>}
        </Text>
      )}
      <TextInput
        className={cn(
          "h-11 rounded-lg border bg-surface px-3 text-[15px] text-foreground",
          error ? "border-rose" : "border-border",
        )}
        placeholderTextColor="#a8a29e"
        {...rest}
      />
      {error ? (
        <Text className="text-xs text-rose">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-subtle">{hint}</Text>
      ) : null}
    </View>
  );
}
