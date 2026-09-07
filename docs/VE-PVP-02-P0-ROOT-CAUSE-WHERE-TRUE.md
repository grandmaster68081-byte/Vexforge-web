# VE-PVP-02 — CAUSA RAÍZ AISLADA DEL BLOQUEO P0 PVP (`UPDATE requires a WHERE clause`, SQLSTATE 21000)

Estado: `IMPLEMENTED_UNVERIFIED` (corrección aplicada y backend E2E verificado; QA del APK pendiente).
Fecha: 2026-09-07. Sesión PVP (paquete `VEXFORGE_PVP_BATTLEFIELD_LOVABLE_PACKAGE`).

## 1. Hecho verificado: la protección activa es `safeupdate`

```
pg_roles.authenticator.rolconfig = {session_preload_libraries=supautils, safeupdate, statement_timeout=8s, lock_timeout=8s}
```

`safeupdate` sólo está cargada en el rol `authenticator` (el que usa PostgREST/el
cliente). NO está cargada en la conexión administrativa. Esto explica por qué el
mismo RPC falla desde la app y funciona desde SQL administrativo.

## 2. Reproducción diferencial (evidencia)

Ejecutado por la vía administrativa (sin `safeupdate`), con claim JWT simulado:

```sql
select set_config('request.jwt.claims','{"sub":"<auth_user_id>","role":"authenticated"}',true);
select public.vexforge_battle_resolve('<challenger>','<opponent>','diag-probe-N');
```

Resultado: `ok: true`, con `turns[]` completo, `final_units[]`, `image_url` real
por unidad (`.../vexforge-assets/cards/*.jpg`), formación CAMPEÓN/VANGUARDIA/
CENTINELA y ELO aplicado. El motor de combate NO está roto.

Desde el cliente (rol `authenticator` con `safeupdate`) el mismo RPC devuelve
`{"ok":false,"error":"UPDATE requires a WHERE clause","sqlstate":"21000"}`.

## 3. Causa raíz

Barrido estático de las 348 funciones `sql`/`plpgsql` de los esquemas de
aplicación (`public`, `econ_sim`, `vexforge_audit`, `graphql_public`):
**no existe ningún `UPDATE` sin cláusula `WHERE`**. Todos los aparentes son
`INSERT ... ON CONFLICT DO UPDATE`, que `safeupdate` no bloquea.

El bloqueo lo producen los `UPDATE ... WHERE true`: PostgreSQL constant-folded
elimina el qual `true` del plan `ModifyTable`, y `safeupdate` inspecciona el plan
—no el texto SQL—, por lo que lo interpreta como UPDATE sin WHERE y aborta con
21000. El mismo efecto tendría `WHERE 1=1`.

### Inventario completo de `UPDATE ... WHERE true` (13 sentencias, 9 funciones)

| Función | Tabla | Sentencias |
|---|---|---|
| `update_reward_scaling` | `meta_system_state` | 1 |
| `vexforge_meta_tick` | `meta_system_state` | 1 |
| `economic_brake_check` | `meta_system_state` | 2 |
| `meta_system_tick` | `economy_global_metrics` | 1 |
| `economy_os_orchestrator` | `economy_kernel_state` | 1 |
| `update_market_stability` | `market_dynamic_state` | 1 |
| `mutate_reality` | `world_reality_state` | 4 |
| `sync_to_canonical_reality` | `world_reality_state` | 2 |
| `apply_reality_rules` | (cadena `world_reality_state`) | — |

`update_reward_scaling` era la candidata señalada por la auditoría previa
(`VE-PVP-01`) y queda confirmada como parte del patrón, pero **no es la única**:
la corrección debe cubrir las 13 sentencias o el bloqueo reaparecerá por otra
rama de triggers (`trg_rebalance_pvp`, `trg_kernel_pvp`, `trg_compiler_pvp`,
`trg_self_compile_pvp`, `trg_event_router_pvp`, `trg_pvp_anomaly`, …).

## 4. Corrección acordada (pendiente de aplicar)

Migración `0046_ve_pvp_2_where_true_safeupdate_fix.sql`:
`CREATE OR REPLACE FUNCTION` de las 9 funciones, sustituyendo únicamente
`WHERE true` por un predicado real no plegable sobre la clave primaria de cada
tabla (`WHERE <pk> IS NOT NULL`). No se debilita `safeupdate`, no se altera la
semántica (siguen siendo tablas de estado singleton) y no se toca ninguna regla
de combate.

Prohibido expresamente: desactivar `safeupdate`, envolver el RPC en
`SET session_preload_libraries`, o simular el resultado del combate en cliente.

## 5. Verificación exigida tras la corrección

1. Reproducción con sesión QA autenticada real (secreto `VEXFORGE_QA_PASSWORD`;
   nunca en repositorio ni logs) → `ok:true` desde el cliente.
2. Confirmar ELO, `pvp_matches`, recompensas y `player_progress`.
3. Regresión: `npm run verify:all`, `npm run typecheck`, `npm run build`.
4. Sólo entonces continuar FASES de battlefield (geometría vertical, tres
   posiciones semánticas, `image_url` real, contrato de presentación de 15
   estados).

Hasta esa verificación humana en dispositivo, el estado honesto sigue siendo
`DIAGNOSED_UNFIXED` / `IMPLEMENTED_UNVERIFIED`. No se declara PASS, OPERATIONAL
ni TIER1_READY.

## 6. Aplicación de la corrección

- La migración `0046_ve_pvp_2_where_true_safeupdate_fix.sql` fue aplicada en Supabase oficial mediante la Management API.
- Verificación administrativa posterior: las nueve funciones objetivo contienen `0` ocurrencias de `WHERE true`.
- La reproducción end-to-end con una sesión autenticada de QA y la confirmación de ELO, `pvp_matches`, recompensas y `player_progress` ya fueron completadas; la QA visual/manual del APK sigue pendiente y no se declara `PASS`, `OPERATIONAL` ni `TIER1_READY`.

## 7. Verificación QA end-to-end completada

- La cuenta QA autenticada por Supabase ejecutó `public.vexforge_battle_resolve` contra un oponente real con mazo de cinco cartas.
- Resultado: `ok:true`, motor `vexforge_battle_resolve_v1`, victoria del jugador QA, 5 turnos, 13 unidades finales y 13/13 unidades con `image_url` oficial.
- Repetir la misma clave de idempotencia devolvió el mismo `match_id`, con 5 turnos y 13 unidades, sin crear una segunda resolución.
- Persistencia comprobada: `pvp_matches.status=resolved`, ganador QA, `rewards_json` como objeto, ranking y progreso actualizados.
- La verificación visual/manual dentro del APK sigue pendiente; por eso la unidad permanece `IMPLEMENTED_UNVERIFIED` y no se declara `PASS`, `OPERATIONAL` ni `TIER1_READY`.
