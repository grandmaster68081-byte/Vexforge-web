# VEXFORGE — T0 Android Event Presentation Map

**Fecha:** 2026-09-15  
**Unidad:** T0 — `EVENT_PRESENTATION_MAP`  
**Estado:** `PREPARED / EVIDENCE_REQUIRED`  
**Entorno activo:** aplicación Android en `mobile/**`  
**Baseline observado:** `main` en `deb68a0cc5e5e0a527cf1e2f4cebab4a0efe749b`  
**Fuente activa:** `public.vexforge_official_documents / vexforge_home_world_system_protocol_v3` (`ACTIVE`, V2.2)  
**Hash del protocolo leído:** `828a077428987b2534e3733204ac721ef3073eb7dadf9530a6f46877dd63c503`

## 1. Propósito y autoridad

Este registro formaliza la relación entre el `Event Contract v6` y la presentación
Android permitida. No crea eventos, no decide reglas y no añade una ruta de
combate. Su función es indicar qué puede hacer el renderer cuando recibe un
evento canónico y qué debe permanecer visible como pendiente, error o no
reportado.

La autoridad no cambia:

- ForgeFormation v6 / Battle Run v6 produce el resultado, snapshot y replay.
- El event log canónico es append-only y su `seq` define el orden.
- Settlement sólo confirma recompensa, progreso, wallet o receipt mediante el
  contrato vivo; `MATCH_END` no confirma settlement.
- Android sólo presenta el contrato recibido, input permitido y replay. No
  calcula daño, legalidad, outcome, contribution, XP ni reward.
- La fila ACTIVE de Supabase es la única autoridad normativa. Este documento es
  un espejo operativo de producción, no un protocolo paralelo.

## 2. Estado y regla de evidencia

| Estado | Significado | No permite |
|---|---|---|
| `PREPARED` | El grupo canónico, la señal permitida y el bloqueo están identificados. | Declarar que la APK reproduce el grupo completo. |
| `EVIDENCE_REQUIRED` | Falta correlacionar el stream vivo, replay, reduced-motion, audio, haptics y dispositivo. | `VERIFIED`, `PASS`, `TIER1_READY` u `OPERATIONAL`. |
| `BLOCKED` | El evento no tiene payload suficiente, la fuente no confirma el estado o la presentación podría inventar información. | Animar éxito, daño, recompensa o resultado. |
| `VERIFIED` | Existe evidencia reproducible contra un commit, run, release y dispositivo identificados. | No se alcanza por documentación, typecheck o captura conceptual. |

Esta unidad permanece `PREPARED / EVIDENCE_REQUIRED`. El gate T0 continúa
abierto y `PROFILE_HISTORY_STATE_GAP` continúa `BLOCKED`.

## 3. Sobre canónico y normalización permitida

Cada entrada debe conservar, cuando el contrato la entregue: `event_id`,
`battle_run_id`, `seq`, `round`, `phase`, `event_type`, `side`,
`source_unit_id`, `source_card_id`, `target_unit_id`, `payload`,
`rng_context` cuando aplique y `rules_version`.

- `null` significa no aplicable o no recibido; no se reemplaza por un ID,
  número, fecha, objetivo o resultado ficticio.
- `seq` es la única fuente del orden del replay; un timer o una animación no lo
  sustituye.
- Un evento desconocido se conserva como código recibido y se muestra como
  estado no reconocido/pending hasta que exista un mapping aprobado. Nunca se
  transforma en target, daño, muerte, reward o victoria.
- Una corrección añade un evento de corrección/reconciliación referenciado; no
  se edita el evento original.
- El límite ranked es de 2048 eventos. Si se supera, la presentación conserva
  `ERROR_UNSETTLED`; no trunca el stream para fabricar un final.

## 4. Mapa canónico → presentación permitida

