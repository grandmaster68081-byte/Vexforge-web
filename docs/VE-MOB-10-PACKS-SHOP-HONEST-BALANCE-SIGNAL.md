# VE-MOB-10 — HONEST BALANCE SIGNAL

## Change boundary

- **Target:** Android Packs chamber in `mobile/app/store.tsx`.
- **Allowed:** balance presentation and the purchase action state.
- **Do not touch:** catalog, pack pricing, purchase/open RPCs, inventory, Supabase, Auth, economy, assets, routes, or web surfaces.

## Observable change

The VEX balance is shown only when a finite balance has been received from the live contract. An unconfirmed balance is represented by `—`; pack purchase actions show `BALANCE PENDIENTE` and remain disabled until the balance is known.

This prevents an absent signal from being interpreted as zero VEX or from enabling a purchase using a client-side fallback.

## Evidence

- `node scripts/verify-mobile-store.mjs`
- `git diff --check`

## Honest status

`IMPLEMENTED_UNVERIFIED` — device-level visual/tactile verification remains reserved for an APK explicitly authorized by the operator.