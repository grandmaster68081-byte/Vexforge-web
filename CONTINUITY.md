## Chat 139 — 2026-08-02 — T2: ForgeFormation motor de reglas — COMPLETADO

**Branch:** main | **Scope:** protección del Campeón, reserva efectiva, reemplazos e invariantes

### ✅ Implementación

- El simulador compartido acepta reglas de modo para resolver targeting, muertes, reemplazos y terminación anticipada sin alterar el comportamiento por defecto de la IA.
- ForgeFormation protege al Campeón mientras exista Vanguardia o Centinela vivos; si ambos apoyos caen, el Campeón queda expuesto.
- Una unidad de apoyo destruida activa un reemplazo de la Reserva dentro de la simulación; Vanguardia prioriza DEF y Centinela prioriza ATK, conservando el resto de la Reserva.
- La muerte del Campeón detiene inmediatamente la batalla aunque aún queden unidades de apoyo vivas.
- El estado final conserva HP, alive, ranuras activas, reemplazos consumidos y Reserva restante.
- Se añadió un módulo de invariantes puras para validar selección de Campeón, bonus de Reserva, protección y prioridad de reemplazos sin red, timers ni escrituras de producción.

### Verificaciones

- `npm run build` ✅ 240 módulos, 0 errores TypeScript
- `npx tsc --noEmit -p tsconfig.app.json` ✅
- `git diff --check` ✅
- Invariantes ForgeFormation: 8/8 ✅
- `package-lock.json` sin URLs `package-firewall.replit.local` ✅
- `.nvmrc` raíz: Node 22 ✅

### Estado para la próxima sesión

- **T2** ✅ COMPLETADO — motor de reglas ForgeFormation con invariantes verificables
- **Siguiente:** T3 — vertical slice PvE de una misión completa con Battle Run y settlement autoritativo
- **Deploy live:** queda sujeto a la propagación externa de Cloudflare Pages; este lote no modifica RPCs ni contratos de Supabase.

## Chat 138 — 2026-08-02 — T1-H: Contrato autoritativo PvP battle resolve — COMPLETADO

**Branch:** main | **Scope:** vexforge_battle_resolve — batalla PvP idempotente, ELO, recompensas

### ✅ Diagnóstico real verificado

- `vexforge_battle_resolve` **no existía** en el schema cache de Supabase.
- `supabase.rpc('vexforge_battle_resolve', {...})` fallaba silenciosamente para todos los PvP.
- Los 2 pvp_matches existentes tenían winner=null y elo=0 (nunca hubo settle real).
- Solo 1 jugador tiene mazo real en player_deck: `785dc2a7` (owner/QA).
- pvp_rankings tiene solo 1 entrada (owner con mmr=9999 fixture).
- Columnas reales de cartas: `power, affinity, prestige, charge, synergy_json` (NO atk/def/spd/hp).
- `wallet_tx` es una función PL/pgSQL (PERFORM), no una tabla ni RPC REST.

### ✅ Implementación

| Objeto | Estado |
|--------|--------|
| `_vexforge_gen_synthetic_deck(mmr, side)` | ✅ Creada — deck sintético escalado a MMR cuando jugador no tiene cartas |
| `vexforge_battle_resolve(challenger_id, opponent_id, key)` | ✅ Creada — contrato completo autoritativo |
| Constraint `pvp_rankings_season_player_unique(season_id, player_id)` | ✅ Añadida para ON CONFLICT en upsert |

### Detalles del contrato vexforge_battle_resolve

