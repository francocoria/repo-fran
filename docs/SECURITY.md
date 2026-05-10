# SECURITY.md — Modelo de seguridad de pet-app

> La app maneja datos sensibles (médicos veterinarios, datos personales, fotos).
> Esta es la línea base de seguridad. **Cualquier cambio que la debilite requiere discusión explícita.**

---

## 1. Modelo de amenazas — qué nos preocupa

| Amenaza | Mitigación principal |
|---|---|
| Otro dueño accede a mis mascotas | RLS en `animals` + helpers `owner_has_animal_access()` |
| Vet sin permiso accede al historial | RLS chequea `vet_access.status='approved'` |
| Vet ve `private_notes` de otro vet | Filtrado en Server Action — no devolver columna si `vet_id != current_vet_id()` |
| Vet free supera el cap de 5 | Check server-side en `checkPatientCap()` antes de cada `INSERT` en `vet_access` |
| Acceso al panel admin sin ser admin | `is_admin()` en RLS + middleware en `/admin/**` |
| Contenido malicioso en notas (XSS) | React escape por default + sanitizar al renderizar contenido inseguro |
| Path traversal en uploads | `sanitizeFilename()` antes de guardar; nombres random en Storage |
| Tipos de archivo no esperados | `validatePhoto`/`validateDocument` cliente Y servidor |
| Slug de "se perdió" adivinable | nanoid 10 chars con alfabeto seguro (~8.7e14 combinaciones) |
| Service role key filtrada al cliente | NUNCA en `NEXT_PUBLIC_*`. Solo en Server Actions/API routes |
| CSRF en mutaciones | Server Actions de Next.js firman las requests por default |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| MITM | HSTS preload 2 años + HTTPS forzado por Vercel |
| Brute force en login | Rate limit con Upstash (V2) + magic link sin password reduce superficie |
| Datos sensibles en logs | No loguear contenido de medical_records ni PII |
| Backup robado | Supabase encrypta at-rest. No bajamos backups a local. |

---

## 2. Capas de defensa

### Capa 1 — Network (Vercel)
- HTTPS obligatorio
- HSTS preload por 2 años (`next.config.mjs`)
- Headers de seguridad completos: CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy

### Capa 2 — Aplicación (Next.js middleware)
- Middleware bloquea rutas `/app/**`, `/vet/**`, `/admin/**` sin sesión válida
- Falla cerrada: si faltan env vars de Supabase, redirige a `/login`

### Capa 3 — Validación de input (Zod)
- TODO input externo (forms, params, body) pasa por un schema Zod
- Schemas centralizados en `packages/lib/src/validators/`
- Server Actions y API routes hacen `.parse()` antes de tocar DB

### Capa 4 — Autenticación (Supabase Auth)
- Magic link por default (sin password = sin password reuse)
- Si se habilita password: mínimo 8 chars, validación en `passwordSchema`
- Sesiones via cookie httpOnly + secure
- Email verification obligatorio antes de crear `OwnerProfile`/`VetProfile`

### Capa 5 — Autorización de aplicación
- Cada Server Action verifica:
  1. `auth.uid()` no es null
  2. El usuario tiene el role correcto (`current_owner_id()` o `current_vet_id()`)
  3. El recurso le pertenece (vía RLS o check explícito)
- Para vets free: check de `checkPatientCap()` antes de aprobar acceso

### Capa 6 — Row Level Security (Postgres)
- **TODA** tabla tiene RLS habilitada (ver `packages/db/prisma/rls.sql`)
- Deny by default (sin policy = sin acceso para anon)
- Policies usan helpers SECURITY DEFINER que escapan recursión
- Lecturas y escrituras tienen policies separadas

### Capa 7 — Storage (Supabase)
- Buckets privados por default
- Solo `avatars`, `animal-photos` son públicos (URLs no adivinables)
- `licenses` (matrículas) y `documents` (estudios médicos) son **privados**
- Acceso vía signed URLs con TTL corto (15 min)
- Validación de Content-Type y tamaño server-side

### Capa 8 — Auditoría
- Tabla `audit_log` registra acciones sensibles:
  - Aprobar/revocar acceso de vet
  - Cambiar plan de vet (admin)
  - Eliminar animal
  - Verificar matrícula
- Solo admins leen `audit_log`

---

