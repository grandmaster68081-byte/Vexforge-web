## Chat 145 — 2026-08-02 — T9: Observabilidad y hardening pre-lanzamiento — COMPLETADO

**Branch:** main | **Scope:** protección del navegador, diagnóstico local acotado y mensajes seguros de infraestructura

### ✅ Implementación

| Área | Detalle |
|------|---------|
| Headers de Pages | Se añadieron CSP restrictiva compatible con Supabase/WebAssembly, `frame-ancestors 'none'`, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`. |
| Diagnóstico local | El arranque captura `error` y `unhandledrejection` del navegador. Los eventos quedan en un buffer local acotado de 20 entradas; no se envía telemetría, sesiones ni datos a terceros. |
| ErrorBoundary | Los fallos de render se registran mediante el mismo canal local y muestran una explicación segura para el jugador, sin exponer mensajes internos. |
| Errores de infraestructura | El repositorio de economía traduce fallos de red, sesión, permisos y rate limit a mensajes de usuario seguros antes de mostrarlos. |
| Límites de alcance | Se respetan los contratos existentes de RLS, RPCs e idempotencia. No se modificaron economía, combate, esquema, secretos ni se añadió analítica ficticia. |

### Verificaciones

- `npm run build` ✅ 244 módulos, 0 errores TypeScript
- `npx tsc --noEmit -p tsconfig.app.json` ✅
- `git diff --check` ✅
- `_headers` generado en `dist/` con la política activa ✅
- `package-lock.json` sin URLs `package-firewall.replit.local` ✅
- `.nvmrc` raíz: Node 22 ✅

### Estado para la próxima sesión

- **T9** ✅ COMPLETADO — observabilidad local y hardening de navegador aplicados sin telemetría externa.
- **Siguiente:** T10 — Gate final de lanzamiento: reconciliación integral de contratos, chequeos de producción y matriz explícita de go/no-go.
- **Deploy live:** pendiente de la propagación automática de Cloudflare Pages tras el push a `main`.

---

## Chat 144 — 2026-08-02 — T8: Capa audiovisual Tier 1 — COMPLETADO

**Branch:** main | **Scope:** orquestación audiovisual de ForgeFormation, clímax de Boss/Raid y fallback móvil/accesible

### ✅ Implementación

| Área | Detalle |
|------|---------|
| Entrada de Boss/Raid | Cuando el nombre del oponente identifica explícitamente un Boss, Jefe o Raid, ForgeFormation muestra la cortinilla `BOSS ENTRANTE` y sincroniza el sting `sfxBossEncounter` existente. No se altera la simulación ni se infiere contenido de catálogo. |
| Intensidad de combate | El motor procedural recibe la facción del Campeón y ajusta intensidad por el HP de Campeón resultante, conservando las transiciones existentes de intro/mid/last stand. |
| Muerte de Campeón | La cinemática existente queda sincronizada con el SFX `death()` específico, en vez de reutilizar el efecto de eliminación genérico. |
| Efectos reducidos | ForgeFormation respeta `prefers-reduced-motion` al abrirse y ofrece un control `FX COMPLETOS / FX REDUCIDOS`. El Particle Engine reduce arcos, partículas ambientales, entradas, keywords y elimina vibración de pantalla. |
| Compatibilidad | Las cinemáticas ya implementadas de invocación, reserva, ascensión, derrota y scoreboard permanecen intactas. No se crean assets externos ni se modifican contratos, economía o combate. |

### Verificaciones

- `npm run build` ✅ 243 módulos, 0 errores TypeScript
- `npx tsc --noEmit -p tsconfig.app.json` ✅
- `git diff --check` ✅
- `package-lock.json` sin URLs `package-firewall.replit.local` ✅
- `.nvmrc` raíz: Node 22 ✅

### Estado para la próxima sesión

- **T8** ✅ COMPLETADO — clímax audiovisual conectado y fallback de efectos reducidos disponible para móvil/accesibilidad.
- **Siguiente:** T9 — Capa de observabilidad y hardening pre-lanzamiento, empezando por auditoría de telemetría, errores visibles y límites de seguridad sin introducir telemetría ficticia.
- **Deploy live:** pendiente de la propagación automática de Cloudflare Pages tras el push a `main`.

---

## Chat 143 — 2026-08-02 — T7: Cartas, colección y profundidad estratégica — COMPLETADO

**Branch:** main | **Scope:** reconciliación del catálogo vivo, adaptación canónica de combate y lectura estratégica de mazos

### ✅ Verificación de autoridad y catálogo

- El catálogo vivo confirma 127 cartas activas, 4 facciones y 6 rarezas. Los atributos canónicos disponibles son `power`, `affinity`, `prestige`, `charge`, `specialization` y `synergy_json`.
- `card_tags` está vacío en el catálogo actual; no se inventaron arquetipos, cartas, atributos, recompensas ni datos canónicos.
- La fuente autoritativa de PvP define la derivación de estadísticas desde esos cuatro atributos canónicos; el cliente quedó alineado con la misma fórmula.

### ✅ Implementación

| Área | Detalle |
|------|---------|
| Adaptador de combate | `loadPlayerBattleUnits()` ya no intenta leer columnas inexistentes de combate. Deriva HP/ATK/DEF/SPD desde `power`, `affinity`, `prestige` y `charge`, igual que `vexforge_battle_resolve`. |
| Keywords | `Guard`, `Surge`, `Drain` y `Veil` siguen derivándose únicamente de `synergy_json.keywords`; las unidades conservan sus flags de combate existentes. |
| Metadatos de carta | La carga de unidades preserva `specialization` y el `faction_bonus` declarado por la carta para lectura estratégica, sin convertirlo en un multiplicador nuevo no documentado. |
| Deck Builder | Cada carta muestra especialización y keywords oficiales. El panel del mazo presenta afinidad declarada de la facción dominante y patrones de keywords compartidas. |
| ForgeFormation | La previsualización de formación muestra afinidad oficial del Campeón y sinergias de keyword activas, junto al bonus de reserva y la Formación Pura ya existentes. |
| Invariantes | Se añadieron comprobaciones puras para la derivación canónica de estadísticas y la preservación de metadatos estratégicos en una `BattleUnit`. |

### Verificaciones

- `npm run build` ✅ 242 módulos, 0 errores TypeScript
- `npx tsc --noEmit -p tsconfig.app.json` ✅
- `git diff --check` ✅
- `package-lock.json` sin URLs `package-firewall.replit.local` ✅
- `.nvmrc` raíz: Node 22 ✅

### Estado para la próxima sesión

- **T7** ✅ COMPLETADO — catálogo y contratos de colección reconciliados; Deck Builder y ForgeFormation revelan profundidad estratégica basada exclusivamente en datos oficiales existentes.
- **Siguiente:** T8 — Capa audiovisual Tier 1, comenzando por cinemáticas de reserva, bosses, muerte de Campeón y fallback de efectos reducidos sin degradar rendimiento móvil.
- **Deploy live:** pendiente de la propagación automática de Cloudflare Pages tras el push a `main`.

---

## Chat 142 — 2026-08-02 — T6: PvP competitivo y paridad de reglas — COMPLETADO

**Branch:** main | **Commit:** 54f7d24 | **Build:** 0 errores TypeScript | **Scope:** formation snapshots, forfeit autoritativo, QA-filter leaderboard, banner ELO

### ✅ Implementado

#### Supabase — migración 0006_t6_pvp_formation.sql (aplicada en vivo)

| Objeto | Detalle |
|--------|---------|
| `pvp_matches.formation_snapshot_a/b` JSONB | Snapshot de formación del challenger/oponente por batalla |
| `pvp_matches.forfeit_by` UUID | Registra quién abandonó la batalla |
| `players.is_qa` BOOLEAN | Filtra cuentas admin/QA del leaderboard público; UPDATE admin → is_qa=TRUE |
| `vexforge_pvp_store_formation(match_id, formation)` | SECURITY DEFINER — almacena snapshot post-batalla, valida propiedad del match |
| `vexforge_pvp_forfeit(opponent_id, key)` | SECURITY DEFINER — registra abandono, ELO dinámico por diferencia de MMR, idempotente |
| `get_public_pvp_rankings(season_id, limit)` | SECURITY DEFINER — leaderboard QA-filtrado (excluye is_admin/is_qa) |

#### Frontend — src/domains/pvp/repository.ts

| Función | Detalle |
|---------|---------|
| `storeFormationSnapshot(matchId, formation)` | Telemetría silenciosa post-batalla |
| `pvpForfeit(opponentId, key)` | Llama vexforge_pvp_forfeit, retorna elo_change |
| `listPublicRankings(seasonId, limit)` | Llama get_public_pvp_rankings |

#### Frontend — src/routes/PvpRoute.tsx

| Cambio | Detalle |
|--------|---------|
| `pvpFormationRef` | Captura snapshot (champion/vanguard/sentinel/reserve_size) antes de batallar |
| `pvpForfeitKeyRef` | Clave idempotencia generada en handleFormationConfirm para PvP |
| `handleFormationConfirm` | Captura snapshot + key; aplica relics y pasa a ForgeFormationBoard |
| `handleForgeFormationComplete (PvP)` | Almacena snapshot post-match, banner ELO flotante, recarga publicRankings |
| `ForgeFormationBoard onDismiss (PvP)` | Llama pvpForfeit, onLoss(), banner ELO con MMR perdido, recarga rankings |
| `useEffect [seasons]` | Carga publicRankings QA-filtrado al recibir la temporada activa |
| Leaderboard | Usa publicRankings (get_public_pvp_rankings), sin cuentas QA/admin |
| Banner PRE-LANZAMIENTO | Contexto interno QA visible en la sección de rankings |
| Banner ELO flotante | Victoria/Derrota/Forfeit con +/- MMR, auto-dismiss 5s |

### Verificaciones

- `npm run build` ✅ 0 errores TypeScript
- `npx tsc --noEmit -p tsconfig.app.json` ✅
- `git diff --check` ✅
- Columnas pvp_matches confirmadas en Supabase: `formation_snapshot_a`, `formation_snapshot_b`, `forfeit_by` ✅
- RPCs confirmados en Supabase: `vexforge_pvp_store_formation`, `vexforge_pvp_forfeit`, `get_public_pvp_rankings` ✅
- players.is_qa=TRUE para todas las cuentas is_admin ✅
- git push origin main ✅ commit 54f7d24
- `package-lock.json` sin URLs package-firewall.replit.local ✅
- `.nvmrc` raíz: Node 22 ✅

### Estado para la próxima sesión

- **T6** ✅ COMPLETADO — PvP competitivo con formation snapshots, forfeit autoritativo, leaderboard QA-filtrado y banner pre-lanzamiento
- **Siguiente:** T7 — Cartas, colección y profundidad estratégica (reconciliar catálogo vivo, sinergias de formación, Deck Builder con contratos compatibles)
- **Deploy live:** Cloudflare Pages se actualiza automáticamente desde main; sin cambios de infraestructura Supabase adicionales en este lote

---

---

## Chat 140 — 2026-08-02 — T4: Sistema PvE Completo — COMPLETADO

**Branch:** main | **Scope:** Arquetipos de enemigos por tipo, modificadores regionales, sistema de 2 fases para Clan/Event épico+

### ✅ Implementación

#### Nuevo módulo: `src/lib/missionEncounterEngine.ts` (sin cambios DB)

| Feature | Detalle |
|---------|---------|
| `getMissionEncounter(mission)` | API principal — devuelve enemigos, nombre, descripción, modificador regional, config de fases y narrativa |
| Arquetipos por tipo de misión | 12 arquetipos: `pve_patrol`, `pve_elite`, `expedition_scout/ranger/commander`, `event_champion/elite`, `clan_vanguard/warlord`, `dungeon_guardian/boss`, `tutorial_drone` |
| Modificadores regionales | Torres Rúnicas (+12 DEF), Catedral del Alba (+15 ATK/+20 HP), Fortaleza Abisal (-5 SPD), Sombras del Eclipse (+8 ATK/-8 DEF), Reino del Acero (+10 ATK/+8 DEF), Telegram (neutral) |
| `applyRegionalModifier(formation, mod)` | Aplica buff/debuff regional a la FormationState del jugador antes de la batalla |
| `getPhaseConfig(type, difficulty)` | Determina totalPhases, label, curación entre fases y archetype de fase 2 |
| Sistema de 2 fases | Clan epic/legendary + Event epic/legendary + Expedition legendary → 2 fases; fase 2 tiene archetype más fuerte, dificultad legend |
| `applyInterphaseHeal(formation, pct)` | Cura % del HP perdido del Campeón entre fases (20-30% según tipo) |
| `getPhase2Encounter(phaseConfig, id)` | Genera la formación enemiga de fase 2 |

#### Cambios en `src/routes/MissionsRoute.tsx`

| Cambio | Detalle |
|--------|---------|
| Nuevo tipo `BattlePhase` | Añadidos `"phase_transition"` y `"battle_phase2"` |
| Estado T4 | `encounterConfig`, `currentPhase`, `phase2Formation` |
| `handleStartBattle` | Pre-computa `getMissionEncounter()` síncrono para disponibilidad en briefing |
| `handleFormationConfirm` | Aplica `applyRegionalModifier()` a la formación antes de la batalla |
| `handleBattleComplete` | Detecta misiones de 2 fases — en fase 1 va a `phase_transition`, en fase 2/simple reclama recompensas |
| `handlePhase2Complete` | Completa la fase 2 y reclama recompensas |
| `handlePhaseTransitionConfirm` | Avanza de pantalla de transición a `battle_phase2` |
| `MissionBriefing` | Nuevo prop `encounterConfig?` — muestra opponentName archetype, enemyDescription, keywords de enemigo, modificador regional, indicador de 2 fases y narrativa específica por tipo/región |
| Pantalla `phase_transition` | Interstitial animado con: FASE 1 ✓, nombre FASE 2, narrativa, curación del Campeón, modificador regional activo y botón INICIAR FASE 2 |
| Render `battle_phase2` | Segundo `ForgeFormationBoard` con formación curada, archetype de fase 2 y prefijo "FASE 2 ·" en nombre del oponente |

### Tipos de misión → Arquetipos (resumen)

| Tipo | easy/normal | hard | epic | legendary |
|------|-------------|------|------|-----------|
| PvE | pve_patrol | pve_elite | pve_elite | pve_elite |
| Expedition | expedition_scout | expedition_ranger | expedition_ranger | expedition_commander (2 fases) |
| Event | event_champion | event_champion | event_elite (2 fases) | event_elite (2 fases) |
| Clan | clan_vanguard | clan_vanguard | clan_warlord (2 fases) | clan_warlord (2 fases) |

### Verificaciones

- `npm run build` ✅ 241 módulos, 0 errores TypeScript
- `grep -c "package-firewall.replit.local" package-lock.json` = 0 ✅
- `.nvmrc` = 22 ✅
- Misiones PvE (region Telegram) → `pve_patrol`, sin modificador regional ✅
- Misiones Clan (Catedral del Alba) → `clan_vanguard`, +15 ATK/+20 HP al Campeón ✅
- Event epic → `event_elite` + 2 fases + pantalla de transición ✅
- Briefing muestra: opponentName archetype, descripción, keywords, modificador regional, indicador de fases ✅
- Sin cambios en RPCs, ForgeFormationBoard, economía ni ForgeFormation rules ✅

### Estado para la próxima sesión

- **T4** ✅ COMPLETADO — Sistema PvE completo con arquetipos, regiones y fases
- **Siguiente: T5** — PvP autoritativo completo y arena de rangos
- **Deuda técnica:** `enemy_deck_id` de `getMissionEncounter` todavía usa AI decks genéricos del `aiBattleEngine` porque `ForgeFormationBoard` no acepta `opponentUnits` como prop — para un T4.5 optativo se puede añadir este prop y pasar los BattleUnit[] concretos del archetype
- **Deploy:** `dist/` comprometido, Cloudflare Pages se actualiza solo al pushear a main

---

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
