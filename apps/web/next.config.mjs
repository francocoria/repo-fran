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
  // CSP — el script-src 'unsafe-inline' es necesario por Next.js dev; tightenar en prod
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.googleapis.com https://*.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com https://maps.googleapis.com https://maps.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://api.resend.com",
      "frame-src 'self' https://*.supabase.co",
      "media-src 'self' blob: https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
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
    ],
  },
  experimental: {
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: "10mb", // para subida de fotos / PDFs
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
