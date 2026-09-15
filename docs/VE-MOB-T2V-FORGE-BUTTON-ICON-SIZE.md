# VE-MOB-T2V — FORGE BUTTON ICON SIZE

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar la extracción del tamaño de icono de `ForgeButton` usando el rol visual
compartido existente, sin cambiar la API, la escala efectiva ni las acciones
del botón.

## Contrato implementado

- La variante secundaria consume `VISUAL_TOKENS.control.button.iconSize`.
- La variante primaria consume `VISUAL_TOKENS.control.button.iconSize`.
- Se conserva el tamaño efectivo de `16`.
- Se mantienen pressed/disabled, haptics, colores, gradientes, label,
  accesibilidad, `testID` y el comportamiento de `onPress`.
- No se añadieron datos, rutas, solicitudes, assets, reglas ni dependencias.

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