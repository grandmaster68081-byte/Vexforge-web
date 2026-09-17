# 13 — MISSIONS / REWARDS / ECONOMY

## Flujo esperado documentado

```text
CATALOG → ASSIGNMENT → EXECUTION → PROGRESS → CLAIM → REWARD → PERSISTENCE
```

## Android

- Missions: `mobile/app/missions.tsx`, loaders/actions de `mobile/lib/supabase.ts`.
- Rewards/packs: `mobile/app/store.tsx`, pack balance/history/catalog, open/buy/claim actions.
- Economy: `mobile/app/economy.tsx`, wallet, ledger, stats, deposits, withdrawals, shop orders.
- World rewards: `world.tsx` y acciones de raids/season.

## Backend live representativo

Missions: `missions`, `mission_runs`, `mission_rewards`, `mission_gates`, `daily_quests`.
Rewards: `rewards`, `reward_rules`, `pvp_rewards`, `raid_rewards`.
Economy: `economy_ledger`, `player_wallet`, `player_economy_state`, `energy_state`, treasury/deposit/withdrawal objects.

## Reglas de evidencia

Anti-double-claim, cooldown, settlement, balances VEX in-game/tradeable y ledger requieren evidencia live y/o QA autenticada. No se afirma que una acción económica sea operacional porque el botón o caller exista.

Estado global: `IMPLEMENTED_UNVERIFIED`; economía y retiros: `EVIDENCE_REQUIRED`.
