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


## Cursor activo

El consumidor PvE expone `data-presentation-state` derivado de su fase, turno real, impacto y resultado. Cuando el operador activa FX reducidos o el sistema informa `prefers-reduced-motion`, el root expone fallback `reduced`; ante error o resultado ambiguo usa `reconnect/static`.


## Motor PvP conectado

`BattleBoardEngine` usa la misma fuente real de turnos y expone el cursor activo: `attack` durante `CardAttackCinematic`, `impact` cuando una unidad recibe el impacto, `target_lock` mientras existe turno activo y `victory`/`defeat` al completar.


## Reduced motion

`BattleBoardEngine` escucha `prefers-reduced-motion` y activa `particleEngine.setReducedEffects` sin alterar los tiempos ni los datos autoritativos. El contrato expone fallback `reduced` mientras la preferencia está activa.


## Cues por evento

P0.2 formaliza los eventos reales `shield_block`, `poisoned`, `poison_tick`, `poison_death`, `lifesteal` y `double_strike` como cues con label, color, forma, target, duración y audio existente cuando aplica. `BattleBoardEngine` los consume sin inventar keywords ni cambiar el resultado.


## Arena por facción

P0.3 añade perfiles authored derivados de la facción existente: fondo, niebla y terreno semántico con fallback `neutral-forge`. Se aplican como CSS en los dos consumidores de batalla; el HUD y el DOM permanecen fuera del Canvas y los efectos previos continúan siendo los únicos emisores de partículas.


## Carta como actor

P0.4 centraliza el perfil semántico de actor a partir de `BattleUnit`: facción, rareza, arte disponible y cantidad de keywords. `BattleCard` y `CardAttackCinematic` lo exponen para diagnóstico y composición visual, manteniendo sus animaciones y mappings canónicos existentes.


## Semántica y fallback DOM

Los tableros exponen una región accesible y el cinemático anuncia acción/daño/eliminación con datos reales. Las cartas anuncian nombre, facción, rareza y HP. El Canvas de partículas es decorativo (`aria-hidden`) y no sustituye texto, controles ni HUD.


## Expansión controlada

El tutorial comparte `ForgeFormationBoard` y declara `presentationSurface="tutorial"`; Misiones declara `presentationSurface="pve"`. Es un contexto de presentación, no una segunda autoridad: `tutorial_step`, formación, resultado y settlement siguen viniendo de sus fuentes existentes.
