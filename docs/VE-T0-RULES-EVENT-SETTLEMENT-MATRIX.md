# VEXFORGE — T0 Rules, Event and Settlement Matrix

**Fecha:** 2026-09-15  
**Unidad:** T0 — `RULES_MATRIX` + `EVENT_MATRIX` + `SETTLEMENT_MATRIX`  
**Estado:** `PREPARED / EVIDENCE_REQUIRED`  
**Entorno activo:** aplicación Android en `mobile/**`  
**Baseline observado:** `main` en `0458a1a7e9487946e9400b40d291fee34095c37b`  
**Fuente activa:** `public.vexforge_official_documents / vexforge_home_world_system_protocol_v3` (`ACTIVE`, V2.2)  
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito y autoridad

Esta matriz cierra la casilla de T0 que exige una `Rules Matrix`, una `Event
Matrix` y una `Settlement Matrix` sin crear un motor paralelo. Une la regla que
se aplica, el evento que la hace auditable y el settlement que puede confirmar
el resultado.

La autoridad es única y está separada por responsabilidad:

- **ForgeFormation v6 / Battle Run v6:** reglas, resolución, outcome, replay y
  estado canónico.
- **Event Contract v6:** secuencia append-only y payload de los eventos
  autorizados.
- **Settlement service:** recompensa, progreso y receipt después del resultado
  canónico; debe ser idempotente bajo concurrencia.
- **Ranking service:** convierte `WIN`, `LOSS` o `DRAW` en rating después del
  outcome; el combate no calcula MMR.
- **Android:** solicita intenciones, muestra el estado recibido y reproduce
  eventos; nunca decide outcome, daño, snapshot final, contribution, XP o
  reward.

Este documento registra contratos y gates. No afirma que el simulator, la APK,
la QA física, el settlement de producción o la evidencia de replay estén
cerrados.

## 2. Estados de esta matriz

| Estado | Significado | Qué no permite |
|---|---|---|
| `PREPARED` | Regla, evento, precondición y bloqueo están identificados. | No permite declarar implementación completa. |
| `EVIDENCE_REQUIRED` | Falta comprobar el recorrido con contratos vivos, replay, concurrencia o dispositivo cuando aplique. | No permite `PASS`, `VERIFIED`, `TIER1_READY` u `OPERATIONAL`. |
| `BLOCKED` | Existe una fuga de autoridad, evento faltante, settlement no idempotente o resultado no confirmable. | No permite presentar éxito ni ocultar el bloqueo. |
| `VERIFIED` | La prueba reproducible pasó contra la versión y release identificados. | Sólo se alcanza con evidencia, no por documentación o compilación. |

## 3. Rules Matrix — regla versionada y autoridad

