# VE-MOB-11 — HONEST ECONOMY BALANCE SIGNALS

## Change boundary

- **Target:** Android Economy screen in `mobile/app/economy.tsx`.
- **Allowed:** rendering of missing numeric signals and withdrawal gating.
- **Do not touch:** economy RPCs, ledger queries, market mutations, treasury data, deposits, withdrawals, referrals, Auth, or web surfaces.

## Observable change

Missing wallet, ledger summary, referral, or tradeable-balance values are now shown as `—` instead of `0`. A withdrawal cannot be submitted or enabled until the server returns a finite available balance.

Confirmed numeric zero remains visible as zero. The client still delegates the final economic decision to the server.

## Evidence

- `node scripts/verify-mobile-economy.mjs`
- `git diff --check`

## Honest status

`IMPLEMENTED_UNVERIFIED` — device-level visual/tactile verification remains reserved for an APK explicitly authorized by the operator.