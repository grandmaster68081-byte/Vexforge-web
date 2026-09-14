# VE-MOB-7 — FEEDBACK HÁPTICO DE LOS UMBRALES DE ARENA

## Alcance

Los puntos de decisión principales de Arena Android ahora tienen una respuesta
háptica breve y con propósito:

- seleccionar un rival: `selectionAsync`;
- cancelar el desafío: `selectionAsync`;
- iniciar el combate oficial: impacto medio antes de enviar la resolución.

La respuesta táctil acompaña al estado visual existente de presión, selección,
confirmación y carga. No cambia el resultado del combate.

## Límites

- No se simula una respuesta del servidor con haptics.
- No se activa feedback en controles deshabilitados.
- No se modifica `vexforge_battle_resolve`, Supabase, MMR, economía, Auth ni
  el flujo de replay.
- No se compila APK ni se genera release en este bloque.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda local debe pasar y la respuesta táctil
requiere QA en dispositivo cuando la compilación sea autorizada.