- **Auth:** challenger debe ser `auth.uid()` — `p_challenger_id` se valida contra la sesión real.
- **Idempotencia:** `pvp_matches.reference_id = p_idempotency_key` — mismo key retorna resultado cacheado.
- **Stats:** derivadas de `power * 4 + affinity` (hp), `power + affinity/4` (atk), `prestige*2 + affinity/8` (def), `charge*4 + affinity/10` (spd).
- **ForgeFormation:** Champion identificado por `is_champion=true`; deck bonus (+1.2 ATK, +0.8 DEF, +5 HP × reserve); Pure bonus (+15% si misma facción en 3 activas).
- **Keywords:** Guard (target priority), Surge (spd+20), Drain (lifesteal 30%), Veil (absorbe 1 golpe).
- **Combate:** máx 30 rounds, champion death = derrota inmediata; desempate por HP total.
- **ELO:** K=32, fórmula estándar, floor MMR=100.
- **Recompensas:** ganador +50 VEX ingame + 100 XP; perdedor +5 VEX ingame + 20 XP (via wallet_tx + player_progress).
- **Logros:** `fn_check_and_grant_achievements(challenger_id)` al terminar.
- **Retorno:** JSON compatible con RealBattleResult: `{ok, match_id, winner_id, you_won, elo_change, total_turns, turns[], final_units[], engine}`.

### Verificaciones

- `npm run build` ✅ 240 módulos, 0 errores TypeScript
- `git diff --check` ✅
- Función `vexforge_battle_resolve` creada (36881 chars) ✅
- Función `_vexforge_gen_synthetic_deck` creada (1923 chars) ✅
- Deploy via Supabase Management API `/v1/projects/rscuzqnfccqvltkdcdny/database/query` ✅ (201)
- GRANTs: `authenticated` ✅, `anon` ❌, `service_role` ✅
- Migración reproducible en `backend/sql-migrations/T1-H-pvp-battle-resolve.sql` ✅

### Estado para la próxima sesión

- **T1-H** ✅ COMPLETADO — contrato autoritativo e idempotente de PvP
- **Siguiente:** T2 — ForgeFormation completo como motor de reglas (verificar protección del Campeón en todos los estados, reserva efectiva, reglas de reemplazo, invariantes)
- **Nota:** Solo 1 jugador tiene mazo real (owner). Para probar PvP real se necesitan al menos 2 jugadores con decks.
- **Deploy live:** Cloudflare Pages — la RPC existe en Supabase, no requiere cambios de código frontend.

---

## Chat 137 — 2026-08-02 — T1-G: Contrato autoritativo de Raids — COMPLETADO

**Branch:** main | **Scope:** listar + unirse + contribuir + completar + recompensas

### ✅ Estado real verificado

- La auditoría viva corrigió el plan histórico: no existe `raids`; el contrato canónico usa `raid_runs`, `raid_participants` y `raid_rewards`, con 3 raids y 3 participantes existentes.
- `vexforge_join_raid(uuid)` ahora bloquea la fila de `raid_runs` antes de contar plazas, conserva la unicidad `(raid_run_id, player_id)`, es idempotente y reactiva correctamente una participación marcada `left`.
- `vexforge_contribute_raid(uuid, bigint)` rechaza contribuciones nulas o no positivas, bloquea raid y participante, limita cada aporte a `10000` y evita intercalarse con una finalización.
- `vexforge_complete_raid(uuid)` queda restringida a `service_role` para automatización confiable; bloquea el raid, devuelve éxito idempotente para un raid ya completado, reparte VEX proporcionalmente y marca las participaciones como `rewarded`.
- La finalización también acredita XP proporcional, actualiza `player_progress` bajo bloqueo del jugador y registra la recompensa XP en `raid_rewards`. No se reutilizó el helper global `add_player_xp` porque su llamada live a `emit_game_event` no coincide con la firma vigente.
- Las tres RPCs tienen `SECURITY DEFINER`, `SET search_path = public, pg_temp` y sólo `join/contribute` están disponibles para `authenticated`; `complete` queda sólo para `service_role`.
- Migración reproducible publicada: `backend/sql-migrations/T1-G-raid-contract.sql`.

### Verificaciones

- `npm run build` ✅ 240 módulos, 0 errores TypeScript
- `git diff --check` ✅
- Join: `anon` ❌, `authenticated` ✅, `service_role` ✅
- Contribute: `anon` ❌, `authenticated` ✅, `service_role` ✅
- Complete: `anon` ❌, `authenticated` ❌, `service_role` ✅
- Join sin sesión devuelve `Not authenticated` ✅
- Contribuciones `0` y `NULL` devuelven `Invalid contribution` ✅
- Datos preservados durante probes: 3 raids, 3 participantes, 0 recompensas nuevas, 0 entradas de ledger de raids ✅
- Definición live confirma locks, idempotencia de finalización y actualización de `player_progress` ✅

