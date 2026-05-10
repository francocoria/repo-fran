# PROJECT_STATE.md — Estado del proyecto pet-app

**Última actualización:** 2026-05-02
**Fase actual:** Semana 2 — Auth + perfiles (completada)
**Estado:** Auth con magic link, signup dueño/vet, layouts protegidos, landing premium. Falta conectar Supabase real.

---

## Qué se decidió

### Producto
- **Nombre:** PetApp (provisorio)
- **Tipo:** Webapp (Next.js) — futuro mobile nativo (Expo) en V3
- **Audiencia:** Dueños de mascotas + veterinarios
- **Idioma:** Solo español (es-AR) en MVP
- **Especies:** Todas, con vacunación inteligente solo perro/gato en MVP
- **Diseño:** Minimalista, profesional, con animaciones, dark mode, 100% responsive

### Modelo de negocio
- **Free:** Para dueños siempre. Vets free hasta 5 pacientes activos.
- **Premium vet:** USD 10/mes o USD 100/año (10 meses x 12 — ahorra USD 20).
- **Trial:** 30 días premium gratis al registrarse como vet.
- **Pagos:** Manuales en MVP (gestionados por el founder vía panel admin). Mercado Pago en V2.

### Vínculo dueño ↔ vet
- QR del animal → vet escanea → solicita acceso → dueño aprueba.
- Acceso permanente hasta que el dueño revoque.
- Vet ve todo el historial (incluido lo escrito por otros vets).
- Dueño NO puede editar lo que escribió un vet.
- Vet tiene `private_notes` que el dueño NO ve.

### Verificación de matrícula
- Solo si el vet la solicita (modelo "opt-in").
- Validación manual desde panel admin.
- Marca "verificado" visible públicamente.

### Co-dueños
- En MVP. Permiso `full` o `limited`.
- Solo el dueño primario los gestiona.

### Modo "se perdió"
- En MVP. Genera URL pública `/lost/[slug]` con datos y QR.
- Slug random no adivinable (10 chars, alfabeto seguro).

### Directorio veterinarias
- Pasivo en MVP — Google Places API + cache local.
- Activo (vets reclaman ficha) en V2.

### Recordatorios
- NO en MVP. V2 con Resend (email) y luego WhatsApp.

---

## Stack confirmado

| Capa | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 RC |
| Lenguaje | TypeScript 5.6 strict |
| Estilos | Tailwind 3.4 + shadcn/ui |
| Animaciones | Framer Motion (UI) + GSAP/Lenis (landing) |
| Base de datos | Supabase Postgres |
| ORM | Prisma 5.22 |
| Auth | Supabase Auth (magic link + Google OAuth) |
| Storage | Supabase Storage |
| Forms | React Hook Form + Zod |
| Data | TanStack Query 5 + Server Components |
| Email | Resend + React Email |
| QR | `qrcode` (gen) + `html5-qrcode` (scan) |
| PDF | `@react-pdf/renderer` |
| Iconos | Lucide React |
| Tipografía | Geist Sans + Geist Mono |
| Hosting | Vercel |
| Monorepo | Turborepo + pnpm workspaces |

---

## Estructura del repo

