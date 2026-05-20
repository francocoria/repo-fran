"use client";

import React from "react";

interface PawPatternProps {
  width: number;
  height: number;
  color?: string;
  opacity?: number;
  cell?: number;
}

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
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        opacity,
        pointerEvents: "none",
      }}
    >
      {paws}
    </svg>
  );
}

function Paw({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y + 6} r={5} fill={color} />
      <circle cx={x - 7} cy={y - 4} r={2.6} fill={color} />
      <circle cx={x - 2.5} cy={y - 8} r={2.6} fill={color} />
      <circle cx={x + 2.5} cy={y - 8} r={2.6} fill={color} />
      <circle cx={x + 7} cy={y - 4} r={2.6} fill={color} />
    </g>
  );
}
