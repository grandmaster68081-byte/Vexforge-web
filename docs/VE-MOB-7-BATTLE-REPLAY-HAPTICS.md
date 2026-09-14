# VE-MOB-7 — FEEDBACK HÁPTICO DE REPLAY Y RESULTADO

## Alcance

La lectura del combate y el cierre del resultado ahora mantienen la misma
respuesta táctil intencional que los umbrales de lobby:

- avanzar un turno o abrir el resultado: impacto ligero;
- volver a la Arena desde el resultado: selección ligera.

La respuesta acompaña una transición real de estado. No altera el replay, el
resultado, la resolución ni los datos mostrados.

## Límites

- No se agregan haptics a estados deshabilitados.
- No se usa haptic como sustituto de una respuesta del servidor.
- No se modifica `vexforge_battle_resolve`, Supabase, MMR, economía, Auth ni
  el motor de combate.
- No se compila APK ni se genera release en este bloque.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda local debe pasar y la respuesta táctil
requiere QA en dispositivo cuando la compilación sea autorizada.