# Store submission checklist — pendientes manuales

Lo que falta antes de subir a Apple App Store + Google Play Store.
Esto NO se puede hacer desde el código — son tareas tuyas en consolas
externas.

Última actualización: 2026-05-13

---

## 🚨 BLOQUEANTES (sin esto no podés submitear)

### 1. EAS Project ID (Expo)

`app.json` tiene `"projectId": "00000000-0000-0000-0000-000000000000"` que es placeholder. EAS build aborta inmediatamente.

```bash
cd apps/mobile
npx eas init        # te logueás con tu cuenta Expo y crea el proyecto
# Reemplaza el UUID en app.json -> extra.eas.projectId con el que devuelve
```

### 2. Iconos PNG y splash

`app.json` referencia `./assets/icon.png`, `adaptive-icon.png`, `splash.png` pero sólo hay SVG sources. Expo prebuild no convierte SVG → PNG automático.

```bash
cd apps/mobile
npm run gen:icons   # script ya existe; commitea los .png que genere
```

### 3. EAS Secrets

Setear en EAS para que las env vars estén disponibles al build:

```bash
cd apps/mobile
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xdsdsygewaxqcqggjgtr.supabase.co"
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<tu-anon-key>"
npx eas secret:create --scope project --name EXPO_PUBLIC_APP_URL --value "https://pet-friendly.fun"
```

### 4. Privacy Policy URL + Data deletion URL públicos

Apple y Google los piden literalmente como URL público accesible sin login. Ya tenés:

- ✅ `https://pet-friendly.fun/privacy` — Privacy Policy
- ✅ `https://pet-friendly.fun/terms` — Terms

Falta:

- ⚠️ `https://pet-friendly.fun/privacy/data-deletion` — Google Play **exige** un endpoint público con instrucciones (o form) para que cualquiera pueda solicitar borrado sin necesidad de login. La eliminación in-app ya está implementada, sólo falta esta página informativa pública.

---

## ⚠️ App Store Connect (iOS)

### App Privacy details
Completar cada tipo de dato recolectado:
- **Email Address** → Linked to user → App Functionality
- **Name** → Linked → App Functionality
- **Phone Number** → Linked → App Functionality
- **Photos or Videos** (cuando se implemente upload de foto) → Linked → App Functionality
- **Other User Content** (animal records, notas vet) → Linked → App Functionality
- **Crash Data** → Not linked → App Functionality
- **NO tracking** (decir No a "Data Used to Track You")

### Demo account credentials
Apple pide login para revisar la app. Crear en Supabase:
- Owner demo: `apple-review-owner@pet-friendly.fun` con 2 mascotas con datos completos
- Vet demo: `apple-review-vet@pet-friendly.fun` con trial premium activo
- Anotar contraseñas en App Store Connect → App Information → Sign-In Information

### Sign in with Apple
Sólo aplica si agregás Google/Facebook/Twitter login. Por ahora sólo hay OTP email — no aplica. Si en el futuro agregás OAuth con cualquier proveedor, **obligatorio** agregar Sign in with Apple también.

### Screenshots requeridos
- iPhone 6.7" (1290×2796) — entre 3 y 10 screenshots
- iPhone 6.5" (1242×2688) — opcional pero recomendado
- iPad 12.9" (2048×2732) — **obligatorio** porque `supportsTablet: true`

Para sacarlas: simulador iOS → captura → o usa fastlane snapshot.

### Categoría
**Lifestyle** (no Medical — Medical implica advice profesional supervisado).

### Age rating
4+ / Everyone. Confirmar que la encuesta de age rating no marca nada que cambie esto.

### Export compliance
Ya declarado `usesNonExemptEncryption: false` en `app.json`. Sólo confirmar al subir.

---

## ⚠️ Google Play Console (Android)

### Data Safety form
Formato propio de Google. Marcá:
- **Data collected**: Email, Name, Phone, Photos, App activity (vet records), Crash logs
- **Purpose**: App functionality (todos)
- **Shared with third parties**: Supabase (hosting & auth), Resend (email), Vercel (hosting)
- **User can request data deletion**: ✅ Yes
- **Method for data deletion**: in-app + URL público (linkear `https://pet-friendly.fun/privacy/data-deletion`)

### Closed Testing
Antes de Production track, hacer Closed Testing con 20 usuarios reales por mínimo 14 días. Es requisito desde 2024 para nuevas apps.

### Screenshots requeridos
- Phone (16:9 o 9:16, mín 320px): 2 a 8 screenshots
- 7" tablet: 1 a 8
- 10" tablet: 1 a 8
- Feature graphic 1024×500 (banner principal)

### Privacy policy URL
`https://pet-friendly.fun/privacy` — pegar en Play Console.

### Service account para EAS submit
```bash
# 1. Crear service account en Google Cloud Console del proyecto Play
# 2. Asignarle rol "Service Account User" en Play Console
# 3. Generar JSON key
# 4. Guardarlo en apps/mobile/google-service-account.json (gitignored)
# 5. eas submit --platform android usa el path del eas.json
```

---

## 💡 Recomendados antes del primer submit

1. **Soft launch con TestFlight** (iOS) y **Closed Testing** (Google) durante 7-14 días con 20-50 testers reales.
2. **Crashlytics o Sentry**: el codigo no tiene crash tracking. Agregá `sentry-expo` antes de prod para detectar bugs en usuarios reales.
3. **Supabase RLS audit**: con un user real, verificá que owner A no puede leer datos de owner B, y vet sin acceso aprobado no ve animales ajenos. Las policies están definidas pero conviene probarlas.
4. **iPad layout testing**: con `supportsTablet: true`, Apple va a abrirla en iPad durante review. Probá en simulador iPad 12.9" que no se rompe el layout.
5. **Trial overflow**: probar el flujo cuando un vet llega al cap de 5 pacientes sin Premium → debe mostrar paywall claro, no crashear.

---

## 📝 Lo que YA quedó listo en código

- ✅ Account deletion en app + endpoint público para mobile
- ✅ Privacy + Terms publicados en pet-friendly.fun
- ✅ PrivacyInfo.xcprivacy con APIs + data types declarados
- ✅ Permisos justificados con descripciones en español (sólo cámara — image picker removido)
- ✅ Sin URLs hardcoded a vercel.app
- ✅ Supabase URL no leakable en fork (sin fallback default)
- ✅ QR real (no un ícono)
- ✅ Sin CTAs de pago externo (WhatsApp upgrade removido)
- ✅ OpenGraph image dinámica
- ✅ Vet settings web completo (perfil + logout + delete)
