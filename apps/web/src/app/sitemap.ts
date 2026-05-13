import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-friendly.fun";

/**
 * Sitemap estático con las rutas públicas (no autenticadas).
 * /lost/[slug] no se incluye porque son URLs efímeras de mascotas perdidas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; changeFrequency: "yearly" | "monthly" | "weekly"; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/login", changeFrequency: "yearly", priority: 0.6 },
    { path: "/signup", changeFrequency: "yearly", priority: 0.8 },
    { path: "/signup/vet", changeFrequency: "yearly", priority: 0.7 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
    { path: "/privacy/data-deletion", changeFrequency: "monthly", priority: 0.3 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${APP_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