### Estado para la próxima sesión

- **T1-G** ✅ COMPLETADO — contrato autoritativo e idempotente de Raids
- **Siguiente:** T1-H — auditar el flujo PvP autoritativo, resultados y recompensas
- Deploy live: T1-F pendiente de propagación externa de Cloudflare Pages

## Chat 136 — 2026-08-02 — T1-F: Ataque autoritativo de World Bosses — COMPLETADO

**Branch:** main | **Scope:** daño compartido + encuentros + recompensas + identidad autenticada

### ✅ Estado real verificado

- La auditoría confirmó que `vexforge_attack_world_boss(uuid, bigint)` ya era la RPC canónica: deriva el jugador desde `auth.uid()`, bloquea la fila del boss con `FOR UPDATE`, calcula el HP restante desde encuentros completados y liquida VEX/shards mediante `wallet_tx`/`economy_ledger`.
- Se añadió validación explícita para daño nulo o no positivo, preservando el límite por `power_level` y el HP restante.
- La función legacy `attack_world_boss(uuid, uuid)` aceptaba `p_player_id` desde el caller; quedó revocada para `PUBLIC`, `anon` y `authenticated`, conservándose sólo para `service_role` por compatibilidad operativa.
- El cliente ya usa exclusivamente `vexforge_attack_world_boss` después de una victoria real de `ForgeFormationBoard`; no se creó un flujo paralelo ni se modificaron fórmulas de recompensa, bosses, cartas o economía.
- Migración reproducible publicada: `backend/sql-migrations/T1-F-world-boss-contract.sql`.

### Verificaciones

- `npm run build` ✅ 240 módulos, 0 errores TypeScript
- `git diff --check` ✅
- RPC canónica: `anon` ❌, `authenticated` ✅, `service_role` ✅
- RPC legacy: `anon` ❌, `authenticated` ❌, `service_role` ✅
- Probes de daño `0` y `NULL` devuelven `Invalid damage` ✅
- Deploy live: T1-F pendiente de propagación externa de Cloudflare Pages

### Estado para la próxima sesión

- **T1-F** ✅ COMPLETADO
- **Siguiente:** T1-G — contratos de Raids
- **M2** pendiente — cinemáticas de batalla al siguiente nivel


## Chat 124 — 2026-08-01 — P4: Reliquias con efectos reales sobre el Campeón — COMPLETADO

**Branch:** main | **Base:** `8646bbf` | **Build:** ✅ `npm run build` limpio, 238 módulos, 0 errores TS

### ✅ Infraestructura Supabase (sesión anterior, ya confirmada)

| Objeto | Estado |
|--------|--------|
| Tabla `player_relics` | ✅ Creada con RLS |
| Políticas RLS (SELECT, INSERT, UPDATE) | ✅ Activas |
| RPC `grant_starter_relics()` | ✅ Creada + GRANT authenticated |
| RPC `equip_relic(UUID)` | ✅ Creada + GRANT (máx. 3 equipadas) |
| RPC `unequip_relic(UUID)` | ✅ Creada + GRANT |

### ✅ Implementación frontend P4

| Archivo | Cambios |
|---------|---------|
| `src/lib/forgeFormation.ts` | `EquippedRelic` interface + `applyRelicEffects(formation, relics)` — aplica 12 effect_types en combate |
| `src/domains/relics/repository.ts` | `PlayerRelic` type + CRUD de reliquias |
| `src/routes/RelicsRoute.tsx` | UI completa: catálogo, equipar/desequipar, contador X/3, kit inicial, filtros |
| `src/components/battle/ForgeFormationBoard.tsx` | Prop `equippedRelics?: EquippedRelic[]` + HUD de reliquias activas |
| `src/routes/PvpRoute.tsx` | Carga reliquias equipadas, aplica `applyRelicEffects`, pasa al board |
| `src/routes/RaidsRoute.tsx` | Mismo patrón |
| `src/routes/WorldBossesRoute.tsx` | Mismo patrón |

