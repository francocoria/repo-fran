import Svg, { Circle, G } from "react-native-svg";

interface PawPatternProps {
  width: number;
  height: number;
  color?: string;
  opacity?: number;
  /** Separación entre huellas. */
  cell?: number;
}

/** Patrón decorativo de huellas — fondo sutil para avatares y heros. */
export function PawPattern({
  width,
  height,
  color = "#ffffff",
  opacity = 0.12,
  cell = 60,
}: PawPatternProps) {
  const cols = Math.ceil(width / cell) + 1;
  const rows = Math.ceil(height / cell) + 1;
  const paws = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cell + (r % 2) * (cell / 2);
      const y = r * cell;
      paws.push(<Paw key={`${r}-${c}`} x={x} y={y} color={color} />);
    }
  }
  return (
    <Svg
      width={width}
      height={height}
      opacity={opacity}
      style={{ position: "absolute", top: 0, left: 0 }}
      pointerEvents="none"
    >
      {paws}
    </Svg>
  );
}

function Paw({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Circle cx={x} cy={y + 6} r={5} fill={color} />
      <Circle cx={x - 7} cy={y - 4} r={2.6} fill={color} />
      <Circle cx={x - 2.5} cy={y - 8} r={2.6} fill={color} />
      <Circle cx={x + 2.5} cy={y - 8} r={2.6} fill={color} />
      <Circle cx={x + 7} cy={y - 4} r={2.6} fill={color} />
    </G>
  );
}
