# VEXFORGE 1.8 — Tier-1 Reference Research & Engineering Translation

Date: 2026-09-29

This document records public, attributable engineering/product lessons used to harden the VEXFORGE Expo runtime. It does not copy proprietary code, assets, rules text, or internal implementation details.

## 1. MARVEL SNAP / Second Dinner

Public sources:
- Unity case study: https://unity.com/resources/marvel-snap
- GDC: https://gdcvault.com/play/1029205/Launching-MARVEL-SNAP-on-Mobile
- Game Developer interview: https://www.gamedeveloper.com/design/why-second-dinner-first-prototyped-marvel-snap-using-physical-cards

Verified lessons:
- A live TCG needs a content pipeline separate from core gameplay code.
- Card art, VFX, variants and content delivery need explicit packaging/versioning.
- Visual effects should communicate what a card does, not merely decorate it.
- Card design can combine top-down identity with bottom-up gameplay needs.

VEXFORGE translation:
- server/catalog remains authoritative for card records;
- local content packs are versioned and hashed;
- presentation is event-driven;
- card visuals are identity-bearing rather than generic UI decoration.

## 2. HEARTHSTONE

Public source:
- Blizzard art/engineering insight: https://hearthstone.blizzard.com/en-us/news/22552047

Verified lesson:
- Many visual effects are client-side while gameplay results can be driven by authoritative game data; some effects need synchronized information from both sides.

VEXFORGE translation:
- `BattleResult` / `BattleEvent[]` remain the authoritative result contract;
- FX are local presentation;
- the client never converts a visual effect into damage, reward or settlement;
- event timing is handled by `battleDirector.ts`.

## 3. YU-GI-OH! MASTER DUEL

Public sources:
- Official game page: https://www.konami.com/yugioh/masterduel/us/en/
- New-player support: https://us-support.konami.com/hc/en-us/articles/4812893829399-I-m-new-to-Yu-Gi-Oh-MASTER-DUEL-How-should-we-start-the-game

Verified lessons:
- Tutorial and strategy teaching are separate layers.
- Solo content connects rules teaching with card stories, animations and loaner decks.
- Live events and multiple competitive formats extend retention beyond the first duel.

VEXFORGE translation:
- tutorial remains a playable route through the actual ecosystem;
- combat drills are interactive;
- lore and cards are connected;
- events/season systems are first-class routes.

## 4. SKYWEAVER

Public sources:
- Knowledge Base: https://support.skyweaver.net/en/category/knowledge-base-17yl192/
- Marketplace terms: https://marketplace.skyweaver.net/terms

Verified lessons:
- Wallet, marketplace, ownership and transaction state are explicit system boundaries.
- Fees and transaction risks are visible parts of the economic design.

VEXFORGE translation:
- wallet/market settlement stays server-owned;
- client concurrency is guarded;
- retry/idempotency is never simulated as a local economic authority;
- transaction states remain explicit.

## 5. MTG ARENA

Public sources:
- Rules-engine engineering article: https://magic.wizards.com/en/news/mtg-arena/on-whiteboards-naps-and-living-breakthrough
- Official product page: https://magic.wizards.com/en/mtgarena

Verified lesson:
- A mature digital TCG requires a dedicated rules engine capable of supporting large numbers of card interactions.
- Content implementation involves data, art, rules and production work, not a single card file.

VEXFORGE translation:
- production combat authority remains outside the Expo client;
- local tactical code is explicitly a training/presentation harness;
- release checks validate event shape before presentation.

## 6. AXIE INFINITY / CRYPTO ECONOMY

Public sources:
- Economy sustainability: https://whitepaper.axieinfinity.com/gameplay/axie-population-and-long-term-sustainability
- App.Axie portal: https://support.axieinfinity.com/hc/en-us/articles/7997431782811-App-Axie-Game-Portal
- 2026 economy changes: https://support.axieinfinity.com/hc/en-us/articles/21397975338523-Lunacian-Homecoming-Navigating-the-History-of-Axie-Infinity-for-New-and-Returning-Players

Verified lessons:
- Token emissions, sinks, utility and withdrawal/deposit boundaries require active economic management.
- A game economy can require policy changes when reward emissions create unhealthy incentives.
- Wallet-to-game transfers should have explicit states and restrictions.

VEXFORGE translation:
- no client-side balance mutation;
- tradeable/non-tradeable balances remain distinct;
- withdrawal is policy-gated by backend;
- economic simulations remain separate from live settlement.

## 7. ROLLERCOIN

Public sources:
- Product site: https://rollercoin.com/
- Marketplace/economy development history: https://rollercoin.com/blog/marketplace-what-to-expect-play2earn-and-release-dates

Verified lessons:
- Marketplace value depends on a larger ecosystem of collectible assets, progression and sinks.
- Economy changes need to be considered together with marketplace activity, quests and crafting.

VEXFORGE translation:
- marketplace is connected to collection, packs, fusion/evolution, missions and seasons rather than existing as an isolated shop.

## 8. EXPO / REACT NATIVE RUNTIME

Public sources:
- Expo Image SDK 54: https://docs.expo.dev/versions/v54.0.0/sdk/image/
- Expo Router SDK 54: https://docs.expo.dev/versions/v54.0.0/sdk/router/
- Expo debugging/performance tools: https://docs.expo.dev/debugging/tools/

Verified lessons:
- `expo-image` provides disk/memory caching and downscaling controls suitable for image-heavy applications.
- Expo Router supports route prefetching.
- React Native performance should be measured on UI and JS threads rather than inferred from development appearance.

VEXFORGE translation:
- runtime image surfaces use `VexforgeImage` backed by `expo-image`;
- card artwork prefetch is bounded by quality tier;
- scene/cinematic imagery uses memory-disk caching while collection cards default to disk caching;
- performance budgets are explicit in `performanceBudget.ts`.

## Hard boundary

Public benchmark material does not prove the private production architecture of any competitor. VEXFORGE therefore adopts only documented patterns and keeps its own gameplay, economy, lore, assets and contracts authoritative.
