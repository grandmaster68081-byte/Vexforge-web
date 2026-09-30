# VEXFORGE 1.9 — Tier-1 Reference Research

Date: 2026-09-29

This document records engineering patterns used as references. It does not copy proprietary code, assets, rules, UI or franchise content.

## 1. MARVEL SNAP / Second Dinner

Public Unity case study: https://unity.com/resources/marvel-snap

Relevant pattern:

- Live-service content must be authored and delivered through a scalable content pipeline.
- Second Dinner's public case study describes 200+ base cards, 1,000+ collectible variants and weekly content, supported by an integrated pipeline using Addressables, DevOps and backend services.

VEXFORGE adaptation:

- Supabase remains canonical for card/content identity.
- Expo runtime uses bounded image caching/prefetch rather than loading the whole collection at once.
- Scene/cinematic assets have explicit manifests and quality derivatives.
- Client never invents card ownership or content.

## 2. Hearthstone

Public Blizzard engineering article: https://hearthstone.blizzard.com/en-us/news/22552047

Relevant pattern:

- Visual effects are predominantly client-side while authoritative gameplay values can arrive from server state.
- Certain effects need synchronized information from both sides.

VEXFORGE adaptation:

`server result -> validated battle events -> presentation classifier -> cinematic/VFX/audio`

The client does not calculate competitive settlement. It renders the event stream.

## 3. MTG Arena

Public rules-engine article: https://magic.wizards.com/en/news/mtg-arena/on-whiteboards-naps-and-living-breakthrough

Relevant pattern:

- A dedicated Game Rules Engine tracks state and enforces card interactions.

VEXFORGE adaptation:

- Competitive settlement remains in Supabase RPC/database authority.
- The local tactical engine is explicitly a training/presentation system, not a second competitive rules authority.

## 4. Yu-Gi-Oh! MASTER DUEL

Official product page: https://www.konami.com/yugioh/masterduel/us/en/

Official support: https://us-support.konami.com/hc/en-us/articles/4812893829399-I-m-new-to-Yu-Gi-Oh-MASTER-DUEL-how-should-we-start-the-game

Relevant pattern:

- Tutorial teaches basic rules.
- Duel Strategy expands into specific summoning systems.
- Solo Mode also connects card stories and loaner decks.

VEXFORGE adaptation:

- Tutorial is a progression through combat, cards, PvE, bosses/raids, economy and social systems.
- It is not allowed to become a dead-end modal walkthrough.

## 5. Skyweaver

Official knowledge base: https://support.skyweaver.net/en/

Relevant pattern:

- Wallet, economy, rewards, marketplace and blockchain concepts are documented as separate operational surfaces.

VEXFORGE adaptation:

- Wallet and marketplace are server-driven.
- Transaction settlement, ownership and fees remain authoritative on the backend.
- Client-side fee examples are excluded from the live economy surface in 1.9.

## 6. Supabase

RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

Realtime authorization: https://supabase.com/docs/guides/realtime/authorization

Relevant pattern:

- Exposed tables need RLS and grants/policies must be treated as part of the security model.
- Realtime Broadcast/Presence can be authorized with RLS on `realtime.messages` and private channels.

VEXFORGE adaptation:

- Client code assumes backend authority.
- The runtime never treats UI validation as a security boundary.
- Social/realtime access remains a Supabase policy responsibility.

## 7. Expo / React Native / Skia

SDK 54: https://docs.expo.dev/versions/v54.0.0/

Skia SDK 54: https://docs.expo.dev/versions/v54.0.0/sdk/skia/

Image: https://docs.expo.dev/versions/v54.0.0/sdk/image/

Relevant pattern:

- SDK 54 uses React Native 0.81 and Android API 36.
- Skia 2.2.12 is the SDK 54 documented recommended version.
- `expo-image` provides memory/disk caching and downscaling support.

VEXFORGE adaptation:

- SDK 54 is retained to preserve the existing Expo build line.
- Skia remains 2.2.12.
- `expo-image` is used as the canonical image surface for large visual content.

## 8. EAS Updates

Runtime compatibility: https://docs.expo.dev/eas-update/runtime-versions/

Deployment: https://docs.expo.dev/eas-update/deployment/

Relevant pattern:

- OTA updates must match the native runtime.
- Expo recommends an `appVersion` runtime policy for predictable release compatibility.
- Channels should be explicitly assigned to build profiles.

VEXFORGE 1.9 correction:

The prior fixed runtime version `1.0.0` was unsafe once the native dependency surface had changed. 1.9 uses:

```json
"runtimeVersion": { "policy": "appVersion" }
```

and maps EAS channels to the existing Supabase update service:

- development → development
- preview → internal
- production → production

## 9. Public VEXFORGE repository comparison

Verified public `main` currently exposes:

- `mobile/package.json` version `1.0.0`.
- `mobile/app.json` version `1.0.1`.
- Android versionCode `4`.
- The current public mobile dependency surface is materially smaller than this runtime and does not contain the 1.8/1.9 battle/economy architecture.

Therefore 1.9 is a replacement implementation for the target `mobile/` runtime, not a partial patch that mixes old and new mobile files.

## Engineering conclusion

The reference implementations support the same broad architectural direction for VEXFORGE:

- authoritative rules/state separated from presentation;
- deterministic event-driven combat presentation;
- scalable content delivery;
- guided learning that grows into strategy;
- server-controlled economic settlement;
- explicit runtime/update compatibility;
- bounded mobile visual budgets.

The remaining production proof is empirical: install dependencies, run Expo Doctor/typecheck, produce the preview APK, test on physical Android hardware, exercise authenticated Supabase RPCs, and only then produce the production AAB.

## 1.10 final engineering conclusions

- MTG Arena's public engineering material reinforces the rule-engine boundary: VEXFORGE competitive resolution remains authoritative on the server; Expo is presentation/input, not a second competitive rules authority.
- Yu-Gi-Oh! MASTER DUEL publicly separates Tutorial and Duel Strategy and uses story/animation/Loaner Deck content. VEXFORGE uses the same layered teaching principle while keeping its own cards, lore and terminology.
- Expo SDK 54 currently recommends `expo-router ~6.0.24`; 1.10 pins that version explicitly.
- The 1.10 mobile package uses `runtimeVersion: { policy: "appVersion" }` so OTA updates remain coupled to the native runtime surface.
- A legacy direct raid contribution RPC is blocked by the client. A raid contribution is valid only after an authoritative Battle Run v6 result and settlement contract is available.
- Live Android/EAS and authenticated Supabase verification remain external release gates; static PASS is never represented as a device PASS.
