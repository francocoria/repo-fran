# pet-app

Plataforma de gestión de mascotas — centro de control para dueños + workspace para veterinarios.

> **Estado:** En desarrollo activo. MVP en construcción (Semana 1 de 8).
> **Si retomás el trabajo:** leer primero [`docs/CONTINUE_HERE.md`](docs/CONTINUE_HERE.md).

---

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui + Framer Motion + GSAP
- **Backend:** Supabase (Postgres + Auth + Storage)
- **ORM:** Prisma 5
- **Email:** Resend + React Email
- **Hosting:** Vercel
- **Monorepo:** Turborepo + pnpm

---

## Estructura

```
pet-app/
├── apps/web              # Next.js — webapp principal
├── packages/
│   ├── db                # Prisma schema + RLS policies
│   ├── lib               # Supabase clients + Zod validators + utils
│   ├── ui                # Componentes shadcn extendidos
│   └── emails            # Templates Resend
└── docs                  # Documentación viva
```

---

## Setup local (primera vez)

### 1. Requisitos

- Node.js 20+
- pnpm 9+
- Cuenta en Supabase
- Cuenta en Vercel
- Cuenta en Resend (para V2)

### 2. Instalar

```bash
pnpm install
```

### 3. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar credenciales (ver [`docs/CONTINUE_HERE.md`](docs/CONTINUE_HERE.md) paso 2)
3. Crear `apps/web/.env.local` desde `.env.example`

### 4. Aplicar schema

```bash
pnpm db:generate
pnpm db:push
```

### 5. Aplicar Row Level Security (CRÍTICO)

Copiar `packages/db/prisma/rls.sql` y ejecutar en **Supabase Dashboard → SQL Editor**.

Verificar:
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;
```

Deberían aparecer todas las tablas.

### 6. Seed

```bash
pnpm --filter @pet-app/db db:seed
```

### 7. Crear buckets de Storage

En Supabase Dashboard → Storage → New bucket:
- `avatars` (público)
- `animal-photos` (público)
- `documents` (privado)
- `prescriptions` (privado)
- `licenses` (privado, solo admin lee)

### 8. Correr local

```bash
pnpm dev
```

Abrir http://localhost:3000

---

## Comandos útiles

```bash
pnpm dev              # Dev server (todas las apps)
pnpm build            # Build de todo
pnpm lint             # Lint
pnpm type-check       # TS check sin emitir
pnpm db:generate      # Regenerar Prisma client
pnpm db:push          # Push del schema a Supabase (sin migration)
pnpm db:migrate       # Crear y aplicar migration
pnpm db:studio        # Abrir Prisma Studio (UI para la DB)
pnpm format           # Prettier
```

---

## Deploy a Vercel

1. Conectar repo a Vercel
2. **Root directory:** `pet-app/apps/web`
3. **Build command:** `cd ../.. && pnpm build --filter=@pet-app/web`
4. **Install command:** `cd ../.. && pnpm install`
5. Cargar todas las env vars de `.env.example` con valores reales
6. Deploy

---

## Documentación

- [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) — qué hay y qué falta
- [`docs/CONTINUE_HERE.md`](docs/CONTINUE_HERE.md) — siguiente paso concreto
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decisiones del producto con rationale
- [`docs/SECURITY.md`](docs/SECURITY.md) — modelo de amenazas y checklist
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — plan por semanas

---

## Convenciones

- **Idioma:** comentarios y UI strings en español. Identificadores en inglés.
- **Naming:** snake_case en DB, camelCase en TS, kebab-case en URLs.
- **Validación:** todo input externo pasa por un Zod schema (`packages/lib/src/validators/`).
- **Mutaciones:** Server Actions de Next.js. API routes solo para webhooks.
- **Seguridad:** RLS en todas las tablas. Nunca commitear `.env*`.
- **Sin mocks de DB en tests:** usar branch de Supabase para integration tests.

---

## Licencia

Privado, sin licencia abierta. © 2026.
