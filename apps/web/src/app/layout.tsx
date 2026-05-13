import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeColorProvider } from "@/components/providers/theme-color-provider";
import { InstallPrompt } from "@/components/install-prompt";
import { Toaster } from "sonner";
import "./globals.css";

// Script inline para aplicar el color guardado ANTES de hidratar y evitar flash.
const THEME_COLOR_INIT_SCRIPT = `
(function(){
  try {
    var k = localStorage.getItem('petapp-theme-color') || 'violet';
    var P = {
      violet:  { p:'262 83% 58%', p6:'263 70% 50%', p5:'270 100% 95%' },
      cyan:    { p:'189 94% 43%', p6:'192 91% 36%', p5:'186 100% 94%' },
      emerald: { p:'160 84% 39%', p6:'161 94% 30%', p5:'152 81% 96%' },
      rose:    { p:'350 89% 60%', p6:'347 77% 50%', p5:'356 100% 95%' },
      amber:   { p:'32 95% 53%',  p6:'30 92% 45%',  p5:'33 100% 96%' },
      indigo:  { p:'239 84% 67%', p6:'243 75% 59%', p5:'226 100% 97%' },
      teal:    { p:'168 78% 41%', p6:'172 85% 32%', p5:'166 76% 97%' },
      pink:    { p:'330 81% 60%', p6:'333 71% 51%', p5:'327 73% 97%' }
    };
    var c = P[k] || P.violet;
    var r = document.documentElement.style;
    r.setProperty('--primary', c.p);
    r.setProperty('--primary-600', c.p6);
    r.setProperty('--primary-50', c.p5);
    r.setProperty('--ring', c.p);
  } catch(e) {}
})();
`;

function resolveAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv && URL.canParse(fromEnv)) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
const APP_URL = resolveAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PetApp — el centro de control de tu mascota",
    template: "%s · PetApp",
  },
  description:
    "Llevá la salud, vacunas, turnos e historial médico de tus animales en un solo lugar. Compartí con tu veterinario en segundos.",
  keywords: [
    "mascotas",
    "veterinario",
    "vacunas",
    "salud animal",
    "libreta sanitaria",
    "perros",
    "gatos",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: APP_URL,
    siteName: "PetApp",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_COLOR_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeColorProvider />
          <QueryProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
            <InstallPrompt />
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
