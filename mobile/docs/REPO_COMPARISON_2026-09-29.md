# VEXFORGE Public Repository ↔ Expo Runtime Comparison · 2026-09-29

## Public repository

Repository inspected: `https://github.com/grandmaster68081-byte/Vexforge-web.git`

The public repository's root application is the VEXFORGE web/portal surface. Its current package metadata reports version `5.6.0`, with Vite 6 and React 18.3.1. The repository's `CURRENT_SOURCE_OF_TRUTH.md` describes V5.6 as the portal visual authority and explicitly keeps official card artwork catalog/Storage controlled while non-card platform/environment art is local.

## Uploaded runtime

The uploaded artifact was `VEXFORGE_EXPO_1.5.0_OFFICIAL_RUNTIME_RELEASE.zip`. Its actual mobile implementation is an Expo 54 runtime with React Native 0.81.5, Expo Router 6 and React 19.1.0. It contained the active mobile routes, repository contract layer, tactical presentation engine, asset registry and EAS build profiles.

## Decision used for 1.6.0

The public repository remains the public web surface. The Expo runtime is the Android game client implementation delivered by this package. The two surfaces are not collapsed into a single renderer.

The Expo runtime consumes the existing Supabase authority instead of fabricating local data. In particular, card catalog, ownership, deck validation, PvP resolution, pack opening, marketplace, wallet/ledger settlement, social data, raids, bosses, seasons and lore remain contract-driven.

## Visual integration decision

The runtime's original 1.5 scene masters were visually repetitive and did not exploit the supplied registered VEXFORGE art library sufficiently. Release 1.6 rebuilds the 13 scene masters from those registered assets, then regenerates HIGH/MEDIUM/LOW derivatives. Eight additional cinematic plates are shipped for major combat and progression moments.

No remote card artwork was fabricated. Card images remain server/catalog supplied.

## Build integration decision

The existing Expo/EAS build line is preserved rather than creating a new native project. SDK 54 corresponds to React Native 0.81 and React 19.1.0. The release pins the selected dependency versions exactly and explicitly declares `@react-navigation/bottom-tabs`, which is directly imported by the custom tab bar.

The existing embedded-JS-bundle config plugin and preview APK / production AAB EAS profiles remain intact.

## Important external gate

The package contains implementation, assets and audit tooling. A native Android build and live Supabase mutation smoke test require the actual target environment and credentials; they are not falsely marked as successful by this artifact.
