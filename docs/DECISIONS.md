# DECISIONS.md — Decisiones tomadas con rationale

> Cada decisión polémica del producto, con su razón. Si querés cambiar algo, leelo primero.

## Producto — 10 decisiones core

### 1. Acceso del vet permanente, no expira
**Decisión:** Una vez que el dueño aprueba al vet, el acceso es permanente hasta que el dueño lo revoque manualmente.
**Razón:** Modelo "vet de cabecera". Expirar mete fricción innecesaria.

### 2. Vet ve historial completo (incluso lo escrito por otros vets)
**Decisión:** Un vet con acceso aprobado ve todo el historial médico del animal.
**Razón:** Es el principal valor diferencial — evita el "tengo que llamar al colega anterior".

### 3. Dueño no puede editar lo que escribió un vet
**Decisión:** El historial médico (`medical_records`) es read-only para el dueño. Puede agregar nota propia debajo, pero no editar la del vet.
**Razón:** Integridad clínica. RLS lo fuerza.

### 4. Plan free vet hasta 5 pacientes activos
**Decisión:** Vet free puede tener hasta 5 `vet_access` con status `approved` y NO archivados. Más → upgrade.
**Razón:** Suficiente para probar el producto, no para usarlo gratis. Empuja al upgrade rápido.

### 5. Verificación de matrícula es opt-in
**Decisión:** El vet puede usar la app sin verificar matrícula. Si quiere la marca "verificado", la solicita y validamos manualmente.
**Razón:** No queremos crear fricción al alta. La marca da prestigio (premium feature).

### 6. Notas privadas del vet sí
**Decisión:** Cada `medical_record` tiene `privateNotes` que solo ve el vet que escribió.
**Razón:** Estándar en software médico. Sin esto los vets no migran. Ejemplo: "el dueño parece no entender, reforzar próximo control".
**Implementación:** Filtrado server-side en Server Actions (RLS no filtra columnas).

### 7. Solo español en MVP
**Decisión:** Toda la UI en es-AR. Multi-idioma (PT, EN) en V3.
**Razón:** Foco. Multi-idioma es trabajo significativo sin retorno hasta tener tracción.

### 8. Todas las especies, vacunación inteligente solo perro/gato
**Decisión:** El enum `AnimalSpecies` soporta dog/cat/bird/rabbit/rodent/reptile/fish/exotic/other desde el día 1. Pero el calendario de vacunación sugerido solo cubre perro y gato en MVP.
**Razón:** No bloquear usuarios con mascotas exóticas, pero foco en el 90% del mercado.

### 9. Modo "se perdió" en MVP
**Decisión:** El dueño puede activar una alerta pública con URL `/lost/[slug]`, foto, datos de contacto, info adicional.
**Razón:** Es viral y emotivo. Tabla `lost_pet_alerts` lista. Slug random no adivinable.

### 10. Co-dueños en MVP
**Decisión:** Un animal puede tener varios `OwnerProfile` asociados vía `animal_co_owners`. El primary owner los gestiona.
**Razón:** Caso real frecuente (parejas, familia). Permisos `full` o `limited`.

## Premium — 6 decisiones

### P1. Precio: USD 10/mes, USD 100/año
**Razón:** Punto de entrada accesible para LATAM. Anual ahorra USD 20 (16.6%).

### P2. Descuento anual: sí — 10 meses por 12
**Razón:** Mejora cashflow y engancha por 12 meses.

### P3. Cap de 5 pacientes cuenta solo activos NO archivados
**Razón:** El vet puede archivar pacientes inactivos sin perderlos del historial.

### P4. Vet vencido pierde features premium pero no historial
**Decisión:** Si la sub vence, vuelve a free. Sigue accediendo a 5 primeros pacientes; los demás quedan "bloqueados con candado". Historial nunca se pierde.
**Razón:** Trato justo + incentivo a renovar.

### P5. Trial 30 días premium gratis al registrarse vet
**Razón:** Engancha rápido. Cuando vence vuelve a free, no se cobra automáticamente.

### P6. Email de premium activado/vencido en MVP
**Decisión:** Sí, con Resend. Es transaccional, no recordatorio.
**Razón:** Crítico para que el vet sepa el estado de su plan.

## Stack — decisiones técnicas

### Monorepo desde el inicio (Turborepo + pnpm)
**Razón:** El plan es agregar `apps/mobile` (Expo) en V3. Sin monorepo desde día 1, sería reescritura. Con monorepo, los validators Zod, tipos Prisma y lógica de negocio se reusan entre web y mobile.

### Prisma sobre Drizzle / Supabase types directos
**Razón:** El usuario tiene experiencia previa con Prisma (Panel-Leonardo). Tipado fuerte, migrations claras, prisma studio útil para debug.

### Server Actions sobre API routes para mutaciones
**Razón:** Less boilerplate, CSRF protection automática, type-safe end-to-end. API routes solo para webhooks externos.

### Magic link como auth principal
**Razón:** Sin password = sin password reuse, sin "olvidé mi password", menos superficie de ataque. Email es el "factor de posesión".

### shadcn/ui en lugar de UI library completa
**Razón:** Componentes son código en el repo (no dependencia externa) — total control de UX y accessibility. Foundation correcta para diseño minimalista premium.

### Tailwind 3 en vez de Tailwind 4
**Razón:** Tailwind 4 está en alpha al momento. Esperamos a que estabilice antes de migrar.

### Calendario de vacunación como datos hardcoded en `constants/`
**Razón:** No vale la pena tabla en DB para algo que cambia cada años. Si en V2 queremos personalizable por país/criadero, migramos a tabla.

### `audit_log` como tabla genérica con `metadata` JSON
**Razón:** Logging es transversal. Una tabla genérica simplifica vs N tablas específicas.

### Slug del modo "se perdió" usa nanoid con alfabeto seguro
**Decisión:** 10 caracteres del alfabeto `23456789abcdefghjkmnpqrstuvwxyz` (sin 0, O, l, 1, dígitos parecidos a letras).
**Razón:** ~8.7e14 combinaciones — no enumerable. Legible al ser dictado por teléfono.

## Cosas que considerábamos y descartamos

### ❌ Validar matrícula automáticamente vía API del Colegio Veterinario
**Por qué no:** No existe API pública en Argentina. Costo de scraping > costo de validar manualmente en MVP.

### ❌ Recordatorios en MVP (vacunas, turnos, medicación)
**Por qué no:** Cron jobs + emails + push + WhatsApp es trabajo significativo. V2.

### ❌ Mercado Pago integrado en MVP
**Por qué no:** Sin volumen de vets pagando todavía. Pagos manuales validan precio y demanda. Integración cuando haya >5 vets pagando.

### ❌ Storage S3 directo en lugar de Supabase Storage
**Por qué no:** Una menos dependencia. Supabase Storage tiene RLS integrada. Migrar más adelante si crece mucho.

### ❌ Drizzle como ORM
**Por qué no:** Curva de aprendizaje + el founder ya conoce Prisma.

### ❌ Versión separada para clínicas (multi-staff)
**Por qué no:** Complejidad enorme (roles, permisos finos, agenda compartida). V3+.

### ❌ Chat dueño-vet en MVP
**Por qué no:** Genera expectativa de respuesta 24/7 que satura al vet free. V3 con plan premium-only.
