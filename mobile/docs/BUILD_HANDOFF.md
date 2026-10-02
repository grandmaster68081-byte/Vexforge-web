# VEXFORGE · BUILD HANDOFF

The project is based on the current `main` Expo identity:

- Expo SDK 54
- React Native 0.81
- Expo Router 6
- Android package `com.vexforge.android`
- portrait
- New Architecture

## Required environment

Create `.env` from `.env.example` and provide the public Supabase URL and anon/publishable key.

The project does not store service-role keys or private credentials.

## Local run

```bash
npm install
npm run verify
npm run verify:android-export
npm run audit:all
npm run verify:game-runtime
npm run start
```

## Expo Router route root

The actual product routes live in `app/`. `src/app/` holds shared runtime
components and is not a route directory. `app.json` pins Expo Router to
`./app`; do not remove that setting unless the route tree is intentionally
moved.

## Android asset-integrity gates

Before generating the native Android project, run `npm run verify:android-export`.
It creates a temporary Android export, requires the embedded JavaScript bundle,
and checks that all 75 critical asset SHA-256 values match both the official QA
manifest and `SHA256SUMS.txt`.

After building an APK, run:

```bash
node scripts/verify-android-apk-assets.mjs <path-to-apk>
```

This rejects APKs without `assets/index.android.bundle` or any of the 75
official runtime asset hashes. The nine official support PNGs must also retain
their source bytes under `assets/vexforge-critical/`. The
`withCriticalPngAssets` config plugin copies them into Android's raw assets
directory during prebuild; keep this separate from React Native's normal image
resources so Android resource processing cannot change the bytes checked by
SHA-256. The GitHub Android workflow runs both checks.

## OTA/runtime compatibility

1.9 uses `runtimeVersion.policy = appVersion`. Do not revert this to a fixed `1.0.0`. The EAS channels are `development`, `internal` (preview APK) and `production`, matching the existing Supabase update endpoint.

## Android APK

```bash
eas build --platform android --profile preview
```

The `preview` profile outputs an APK. The `production` profile outputs an Android App Bundle.

## Replit integration rule

Replit is an assembly/execution environment for this package, not a design authority. It must not replace routes, rules, economic formulas, RPC names, card identities, or server contracts because they appear inconvenient.


## Canonical build-plugin behavior

Do not remove `plugins/withEmbeddedJsBundle.js` or replace it with a no-op. The plugin modifies the Android Gradle `react` block so standalone variants embed the JavaScript bundle and assets. This preserves the behavior expected by the existing VEXFORGE mobile build path.

## Release URL

Official web surface: `https://vexforge-web.pages.dev`
