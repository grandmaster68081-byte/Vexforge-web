# 23 — GIT AND RELEASE HISTORY

## Estado actual

- Branch: `main`
- Commit actual: `f43159ecee63b610bb71c295238327ecea3feeb6`
- Commit message: `[skip ci] Record verified Android build 249 release`
- Fecha observada: 2026-09-17

## Android release evidence

| Source commit | Workflow/run | Release | Evidence | Status |
|---|---|---|---|---|
| `ded78720d1d3f97280d5702166d44e18415beb8f` | `vexforge-android-apk.yml` / `35238357900` | `vexforge-android-build-249` | success, embedded JS bundle | RELEASE_PUBLISHED / BUNDLE_VERIFIED |
| `8ccb6f0fa2ec5fcd1a68b8bc7532fb67312c2690` | `vexforge-android-apk.yml` / `35122882007` | `vexforge-android-build-248` | APK SHA recorded in `CONTINUITY.md` | HISTORICAL |

## Build → artifact → runtime

The workflow installs mobile dependencies, runs typecheck and guards, runs Expo prebuild, runs Gradle assembleRelease, checks `assets/index.android.bundle` and uploads `app-release.apk` to the GitHub release. OTA uses `expo export --platform android --output-dir dist` and `mobile/scripts/publish-ota.mjs`.

No APK or deployment was produced by the canonical documentation commit.
