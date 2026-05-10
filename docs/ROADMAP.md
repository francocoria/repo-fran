# ROADMAP.md — Plan por fases

## Fase MVP — 8 semanas

### Semana 1 — Setup ✅
- [x] Monorepo Turborepo + pnpm
- [x] Next.js 15 en apps/web con TypeScript, Tailwind, providers
- [x] Headers de seguridad + CSP
- [x] Schema Prisma completo
- [x] RLS policies completas
- [x] Clientes Supabase (browser, server, admin)
- [x] Validators Zod
- [x] Utils: format, slug, files, subscription gating
- [x] Componentes UI base (Button, Input, Card, Badge)
- [x] Documentación de continuidad
- [x] `pnpm install`
- [ ] Crear proyecto Supabase real
- [ ] Aplicar schema + RLS
- [ ] Crear buckets de Storage
- [ ] Deploy inicial a Vercel

### Semana 2 — Auth + perfiles ✅
- [x] Landing premium completa (hero, features, vet CTA, pricing, footer)
- [x] Página `/login` con magic link
- [x] Página `/signup` (dueño)
- [x] Página `/signup/vet` (vet) con campos profesionales
- [x] Server Action `signupOwner()` — crea `OwnerProfile`
- [x] Server Action `signupVet()` — crea `VetProfile` + `Subscription` (trial 30 días)
- [x] Server Action de bootstrap admin (primer email = admin)
- [x] `/auth/callback` route handler con redirect inteligente
- [x] Layouts protegidos: `(owner)/layout.tsx`, `(vet)/layout.tsx`, `(admin)/layout.tsx`
- [x] Página `/onboarding` — selector + confirmación owner/vet
- [x] Settings personales (perfil owner)
- [x] Logout via server action
- [x] Theme switcher en header
- [x] App header role-based con mobile menu

### Semana 3 — Animales (lado dueño) ✅
- [x] Dashboard `/app` con grid de mascotas (real DB query + co-owned)
- [x] Wizard `/app/animals/new` (selector especie visual + form completo)
- [x] Perfil del animal `/app/animals/[id]` con componentes:
  - [x] PhotoUpload (click-to-upload con preview + Supabase Storage)
  - [x] WeightTracker (add/delete entries, trend indicator, historial)
  - [x] CoOwnersManager (invite, list, remove)
  - [x] Info cards (color, marcas, notas)
  - [ ] Resumen salud (vacunas, alergias) — Semana 4
  - [ ] Historial (medical_records read-only) — Semana 5
  - [ ] Galería de fotos — V2
  - [ ] Documentos (estudios, certificados) — Semana 4
- [x] Editar animal (`/app/animals/[id]/edit`)
- [x] Subir fotos (validación + Storage + signed URLs)
- [x] Tracking de peso con histórico
- [x] Co-owners management (invitar por email — pendiente Auth real)
- [x] API Route `/api/animals/[id]` para fetch client-side
- [x] Server Actions: create, update, uploadPhoto, addWeight, deleteWeight, inviteCoOwner, removeCoOwner

### Semana 4 — Salud ✅
- [x] CRUD vacunas con calendario sugerido perro/gato (datalist suggestions, upcoming dose alerts)
- [x] CRUD desparasitación (internal/external badges, overdue warnings)
- [x] CRUD medicación crónica (active/inactive toggle, end date management)
- [x] CRUD alergias (severity badges, red card border for severe, severe banner in header)
- [x] Subir estudios (PDF/imagen, drag-area UI, file type icons, open link)
- [x] Health actions server file (`health-actions.ts`) con verifyAnimalAccess helper
- [ ] Vista de historial médico (read-only para dueño) — Semana 5 (lado vet)

### Semana 5 — Vínculo vet
- [ ] Generar QR del animal (modal en `/app/animals/[id]`)
- [ ] Página `/vet/scan` con cámara y `html5-qrcode`
- [ ] Server Action `requestAccess(animalId)` → crea `vet_access` pending
- [ ] Notificación in-app al dueño
- [ ] Página `/app/access` con solicitudes pendientes + accesos activos
- [ ] Aprobar/rechazar/revocar acceso
- [ ] Lado vet: dashboard `/vet` con pacientes recientes
- [ ] Lista `/vet/patients` con búsqueda y filtros
- [ ] Vista del paciente para vet: alergias destacadas arriba, historial completo, medicación activa
- [ ] Crear consulta `/vet/patients/[id]/new-consult` con plantillas
- [ ] Notas privadas filtradas server-side

### Semana 6 — Premium + Admin
- [ ] Sistema de subscriptions (lectura del plan, check de cap)
- [ ] Banner "X de 5 pacientes" en dashboard vet free
- [ ] Modal de upgrade con CTA a WhatsApp
- [ ] Página `/vet/plan` con info de plan, vencimiento, renovar
- [ ] Cron job diario que actualiza status `expired` y envía emails
- [ ] **Panel admin** `/admin`:
  - Dashboard (stats)
  - Lista de vets con plan + vencimiento
  - Modal "Activar premium" (fecha, monto, método)
  - Modal "Verificar matrícula"
  - Cola de verificaciones
  - Registro de pagos manuales
- [ ] Templates Resend: PremiumActivated, PremiumExpiringSoon, PremiumExpired
- [ ] Recetas con marca de agua en free, branding propio en premium

### Semana 7 — Directorio + Modo perdido
- [ ] Server function que llama Google Places API y cachea
- [ ] Página `/directory` con búsqueda por ciudad y mapa
- [ ] Filtros (24hs, distancia, rating)
- [ ] Modo "se perdió": activar/desactivar desde perfil del animal
- [ ] Página pública `/lost/[slug]` (server component, sin auth)
- [ ] Compartir en WhatsApp/redes
- [ ] PDF descargable con foto y datos para imprimir flyer
- [ ] Pulido visual general: animaciones, microinteracciones, dark mode QA
- [ ] Mobile QA exhaustivo (375px, 414px, 768px)

### Semana 8 — Beta privada
- [ ] Onboarding email a 5-10 dueños y 2-3 vets
- [ ] Bug fixing y polish
- [ ] Landing pública final con copy real
- [ ] Página `/pricing` con plan free vs premium
- [ ] Términos y Privacidad reales
- [ ] Página de contacto

---

## Fase V2 — 6-8 semanas post-MVP

- Recordatorios (vacunas, turnos, medicación) con email + push
- Calendario de turnos con sincronización Google Calendar
- Recetas digitales con firma + PDF profesional
- Certificados (salud, antirrábico, viaje) con PDF
- Reclamación de ficha por veterinarias (directorio activo)
- Gráficos de peso y stats
- Más especies con calendarios específicos
- Mercado Pago integrado para auto-suscripción
- Export de historial PDF + JSON (GDPR)
- Modo memorial cuando la mascota fallece

## Fase V3 — 3-4 meses post-V2

- App nativa (Expo + React Native, monorepo ya listo)
- WhatsApp Cloud API para recordatorios
- Chat dueño-vet (premium only)
- Reviews de vets en plataforma
- Multi-idioma (PT, EN)
- Plantillas de consulta avanzadas
- Stripe para mercado internacional

## Fase V4 — visión

- Multi-clínica con staff
- Marketplace de productos
- Integraciones (Tractive, seguros)
- Modo offline mobile
- Stats avanzados para vets
- API pública para integraciones