| Grupo / eventos canónicos | Presentación permitida | Fuente que debe existir | Bloqueo / fallback prohibido | Estado |
|---|---|---|---|---|
| `BATTLE_CREATED`, `BATTLEFIELD_PROFILE_SELECTED` | Entrada al Forge Battlefield, identidad del modo/perfil y estado de preparación. El perfil puede cambiar material, acento y tier de efectos, nunca el outcome. | Sobre del evento, `battle_run_id`, modo, versiones y profile identificados. | No mostrar una partida iniciada si falta el run o sustituir el perfil por una escena genérica que cambie semántica. | `PREPARED` |
| `MULLIGAN_STARTED`, `MULLIGAN_RESOLVED` | Ventana de preparación y confirmación de la mano sólo después de la resolución autorizada. | Evento de inicio/resolución y snapshot permitido. | No mostrar cartas definitivas antes de confirmar ni inventar una mano cuando el payload no llega. | `EVIDENCE_REQUIRED` |
| `ROUND_START`, `COMMAND_GAINED`, `CARD_DRAWN`, `PHASE_CHANGED`, `ROUND_END` | Lectura de ronda, fase, Command y robo en el orden recibido; el timer sólo comunica una ventana ya entregada. | `seq`, `round`, `phase` y payload del recurso/evento. | No calcular Command, avanzar la ronda por tiempo local ni usar un contador como autoridad. | `EVIDENCE_REQUIRED` |
| `DOCTRINE_COMMITTED`, `FOCUS_COMMITTED`, `TACTIC_COMMITTED`, `REACTION_COMMITTED`, `REACTION_RESOLVED` | Confirmación diegética de intención aceptada y resolución de la ventana; una intención rechazada no se presenta como aplicada. | Aceptación del servidor, actor, ventana y evento de resolución. | No mostrar commit por el tap local ni simular una reacción ausente. | `EVIDENCE_REQUIRED` |
| `ATTACK_DECLARED`, `TARGET_LOCKED` | Foco de atacante y objetivo legal; telegraph estable, legible y reversible si la resolución posterior lo requiere. | Identidades de source/target, fase y legalidad recibida. | No habilitar ni celebrar un target sólo porque fue dibujado; no ocultar la protección del Champion. | `EVIDENCE_REQUIRED` |
| `CRIT_ROLLED`, `DAMAGE_CALCULATED`, `DAMAGE_APPLIED` | Impacto, crítico y daño únicamente con los valores reportados; feedback audiovisual/háptico ligado al evento real. | Payload de cálculo/aplicación, `rng_context` cuando aplique y snapshot posterior. | No recalcular ATK/DEF, crítico o HP en Android; ausencia de daño permanece `DAÑO NO REPORTADO`. | `EVIDENCE_REQUIRED` |
| `HEAL_APPLIED`, `STATUS_APPLIED`, `STATUS_REMOVED`, `FATIGUE_TRIGGERED` | Cambio de estado y señal de duración/impacto sólo si el evento entrega esa información. | Tipo de estado, unidad objetivo, valor/duración si el contrato lo reporta. | No inferir poison, healing, Veil o fatiga por una animación o por ausencia de evento. | `EVIDENCE_REQUIRED` |
| `UNIT_KILLED` | Estado de unidad caída y lectura persistente durante el turno/replay correspondiente. | Unidad, `seq` y snapshot posterior. | No retirar una unidad por HP calculado localmente ni mostrar muerte si sólo falta arte. | `EVIDENCE_REQUIRED` |
| `RESERVE_REVEALED`, `RESERVE_SELECTED`, `RESERVE_ACTIVATED` | Apertura de Reserve, candidato seleccionado y despliegue en la secuencia autorizada. | Evento específico y unidades/candidate IDs entregados. | No revelar la Reserve antes del evento, no desplegar por tap local y no convertir una reserva vacía en una unidad. | `EVIDENCE_REQUIRED` |
| `CHAMPION_EXPOSED`, `CHAMPION_DEFEATED` | Prioridad visual persistente para exposición y cierre legal del Champion. | Estado de protección/exposición y unidad canónica. | No inferir exposición por una tarjeta visible ni declarar victoria antes de `MATCH_END`. | `EVIDENCE_REQUIRED` |
| `SUDDEN_FORGE_STARTED`, `MATCH_END` | Cambio de fase y resultado recibido; `MATCH_END` cierra el engine pero no confirma recompensa. | Outcome canónico, snapshot final y secuencia completa. | No convertir `DRAW` en victoria, no repetir el final por reentrada y no celebrar reward todavía. | `EVIDENCE_REQUIRED` |
| `SETTLEMENT_STARTED`, `SETTLEMENT_COMPLETED` | Estado pending durante el intento y confirmación de reward/progreso/wallet/receipt sólo al completar. | `settlement_id`/receipt y respuesta idempotente del contrato vivo. | No mostrar reward, XP, saldo o misión completada antes de `SETTLEMENT_COMPLETED`; ausencia de receipt permanece pending. | `EVIDENCE_REQUIRED` |
| Evento desconocido, stream incompleto o `ERROR_UNSETTLED` | Código recibido, estado recuperable y acción de retry/reentrada cuando el contrato lo permita. | Error explícito o stream identificable; no se exige inventar una causa. | No mapearlo a una animación conocida, outcome, daño, reward o éxito genérico. | `BLOCKED` si afecta el resultado |

