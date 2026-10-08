# V7 Turn Combat — Continuity Handoff

Use this note to continue the V7 combat work without repeating the initial repository and video review.

## Current status

The screen recording documented the design discussion and acceptance boundaries; it did not show an existing V7 engine implementation. The repository now contains the V7 core, mirror training, PvP rooms, and additive mission/boss server adapters. The current Unity client still uses the automatic V6 battle-resolution route for its legacy combat flow.

The V7 work is **partial**:

- An additive Supabase migration adds V7 session/event/idempotency storage and a server-authoritative sequential action kernel.
- The first playable profile is a PvE mirror-training session using the authenticated player's own formation, a server-side AI controller, and no rewards.
- V7 now has an additive no-reward PvP room lifecycle: authenticated room discovery, participant-only session access, server-loaded joining formation, alternating human turns, and idempotent create/join/action handling.
- Unity has additive mirror-training and PvP room routes that render server state/legal actions, submit intents with sequence and idempotency keys, and replay event snapshots.
- Existing V6 tables, RPCs, settlement, and route remain unchanged.
- An additive server migration adds mission and boss profiles on the same V7 action kernel. Mission runs settle through the existing mission contract; winning boss runs record server-confirmed damage through the existing world-boss contract. The migration selects only active official cards for the opposing formation and does not create card records.
- A new additive migration snapshots the selected team's registered `card_synergy_rules` when a session starts. A passive `power_pct` rule applies to both named cards only while both are alive and active on the board; reserve/fallen units do not activate it. Unity now displays the server-confirmed combo name and power increase.
- The current official rules define the 20 registered synergies as passive power percentages. `Guard`, `Surge`, `Drain`, and `Veil` retain their existing V7 mechanics; `Flux`, `Forge`, `Resonance`, and `Consecrate` remain metadata until an authoritative combat effect is documented. No behavior was invented for them.
- Unity exposes V7 mission starts from the scrollable mission list and boss starts from the Atlas. The client validates mission/boss response profiles, preserves per-encounter idempotency/session state, and renders mode-specific outcomes. Live V7 RPCs are now installed, but no authenticated Unity gameplay has been verified.
- All four V7 migrations were applied to the live Supabase project on 2026-10-08 after explicit approval. The migrations did not redefine V6 RPCs or alter V6 client routes; V7 PvE intentionally calls the existing mission/boss settlement contracts.
- The 2026-10-07 pre-deployment audit found no V7 tables, functions, or migration records. The 2026-10-08 postflight confirmed all four migration records, three empty V7 tables with RLS enabled and no direct `anon`/`authenticated` table privileges, authenticated-only public V7 RPC execution, revoked helper execution, the enabled PvE settlement trigger, and 20/20 supported synergy rules.
- No Unity Editor/device compile, authenticated gameplay test, APK/AAB build, or Unity Cloud build has been performed.

The canonical design/status document is `docs/vexforge-canonical/17_UNIVERSAL_TURN_COMBAT_ENGINE.md`.

## Changes already pushed to official `main`

- `supabase/migrations/20261006220000_vexforge_universal_turn_combat_v7.sql`
- `supabase/migrations/20261006230000_vexforge_turn_combat_v7_pvp_rooms.sql`
- `supabase/migrations/20261007010000_vexforge_turn_combat_v7_mission_boss.sql`
- `supabase/migrations/20261007140000_vexforge_turn_v7_official_card_synergies.sql`
- `verification/v7-turn-combat-fixture.sql`
- `verification/v7-turn-combat-test.sql`
- `verification/v7-card-synergy-test.sql`
- `verification/v7-pvp-turn-combat-test.sql`
- `verification/v7-pve-turn-combat-test.sql`
- `verification/v7-pve-settlement-contracts.sql`
- `verification/run-v7-turn-combat-local.sh`
- Unity contracts/repository, Bootstrap and BattleGate wiring, and `VexforgeTier1TurnCombatGate` for mirror training and PvP rooms
- `verification/verify-v7-unity-contract.mjs`
- Unity Editor build-validator checks for the centralized V7 PvP room RPCs
- Updated V7 design/status document

The V7 core, PvP, and mission/boss server adapters are present and pass isolated PostgreSQL tests. Unity source now includes entry points and result handling for all four modes, with static contract verification only. The four live migrations were applied on 2026-10-08; no Unity Editor/device compile or authenticated gameplay test has been performed. Start from official `main`; do not reset or overwrite it.

## Verified checks

Run from the official repository root:

```sh
bash verification/run-v7-turn-combat-local.sh
node verification/verify-v7-unity-contract.mjs
node scripts/verify-supabase-public-contract.mjs
```

The isolated PostgreSQL suite covers V6 base-stat formulas and Guard targeting, mirror formation and hidden enemy reserves, legal attack/move/replacement transitions, AI use of legal actions, Champion death, no rewards, contiguous event sequence and hashes, idempotent retry, stale/illegal/foreign-player rejection, and storage/function grants. It also verifies a registered pair's percentage bonus, that a reserve partner does not activate it, and that the bonus changes when that card enters the board. Its PvP checks cover authenticated room discovery, private participant access, server-loaded formations, alternating turns, create/join/action idempotency, replay, completion without rewards, and grants. It does not contact Supabase. The V7 Unity static contract check confirms the centralized RPC path, additive V6 route, synergy display/model, response models, and unique asset GUIDs.

`node scripts/verify-pvp-authority.mjs` currently cannot run because its expected `src/domains/pvp/repository.ts` input is absent in this checkout; investigate that existing verifier/source mismatch separately. Unity Editor, `dotnet`, `csc`, and `mcs` were unavailable in the Replit workspace, so the Unity code has static contract checks but no compile/device verification.

## Required constraints

- Do not use Replit connectors.
- Keep `GITHUB_PAT` and `SUPABASE_PAT` in Replit Secrets; never print or copy their values. They were used for official GitHub synchronization and the explicitly approved V7 Supabase migration.
- The four V7 migrations are already applied to live Supabase; do not replay them. Re-audit live schema, ACLs, and function contracts and obtain explicit approval before any future live database changes.
- Do not trigger Unity Cloud/Android builds without explicit approval. Unity Cloud API/basic-auth credentials were not needed and were not requested.
- Do not modify V6 rules, settlement, matchmaking, production data, rewards, or economy as part of the V7 work.
- Do not invent enemy decks, costs, currencies, or rewards. The mirror profile exists because no canonical AI deck was confirmed.
- Unity remains presentation/intent-only; all legal actions, state transitions, results, and replay snapshots come from the server.

## Next work

1. Compile and verify the Unity client in an approved Editor/device environment. Confirm mission eligibility, energy/cooldown handling, boss contribution settlement, and that V7 sessions work without changing V6 behavior.
2. The adapters deterministically select active official cards using existing region and difficulty/tier data; they are not a canonical authored boss roster. Do not invent card records or change settlement semantics. Mission and boss RPC calls use existing live energy and settlement contracts, so conduct gameplay QA with an explicitly approved test account/environment.

## Replit Git boundary

In this Replit Project Editor, `Vexforge-web/` may be a plain source copy without a nested `.git`; running Git there can fall through to the workspace backup repository. Use a dedicated clone of the official GitHub repository for fetch/status/commit/push, verify it is clean and `HEAD == origin/main` before each milestone, and mirror only the intended files back to the mounted source.
