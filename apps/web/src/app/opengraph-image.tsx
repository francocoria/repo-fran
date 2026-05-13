import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PetApp — el centro de control de tu mascota";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Open Graph image dinámica para WhatsApp, Twitter/X, Facebook, LinkedIn.
 * Se genera en el edge con la fuente del sistema (sin font assets para
 * mantenerla rápida).
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "linear-gradient(135deg, #ede9fe 0%, #cffafe 50%, #fafaf9 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#7c3aed",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            🐾
          </div>
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#0c0a09",
              letterSpacing: "-0.02em",
            }}
          >
            PetApp
          </span>
        </div>

        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#0c0a09",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            margin: 0,
            maxWidth: 880,
          }}
        >
          El centro de control de la salud de tu mascota.
        </h1>

        <p
          style={{
            fontSize: 28,
            color: "#57534e",
            lineHeight: 1.4,
            marginTop: 28,
            maxWidth: 880,
          }}
        >
          Vacunas, peso, alergias, historial completo y QR para compartir con
          tu veterinario.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 48,
            fontSize: 22,
            color: "#7c3aed",
            fontWeight: 600,
          }}
        >
          pet-friendly.fun
        </div>
      </div>
    ),
    { ...size },
  );
}
