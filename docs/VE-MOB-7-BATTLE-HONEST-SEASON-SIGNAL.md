# VE-MOB-7 — SEÑAL HONESTA DE TEMPORADA EN ARENA

## Alcance

Evitar que la tarjeta de rango Android afirme una temporada activa cuando la
respuesta autoritativa todavía está cargando o no entrega `season_id`.

## Cambio

- Durante la carga se muestra `TEMPORADA EN ESPERA · RANGO PvP`.
- Con `season_id` confirmado se conserva `TEMPORADA ACTIVA · RANGO PvP`.
- Sin `season_id` se muestra `TEMPORADA NO REPORTADA · RANGO PvP`.
- MMR, récord y escudos continúan preservando sus señales independientes.

No se añadieron temporadas, MMR, escudos, RPCs, datos, simulaciones, rutas ni
autoridad local. La cuenta QA comprobó una temporada real en la fuente viva,
pero la pantalla también conserva correctamente el estado si esa señal falta.

## Evidencia

- Sesión QA autenticada de solo lectura contra Supabase oficial: `get_player_rank`
  respondió correctamente con `season_id`, MMR y escudos presentes.
- `node scripts/verify-mobile-battle.mjs` OK, 45/45.
- `git diff --check` limpio.
- No se inicia workflow Android, no se compila APK y no se publica release.

## Estado

`IMPLEMENTED_UNVERIFIED`. La QA visual/táctil en dispositivo queda pendiente
para una APK autorizada posteriormente.