| ID | Regla / versión | Entrada válida | Autoridad y salida canónica | Evento o evidencia exigida | Bloqueo |
|---|---|---|---|---|---|
| R-01 | Battle Run v6 identifica `rules_version`, `card_rules_version`, `reward_version`, `mission_version`, `battlefield_profile_id` y `battlefield_layout_version`. | Run creado con versiones explícitas. | Servidor fija las versiones antes de resolver; replay usa las mismas versiones. | `BATTLE_CREATED`, `BATTLEFIELD_PROFILE_SELECTED` y snapshot inicial. | Versión ausente, mutable durante el run o replay con reglas distintas. |
| R-02 | Standard deck v6: 1 Champion + 7 Formation Units + 22 Tactical Cards; total 30. | Deck y Champion enviados para validación. | Servidor valida tamaño, Champion, copias y facciones; client sólo solicita. | Validación antes de `READY`; formation snapshot. | Deck ilegal, bypass de ownership o perfil legacy tratado como Standard/ranked. |
| R-03 | Setup canónico: formación, seed server-side, slots Champion/Vanguard/Sentinel, Reserve de 5, mano inicial 5, un Mulligan, Command 1, Round 1. | Deck legal y participantes elegibles. | Battle Run crea snapshots deterministas. | `MULLIGAN_STARTED`, `MULLIGAN_RESOLVED`, snapshot de formación y mano. | RNG del cliente, reserva visible antes de tiempo o setup reconstruido desde UI. |
| R-04 | Formation: un Champion y hasta tres activos; Reserve no ataca, no defiende y no es target activo hasta deploy. | Formation snapshot válido. | ForgeFormation aplica slots y elegibilidad. | `RESERVE_REVEALED`, `RESERVE_SELECTED`, `RESERVE_ACTIVATED` cuando proceda. | Cuarta unidad activa ordinaria o target ilegal aceptado. |
| R-05 | Protección del Champion: protegido si Vanguard o Sentinel está vivo; sólo `BREACH` contractual puede atravesarla. | Target y efecto con reglas de target. | Servidor resuelve legalidad antes del efecto. | `TARGET_LOCKED`, `CHAMPION_EXPOSED` y daño si corresponde. | Cliente habilita target protegido o una cámara/VFX oculta la legalidad. |
| R-06 | Stats derivados siguen el orden: base, Formation, estados temporales, Doctrine, efecto de carta, clamp/round. | Card rules y estado previo. | ForgeFormation calcula y redondea; Android sólo muestra. | Payload de evento de resolución y snapshot resultante. | Stats calculados en render, redondeo alternativo o valor inventado. |
| R-07 | Command es economía táctica; cada coste y límite se valida server-side. | Intención de acción y Command disponible. | Servidor acepta o rechaza la acción y actualiza estado. | `COMMAND_GAINED`, commit/acción y estado posterior. | Command comprable, saldo local o doble consumo. |
| R-08 | Round/Planning/Commit mantienen ventanas y límites explícitos; no se acepta una acción fuera de fase. | Intent con fase, actor y reference estable. | Battle Run controla iniciativa, turno y expiración. | `ROUND_START`, commits, `PHASE_CHANGED`, `ROUND_END`. | Acción fuera de fase, timer visual usado como autoridad o replay divergente. |
| R-09 | RNG es reproducible: seed de 32 bytes server-side, contexto estable y `rules_version`; no se usa RNG local. | Contexto de evento y seed del run. | Servidor genera resultado determinista y registra resumen, no seed secreto innecesario. | `CRIT_ROLLED`, reserve/tie/fatigue event con `rng_context`. | `Math.random`, consumo implícito, seed del cliente o resultado no reproducible. |
| R-10 | Daño canónico: legalidad, ATK efectivo, crítico, Breach, mitigación DEF, Veil, daño final, Drain, evento y estado letal. | Ataque legal y estado vigente. | ForgeFormation resuelve la cadena completa. | `ATTACK_DECLARED`, `TARGET_LOCKED`, `DAMAGE_CALCULATED`, `DAMAGE_APPLIED`, muerte. | Cliente declara daño/HP final, daño truncado o muerte sólo visual. |
| R-11 | Status, poison, healing y State-Based Actions se aplican en orden definido por el engine. | Efecto contractual y target legal. | Servidor muta el snapshot y emite eventos. | `STATUS_APPLIED`, `STATUS_REMOVED`, `HEAL_APPLIED`, `UNIT_KILLED`, `POISON_*` sólo si el contrato lo emite. | UI infiere un efecto por ausencia de evento o cambia un estado recibido. |
| R-12 | Reserve, Reaction, Focus, Doctrine y Champion exposure son ventanas versionadas, no excepciones de pantalla. | Choice permitida dentro de la ventana. | Servidor valida elegibilidad y profundidad máxima. | Commit/resolution y eventos de reveal/activation/exposure. | Stack infinito, elección fuera de ventana o motor alterno por modo. |
| R-13 | Fatigue, Sudden Forge y empate son resultados reales; no se regala una victoria para evitar `DRAW`. | Round, profile y estado final. | Engine produce `DRAW` si ambos Champions siguen vivos tras el límite; ranking decide su tratamiento posterior. | `FATIGUE_TRIGGERED`, `SUDDEN_FORGE_STARTED`, `MATCH_END`. | Resultado forzado por UI, empate convertido en victoria sin regla de ranking o loop silencioso. |
| R-14 | Todos los modos usan el mismo engine y perfiles versionados; PvE/Boss/Raid/Clan War no crean un cuarto slot ordinario ni otro motor. | Mode + profile válidos. | ForgeFormation resuelve; profile cambia presentación/modificadores permitidos. | `BATTLEFIELD_PROFILE_SELECTED` y mismos eventos canónicos. | Fork de combate, profile que cambia outcome fuera de reglas o motor de cliente. |
| R-15 | El cliente puede enviar intención, card, doctrine, focus, reaction, reserve choice y reference; nunca outcome, daño, final snapshot, contribution, XP o reward. | Payload de intención permitido. | Boundary server-side rechaza campos de autoridad. | Log de rechazo seguro si aplica; no se crea evento falso. | Cualquier campo prohibido es aceptado o se ignora silenciosamente. |

