# VE-MOB-T2V — BATTLEFIELD TYPOGRAPHY WEIGHTS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Completar la extracción de los pesos tipográficos del `ForgeBattlefield`,
manteniendo la jerarquía de lectura actual para combate, formaciones, reserva,
carril y resultado.

## Contrato implementado

- Los pesos existentes de `ForgeBattlefield` viven en
  `VISUAL_TOKENS.battlefield.typography`.
- Se conservan los valores efectivos `900`, `800` y `700`.
- El componente consume roles para eyebrow, título, turno, identidad, roles,
  estados, arte faltante, nombres, facción, HP, keywords, reserva, carril,
  daño y resultado.
- No se modifican turnos, unidades, HP, eventos, resultado, replay, contratos
  de combate, Supabase, Auth ni acciones táctiles.

## Guard

- `node scripts/verify-mobile-visual-system.mjs`
- `node --check scripts/verify-mobile-visual-system.mjs`
- `git diff --check`

## Gate de release

No se inicia workflow Android, no se compila APK ni se publica release. La
verificación visual/táctil queda pendiente de una APK autorizada.

## Estado honesto

`IMPLEMENTED_UNVERIFIED`: el cambio queda preparado para QA en dispositivo y
no se eleva a `PASS`, `OPERATIONAL` ni `TIER1_READY`.