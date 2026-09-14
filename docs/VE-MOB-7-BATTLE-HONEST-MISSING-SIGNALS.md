# VE-MOB-7 — HONEST BATTLE MISSING SIGNALS

## Change boundary

- **Target:** Android Battle surface in `mobile/app/(tabs)/battle.tsx`.
- **Allowed:** absent MMR reference ordering and absent turn-count presentation/telemetry.
- **Do not touch:** opponent query, battle resolution RPC, AI practice rules, replay contract, rewards, economy, Auth, or web surfaces.

## Observable change

When the player's MMR is unavailable, opponents remain in the server-provided order instead of being ranked against an invented `1000` reference. When the authoritative result does not report a turn count, the result shows `—` and telemetry omits the field rather than recording `0`.

Confirmed zero remains zero. Battle resolution remains authoritative on the server.

## Evidence

- `node scripts/verify-mobile-battle.mjs`
- `git diff --check`

## Honest status

`IMPLEMENTED_UNVERIFIED` — device-level visual/tactile verification remains reserved for an APK explicitly authorized by the operator.