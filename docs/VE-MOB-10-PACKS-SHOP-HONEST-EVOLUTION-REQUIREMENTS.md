# VE-MOB-10 — HONEST EVOLUTION REQUIREMENTS

## Change boundary

- **Target:** Android Evolution chamber in `mobile/app/store.tsx`.
- **Allowed:** display of the requirements returned by the live evolution-path contract.
- **Do not touch:** evolution RPC, card ownership, costs in Supabase, fusion, inventory, Auth, economy, assets, routes, or web surfaces.

## Observable change

Evolution no longer presents absent requirements as `2` copies, `0` VEX, or level `1`. Missing copy, VEX, or level data is labeled as not reported. When the authoritative path includes PvP wins, that requirement is shown; no client-side requirement is invented or enforced.

## Evidence

- `node scripts/verify-mobile-store.mjs`
- `git diff --check`

## Honest status

`IMPLEMENTED_UNVERIFIED` — device-level visual/tactile verification remains reserved for an APK explicitly authorized by the operator.