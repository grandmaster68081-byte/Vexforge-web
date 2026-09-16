# VE-MOB-T2V — ECONOMY CHAMBER TOKENS

## Entorno y autoridad

- Entorno activo: aplicación Android en `mobile/**`; la web permanece congelada.
- Autoridad: fila `ACTIVE` de
  `public.vexforge_official_documents / vexforge_home_world_system_protocol_v3`,
  versión V2.3, SHA-256 `cd83250a5f63fe72b5be237bfdf1bb54a1f935927a5fea95136190b837a165ba`.

## Superficie

`ECONOMY` / Iron Treasury: encabezado de Economía y selector táctil de
Cartera, Mercado, Depósitos, Retiros y Referidos.

## Bloque

Centralizar la geometría, escala, tipografía y estados de presión ya existentes
en el encabezado y selector de cámaras, sin alterar la economía autoritativa.

## Cambio

`VISUAL_TOKENS.economy` define shell, encabezado, controles de regreso,
rail de secciones y botones de sección. `mobile/app/economy.tsx` consume esos
roles manteniendo el mismo diseño efectivo y el mismo comportamiento.

## Garantías

- Se conservan las cinco secciones, rutas, `testID`, accesibilidad, refresh y
  selección local de sección.
- Se conservan cartera, ledger, mercado, depósitos, retiros, referidos,
  balances, fórmulas informativas, RPCs, Supabase, Auth y estados
  `loading/error/empty/pending`.
- No se añadieron saldos, precios, recompensas, contratos, datos, assets ni
  lógica económica.
- El feedback de presión mantiene la misma opacidad efectiva (`0.72`).

## Verificación y release gate

- `node scripts/verify-mobile-economy.mjs`
- `node scripts/verify-mobile-visual-system.mjs`
- `node --check scripts/verify-mobile-economy.mjs`
- `node --check scripts/verify-mobile-visual-system.mjs`
- `git diff --check`
- No se inicia workflow Android, no se compila APK ni se publica release.
- Estado: `IMPLEMENTED_UNVERIFIED`; la QA física queda reservada para una APK
  autorizada.