## 4. Event Matrix — secuencia auditable e inmutable

### 4.1 Sobre de evento obligatorio

Cada evento canónico debe conservar: `event_id`, `battle_run_id`, `seq`, `round`,
`phase`, `event_type`, `side`, `source_unit_id`, `source_card_id`,
`target_unit_id`, `payload`, `rng_context` cuando aplique y `rules_version`.
Los valores no aplicables permanecen `null`; no se rellenan con IDs ficticios.

| Grupo | Eventos canónicos | Qué prueban | Regla de lectura |
|---|---|---|---|
| Inicio y perfil | `BATTLE_CREATED`, `BATTLEFIELD_PROFILE_SELECTED` | Identidad del run, participantes, modo, versiones y geometría. | El perfil visual no cambia la autoridad de reglas. |
| Mulligan y preparación | `MULLIGAN_STARTED`, `MULLIGAN_RESOLVED` | La única ventana de Mulligan y la mano resultante. | No mostrar cartas definitivas antes de confirmación. |
| Ronda y recursos | `ROUND_START`, `COMMAND_GAINED`, `CARD_DRAWN`, `ROUND_END`, `PHASE_CHANGED` | Orden de ronda, Command, robo y fase. | `seq` define el orden; el timer no lo sustituye. |
| Decisions | `DOCTRINE_COMMITTED`, `FOCUS_COMMITTED`, `TACTIC_COMMITTED`, `REACTION_COMMITTED`, `REACTION_RESOLVED` | Intenciones aceptadas y resolución de ventanas. | Un commit rechazado no se representa como aplicado. |
| Ataque y cálculo | `ATTACK_DECLARED`, `TARGET_LOCKED`, `CRIT_ROLLED`, `DAMAGE_CALCULATED`, `DAMAGE_APPLIED` | Legalidad, RNG, cálculo y daño aplicado. | UI reproduce el payload; no recalcula daño. |
| Estados y muertes | `HEAL_APPLIED`, `STATUS_APPLIED`, `STATUS_REMOVED`, `UNIT_KILLED`, `FATIGUE_TRIGGERED` | Cambios de estado y acciones basadas en estado. | Ausencia de evento significa ausencia de afirmación. |
| Reserve y Champion | `RESERVE_REVEALED`, `RESERVE_SELECTED`, `RESERVE_ACTIVATED`, `CHAMPION_EXPOSED`, `CHAMPION_DEFEATED` | Presión de Reserve, deployment y condición de victoria. | La Reserve permanece oculta hasta el evento autorizado. |
| Cierre de combate | `SUDDEN_FORGE_STARTED`, `MATCH_END` | Resultado de combate y fin del engine. | `MATCH_END` precede al settlement; no otorga recompensa por sí solo. |
| Settlement | `SETTLEMENT_STARTED`, `SETTLEMENT_COMPLETED` | Intento y confirmación de aplicación económica/progreso. | Sólo `SETTLEMENT_COMPLETED` confirma la mutación. |

### 4.2 Inmutabilidad y replay

- El event log es append-only. Una corrección no edita el evento original: añade
  un evento de corrección/reconciliación referenciado.
- `seq` debe ser monotónico dentro del `battle_run_id`; no se acepta una
  secuencia con huecos silenciosos, duplicados ambiguos o payload mutado.
- El replay consume el event stream canónico, el seed permitido y las mismas
  versiones; Android no ejecuta combate en el render thread.
- El techo ranked es de 2048 eventos canónicos. Si una cadena supera el límite,
  el run termina de forma segura como `ERROR_UNSETTLED`; no se trunca para
  inventar un resultado.
- Un evento desconocido o no reportado se conserva como código recibido y no se
  convierte en una animación, target, daño o recompensa inventada.

## 5. Settlement Matrix — resultado, retry y recompensa

El settlement sólo puede iniciar cuando el Battle Run tiene un resultado
canónico y snapshot final válido. `MATCH_END` comunica el cierre del combate;
`SETTLEMENT_COMPLETED` confirma la aplicación persistida.

