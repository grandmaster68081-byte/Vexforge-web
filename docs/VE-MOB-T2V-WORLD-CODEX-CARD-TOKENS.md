# VE-MOB-T2V — WORLD CODEX CARD TOKENS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar una unidad visual atómica de la tarjeta del Codex de World Atlas.
Se centralizan la superficie, el sello, la jerarquía tipográfica y la lectura
expandida sin modificar el contenido oficial ni su navegación.

## Contrato implementado

- `VISUAL_TOKENS.worldLore` registra geometría, iconografía, tipografía y
  separación de la tarjeta.
- `LoreCard` consume esos roles en sus estados colapsado y expandido.
- Se conservan `world-lore-*`, `onToggle`, `expanded`, búsqueda, contenido,
  categoría, título, `related_entity`, colores dinámicos y accesibilidad.
- No se añadieron entradas, texto, estado de Codex, reglas, assets ni fallback
  genérico.

## Guard

- `node scripts/verify-mobile-world.mjs`
- `node scripts/verify-mobile-visual-system.mjs`
- `node --check scripts/verify-mobile-visual-system.mjs`
- `git diff --check`

## Gate de release

No se inicia workflow Android, no se compila APK ni se publica release. La
verificación visual/táctil queda pendiente de una APK autorizada.

## Estado honesto

`IMPLEMENTED_UNVERIFIED`: la unidad queda preparada para QA visual/táctil en
dispositivo y no se eleva a `PASS`, `OPERATIONAL` ni `TIER1_READY`.