```
pet-app/
├── apps/
│   └── web/                    # Next.js 15 — webapp principal
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx           # Landing premium completa
│       │   │   ├── (auth)/            # Route group: auth
│       │   │   │   ├── layout.tsx     # Split-screen auth layout
│       │   │   │   ├── actions.ts     # ★ Server actions de auth
│       │   │   │   ├── login/page.tsx
│       │   │   │   ├── signup/page.tsx
│       │   │   │   ├── signup/vet/page.tsx
│       │   │   │   └── onboarding/    # Selector + owner + vet
│       │   │   ├── auth/callback/route.ts  # Auth callback handler
│       │   │   ├── (owner)/           # Route group: dueños
│       │   │   │   ├── layout.tsx     # Protected layout owner
│       │   │   │   └── app/           # Dashboard + settings
│       │   │   ├── (vet)/             # Route group: vets
│       │   │   │   ├── layout.tsx     # Protected layout vet
│       │   │   │   └── vet/           # Dashboard vet
│       │   │   └── (admin)/           # Route group: admin
│       │   │       ├── layout.tsx     # Protected layout admin
│       │   │       └── admin/         # Dashboard admin
│       │   ├── components/
│       │   │   ├── app-header.tsx      # Header con nav, theme, logout
│       │   │   └── providers/         # Theme + Query providers
│       │   ├── lib/auth.ts            # ★ Auth helpers server-side
│       │   ├── env.ts
│       │   └── middleware.ts
│       ├── next.config.mjs
│       ├── tailwind.config.ts
│       └── package.json
├── packages/
│   ├── db/                     # Prisma + tipos compartidos
│   ├── lib/                    # Lógica compartida
│   │   └── src/
│   │       ├── index.ts        # Barrel (incluye server)
│   │       ├── client.ts       # ★ Barrel client-safe (sin next/headers)
│   │       ├── supabase/       # client / server / admin clients
│   │       ├── validators/     # Zod schemas
│   │       ├── utils/          # cn, format, slug, files, subscription
│   │       └── constants/
│   ├── ui/                     # Componentes shadcn (importan lib/client)
│   └── emails/                 # React Email templates (V2)
├── docs/
├── scripts/
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## Lo que YA está hecho ✓

### Semana 1 — Setup
- [x] Estructura del monorepo con Turborepo + pnpm workspaces
- [x] `pnpm install` ejecutado con éxito
- [x] `apps/web` con Next.js 15, TypeScript, Tailwind, providers
- [x] Headers de seguridad completos (CSP, HSTS, X-Frame, etc.) en `next.config.mjs`
- [x] Validación de env vars con Zod (`apps/web/src/env.ts`)
- [x] Middleware de auth y protección de rutas
- [x] Tema visual: paleta menta + naranja, dark mode, Geist
- [x] **Schema Prisma completo** (28 tablas, todos los enums, FKs e índices)
- [x] **RLS policies completas** (`packages/db/prisma/rls.sql`) — deny by default
- [x] Helpers SQL: `current_owner_id()`, `current_vet_id()`, `is_admin()`, etc.
- [x] Seed inicial con templates de consulta del sistema
- [x] Clientes Supabase: browser, server (con cookies), admin (service role)
- [x] Validators Zod para auth, animal, health, vet
- [x] Utils: `cn`, format de fechas/edad, slug seguro, validación de archivos
- [x] Lógica de subscription centralizada
- [x] Constantes: especies, sexo, alergias, calendarios de vacunación
- [x] Componentes UI base: Button, Input, Label, Card, Badge
- [x] Fix: `@pet-app/lib/client` entrypoint para evitar next/headers en client components

### Semana 2 — Auth + perfiles
- [x] **Landing premium** completa con hero, features grid, vet CTA, pricing, footer
- [x] **Auth layout** split-screen con branding (desktop) / compact (mobile)
- [x] **Login page** con magic link + confirmación visual
- [x] **Signup dueño** con nombre, email, teléfono, términos
- [x] **Signup vet** con campos profesionales + badge "30 días premium"
- [x] **Auth callback** route handler (exchange code + redirect inteligente)
- [x] **Server actions de auth**: loginWithMagicLink, loginWithGoogle, signupOwner, signupVet, createOwnerProfile, createVetProfile (con trial 30 días), logout
- [x] **Admin bootstrap** — primer email se vuelve superadmin
- [x] **Onboarding** — selector de tipo de cuenta + páginas de confirmación
- [x] **Layout protegido owner** (`(owner)/layout.tsx`) — verifica perfil
- [x] **Layout protegido vet** (`(vet)/layout.tsx`) — verifica perfil
- [x] **Layout protegido admin** (`(admin)/layout.tsx`) — verifica admin_users
- [x] **App header** compartido con nav role-based, theme switcher, logout, mobile menu
- [x] **Dashboard owner** con empty state
- [x] **Dashboard vet** con quick actions
- [x] **Dashboard admin** placeholder
- [x] **Settings owner** con formulario de perfil
- [x] **Auth helpers** server-side (`apps/web/src/lib/auth.ts`)

## Lo que FALTA — Configuración Supabase

- [ ] Crear proyecto Supabase real → completar `.env.local`
- [ ] `pnpm db:push` → aplicar schema
- [ ] Aplicar `rls.sql` manualmente en Supabase SQL Editor
- [ ] `pnpm db:seed` → templates del sistema
- [ ] Crear buckets de Storage en Supabase
- [ ] Configurar Auth providers (Magic Link + Google)
- [ ] Crear proyecto en Vercel y configurar env vars
- [ ] Smoke test end-to-end: signup → login → dashboard

## Lo que FALTA — Semanas 2-8

Ver `docs/ROADMAP.md`.

---

## Cómo seguir si te estás quedando sin tokens / cambia la sesión

**Lee primero:** `docs/CONTINUE_HERE.md`. Tiene el siguiente paso concreto a hacer.

**Para entender el producto:** `docs/DECISIONS.md`.

**Para entender la seguridad:** `docs/SECURITY.md`.

**Para retomar la build:** este archivo y `docs/ROADMAP.md`.
