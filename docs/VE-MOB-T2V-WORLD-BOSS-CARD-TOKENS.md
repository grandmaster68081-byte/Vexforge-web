# VE-MOB-T2V — WORLD BOSS CARD TOKENS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar una unidad visual atómica de la tarjeta de World Boss. Se centraliza la
composición de arte, identidad, tier, señales de HP, recompensa y acción sin
crear datos, simular daño ni alterar la resolución oficial.

## Contrato implementado

- `VISUAL_TOKENS.worldBoss` registra geometría, tipografía, separación,
  señales de estado y escala de los controles de la tarjeta.
- `BossCard` consume esos roles para la superficie completa y el botón
  `PREPARAR BATALLA`.
- Se conservan `world-boss-*`, `onBattle`, encounters, daño, rewards, lore,
  colores dinámicos, asset oficial, fallback honesto de arte y accesibilidad.
- La tarjeta sigue mostrando sólo valores vivos; no calcula ni confirma
  settlement, recompensa o resultado de combate.

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