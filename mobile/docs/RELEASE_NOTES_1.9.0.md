# VEXFORGE Expo 1.9.0 — Tier-1 Runtime Compatibility Hardening

## Purpose

1.9.0 is a hardening release over 1.8.0. It does not replace the canonical Supabase rules engine, invent new RPCs, or introduce a second gameplay authority.

## Critical fixes

### EAS Update compatibility

The previous runtime used a fixed `runtimeVersion` of `1.0.0` while the native dependency surface had evolved. Expo documents that OTA updates must match the native runtime and recommends an appVersion policy for predictable release compatibility.

1.9.0 changes this to:

```json
"runtimeVersion": { "policy": "appVersion" }
```

The app version is now `1.9.0` and Android versionCode is `10`.

### Channel alignment

The existing Supabase update endpoint accepts `development`, `internal`, `closed`, and `production` channels. EAS profiles therefore use:

- development → `development`
- preview → `internal`
- production → `production`

This avoids a preview build requesting an unsupported `preview` channel from the existing update service.

### Client boundary validation

Additional validation rejects malformed client inputs before network calls for raid, season claims, market operations, deposits, withdrawals, shop payments, fusion and evolution. These checks are UX/integrity guards only; the server remains authoritative.

### Result guards

Battle event sequences are bounded and event identifiers are validated. Pack result identity fields are bounded. These checks protect presentation code from malformed server responses without changing gameplay rules.

## Intentionally unchanged

- Expo SDK 54 / React Native 0.81.5.
- Skia 2.2.12, the SDK 54 recommended version.
- Supabase RPC names and database contracts.
- Android package `com.vexforge.android`.
- Existing scene/cinematic corpus.
- Canonical card artwork authority.
- Existing custom Supabase Expo Updates service.
- Existing embedded-JS build plugin.
