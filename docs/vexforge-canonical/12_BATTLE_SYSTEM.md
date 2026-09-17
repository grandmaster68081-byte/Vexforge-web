# 12 — BATTLE SYSTEM

## Entry y presentación

La entrada móvil es `mobile/app/(tabs)/battle.tsx`. La escena reusable es `mobile/components/ForgeBattlefield.tsx`; la formación se presenta con `ForgeFormationPreview`. La capa de datos está en `mobile/lib/supabase.ts`.

## Capas observadas

- Opponent: `findOpponents`.
- Start path: `startBattle` y funciones de battle/PvP en `supabase.ts`.
- Formation: deck/formation loaders y tipos `DeckSlot`.
- Events/result: tipos y loaders de `BattleResult`/event stream en el cliente.
- Local practice: `mobile/lib/aiBattle.ts` contiene `simulateQuickAIBattle`; se clasifica como `SIMULATION`, no como settlement autoritativo.
- Visual: battlefield, champion/frontline/reserve/hand/command y estados explícitos en la pantalla.

## Autoridad

La autoridad canónica declarada por el protocolo live es servidor/Supabase para Battle Run, event log, cálculo, settlement, resultado y recompensa. Android es renderer/input/replay. Cualquier cálculo local debe permanecer claramente marcado como simulación/práctica y no debe resolver una partida competitiva.

## Estado

`PARTIAL / IMPLEMENTED_UNVERIFIED / EVIDENCE_REQUIRED`: existen rutas, componentes y consumers reales; falta evidencia física y reconciliación live completa de cada RPC/evento/settlement. No se reparan ni sustituyen algoritmos en esta capa documental.
