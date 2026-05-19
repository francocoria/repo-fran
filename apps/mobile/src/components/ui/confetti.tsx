import { useEffect, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#e11d48", "#10b981", "#3b82f6"];
const COUNT = 46;
const DURATION = 2800;

interface Particle {
  x0: number;
  drift: number;
  w: number;
  h: number;
  color: string;
  spins: number;
  delay: number;
}

function makeParticles(width: number): Particle[] {
  return Array.from({ length: COUNT }, () => ({
    x0: Math.random() * width,
    drift: (Math.random() - 0.5) * 140,
    w: 6 + Math.random() * 7,
    h: 8 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#7c3aed",
    spins: (Math.random() - 0.5) * 6,
    delay: Math.random() * 0.22,
  }));
}

/** Lluvia de confetti — celebración del paso final del onboarding. */
export function Confetti({ active }: { active: boolean }) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const particles = useMemo(() => makeParticles(width), [width]);

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: DURATION,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [active, progress]);

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {particles.map((p, i) => (
        <Piece key={i} p={p} progress={progress} height={height} />
      ))}
    </View>
  );
}

function Piece({
  p,
  progress,
  height,
}: {
  p: Particle;
  progress: SharedValue<number>;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const t = Math.min(
      1,
      Math.max(0, (progress.value - p.delay) / (1 - p.delay)),
    );
    return {
      transform: [
        { translateY: -40 + t * (height + 80) },
        { translateX: t * p.drift },
        { rotate: `${t * p.spins * 360}deg` },
      ],
      opacity: t < 0.85 ? 1 : Math.max(0, 1 - (t - 0.85) / 0.15),
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: p.x0,
          top: 0,
          width: p.w,
          height: p.h,
          borderRadius: 2,
          backgroundColor: p.color,
        },
        style,
      ]}
    />
  );
}