---

## Chat 123 — 2026-08-01 — Corrección normativa: autonomía técnica y calidad Tier 1

**Branch:** main | **Base:** `a271f38`
- Protocolo Maestro actualizado con directiva de autonomía técnica completa
- IA autorizada a crear infraestructura necesaria autónomamente

---

## Chats anteriores (resumen)

- **Chat 122** — P3: WorldBosses con ForgeFormation, terrain particles, Shield Arc
- **Chat 121** — P2: Raids con ForgeFormation real
- **Chat 120** — P1: Identidad audiovisual por carta (elemento, tipo, poder, personalidad)
- **Chat 119** — H4: Post-battle scoreboard, H2/H3: Target Lock + Terrain Particles
- **Chat 118** — H1: Shield Arc enhanced, I1: responsive cards
- **Chat 117** — ForgeFormation completado (champion summon cinematic, rage system, ascension)
- **Chat 116** — ChampionSummonCinematic keyword FX + image_url, per-card motto system
- **Chat 115** — Rewards IA anti-farm, daily cap, claim RPC
- **Chats 100-114** — Base del juego: auth, cards, deck builder, pvp, raids, shop, economy, etc.
## Chat 140 — 2026-08-02 — T3: Vertical slice PvE — ForgeFormation battle flow — COMPLETADO

**Branch:** main | **Scope:** flujo completo de misión con ForgeFormationBoard y settlement autoritativo

### ✅ Implementación

- **MissionsRoute.tsx**: botón "Iniciar Batalla" lanza flujo T3 completo (ya no auto-ejecuta sin combate)
- **MissionBriefing**: pantalla narrativa cinematográfica — misión, región, enemigo IA, energía requerida, recompensas, recordatorio ForgeFormation
- **FormationSelector**: selección de Campeón/Vanguardia/Centinela con reliquias equipadas aplicadas
- **execute_mission RPC**: llamado ANTES del combate para descontar energía y crear mission_run en `pending`
- **ForgeFormationBoard**: combate ForgeFormation real — dificultad derivada del campo `difficulty` de la misión
- **VictoryScreen**: `claim_mission_reward` autoritativo + desglose animado de XP/VEX ganados
- **DefeatScreen**: mensaje diferenciado según causa (campeón caído vs derrota) + opción reintento
- **repository.ts**: `startMissionRun()` separado de claim; `getCurrentPlayerId` exportado
- **useMissions.ts**: `recordBattleComplete()` para actualizar session stats desde la ruta
- **Mapeo de dificultad**: easy→easy, normal→easy, hard→normal, epic→expert, legendary→legend (PvE más accesible)

### Cobertura T3 (según protocolo)

| Caso | Cubierto |
|------|----------|
| Victoria | ✅ claim_mission_reward + VictoryScreen + session stats |
| Derrota | ✅ DefeatScreen (energía ya gastada) |
| Campeón caído | ✅ championDied=true → mensaje específico |
| Abandono/dismiss | ✅ handleBattleDismiss → DefeatScreen |
| Energía insuficiente | ✅ MissionBriefing bloquea el botón + error en startMissionRun |
| Cooldown activo | ✅ MissionCard bloquea el botón (existente) |
| Doble reclamación | ✅ claim_mission_reward idempotente (T1-C) |
| Error de red | ✅ errores propagados a setBattleError → mostrados en briefing |

### Verificaciones

- `npm run build` ✅ 241 módulos, 0 errores TypeScript
- `git diff --check` ✅
- `grep -c "package-firewall.replit.local" package-lock.json` → 0 ✅
- `.nvmrc` raíz: Node 22 ✅
- Commit: `da3feab`

### Estado para la próxima sesión

- **T3** ✅ COMPLETADO — vertical slice PvE con ForgeFormation real, settlement autoritativo y screens de resultado
- **Siguiente:** T4 — extender el vertical slice a todo el contenido PvE (misiones elite, expediciones, dungeons, eventos, patrones de enemigos, fases, modificadores regionales)
- **Deploy live:** queda sujeto a propagación externa de Cloudflare Pages (no se modificó infraestructura Supabase en este lote)
