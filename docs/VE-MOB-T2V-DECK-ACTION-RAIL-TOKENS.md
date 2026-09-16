# VE-MOB-T2V — DECK ACTION RAIL TOKENS

## Entorno y autoridad

- Entorno activo: aplicación Android en `mobile/**`; la web permanece congelada.
- Autoridad: fila `ACTIVE` de
  `public.vexforge_official_documents / vexforge_home_world_system_protocol_v3`,
  versión V2.3, SHA-256 `cd83250a5f63fe72b5be237bfdf1bb54a1f935927a5fea95136190b837a165ba`.

## Superficie

`DECK / FORJA`: encabezado de identidad Forja y consola nativa de búsqueda,
forja, filtro y detalle.

## Bloque

Centralizar roles visuales ya existentes en la cabecera y consola de acciones
sin cambiar la formación, el editor, la validación, el guardado, la navegación
ni los datos oficiales del mazo.

## Cambio

`VISUAL_TOKENS.deck` define posiciones de cabecera, control de refresco,
proporciones de la consola, búsqueda, acción principal y utilidades. `deck.tsx`
consume esos roles conservando los valores efectivos.

## Garantías

- Se conservan `DomainHeader`, los estados de sincronización/offline, `testID`,
  accesibilidad, búsqueda, filtro de facción, edición, detalle y navegación.
- Se conservan slots de formación/reserva, colección, validación, guardado,
  RPCs, Supabase, Auth, assets y estados `loading/error/empty`.
- No se añadieron datos, cartas, facciones, recompensas, reglas, endpoints ni
  dependencias.
- La profundidad táctil de la consola mantiene la misma opacidad y escala
  efectiva.

## Verificación y release gate

- `node scripts/verify-mobile-deck.mjs`
- `node scripts/verify-mobile-economy.mjs`
- `node scripts/verify-mobile-store.mjs`
- `node scripts/verify-mobile-visual-system.mjs`
- `node --check scripts/verify-mobile-deck.mjs`
- `node --check scripts/verify-mobile-visual-system.mjs`
- `git diff --check`
- No se inicia workflow Android, no se compila APK ni se publica release.
- Estado: `IMPLEMENTED_UNVERIFIED`; la QA física queda reservada para una APK
  autorizada.