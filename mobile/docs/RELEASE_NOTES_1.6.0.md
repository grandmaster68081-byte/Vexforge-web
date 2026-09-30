# VEXFORGE Expo Runtime 1.6.0 · Official Runtime Upgrade

## What changed

- Rebuilt all 13 runtime scene masters from the registered VEXFORGE art library into scene-specific compositions; HIGH/MEDIUM/LOW derivatives were regenerated from the same masters.
- Added 8 official cinematic plates for battle intro/result, boss phase, pack reveal, mission completion, fusion and season arrival.
- Added `BattleCinematic` as the major-event director. Boss phases, victories and defeats now receive a dedicated cinematic layer instead of only HUD FX.
- Strengthened combat FX with shockwaves, status auras and event-linked presentation while preserving the server-authoritative PvP path.
- Pack opening now uses the dedicated Vault cinematic plate before revealing official catalog card artwork.
- Pinned the Expo 54 dependency family to exact versions already audited for this runtime, reducing dependency drift at assembly time.
- Incremented Android versionCode to 7 and runtime version to 1.6.0.

## Authority

Supabase remains authoritative for auth, catalog, ownership, deck validation, PvP resolution, rewards, wallet/ledger settlement, marketplace, packs, shop, social and live operations. The client does not invent an RPC or settle economic state locally.

## External release gates

A native APK/AAB and live Supabase smoke test cannot be truthfully marked successful from this offline container. The package contains the implementation; the target Expo/EAS environment must still execute the native build and authenticated smoke suite.
