# VE-PVP-3-OPPONENT-ROSTER — ROSTER PVP CONECTADO A LA FUENTE CANÓNICA

Estado: `IMPLEMENTED_UNVERIFIED` (corregido y verificado en backend con sesión QA real; QA visual en APK pendiente).
Fecha: 2026-09-13. Sesión PVP-only.

## 1. Deuda heredada

`CONTINUITY.md` cerró la sesión anterior con: "el PvP real sigue bloqueado por el
roster vacío (`get_leaderboard` sin rivales)". El bloqueo `UPDATE requires a
WHERE clause` ya quedó resuelto en `VE-PVP-02` (migración `0046`).

## 2. Causa raíz del roster vacío

`listOpponents()` en `src/domains/pvp/repository.ts` consultaba
`get_leaderboard`, que sólo devuelve jugadores con fila en `pvp_rankings`.
Con la temporada activa había una sola fila (la cuenta QA), que además se filtra
por ser el propio jugador → la lista quedaba en cero. Adicionalmente inventaba
`level: 1` y `deck_size: 0`, valores sintéticos prohibidos por la ley de datos honestos.

## 3. Corrección

`listOpponents()` pasa a usar el RPC canónico `public.get_pvp_opponents(p_limit)`
(SECURITY DEFINER), que ya:
- excluye al llamante (`auth.uid()` → `players.id`),
- excluye cuentas admin y de simulación (`VEXFORGE_%`, `SIM_BOT_%`),
- exige mazo real (`player_deck >= 5`),
- ordena por MMR con `COALESCE(mmr, 1000)` para jugadores sin ranking.

`deck_size` y `total_power` se leen de la respuesta; no se fabrica ningún valor.
Sin rivales elegibles, la ruta PvP conserva su estado vacío explícito y no
simula batalla local.

## 4. Evidencia

Sesión autenticada real de la cuenta QA autorizada (contraseña en el almacén de
secretos, nunca en el repositorio) contra el proyecto oficial `rscuzqnfccqvltkdcdny`:

```
POST /rest/v1/rpc/get_pvp_opponents {"p_limit":20}
=> 200 [ {"display_name":"Pavilo20 Opponent","mmr":889,"deck_size":5,"has_deck":true},
         {"display_name":"Pavilo20","mmr":889,"deck_size":5,"has_deck":true} ]
```

Antes de la corrección, la misma sesión obtenía 0 rivales por `get_leaderboard`.

Regresión local: `tsc --noEmit` limpio, `npm run build` correcto.

## 5. Deuda vigente

- `startBattle()` (camino legacy que llama `start_pvp_match`) sigue muerto:
  el RPC es `service_role` únicamente. La UI usa `startRealBattle` →
  `vexforge_battle_resolve`. Pendiente eliminar o endurecer el camino legacy.
- QA visual dentro del APK del ciclo PvP completo.
