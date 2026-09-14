# VE-MOB-12 — IDENTIDAD HONESTA DEL RANKING EN WORLD

## Alcance

Evitar que el ranking público muestre una fila sin nombre o una temporada
vacía cuando la fuente oficial no resuelve esas cadenas.

## Cambio

- La temporada del encabezado usa `NO CONFIRMADA` cuando `season_key` está
  ausente o vacío.
- El nombre de una fila usa `NOMBRE NO RESUELTO` cuando el RPC oficial de
  nombres no devuelve una cadena utilizable.
- Los nombres siguen llegando desde `get_public_player_names`; no se lee ni se
  inventa una columna `display_name` en `season_rankings`.

No se agregaron jugadores, nombres, temporadas, posiciones, métricas,
consultas, RPCs ni datos locales.

## Evidencia

- La lectura de `season_rankings` confirmó que `display_name` no es una
  columna viva; la resolución oficial se conserva por RPC.
- `node scripts/verify-mobile-world.mjs` OK.
- `git diff --check` limpio.
- No se inicia workflow Android, no se compila APK y no se publica release.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.