# PetApp Mobile

App nativa de PetApp para Android e iOS, construida con Expo + React Native.
Comparte la base de datos Supabase con la versión web.

## Stack

- Expo SDK 51 + React Native 0.74
- Expo Router 3 (file-based routing)
- NativeWind 4 (Tailwind para React Native)
- Supabase JS SDK (auth + queries directas con RLS)
- TanStack Query 5
- expo-camera (scanner QR nativo)
- Lucide icons

## Estructura

```
apps/mobile/
├── app/                    # Routes (expo-router)
│   ├── _layout.tsx
│   ├── index.tsx           # Entry → redirige según rol
│   ├── (auth)/             # Login + OTP + onboarding
│   └── (app)/              # Pantallas autenticadas
│       ├── _layout.tsx     # Bottom nav + FAB QR
│       ├── index.tsx       # Dashboard dueño
│       ├── animals/
│       ├── notifications.tsx
│       ├── settings.tsx
│       └── vet/            # Pantallas para veterinarios
├── src/
│   ├── components/         # UI primitives + PetAvatar
│   ├── hooks/              # Queries TanStack
│   └── lib/                # Supabase, session, env, format
├── assets/                 # Icons + splash (SVG + PNG)
├── scripts/                # Helpers de build
├── app.json                # Config Expo
├── eas.json                # Config EAS Build
└── tailwind.config.js
```

## Setup local

```bash
# Desde la raíz del monorepo
pnpm install

# Copiar env y completar con las credenciales reales
cd apps/mobile
cp .env.example .env.local

# Generar iconos PNG desde los SVG (una vez)
pnpm gen:icons

# Levantar Expo dev server
pnpm start
```

Escaneá el QR con la app **Expo Go** (Android/iOS) para probar en tu celular.

## Publicar en Google Play Store — paso a paso

### Pre-requisitos

1. **Cuenta de Google Play Developer** — USD 25 pago único.
   👉 https://play.google.com/console/signup
   Verificación de identidad: 1-3 días.

2. **Cuenta de Expo (gratis)** — https://expo.dev/signup

3. **Tu Supabase project URL + anon key** (ya las tenés del proyecto).

### Paso 1 — Configurar credenciales

```bash
cd apps/mobile

# Loguearte en Expo CLI
npx expo login

# Inicializar EAS (te pide tu cuenta de Expo)
npx eas init

# Configurar credenciales automáticamente
npx eas credentials
```

Esto crea el keystore Android y lo guarda en los servidores de Expo (managed credentials). **No vas a necesitar tocarlo más** — Expo lo usa para firmar cada build.

### Paso 2 — Completar `app.json`

Editá `app.json` y reemplazá:

- `"projectId": "00000000-..."` → el ID real que te dio `eas init`
- `"owner": "francocoria"` → tu usuario de Expo

### Paso 3 — Setear env vars en EAS

```bash
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://TU-PROYECTO.supabase.co"
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key"
npx eas secret:create --scope project --name EXPO_PUBLIC_APP_URL --value "https://petapp-one.vercel.app"
npx eas secret:create --scope project --name EXPO_PUBLIC_WHATSAPP_NUMBER --value "5491100000000"
```

### Paso 4 — Generar el `.aab` (App Bundle)

```bash
pnpm build:android
```

Va a tomar 10-20 minutos en los servidores de Expo (gratis). Al terminar te da un link para descargar el `.aab`.

### Paso 5 — Subir a Google Play Console

1. Entrá a https://play.google.com/console
2. Click "Create app" → completá nombre, idioma (Español), categoría (Health & Fitness o Lifestyle), free.
3. En el menú lateral → **Production** → **Create new release**.
4. **Subí el `.aab`** que descargaste de EAS.
5. Completá la información de la release.

### Paso 6 — Closed testing (obligatorio para cuentas nuevas)

Desde Nov 2023 Google requiere **20 días de closed testing con 12+ testers** antes de poder publicar a Production.

1. En el menú → **Testing → Closed testing → Create track**.
2. Subí el mismo `.aab`.
3. Creá un **email list** con 12+ emails de testers (amigos, familia, etc.).
4. Mandales el link de opt-in que te genera Google.
5. Esperá 14-20 días de "engagement activo" (los testers tienen que abrir la app de vez en cuando).

### Paso 7 — Assets de Play Store

Necesitás tener listos antes de mandar a review:

- **App icon hi-res 512x512 PNG** → `assets/icon.png` ya está
- **Feature graphic 1024x500 PNG** → `assets/feature-graphic.png` (a generar a mano)
- **Mínimo 2 screenshots** del teléfono (1080x1920 o más) — sacalas del emulador con la app andando
- **Privacy policy URL** — opción A: usá `https://petapp-one.vercel.app/privacy`; opción B: hosteala en Notion/GitHub Pages
- **Descripción corta** (máx 80 chars): "Centro de salud para tu mascota. Vacunas, historial y QR para tu vet."
- **Descripción larga** (máx 4000 chars) — copy en `docs/play-store-description.md`

### Paso 8 — Content rating + Data safety

En el Console → **Policy → App content**:

- **Content rating**: completá el cuestionario (todo "No" salvo data sharing).
- **Data safety**: declarar que recolectás email, nombre, teléfono (todos ligados a la cuenta del user, no shared con terceros).
- **Privacy policy URL**: pegá tu URL pública.
- **Target audience**: 13+

### Paso 9 — Mandar a review

1. Cuando termine el closed testing → **Promote release to Production**.
2. Google revisa en 1-7 días.
3. Si aprueban, la app aparece en Play Store buscando "PetApp".

## Updates futuros

Para subir una nueva versión:

1. Editá `app.json`: `"version": "1.0.1"` (sube el versionName) y `"versionCode": 2` (sube el versionCode si no usás `autoIncrement`).
2. `pnpm build:android` — genera nuevo `.aab`.
3. Subí a Play Console → **Production** → **Create new release** → sube el `.aab`.
4. Review de Google (más rápido en updates, suele ser 1-2 días).

## Troubleshooting

**"Cannot find module '@pet-app/lib'"** al correr `pnpm start`:
- Asegurate de haber corrido `pnpm install` desde la raíz del monorepo, no dentro de `apps/mobile`.

**Cámara no funciona en el emulador**:
- Los emuladores de Android tienen cámaras simuladas que escanean QRs hardcoded. Probá en celu físico con Expo Go.

**QR scanner no detecta**:
- Revisar que el permiso de cámara está habilitado en config del dispositivo.

**Build EAS falla**:
- Verificá que `app.json` tenga `projectId` real (no el placeholder).
- Probá `npx expo doctor` para detectar problemas de versiones.
