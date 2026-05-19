import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface HealthRingProps {
  size: number;
  stroke?: number;
  /** 0–100. */
  percent: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
}

/** Anillo de progreso circular — para el "Perfil de salud %". */
export function HealthRing({
  size,
  stroke = 4,
  percent,
  color = "#7c3aed",
  trackColor = "#f5f5f4",
  children,
}: HealthRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  const dash = (pct / 100) * circumference;
  const inset = stroke + 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View
        style={{
          position: "absolute",
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          borderRadius: 9999,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}
