# VE-MOB-7 — RESULTADO DE EMPATE CON DATOS HONESTOS

## Alcance

La Arena Android distingue ahora un empate real de una derrota. La decisión se
deriva de la respuesta autoritativa: victoria cuando `you_won` es verdadero,
derrota cuando existe un `winner_id` rival y empate cuando la resolución no
declara ganador.

## Cambio

- El resultado muestra `Empate confirmado` con su estado visual propio.
- El campo de batalla muestra `EMPATE CONFIRMADO POR EL SERVIDOR`.
- El replay y la formación final usan el mismo estado de resultado.
- La práctica `client_ai_v1` conserva sus estados de victoria/derrota y no
  puede producir un empate por esta ruta.

## Límites

- No se infiere un ganador desde turnos, HP, orden local ni datos de cliente.
- No se cambia `vexforge_battle_resolve`, Supabase, RLS, MMR, economía, Auth ni
  el motor de combate.
- No se inicia workflow Android, no se compila APK ni se genera release en este
  bloque.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda móvil debe pasar antes de publicar y la
distinción visual requiere QA en APK cuando la compilación sea autorizada.