# VE-PVP-4-LEGACY-START-RETIRED — 2026-09-14

## Problema

`src/domains/pvp/repository.ts` mantenía dos caminos de combate PvP:

1. `startBattle(opponentId)` → RPC `start_pvp_match(p_a, p_b)`.
2. `startRealBattle(opponentId)` → RPC `vexforge_battle_resolve`.

El primero estaba muerto por construcción: `start_pvp_match` sólo tiene
`EXECUTE` para `service_role`, por lo que desde el navegador siempre devolvía
permiso denegado; además no produce log de turnos, recompensas ni ELO real.
Mantenerlo abría la puerta a que una pantalla futura lo invocara y mostrara un
resultado de batalla inexistente.

Adicionalmente, `listOpponents()` seguía emitiendo `level: 1`, un valor
sintético prohibido por la ley de datos honestos.

## Cambio

- Eliminado `startBattle()` y los tipos muertos `BattleResult` / `BattleTurn`.
  El único punto de entrada de combate PvP en la web es `startRealBattle()`
  → `vexforge_battle_resolve` (motor autoritativo, valida identidad, escribe
  `pvp_matches`, MMR y recompensas).
- `BattleOpponent` pierde `level` y gana `wins` / `losses`. Todos los campos
  provienen de `get_pvp_opponents`: `display_name`, `deck_size`, `mmr`,
  `wins`, `losses`. Sin valores inventados.
- Nueva guardia `scripts/verify-pvp-authority.mjs` (6/6 OK): prohíbe volver a
  llamar `start_pvp_match`, prohíbe reintroducir `startBattle`, exige
  `get_pvp_opponents`, prohíbe `level: 1` y exige `vexforge_battle_resolve`.

## Verificación (cuenta QA real, proyecto oficial `rscuzqnfccqvltkdcdny`)

- `tsc --noEmit -p tsconfig.app.json`: limpio.
- `npm run build`: correcto (`PvpRoute` 173.74 kB).
- `node scripts/verify-pvp-authority.mjs`: 6/6 OK.
- Sesión QA (`cristiangalvez815@gmail.com`, `players.id`
  `785dc2a7-acd9-4bed-9559-11fd771add80`):
  - `get_pvp_opponents` → 2 rivales con `deck_size: 5`, `has_deck: true`.
  - `vexforge_battle_resolve` → `{"ok": true, "engine":
    "vexforge_battle_resolve_v1", "match_id":
    "05e0d868-0c70-4cfd-be17-e9c2567bb046", "you_won": true, "total_turns": 1}`.
  - `pvp_matches` bajo RLS del jugador devuelve el combate con
    `status: resolved` y ganador correcto → el historial de la Arena se
    alimenta de datos reales.

## Nota abierta

- `elo_change: 0` en la prueba porque la cuenta QA tiene `mmr = 9999` (tope);
  el rival sí se movió 889 → 857. No es un fallo del camino de combate, pero
  conviene revisar el tope de MMR de cuentas QA en un bloque aparte.
- `total_turns: 1`: el motor resolvió en un turno por la diferencia de poder.
  Pendiente confirmar visualmente el replay multi-turno en pantalla.