| Situación / outcome | Precondición canónica | Política de settlement | Rating / progreso | Bloqueo |
|---|---|---|---|---|
| `WIN_A` / `WIN_B` | Champion derrotado o condición de victoria válida; run `RESOLVED`. | Una aplicación idempotente de recompensa, XP y progreso permitidos por versión. | Ranking service calcula cambio desde el outcome; misión deriva de eventos. | Reward antes de settlement, doble claim o outcome desde cliente. |
| `DRAW` | Ambos Champions vivos después de las rondas de Sudden Forge permitidas, o regla equivalente del profile. | Settlement explícito sin convertirlo silenciosamente en victoria. | Ranking define tratamiento de `DRAW`; engine no decide MMR. | “Regalar” una victoria o reescribir el resultado en UI. |
| `ABANDONED_A` / `ABANDONED_B` | Surrender intencional o política de abandono aplicada por servidor. | Registrar el abandono una vez y aplicar la penalización del profile. | Ranking y misión leen el outcome confirmado. | Logout/red presentada como surrender sin regla o penalización local. |
| `TIMEOUT_A` / `TIMEOUT_B` | Timeout repetido o condición de timeout del profile. | Resolver una vez con penalización definida; no duplicar al reconectar. | Ranking service usa el outcome; no se calcula en Android. | Primer timeout convertido automáticamente en derrota si la regla exige AUTO_PASS. |
| `ERROR_UNSETTLED` | Fallo antes de resolución o loop que supera el techo. | Retry seguro; no reward ni progreso definitivo hasta resolver. | Sin MMR ni recompensa por resultado inexistente. | Mostrar victoria, saldo, reward o misión completada. |
| Retry de red | Mismo `battle_run_id` y operación pendiente. | Devuelve el mismo resultado de idempotencia o reanuda el run canónico. | No crea una segunda recompensa. | Nueva mutación por cada tap/reintento. |
| Refresh con run `ACTIVE` | Battle Run vivo y recuperable. | Reanuda el run canónico y consulta el estado; no crea otro. | Conserva el historial de eventos. | Reset local o nuevo seed. |
| Settlement concurrente | Varias solicitudes para el mismo resultado. | Lock/idempotencia del contrato vivo; una sola aplicación persistida. | Receipt, progreso, wallet y reward deben converger. | Dos receipts, saldo duplicado o dos claims. |
| Settlement confirmado | `SETTLEMENT_COMPLETED` persistido y consultable. | Mostrar recompensa, saldo, progreso e historial confirmados. | Ranking/mission/economy leen la fuente correspondiente. | Celebrar antes de la confirmación o usar un campo local como prueba. |

### 5.1 Fronteras que no se mezclan

- El combat engine produce `WIN`, `LOSS`, `DRAW` y outcomes de abandono/timeout;
  el ranking service convierte el outcome en rating.
- `economic_elo` y los campos históricos `elo_change_a/b` no son MMR de combate
  y no forman parte de esta matriz de settlement.
- Las recompensas, XP, misión, wallet y contribución sólo se derivan de eventos
  y contratos autorizados; el cliente no puede declarar ninguno.
- Un receipt o `settlement_id` ausente permanece pendiente; no se sustituye por
  un timestamp, un hash local o un valor cero.

## 6. Gates de verificación

| Gate | Evidencia necesaria | Estado actual |
|---|---|---|
| Rules | Simulator determinista, invariantes, reglas versionadas y cartas competitivas con contrato. | `EVIDENCE_REQUIRED` |
| Events | Event log canónico, secuencia append-only, replay que coincide con snapshot/hash y techo de eventos. | `EVIDENCE_REQUIRED` |
| Settlement | Recorrido end-to-end, concurrencia/idempotencia, retry/recovery, receipt y ausencia de reward prematuro. | `EVIDENCE_REQUIRED` |
| Android renderer | Battle/replay consumen eventos canónicos, sin simulación local ni datos inventados. | `EVIDENCE_REQUIRED` |
| Physical QA | APK autorizada, dispositivo nombrado, touch, legibilidad, performance y release traceable. | `EVIDENCE_REQUIRED` |

## 7. Estado T0

- `RULES_MATRIX`: `PREPARED / EVIDENCE_REQUIRED`.
- `EVENT_MATRIX`: `PREPARED / EVIDENCE_REQUIRED`.
- `SETTLEMENT_MATRIX`: `PREPARED / EVIDENCE_REQUIRED`.
- T0 sigue abierto; esta matriz no promueve T1, T2, `VERIFIED`, `TIER1_READY` ni
  `OPERATIONAL`.
- `PROFILE_HISTORY_STATE_GAP` continúa `BLOCKED`.
- No se modificó `mobile/**`, no se añadieron rutas, cartas, eventos, rewards,
  RPCs, permisos ni datos vivos.
- No se inició workflow Android, no se compiló APK y no se publicó release.
