import { Image, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Dog, Cat, Bird, Rabbit, Fish, PawPrint } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

interface PetAvatarProps {
  name: string;
  species: string;
  photoUrl?: string | null;
  size?: number;
  radius?: number;
  lost?: boolean;
}

interface SpeciesStyle {
  colors: [string, string];
  icon: LucideIcon;
}

const SPECIES_STYLES: Record<string, SpeciesStyle> = {
  dog: { colors: ["#06b6d4", "#0891b2"], icon: Dog },
  cat: { colors: ["#0d9488", "#14b8a6"], icon: Cat },
  bird: { colors: ["#f59e0b", "#fb923c"], icon: Bird },
  rabbit: { colors: ["#a78bfa", "#8b5cf6"], icon: Rabbit },
  fish: { colors: ["#38bdf8", "#0ea5e9"], icon: Fish },
  rodent: { colors: ["#fb7185", "#f43f5e"], icon: PawPrint },
  reptile: { colors: ["#84cc16", "#65a30d"], icon: PawPrint },
  exotic: { colors: ["#c084fc", "#a855f7"], icon: PawPrint },
  other: { colors: ["#64748b", "#475569"], icon: PawPrint },
};

export function PetAvatar({
  name,
  species,
  photoUrl,
  size = 56,
  radius,
  lost = false,
}: PetAvatarProps) {
  const style = SPECIES_STYLES[species] ?? SPECIES_STYLES.other;
  const Icon = style.icon;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const r = radius ?? Math.round(size * 0.22);
  const iconSize = Math.round(size * 0.18);

  if (photoUrl) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: photoUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        {lost && <LostDot size={size} />}
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={style.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: size * 0.42,
            fontWeight: "600",
            textShadowColor: "rgba(0,0,0,0.15)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {initial}
        </Text>
        <View
          style={{
            position: "absolute",
            right: Math.max(3, size * 0.07),
            bottom: Math.max(3, size * 0.07),
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            backgroundColor: "rgba(255,255,255,0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={iconSize} color="#fff" strokeWidth={2} />
        </View>
      </LinearGradient>
      {lost && <LostDot size={size} />}
    </View>
  );
}

function LostDot({ size }: { size: number }) {
  const dotSize = Math.max(12, size * 0.16);
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -4,
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: "#e11d48",
        borderWidth: 2,
        borderColor: "#fafaf9",
      }}
    />
  );
}
