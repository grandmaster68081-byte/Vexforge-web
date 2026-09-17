# 06 — SUPABASE BACKEND MAP

## Snapshot live observado

Consulta al proyecto `rscuzqnfccqvltkdcdny` el 2026-09-17: **318 tablas/vistas públicas, 345 rutinas y 275 policies**. La consulta enumera el estado accesible, pero no prueba que cada objeto esté activo para Android.

Edge Functions encontradas en el repositorio: `supabase/functions/vexforge-updates/index.ts`.

## Mapa por dominio

| Dominio | Objetos live representativos | Consumer móvil / evidencia | Estado |
|---|---|---|---|
| AUTH | Auth endpoints y `players`/`sessions` | `signIn`, `signUp`, `resetPassword`, `loadSession` en `mobile/lib/supabase.ts` | IMPLEMENTED_UNVERIFIED |
| PROFILE/PROGRESS | `players`, `player_progress`, `player_achievements`, `player_settings` | `loadPlayerProfile`, `loadProgress`, `loadStats`, `loadPlayerAchievements` | IMPLEMENTED_UNVERIFIED |
| CARDS | `cards`, `cards_canonical`, `player_cards`, `v_card_master` | `loadCatalogSnapshot`, `loadPlayerCollection` | IMPLEMENTED_UNVERIFIED |
| INVENTORY | `inventory`, `player_cards`, `player_consumables`, `player_relics` | collection, deck, rewards, relic loaders | IMPLEMENTED_UNVERIFIED |
| DECK/FORMATION | `player_deck`, `v_player_forge_formation`, `pvp_arena_players` | `loadPlayerDeck`, `validateDeck`, `saveDeck` | IMPLEMENTED_UNVERIFIED |
| BATTLE | `battle_runs`, `battle_events`, `battle_history`, `combat_*`, `pvp_matches` | `findOpponents`, `startBattle`, `ForgeBattlefield` | PARTIAL / EVIDENCE_REQUIRED |
| MISSIONS | `missions`, `mission_runs`, `mission_rewards`, `mission_gates`, `daily_quests` | mission loaders, execute/claim actions | IMPLEMENTED_UNVERIFIED |
| REWARDS | `rewards`, `reward_rules`, `pvp_rewards`, `raid_rewards` | rewards and pack loaders/actions | IMPLEMENTED_UNVERIFIED |
| ECONOMY | `economy_ledger`, `player_wallet`, `player_economy_state`, `energy_state` | economy screen and wallet/deposit/withdrawal actions | IMPLEMENTED_UNVERIFIED |
| CLANS/SOCIAL | `clans`, `clan_members`, `friendships`, `direct_challenges`, `guild_wars` | `loadSocialSnapshot` and social actions | IMPLEMENTED_UNVERIFIED |
| TELEMETRY | migration 0039/0040 telemetry objects | `mobile/lib/telemetry.ts`, `insertTelemetryEvent` | PARTIALLY_VERIFIED |
| OTA | `vexforge_android_release_registry`, `vexforge-updates` | `expo-updates` and publish-ota script | EVIDENCE_REQUIRED |

Las migrations `0001`–`0049` son historial de cambios del repositorio; el catálogo live contiene objetos adicionales y nombres paralelos/quarantine. No se declara que una migration sea el estado live sin consultarlo.
