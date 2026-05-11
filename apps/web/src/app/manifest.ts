import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PetApp — Centro de salud para mascotas",
    short_name: "PetApp",
    description:
      "Vacunas, peso, alergias e historial médico de tu mascota en un solo lugar. Compartí con tu veterinario vía QR.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: "#7c3aed",
    categories: ["health", "lifestyle", "utilities"],
    lang: "es-AR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon0",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon0",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon1",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
