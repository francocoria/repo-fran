import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */

// Headers de seguridad — referencia: https://nextjs.org/docs/advanced-features/security-headers
const securityHeaders = [
  // Previene MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Bloquea iframe embedding (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Forzar HTTPS por 2 años + subdominios
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Solo enviar referrer mismo origen
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limita features del browser que pueden invocarse
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(self), interest-cohort=()",
  },
  // CSP se setea en el middleware (apps/web/src/middleware.ts) con nonce
  // dinámico per-request — eso permite quitar 'unsafe-inline' de scripts.
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    "@pet-app/db",
    "@pet-app/lib",
    "@pet-app/ui",
    "@pet-app/emails",
  ],
  // Prisma Client: no bundlear — cargarlo desde node_modules en runtime
  // para que los binarios .so.node del query engine sean encontrados.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Asegurar que Vercel incluya los archivos binarios y el schema en el trace
  outputFileTracingIncludes: {
    "/**/*": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*",
      "../../packages/db/prisma/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    typedRoutes: true,
    serverActions: {
      // 5mb cubre subida de fotos JPEG comprimidas + PDFs cortos.
      // Audit MEDIO-6: 10mb permitía abuse de memoria server-side.
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
