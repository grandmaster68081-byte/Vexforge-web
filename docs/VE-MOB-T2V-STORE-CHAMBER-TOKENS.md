# VE-MOB-T2V — STORE CHAMBER TOKENS

## Entorno y autoridad

- Entorno activo: aplicación Android en `mobile/**`; la web permanece congelada.
- Autoridad: fila `ACTIVE` de
  `public.vexforge_official_documents / vexforge_home_world_system_protocol_v3`,
  versión V2.3, SHA-256 `cd83250a5f63fe72b5be237bfdf1bb54a1f935927a5fea95136190b837a165ba`.

## Superficie

`STORE` / Nexus de la Forja: encabezado de cámara activa y rail táctil de
Packs, Tienda, Fusión, Evolución e Inventario.

## Bloque

Eliminar la repetición local de geometría, escala, peso tipográfico y feedback
de presión en la entrada de la cámara sin convertir la ruta en un panel
administrativo ni cambiar sus acciones.

## Cambio

`VISUAL_TOKENS.store` define los roles de shell, regreso, señal de cámara,
rail y modo. `mobile/app/store.tsx` consume esos roles para el contenido
seguro, el control de regreso, `CATÁLOGO VIVO` y las cinco cámaras.

## Garantías

- Se conservan los cinco modos, rutas, `testID`, accesibilidad y selección
  derivada del modo real.
- Se conservan los catálogos, compras, aperturas, pagos, fusión, evolución,
  inventario, RPCs, Supabase, Auth y estados `loading/error/empty/pending`.
- No se añadieron datos, precios, recompensas, assets, solicitudes ni lógica de
  economía.
- El feedback de presión mantiene los mismos valores efectivos.

## Verificación y release gate

- `node scripts/verify-mobile-store.mjs`
- `node scripts/verify-mobile-visual-system.mjs`
- `node --check scripts/verify-mobile-visual-system.mjs`
- `git diff --check`
- No se inicia workflow Android, no se compila APK ni se publica release.
- Estado: `IMPLEMENTED_UNVERIFIED`; la QA física queda reservada para una APK
  autorizada.