# VE-MOB-T2V — WORLD ATLAS HEADER AND TABS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar una unidad visual atómica de `World Atlas` sin inventar contenido de
mundo ni modificar los contratos vivos. La cabecera, el control de
actualización y las pestañas de `/world` mantienen su composición y pasan a
consumir roles registrados del sistema visual.

## Contrato implementado

- `VISUAL_TOKENS.worldHeader` registra la geometría, escala de iconos,
  jerarquía tipográfica y separación de la cabecera y las pestañas.
- `mobile/app/world.tsx` consume esos roles en `WorldHeader`.
- Se conservan `world-refresh`, las cinco pestañas, sus destinos, la acción de
  refresco, el estado de carga, el copy, los colores dinámicos y la
  accesibilidad.
- No se añadieron paneles, datos, assets, rutas, estados, reglas, rewards,
  solicitudes ni fallback genérico.

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