# VE-PVP-1-BATTLE-RESOLVE-BROKEN — DIAGNOSED / NOT_FIXED

Fecha: 2026-09-07. Clasificación: AUDITORÍA (PVP roto).
Estado: `DIAGNOSED_UNFIXED`. No se declara PASS ni OPERATIONAL.

## Evidencia real (no simulada)

Sesión autenticada emitida contra el proyecto oficial
`rscuzqnfccqvltkdcdny` con la cuenta QA autorizada
`cristiangalvez815@gmail.com` (contraseña guardada como secreto
`VEXFORGE_QA_PASSWORD`, nunca en el repositorio).

- `auth_user_id` QA: `a70f8be8-15b5-4634-9b0d-6202bb41491c`
- `players.id` QA: `785dc2a7-acd9-4bed-9559-11fd771add80`

### 1. Fallo bloqueante del motor PVP

```
POST /rest/v1/rpc/vexforge_battle_resolve
{ p_challenger_id: <QA>, p_opponent_id: 09f80fb9-42cb-434b-b56f-a27cadf5597a,
  p_idempotency_key: qa_test_<ts> }
=> { "ok": false, "error": "UPDATE requires a WHERE clause", "sqlstate": "21000" }
```

El RPC devuelve 200 con `ok:false`, por lo que la UI (`startRealBattle` en
`src/domains/pvp/repository.ts`) sólo muestra el texto crudo del error y la
batalla nunca ocurre. Ninguna batalla PVP puede resolverse hoy en producción.

Causa a confirmar en la siguiente pasada: dentro del cuerpo de
`public.vexforge_battle_resolve` (SECURITY DEFINER, plpgsql) existe al menos
un `UPDATE`/`DELETE` sin `WHERE` (o con `WHERE` sobre variable NULL que el
guard `safeupdate` rechaza) en la fase de escritura posterior a la
simulación de combate — las fases 0..7 (freno de emergencia, auth,
idempotencia, temporada, MMR, cargas de mazo) se ejecutan sin error.
El error `21000` se captura por el `EXCEPTION` del propio RPC y se devuelve
como `ok:false`, por lo que no aparece en logs de PostgREST.

### 2. Permisos verificados (no son la causa)

`authenticated` tiene EXECUTE sobre `vexforge_battle_resolve`,
`vexforge_pvp_forfeit`, `vexforge_pvp_store_formation`,
`get_pvp_opponents`, `get_leaderboard`, `get_public_player_names`,
`get_public_pvp_rankings`. `start_pvp_match` y `resolve_pvp_match` son
`service_role` únicamente: por eso `startBattle()` (camino legacy en
`repository.ts`) también falla desde el cliente y debe considerarse muerto.

### 3. Deriva de datos detectada

- Todos los oponentes devueltos por `get_pvp_opponents` tienen
  `deck_size: 0` y `has_deck: false`. Aunque el motor arregle el UPDATE,
  las batallas se resolverán contra mazos sintéticos, no reales.
- `players` no tiene columnas `mmr` ni `level` (el MMR vive en
  `pvp_rankings`); cualquier código que las lea fallará con `42703`.
- `listOpponents()` usa `get_leaderboard` en lugar del canónico
  `get_pvp_opponents`, y fija `level: 1`, `deck_size: 0`.

## Orden de trabajo para la próxima sesión

1. Volcar `pg_get_functiondef('public.vexforge_battle_resolve')` completo y
   localizar el `UPDATE`/`DELETE` sin `WHERE` en la fase de escritura
   (pvp_matches / pvp_rankings / players / player_currencies / xp).
2. Migración `supabase/migrations/00XX_ve_pvp_1_battle_resolve_where.sql`
   que redefina el RPC con `WHERE` explícito por `id`/`player_id` y no
   silencie el sqlstate.
3. Repetir la prueba autenticada con la cuenta QA hasta obtener
   `ok:true`, `match_id`, `turns` y delta de ELO reales.
4. Migrar `listOpponents()` a `get_pvp_opponents` y retirar `startBattle()`.
5. Sembrar mazos reales para los oponentes de entrenamiento o excluir a los
   jugadores sin mazo del matchmaking.
6. Registrar cierre en `CONTINUITY.md` sólo con evidencia de batalla real.
