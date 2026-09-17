# 04 — CURRENT SYSTEM

```text
Android
  ↓
Expo Router: mobile/app/_layout.tsx
  ↓
GameProvider: mobile/context/GameContext.tsx
  ↓
screens: mobile/app/**
  ↓
components/constants/hooks/state
  ↓
services y tipos: mobile/lib/supabase.ts
  ↓
Supabase REST/RPC/Auth/Storage
```

## Entry points y providers

- Root: `mobile/app/_layout.tsx`.
- Provider: `GameProvider`.
- Tab shell: `mobile/app/(tabs)/_layout.tsx`.
- Auth guard: redirect a `/auth` cuando no hay sesión.
- Tutorial guard: cuentas con `tutorial_step` inicial son redirigidas a `/tutorial` cuando hay sincronización.

## Capas observadas

- Screens: `auth`, `tutorial`, `world`, `missions`, `economy`, `store`, `social`, `meta` y tabs `index`, `battle`, `collection`, `deck`, `profile`.
- Components: `ForgeBattlefield`, `ForgeFormationPreview`, `ForgeArchiveScene`, `ScreenShell`, `CanonicalFrame`, `DomainHeader`, `DomainState`, `ErrorBoundary`.
- Context/state: `GameContext` y estado local de cada pantalla.
- Data access: `mobile/lib/supabase.ts` con auth, REST/RPC, tipos y loaders/actions.
- Telemetry: `mobile/lib/telemetry.ts` y `insertTelemetryEvent`.
- Native plugins: `mobile/plugins/withEmbeddedJsBundle.js`.
- Visual tokens: `mobile/constants/visual.ts`, `colors.ts`, `typography.ts`, `experience.ts`.

## Clasificación

- ACTIVE: `mobile/**`, Expo Router, Supabase client, mobile assets y workflows Android.
- LEGACY/HISTORICAL: `src/**`, parte de `backend/**` y documentación que trata la web como cliente oficial.
- UNKNOWN: cualquier objeto live no conectado explícitamente a un consumer móvil.

## Estado del runtime

El mapa anterior describe el sistema **activo**: Expo Router, React Native,
`GameRuntime` y `mobile/**`. La Game Runtime Foundation mantiene la autoridad
de sesión y datos en `GameContext`/Supabase. Unity queda
`RETIRED / HISTORICAL` y no existe como ruta activa de producto.
