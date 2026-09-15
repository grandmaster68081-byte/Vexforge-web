# VE-MOB-T2V — FORMATION PREVIEW COLOR ROLES

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Eliminar dos literales de color aislados de `ForgeFormationPreview` y
registrarlos como roles de presentación del sistema visual. Se conservan
exactamente los valores existentes y no se altera la formación, los datos
autoritativos ni ninguna acción del jugador.

## Contrato implementado

- El placeholder de arte usa `formation.cardArt.placeholderBackground`.
- El borde del panel de feedback usa `formation.feedback.borderColor`.
- Los valores permanecen estáticos y no se convierten en fuente de estado,
  cartas, reglas, recompensas ni datos de Supabase.
- Se conservan loading, empty, error, retry, radios, bordes, accesibilidad,
  colores dinámicos y zonas de interacción.

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