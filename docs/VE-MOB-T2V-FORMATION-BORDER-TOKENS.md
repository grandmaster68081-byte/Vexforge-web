# VE-MOB-T2V — FORMATION PREVIEW BORDER TOKENS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar un delta visual atómico de `ForgeFormationPreview` usando el borde
estándar compartido en todas sus superficies. El cambio conserva la lectura
visual existente y no toca el motor ForgeFormation, los contratos de Battle
Run, Supabase, Auth, economía, rutas, assets ni la web congelada.

## Contrato implementado

- La raíz de la formación usa `VISUAL_TOKENS.border.standard`.
- El sigil de cabecera usa `VISUAL_TOKENS.border.standard`.
- Las tarjetas de formación usan `VISUAL_TOKENS.border.standard`.
- Los paneles de feedback y retry usan `VISUAL_TOKENS.border.standard`.
- Se conservan los colores dinámicos, radios, padding, estados de carga,
  vacío y error, acciones de retry, datos de formación y accesibilidad.

## Guard

- `node scripts/verify-mobile-visual-system.mjs`
- `node --check scripts/verify-mobile-visual-system.mjs`
- `git diff --check`

## Gate de release

No se inicia workflow Android, no se compila APK ni se publica release. La
verificación visual/táctil queda pendiente de una APK autorizada.

## Estado honesto

`IMPLEMENTED_UNVERIFIED`: el cambio está guardado y publicado en `main`, pero
no se eleva a `PASS`, `OPERATIONAL` ni `TIER1_READY` sin evidencia en
dispositivo.