# VEXFORGE Expo 1.10.0 — Final Ship Hardened Release

## New

- Final release contract and canonical document order.
- Final content closure manifest and contact sheet.
- Social foreground live-refresh service with cleanup/AppState handling.
- Final release audit and ship audit scripts.

## Hardened

- Expo Router pinned to 6.0.24 for SDK 54.
- `expo-image` pinned to 3.0.11.
- Android versionCode 11.
- Social writes covered by the mutation gate.
- Settings/tutorial progression writes covered by the mutation gate.
- Legacy direct raid contribution is blocked.
- Boss/PvE local tactical screen is explicitly presentation-only and non-settling.
- Release scripts target 1.10.0 and the 1.10 asset QA manifest.

## Explicit limits

This release does not claim an APK, Gradle build, full dependency typecheck, or live Supabase settlement PASS without executing those gates in the target environment.
