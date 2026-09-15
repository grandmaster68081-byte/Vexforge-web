# VE-MOB-T2V — PROFILE MODAL CONTENT TOKENS

**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** Android `mobile/` únicamente  
**Protocolo vivo:** `vexforge_home_world_system_protocol_v3` (`ACTIVE`)  
**Fase:** `T2V`, subfase dependiente de T2

## Objetivo

Cerrar un delta visual atómico del contenido del modal de Perfil, después de
centralizar su armazón. El cambio registra la jerarquía tipográfica, la lista
de resultados, las placas métricas y el cierre de sesión sin tocar datos,
navegación, estados, contratos de Supabase, Auth, economía, gameplay, assets o
la web congelada.

## Contrato implementado

- `VISUAL_TOKENS.profileModal.content` registra los tamaños y separaciones del
  encabezado, copy, estados pendientes, filas, ranking y cierre de sesión.
- `profile.tsx` consume esos roles para el contenido de los paneles de Perfil.
- Se conservan exactamente los valores visuales previos, el copy, los
  `testID`, la accesibilidad, la fuente de datos viva y las acciones existentes.
- El bloque sigue siendo sólo de presentación: no produce métricas, resultados,
  recompensas, identidad ni estado autoritativo.

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