# CONTINUE_HERE.md — Punto de retoma

> Si vos sos otra IA o el founder volviendo: empezá leyendo esto.
> Última actualización: 2026-05-02

## Estado actual en una línea

Semana 1 completada + Semana 2 (Auth + perfiles) implementada. Falta conectar Supabase real para probar auth funcional.

## Siguiente acción concreta

**Paso 1 — Crear proyecto Supabase (si no se hizo):**
1. Ir a https://supabase.com → New project
2. Region: South America (São Paulo) o más cercana
3. Anotar:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (NO commitear)
   - Connection string (Connection pooling, mode = transaction) → `DATABASE_URL`
   - Connection string (direct) → `DIRECT_URL`

**Paso 2 — Configurar env locales:**
```bash
# Editar apps/web/.env.local con los valores reales de Supabase
```

**Paso 3 — Aplicar schema:**
```bash
cd pet-app
pnpm db:generate
pnpm db:push        # crea las tablas en Supabase
```

**Paso 4 — Aplicar RLS (CRÍTICO — sin esto la DB es insegura):**
1. Abrir `packages/db/prisma/rls.sql`
2. Copiar todo el contenido
3. Pegarlo en Supabase Dashboard → SQL Editor → Run
4. Verificar con: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;`

**Paso 5 — Seed:**
```bash
pnpm --filter @pet-app/db db:seed
```

**Paso 6 — Crear buckets de Storage:**
En Supabase Dashboard → Storage → New bucket:
- `avatars` (public)
- `animal-photos` (public)
- `documents` (private — RLS aplicará)
- `prescriptions` (private)
- `licenses` (private — para verificación de matrícula, max 5 MB)

**Paso 7 — Configurar Supabase Auth:**
1. Dashboard → Authentication → Providers
2. Habilitar Email (Magic Link) — ya viene habilitado
3. (Opcional) Habilitar Google OAuth — necesita credentials
4. URL Configuration → Site URL: `http://localhost:3000`
5. URL Configuration → Redirect URLs: `http://localhost:3000/auth/callback`

**Paso 8 — Probar local:**
```bash
pnpm dev
```
Visitar http://localhost:3000 — la landing renderiza.
Probar login con magic link — debe enviar email y redirigir post-login.

## Una vez terminado, pasar a Semana 3

Ver `docs/ROADMAP.md` → "Semana 3 — Animales (lado dueño)".

Próximas tareas concretas:
1. Dashboard `/app` con grid de mascotas real (consultar DB)
2. Wizard `/app/animals/new` (3 pasos: básico, físico, foto)
3. Perfil del animal `/app/animals/[id]` con tabs
4. Editar animal
5. Subir fotos (validación + Storage + signed URLs)
6. Tracking de peso con histórico
7. Co-owners management

## Archivos clave a leer al retomar

| Archivo | Para qué |
|---|---|
| `docs/PROJECT_STATE.md` | Visión general de qué se decidió y qué hay |
| `docs/DECISIONS.md` | Por qué se decidió cada cosa (rationale) |
| `docs/SECURITY.md` | Modelo de amenazas + checklist |
| `docs/ROADMAP.md` | Plan por semanas |
| `packages/db/prisma/schema.prisma` | Modelo de datos completo |
| `packages/db/prisma/rls.sql` | Reglas de seguridad de la DB |
| `apps/web/src/lib/auth.ts` | Helpers de auth (getUser, requireUser, roles) |
| `apps/web/src/app/(auth)/actions.ts` | Server actions de auth |
| `packages/lib/src/utils/subscription.ts` | Lógica de premium gating |

## Convenciones del repo

- **Idioma:** Comentarios en español. Strings de UI en español. Identificadores en inglés.
- **Naming:** snake_case en DB, camelCase en TypeScript, kebab-case en URLs y archivos UI.
- **Server Actions:** preferidas sobre API routes para mutaciones del usuario.
- **API routes:** solo para webhooks externos y casos donde Server Actions no sirvan.
- **Validación:** todo input pasa por Zod (en `packages/lib/src/validators/`).
- **RLS:** TODA tabla tiene RLS habilitada. Ver `rls.sql`.
- **Imports de lib:** UI components usan `@pet-app/lib/client` (client-safe). Server code usa `@pet-app/lib`.
- **No mockear DB en tests:** usar branch de Supabase para integration tests.
- **Nunca commitear `.env*`:** ya está en `.gitignore`.

## Si encontrás algo raro

- Mirá si hay un `TODO:` en el código relacionado.
- Las decisiones polémicas están documentadas en `docs/DECISIONS.md`. Si te pinta cambiar algo, primero leelo y consultá con el founder.
