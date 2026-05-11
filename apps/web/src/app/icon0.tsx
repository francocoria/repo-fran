import { ImageResponse } from "next/og";

// PWA icon — 192x192
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #5eead4 0%, #06b6d4 60%, #0891b2 100%)",
        }}
      >
        <svg
          width="130"
          height="130"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4.66a2.5 2.5 0 1 1-3.32 2.36 2.5 2.5 0 0 1 3.32-2.36Z" />
          <path d="M16.32 4.66a2.5 2.5 0 1 1 3.32 2.36 2.5 2.5 0 0 1-3.32-2.36Z" />
          <path d="M5.66 10.5a2.5 2.5 0 1 1 3.32 2.36 2.5 2.5 0 0 1-3.32-2.36Z" />
          <path d="M18.34 10.5a2.5 2.5 0 1 1 3.32 2.36 2.5 2.5 0 0 1-3.32-2.36Z" />
          <path d="M16 16.74a4.5 4.5 0 0 0-8 0c0 2.5 2 5 4 5s4-2.5 4-5Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
