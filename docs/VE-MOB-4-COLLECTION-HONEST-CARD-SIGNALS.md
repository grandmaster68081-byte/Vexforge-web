# VE-MOB-4 — HONEST CARD STATISTICS

## Change boundary

- **Target:** Android Archive/Colección in `mobile/app/(tabs)/collection.tsx`.
- **Allowed:** presentation and sorting of optional card statistics.
- **Do not touch:** catalog queries, card identity, owned-card state, artwork, fusion route, achievements route, Auth, or web surfaces.

## Observable change

Power, affinity, prestige, charge, supply, and minted values now remain visibly unconfirmed when the live card record does not provide a finite number. Confirmed zero remains visible as zero. Power sorting keeps cards without a confirmed power value at the end instead of treating them as zero.

## Evidence

- `node scripts/verify-mobile-collection-reference.mjs`
- `git diff --check`

## Honest status

`IMPLEMENTED_UNVERIFIED` — device-level visual/tactile verification remains reserved for an APK explicitly authorized by the operator.