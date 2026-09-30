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
npm run audit:battle
npm run audit:economy
npm run start
```

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
