# VE-P0 — Vertical Battle Slice

## Estado

`IMPLEMENTED_UNVERIFIED` — contrato P0.0 registrado y conectado al orquestador audiovisual existente. La QA final de navegador, dispositivo, rendimiento y deploy queda expresamente pendiente.

## Fuente autoritativa

La única entrada del adaptador es `RealBattleResult`, incluyendo `turns`, `final_units`, `ok` y `you_won`. La capa traduce eventos a estados temporales; no decide daño, victoria, settlement, recompensas, energía, MMR, permisos ni resultados.

## Contrato de estados

El contrato `ve-p0-presentation-v1` cubre `intro`, `formation_ready`, `summon`, `idle`, `target_lock`, `anticipation`, `attack`, `impact`, `damage`, `keyword`, `death`, `reserve_entry`, `victory`, `defeat` y `reconnect`. `boss_phase`, `reserve_entry` y `reward` quedan en el vocabulario para integraciones futuras, pero no se emiten sin una fuente de datos explícita.

Cada paso declara entrada, permanencia, salida, cancelación, replay, refresh, reconexión y fallback. Una respuesta no válida entra en `reconnect` con fallback `static`; una respuesta válida conserva la secuencia real de turnos y sólo emite impacto/daño/keyword/muerte cuando el evento lo respalda.

## Integración existente

Si `you_won` está ausente o es ambiguo, el adaptador entra en `reconnect` con fallback `static`; no transforma incertidumbre en derrota. `BattleCinematicScreen` y `ForgeFormationBoard` conservan sus consumidores reales y exponen el contrato en atributos de diagnóstico del root. Misiones continúa usando el tablero PvE existente; `InteractiveBattleBoard` conserva Target Lock y las partículas por facción implementadas en H2/H3.

## Dependencias y deuda

- Se reutilizan `battleTypes`, `BattleCinematicScreen`, `BattleBoardEngine`, `InteractiveBattleBoard`, `CardAttackCinematic`, `AudioEngine` y datos reales de combate.
- No se añadieron tablas, RPCs, fórmulas, assets, voces, recompensas ni datos de prueba.
- Pendiente para cierre: matriz QA final, propagación del bundle público, medición de rendimiento y expansión a PvE/PvP/World Bosses/Raids con contratos reales.

## Corrección de integridad

No se infiere una reserva contando `final_units`: la forma de los datos no declara reserva. Tampoco se emite victoria/derrota si `you_won` no es booleano; se usa `reconnect` estático hasta recibir una fuente autoritativa.


## Consumidor PvE conectado

`ForgeFormationBoard` crea el contrato desde los turnos reales de `simulateFormationBattle` y conserva la secuencia de formación, invocación, batalla, reserva y resultado existente. La capa audiovisual sólo describe el estado temporal y no modifica la simulación ni el settlement.
