# VE-MOB-11 — Economy: honest identity signals

## Alcance

Este microbloque corrige únicamente la presentación de identidad incompleta en la
superficie Android de Economía (`mobile/app/economy.tsx`).

## Regla aplicada

Cuando Supabase entrega un listado, carta o referido sin nombre, rareza, identidad
o código utilizable, Android no inventa una etiqueta diegética ni presenta un
nombre genérico como si fuera un dato oficial. Muestra una señal explícita de
información no reportada.

Los nombres y rarezas que sí llegan desde el contrato vivo se conservan sin
normalización adicional. Las operaciones de mercado y las lecturas de referidos
continúan usando sus identificadores y RPCs existentes; este bloque no cambia
reglas de economía, permisos, precios ni liquidación.

## Evidencia

- `node scripts/verify-mobile-economy.mjs`
- `git diff --check`

El typecheck Expo y la QA visual/táctil dependen de una APK autorizada y no se
ejecutan en este bloque.