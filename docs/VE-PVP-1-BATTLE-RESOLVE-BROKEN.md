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

---

## Actualización 2026-09-07 (sesión 2) — CAUSA RAÍZ CONFIRMADA

Estado: `ROOT_CAUSE_CONFIRMED / NOT_FIXED`. No se declara PASS ni OPERATIONAL.

### Método

Se volcó `pg_get_functiondef('public.vexforge_battle_resolve')` (1157 líneas)
desde el proyecto oficial `rscuzqnfccqvltkdcdny` y se reprodujo el RPC por SQL
con claims JWT de la cuenta QA autorizada (`sub` =
`a70f8be8-15b5-4634-9b0d-6202bb41491c`), tanto como `postgres` como con
`SET LOCAL ROLE authenticated`.

### Hallazgos

1. **No existe ningún `UPDATE`/`DELETE` sin `WHERE`.** Las tres escrituras del
   RPC (`player_progress` x2 y los upserts de `pvp_rankings`) llevan `WHERE`
   por `player_id` / `ON CONFLICT (season_id, player_id)`. Tampoco lo tienen
   los 16 triggers de `pvp_matches` ni `safe_wallet_transaction`. El mensaje
   `UPDATE requires a WHERE clause` (sqlstate 21000) registrado en la sesión
   anterior no es reproducible hoy y queda descartado como causa.

2. **Causa raíz real (reproducible, fase 16 del RPC):**

```
select public.vexforge_battle_resolve(<QA>, 09f80fb9-..., 'diag_<ts>')
=> { "ok": false,
     "error": "invalid input value for enum ledger_entry_type: \"in\"",
     "sqlstate": "22P02" }
```

   El RPC llama `public.wallet_tx(..., p_direction => 'in', ...)`, que delega en
   `public.safe_wallet_transaction`, y ésta hace `p_direction::ledger_entry_type`
   al insertar en `economy_ledger`. El enum `ledger_entry_type` **no** contiene
   `'in'`; sus valores son: `credit, debit, reserve, release, burn, fee, reward,
   purchase, transfer, mission_reward, combat_reward, market_buy, market_sell,
   market_fee, fusion, withdrawal_request, withdrawal_approved,
   withdrawal_rejected, pack_purchase`.

   Consecuencia: el `INSERT` en `pvp_matches` y los upserts de ranking ocurren,
   pero la transacción entera aborta en el pago de recompensas y el
   `EXCEPTION WHEN OTHERS` devuelve `ok:false` con 200, por lo que la UI
   (`startRealBattle`) sólo muestra texto crudo. Ninguna batalla se completa.

3. Datos comprobados: los 15 jugadores tienen `player_wallet`, así que
   `WALLET_NOT_FOUND` no es un riesgo activo; la deriva de mazos vacíos en
   `get_pvp_opponents` sigue vigente.

### Orden de trabajo (siguiente sesión, sin re-diagnóstico)

1. Migración `supabase/migrations/0044_ve_pvp_1_battle_resolve_ledger_enum.sql`:
   redefinir `vexforge_battle_resolve` cambiando ambas llamadas
   `wallet_tx(..., 'in', ...)` por el valor de enum válido
   (`'combat_reward'`, o `'credit'` si se prefiere el genérico), sin tocar el
   resto del cuerpo. No silenciar el sqlstate.
2. Re-ejecutar el RPC con la cuenta QA hasta obtener `ok:true`, `match_id`,
   `turns` y delta de ELO reales, y confirmar la fila en `economy_ledger`.
3. Migrar `listOpponents()` a `get_pvp_opponents`, retirar `startBattle()`.
4. Sembrar mazos reales o excluir del matchmaking a jugadores sin mazo.
5. Cierre en `CONTINUITY.md` sólo con evidencia de batalla real en vivo.
