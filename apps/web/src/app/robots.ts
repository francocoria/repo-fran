import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://pet-friendly.fun";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Las páginas autenticadas no deberían indexarse, igualmente
        // requieren login. /lost/* es público por diseño (modo perdido).
        disallow: ["/app/", "/vet/", "/admin/", "/api/", "/auth/", "/debug/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
