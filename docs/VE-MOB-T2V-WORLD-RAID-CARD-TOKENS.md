# VE-MOB-T2V — WORLD RAID CARD TOKENS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar una unidad visual atómica de la tarjeta de World Raid. Se centraliza la
superficie, la identidad del raid, la dificultad, las métricas y el control de
participación sin alterar la autoridad del servidor.

## Contrato implementado

- `VISUAL_TOKENS.worldRaid` registra geometría, tipografía, iconografía,
  separación y escala del control de la tarjeta.
- `RaidCard` consume esos roles para su shell, stripe, identidad, estadísticas,
  código, acción y nota de integridad.
- Se conservan `world-raid-*`, `onJoin`, `onContribute`, `joined`, `busy`,
  `joinWorldRaid`, `contributeWorldRaid`, la sesión, el RPC oficial y los
  mensajes honestos del servidor.
- No se añadió estado de participación, cálculo de recompensa, resultado,
  dato, asset, fallback genérico ni regla de raid.

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