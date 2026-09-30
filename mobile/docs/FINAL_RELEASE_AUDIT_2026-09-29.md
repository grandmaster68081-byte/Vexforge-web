# VEXFORGE · FINAL RELEASE AUDIT · 2026-09-29

## Release intent

This directory is the final Expo mobile game client reconstruction for VEXFORGE. It replaces the discarded historical Expo surface while preserving the current `main` Expo identity, Android package, build plugin behavior and Supabase contracts.

## Source-of-truth hierarchy used

1. Current runtime/backend contracts and current `main` client behavior.
2. Supabase-authoritative economy and PvP operations.
3. Verified canonical VEXFORGE assets.
4. Canonical gameplay/system documentation.
5. Earlier documents only when they do not conflict with the active contract.

## Implemented product surfaces

- Nexus / Home
- Arena / PvP server resolution
- Arena / interactive tactical training
- Archive / card collection with search, filters, focus and detail
- Forge / 8-card formation builder and validation
- Missions / PvE progression and daily quests
- World / Atlas, world bosses, raids, lore and seasons
- Store / packs, shop, inventory, fusion, evolution and external-payment orders
- Economy / wallet, market, deposits and withdrawals
- Social / friends, requests, private chat, global chat and clan chat
- Tutorial / 19-stage non-blocking learning path
- Meta / runtime diagnostics and quality budgets

## Battle integrity

The local deterministic training engine supports 8 active units per side, initiative by speed, basic attacks, skills, shields, healing, burn, buffs, drain, summon state, critical hits, KO state, boss phases and a 20-round ceiling. The production client does not settle PvP rewards locally; it calls `vexforge_battle_resolve` and renders the returned `BattleResult` / `BattleEvent[]`.

Automated local validation:

- 2,500 deterministic battle simulations
- 0 failures
- no negative HP
- energy bounded
- no action after temporal KO
- deterministic output
- unique event IDs

The interactive tactical trainer is explicitly non-settling and therefore cannot corrupt production economy state.

## Economy integrity

The client routes wallet-affecting operations through server RPCs. It never writes the authoritative wallet/ledger balance directly.

Documented current invariants integrated into the client/audits:

- market fee reference: 8%
- F2P withdrawal gate: disabled by policy
- F2P E-ELO ceiling: 1199
- idempotency keys used for repeatable mission/PvP mutations
- wallet/ledger settlement remains server-authoritative

Automated local validation:

- 10,000 deterministic economy simulations
- 0 failures
- no negative balance
- ledger reconciliation invariant preserved
- idempotency invariant preserved
- fee calculation exact for the audited policy

## PvE / bosses / raids

World bosses, raid runs and lore are read from the connected Atlas data model. The client provides animated visual presentation, identity, participation and contribution entry points. No local boss-reward settlement was invented where an explicit authoritative resolver was not present in the supplied current contract.

## Social / live operations

The client integrates the discovered friend, private-message, global-message and clan RPCs. World/season data are live from the connected backend where configured. No fake “live news” feed is generated locally.

## Tutorial

The tutorial contains 19 persistent steps covering account/session, cards, formation, combat initiative, skills, PvE, bosses/raids, energy, economy, market, treasury, store, fusion/evolution, social, seasons, lore and live operations. It is non-blocking and routes the player into each system for hands-on exploration.

## Visual/runtime direction

The runtime uses:

- canonical 1080×2340 portrait authoring frame
- diegetic world-object UI
- verified VEXFORGE card identity where available
- animated scene backdrops
- Skia battlefield rendering
- Reanimated motion
- controlled audio cues
- boss intro and mission scene cinematics
- pack acquisition / reveal ceremony
- status-specific combat FX for burn/poison-like damage states
- LOW / MEDIUM / HIGH quality budgets
- bounded visual loading/content behavior

The project intentionally rejects the discarded dashboard-style Expo architecture and does not retain historical scene/component names. Archive/inventory cards suppress infinite rarity motion; battlefield unit animation is capped by the active quality tier.

## Asset policy

Canonical scene art, card frames, card back, boss aura/sigil, reward/pack assets and registered assets are bundled as verified project resources. Dynamic values remain runtime data and are not baked into artwork.

## Build continuity

Current build contract:

- Expo SDK 54
- React Native 0.81.5
- Expo Router 6
- Android package `com.vexforge.android`
- portrait
- New Architecture
- custom `withEmbeddedJsBundle` Gradle plugin
- EAS preview = APK
- EAS production = Android App Bundle

The plugin is preserved from the canonical main mobile build behavior and embeds the JS bundle into standalone variants.

## Verification status

PASS:

- `node scripts/verify.mjs`
- `node scripts/verify-syntax.mjs`
- `node --experimental-strip-types scripts/audit-battle.ts`
- `node --experimental-strip-types scripts/audit-economy.ts`
- `node --experimental-strip-types scripts/audit-economy-policy.ts`
- interactive tactical one-step smoke test

Not claimed:

- native Android build success inside this offline container
- TypeScript typecheck success in this container because dependencies/node_modules are intentionally absent and offline installation is unavailable
- EAS service execution/submission
- live Supabase mutation tests against production data
- recorded canonical voice performances, because no verified voice recording set was present in the supplied project assets

## Release boundary

This is the complete source/runtime game-client package for the supplied Expo/Supabase contract, not a fabricated APK binary. The repository/backend remain the authorities for live data, rewards, ownership, wallet settlement and any server-side rule not represented in the client contract.
