# V7 Turn Combat — Continuity Handoff

Use this note to continue the V7 combat work without repeating the initial repository and video review.

## Current status

The screen recording documented the design discussion and acceptance boundaries; it did not show an existing V7 engine implementation. Before this work, the repository had the V7 design document, while Unity still used the automatic V6 battle-resolution RPC.

The V7 work is **partial**:

- An additive Supabase migration adds V7 session/event/idempotency storage and a server-authoritative sequential action kernel.
- The first playable profile is a PvE mirror-training session using the authenticated player's own formation, a server-side AI controller, and no rewards.
- V7 now has an additive no-reward PvP room lifecycle: authenticated room discovery, participant-only session access, server-loaded joining formation, alternating human turns, and idempotent create/join/action handling.
- Unity has additive mirror-training and PvP room routes that render server state/legal actions, submit intents with sequence and idempotency keys, and replay event snapshots.
- Existing V6 tables, RPCs, settlement, and route remain unchanged.
- Mission, boss, and raid session adapters remain unimplemented.
- The migration has **not** been applied to the live Supabase project. V6 remains the live route.
- No Unity Editor/device compile or Unity Cloud build has been performed.

The canonical design/status document is `docs/vexforge-canonical/17_UNIVERSAL_TURN_COMBAT_ENGINE.md`.

## Changes already pushed to official `main`

- `supabase/migrations/20261006220000_vexforge_universal_turn_combat_v7.sql`
- `supabase/migrations/20261006230000_vexforge_turn_combat_v7_pvp_rooms.sql`
- `verification/v7-turn-combat-fixture.sql`
- `verification/v7-turn-combat-test.sql`
- `verification/v7-pvp-turn-combat-test.sql`
- `verification/run-v7-turn-combat-local.sh`
- Unity contracts/repository, Bootstrap and BattleGate wiring, and `VexforgeTier1TurnCombatGate` for mirror training and PvP rooms
- `verification/verify-v7-unity-contract.mjs`
- Unity Editor build-validator checks for the centralized V7 PvP room RPCs
- Updated V7 design/status document

The V7 PvP database milestone and Unity source wiring are complete. The Unity changes have static contract verification only; no Unity Editor/device compile or live migration was performed. Start from official `main`; do not reset or overwrite it.

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

1. Connect mission and boss profiles only where canonical enemy formations and current settlement policies are available. Reuse the same action kernel; keep settlement separate and do not synthesize missing content or rewards.
2. Obtain approval before applying migrations to any shared/live Supabase environment. Then compile and verify in Unity Editor/device; do not substitute a Unity Cloud build without approval.

## Replit Git boundary

In this Replit Project Editor, `Vexforge-web/` may be a plain source copy without a nested `.git`; running Git there can fall through to the workspace backup repository. Use a dedicated clone of the official GitHub repository for fetch/status/commit/push, verify it is clean and `HEAD == origin/main` before each milestone, and mirror only the intended files back to the mounted source.
