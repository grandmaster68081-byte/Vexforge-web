# VE-MOB-2 — AUTH

## Objetivo

Portar a la aplicación Android el acceso real de VEXFORGE: inicio de sesión,
registro y persistencia de sesión contra el Supabase oficial. La app no contiene
lógica de autorización ni crea filas de jugador directamente; usa el flujo Auth
oficial y la RPC `ensure_player_row`.

## Alcance

- `mobile/app/auth.tsx`: acceso y registro con validación de formulario, estados
  de carga, error y confirmación de correo.
- `mobile/app/(tabs)/_layout.tsx`: barrera de autenticación para impedir acceso
  anónimo a las superficies del producto.
- `mobile/lib/supabase.ts`: respuestas de Auth convertidas a sesiones completas,
  persistencia en AsyncStorage, renovación por refresh token y provisión no
  autoritativa mediante `ensure_player_row`.
- `mobile/package-lock.json`: lock reproducible para el `npm ci` del workflow APK.

## Criterios de aceptación

1. Una sesión guardada se carga al abrir la app y se renueva cuando expira.
2. Un usuario no autenticado ve `/auth`; no puede entrar a las pestañas por URL
   o navegación directa.
3. Un inicio de sesión válido usa `auth/v1/token?grant_type=password` y llega a
   las pestañas con la sesión persistida.
4. Un registro válido usa `auth/v1/signup`; si Supabase requiere confirmación,
   la app informa al usuario y no inventa una sesión.
5. La creación de jugador usa únicamente la RPC `ensure_player_row`; el cliente
   no duplica reglas de cuenta, RLS ni autorización.
6. Los estados de carga y error son visibles; el formulario no permite enviar
   datos incompletos y no utiliza emojis, placeholders visuales ni arte genérico.

## Verificación

- `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund` en `mobile/`.
- `npm run typecheck` en `mobile/`.
- `npm run verify:mobile-auth` desde la raíz.
- `npm run verify:build` y `npm run verify:all` web sin regresión.
- Cierre APK: workflow `.github/workflows/vexforge-android-apk.yml` en `success`,
  release correlativo publicado con `app-release.apk` y bundle JS embebido.

## Estado

Estado inicial: `NOT_STARTED`.

Estado de implementación antes del recorrido APK: `IMPLEMENTED_UNVERIFIED`.
La unidad solo puede pasar a `OPERATIONAL` tras instalar el release que
corresponda al commit en un dispositivo o emulador y recorrer los criterios.

## Deuda y reapertura

La verificación autenticada requiere una sesión QA normal y un dispositivo o
emulador disponible. Reabrir si cambia el contrato de Supabase Auth, la RPC de
provisión, el mecanismo de almacenamiento de sesión o la barrera de rutas.