## 5. Correlación con el renderer Android actual

La implementación actual proporciona evidencia parcial de presentación, no cierre
del mapa:

- `mobile/app/(tabs)/battle.tsx` separa `lobby`, `confirm`, `replay` y
  `result`; reproduce `BattleResult.turns` por `turnIndex`, muestra progreso y
  conserva `reducedMotion`.
- `mobile/components/ForgeBattlefield.tsx` muestra formación, Champion,
  Vanguardia, Centinela, Reserve, unidades caídas, atacante, objetivo, daño
  reportado y outcome recibido. Los valores ausentes permanecen como `NO
  REPORTADO` o `ARTE NO DISPONIBLE`.
- La pantalla actual presenta señales legacy de `BattleTurn.events` como
  `shield_block`, `poisoned`, `poison_tick`, `lifesteal`, `double_strike` y
  `poison_death`. Esas señales no se promueven automáticamente a eventos
  canónicos v6: falta una correlación verificable de sobre, `seq`, versión y
  replay.
- El rail actual `EVENTO NO REPORTADO`, la formación final y el botón de
  resultado son señales honestas de renderer, pero no demuestran settlement ni
  equivalencia byte a byte con un stream canónico.
- La batalla rápida `client_ai_v1` permanece separada como entrenamiento sin MMR;
  no se usa como evidencia de Battle Run autoritativo ni de settlement.

No se cambia código en esta unidad. La correlación anterior identifica el punto
de partida y sus límites para una futura implementación autorizada.

## 6. Motion, audio, haptics y reduced-motion

- Un efecto sólo puede dispararse por un evento recibido y debe poder apagarse
  sin cambiar el estado, el replay, el hash, el outcome o la legalidad.
- `reducedMotion` conserva identidad, legibilidad, orden y funcionalidad; elimina
  o acorta movimiento ornamental, no elimina eventos ni datos.
- Audio y haptics son feedback de presentación. No pueden convertirse en la única
  evidencia de daño, muerte, outcome o reward.
- Un evento pendiente, rechazado o desconocido no recibe una celebración de éxito.
- Cada evidencia futura debe registrar mute, reduced-motion, safe area, lectura
  de cartas, tap/back/retry y recovery de red.

## 7. Gates de verificación

| Gate | Evidencia requerida | Estado |
|---|---|---|
| Contrato | Stream con sobre completo, `rules_version`, `seq` monotónico y tipos v6. | `EVIDENCE_REQUIRED` |
| Renderer | Replay Android que consume eventos sin simular combate ni calcular daño. | `EVIDENCE_REQUIRED` |
| Settlement | `MATCH_END` separado de `SETTLEMENT_COMPLETED`, retry e idempotencia comprobados. | `EVIDENCE_REQUIRED` |
| Estados | Loading, pending, error, empty/unavailable y recovery sin fallback genérico. | `EVIDENCE_REQUIRED` |
| Motion/audio | reduced-motion, mute, haptics y feedback derivado de eventos reales. | `EVIDENCE_REQUIRED` |
| Dispositivo | APK autorizada, instalación, navegación autenticada, touch, legibilidad, FPS, memoria y release traceable. | `EVIDENCE_REQUIRED` |

## 8. Alcance y siguiente paso permitido

- Esta unidad sólo documenta el mapping T0. No modifica `mobile/**`, Supabase,
  Auth, RLS, RPCs, economía, gameplay, assets, rutas ni la web congelada.
- No se inicia workflow Android, no se compila APK y no se publica release.
- La unidad no cierra T0 ni promueve ninguna métrica viva.
- El siguiente paso de implementación requiere seleccionar una unidad Android
  explícita y autorizar el gate de APK/QA si toca `mobile/**`. Mientras esa
  autorización no exista, sólo pueden continuar reconciliaciones documentales
  independientes y honestas.
