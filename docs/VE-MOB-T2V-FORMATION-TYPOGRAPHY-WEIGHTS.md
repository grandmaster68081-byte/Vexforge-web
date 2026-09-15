# VE-MOB-T2V — FORMATION PREVIEW TYPOGRAPHY WEIGHTS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Completar la extracción de la jerarquía tipográfica de
`ForgeFormationPreview` sin cambiar el texto, el tamaño, la legibilidad ni
la semántica de los datos de formación.

## Contrato implementado

- Los pesos de kicker, título, contador, sección, rol, nombre, poder, feedback
  y retry viven en `VISUAL_TOKENS.formation`.
- `ForgeFormationPreview` consume esos pesos en todos los estilos que ya los
  utilizaban.
- Se conservan los pesos efectivos `900` y `800`, tamaños, interlineados,
  tracking, copy, estados de carga/vacío/error y acciones.
- No se añadieron datos, fuentes, assets, rutas, solicitudes ni reglas de
  juego.

## Guard

- `node scripts/verify-mobile-visual-system.mjs`
- `node --check scripts/verify-mobile-visual-system.mjs`
- `git diff --check`

## Gate de release

No se inicia workflow Android, no se compila APK ni se publica release. La
verificación visual/táctil queda pendiente de una APK autorizada.

## Estado honesto

`IMPLEMENTED_UNVERIFIED`: la extracción queda preparada para QA en dispositivo
y no se eleva a `PASS`, `OPERATIONAL` ni `TIER1_READY`.