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
- Unity client entry points currently cover mirror training and PvP only. There are no Unity start-RPC paths or user-facing mission/boss V7 launch flows yet.
- The migration has **not** been applied to the live Supabase project. V6 remains the live route.
- A read-only live audit on 2026-10-07 confirmed the V6 resolver remains active and the V7 tables, functions, and migration records are absent. Live counts: 127 active cards, 20 synergy rules, 49 active missions (24 `production_ready`), 15 active bosses, and 5 regions. These are inventory counts, not proof of a canonical boss roster or combat profile.
- No Unity Editor/device compile or Unity Cloud build has been performed.

The canonical design/status document is `docs/vexforge-canonical/17_UNIVERSAL_TURN_COMBAT_ENGINE.md`.

## Changes already pushed to official `main`

- `supabase/migrations/20261006220000_vexforge_universal_turn_combat_v7.sql`
- `supabase/migrations/20261006230000_vexforge_turn_combat_v7_pvp_rooms.sql`
- `supabase/migrations/20261007010000_vexforge_turn_combat_v7_mission_boss.sql`
- `verification/v7-turn-combat-fixture.sql`
- `verification/v7-turn-combat-test.sql`
- `verification/v7-pvp-turn-combat-test.sql`
- `verification/v7-pve-turn-combat-test.sql`
- `verification/v7-pve-settlement-contracts.sql`
- `verification/run-v7-turn-combat-local.sh`
- Unity contracts/repository, Bootstrap and BattleGate wiring, and `VexforgeTier1TurnCombatGate` for mirror training and PvP rooms
- `verification/verify-v7-unity-contract.mjs`
- Unity Editor build-validator checks for the centralized V7 PvP room RPCs
- Updated V7 design/status document

The V7 core, PvP, and mission/boss server adapters are present and pass isolated PostgreSQL tests. Unity source wiring is complete only for mirror training and PvP; mission/boss launch flows remain a client gap. No Unity Editor/device compile or live migration was performed. Start from official `main`; do not reset or overwrite it.

## Verified checks

Run from the official repository root:

```sh
bash verification/run-v7-turn-combat-local.sh
node verification/verify-v7-unity-contract.mjs
node scripts/verify-supabase-public-contract.mjs
```

The isolated PostgreSQL suite covers V6 base-stat formulas and Guard targeting, mirror formation and hidden enemy reserves, legal attack/move/replacement transitions, AI use of legal actions, Champion death, no rewards, contiguous event sequence and hashes, idempotent retry, stale/illegal/foreign-player rejection, and storage/function grants. Its PvP checks cover authenticated room discovery, private participant access, server-loaded formations, alternating turns, create/join/action idempotency, replay, completion without rewards, and grants. It does not contact Supabase. The V7 Unity static contract check confirms the centralized room RPC path, additive V6 route, response models, and unique asset GUIDs.

`node scripts/verify-pvp-authority.mjs` currently cannot run because its expected `src/domains/pvp/repository.ts` input is absent in this checkout; investigate that existing verifier/source mismatch separately. Unity Editor, `dotnet`, `csc`, and `mcs` were unavailable in the Replit workspace, so the Unity code has static contract checks but no compile/device verification.

## Required constraints

- Do not use Replit connectors.
- Keep `GITHUB_PAT` and `SUPABASE_PAT` in Replit Secrets; never print or copy their values. They were available for official GitHub synchronization and read-only Supabase schema inspection.
- Do not apply the V7 migration to live Supabase during this implementation phase. Re-audit live schema, ACLs, and function contracts before any later activation; obtain explicit approval first.
- Do not trigger Unity Cloud/Android builds without explicit approval. Unity Cloud API/basic-auth credentials were not needed and were not requested.
- Do not modify V6 rules, settlement, matchmaking, production data, rewards, or economy as part of the V7 work.
- Do not invent enemy decks, costs, currencies, or rewards. The mirror profile exists because no canonical AI deck was confirmed.
- Unity remains presentation/intent-only; all legal actions, state transitions, results, and replay snapshots come from the server.

## Next work

1. Keep the new server adapters staged until Unity mission/boss entry points and result handling are implemented and verified. The adapters deterministically select active official cards using the existing region and difficulty/tier data; they are not a canonical authored boss roster. Do not invent card records or change settlement semantics.
2. Obtain explicit approval before applying migrations to any shared/live Supabase environment. Then compile and verify in Unity Editor/device; do not substitute a Unity Cloud build without approval.

## Replit Git boundary

In this Replit Project Editor, `Vexforge-web/` may be a plain source copy without a nested `.git`; running Git there can fall through to the workspace backup repository. Use a dedicated clone of the official GitHub repository for fetch/status/commit/push, verify it is clean and `HEAD == origin/main` before each milestone, and mirror only the intended files back to the mounted source.