## 3. Notas privadas del vet — caso especial

`medical_records.private_notes` debe ser invisible para todos excepto el vet que la escribió.

**Postgres RLS no filtra columnas individuales.** Por eso la regla es:

✅ **Patrón correcto (Server Action):**
```ts
const records = await prisma.medicalRecord.findMany({
  where: { animalId },
  select: {
    id: true,
    visitDate: true,
    diagnosis: true,
    publicNotes: true,
    // private_notes solo si current vet es el autor
    privateNotes: currentVetId ? undefined : false, // pseudocódigo
  },
});
```

✅ **Mejor patrón (separar query):**
```ts
// Para owner / otros vets
const publicData = await prisma.medicalRecord.findMany({
  where: { animalId },
  omit: { privateNotes: true },
});

// Para el vet autor (en su propia vista de pacientes)
const myData = await prisma.medicalRecord.findMany({
  where: { animalId, vetId: currentVetId },
});
```

❌ **Patrón incorrecto:**
```ts
// NUNCA enviar el record completo al cliente sin filtrar
const records = await prisma.medicalRecord.findMany({ where: { animalId } });
return records; // ← expone private_notes
```

---

## 4. Checklist al agregar features

Antes de hacer merge de cualquier feature nueva:

- [ ] ¿La nueva tabla tiene RLS habilitada?
- [ ] ¿Hay policies SELECT/INSERT/UPDATE/DELETE explícitas?
- [ ] ¿Los inputs externos pasan por un Zod schema?
- [ ] ¿Las Server Actions verifican `auth.uid()` antes de operar?
- [ ] ¿Si el feature limita por plan, se hace check server-side (no solo UI)?
- [ ] ¿Las URLs públicas usan slugs no adivinables (no IDs incrementales)?
- [ ] ¿Los archivos subidos validan tipo y tamaño en server?
- [ ] ¿Los archivos privados se sirven via signed URLs con TTL?
- [ ] ¿La operación sensible queda registrada en `audit_log`?
- [ ] ¿Los logs NO contienen PII ni contenido médico?
- [ ] ¿La feature funciona aunque el cliente desactive JS? (graceful degradation crítica para auth)

---

## 5. Manejo de secrets

| Secret | Dónde vive | Quién lo ve |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (server-only) | Server actions/API routes |
| `RESEND_API_KEY` | Vercel env (server-only) | Server actions |
| `GOOGLE_PLACES_API_KEY` | Vercel env (server-only) | API routes (proxy) — NO cliente |
| `DATABASE_URL`, `DIRECT_URL` | Vercel env (server-only) | Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente OK | Necesario para Supabase JS |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente OK | RLS hace la seguridad real |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Cliente OK | Restringir por dominio en Mapbox |

**Nunca commitear `.env`, `.env.local`, ni archivos con secretos.** Ya está en `.gitignore`.

**Rotación:** si un secret se filtra, rotarlo inmediatamente:
- Supabase: regenerar service_role key en dashboard
- Resend: revocar API key
- Google: regenerar key + invalidar la anterior

---

## 6. Privacidad y compliance

- **Datos personales** (nombre, teléfono, dirección): solo se piden los necesarios, opcionales cuando se pueda.
- **Datos médicos**: tratados con la misma seriedad que datos médicos humanos. Acceso restringido por RLS.
- **Derecho de exportación:** habrá endpoint que exporta todos los datos del usuario (V2).
- **Derecho al borrado:** habrá endpoint que borra cuenta y mascotas (V2). Para preservar integridad clínica, los `medical_records` se anonimizan en lugar de borrarse físicamente.
- **Cookies:** solo cookies de sesión necesarias (Supabase Auth). No analytics tracking de terceros sin consentimiento.

---

## 7. Reportar vulnerabilidades

Por ahora interno. Cuando haya producto en producción: configurar `security@petapp.example.com`.

---

## 8. Pendientes de seguridad para el roadmap

- [ ] Rate limiting con Upstash en `/auth/*` y `/api/*` (V2)
- [ ] CAPTCHA en signup (V2 si vemos abuso)
- [ ] 2FA para admins (V2)
- [ ] Logs de acceso a animal (quién vio cuándo) — tabla `audit_log` lista
- [ ] Penetration test antes de marketing público
- [ ] Política de privacidad y T&C revisados por abogado
