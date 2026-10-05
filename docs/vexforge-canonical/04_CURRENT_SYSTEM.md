# 04 — CURRENT SYSTEM

> El mapa Expo de esta página describe el runtime previo a Hito 10; el árbol
> `mobile/**` ya fue retirado y este documento es evidencia histórica, no código
> ejecutable. Unity está activo; ver `26_UNITY_ENGINE_MIGRATION.md`
> y el inventario de migración para su estado y límites.

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

- ACTIVE: `unity/**`, Unity Android runtime, Supabase client/contracts, scenes
  and presentation.
- HISTORICAL PARITY SNAPSHOT: `mobile/**`, Expo Router, Supabase client and
  mobile assets as recorded before the 2026-10-05 retirement.
- LEGACY/HISTORICAL: `src/**`, parte de `backend/**` y documentación que trata la web como cliente oficial.
- UNKNOWN: cualquier objeto live no conectado explícitamente a un consumidor
  del runtime.

## Estado del runtime

El mapa anterior describe la arquitectura Expo antes de la retirada. Unity bajo
`unity/**` es el único runtime Android activo; su implementación está en
distintos grados y no se declara compilada ni verificada en dispositivo.
Supabase conserva la autoridad de sesión y datos. `mobile/**` se retiró en
Hito 10 antes de cerrar las gates; el estado de cada gate permanece en el
documento 28.
