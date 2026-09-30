# VEXFORGE Expo Runtime 1.6.0 · Final Engineering / Visual Audit

Date: 2026-09-29

## 1. Source comparison

The public `Vexforge-web` repository was inspected as the current public source. Its root package is a Vite/React portal package version 5.6.0, and its `CURRENT_SOURCE_OF_TRUTH.md` states that V5.6 is the portal visual authority, that non-card platform/environment artwork is local, and that official card artwork remains catalog/Storage controlled.

The uploaded 1.5.0 ZIP was inspected as a separate Expo 54 mobile runtime artifact. It contained 13 scene masters, 39 scene derivatives, 48 registered assets, 7 canonical assets, 9 runtime PNG support assets and 6 runtime WAV files. Its own audit correctly identified the native Android build and live Supabase smoke tests as external gates.

## 2. 1.5.0 defects corrected in 1.6.0

- Scene masters were visually repetitive and over-dependent on generic fantasy environment plates. They have been rebuilt from the supplied registered VEXFORGE art library into scene-specific compositions with distinct object identity, framing and color language.
- Tutorial scene art accidentally used a registered screenshot/scroll asset as the dominant environment. The 1.6 tutorial scene is now a dedicated environment composition.
- The battle presentation had strong event classification but its major moments remained HUD/FX-only. 1.6 adds `BattleCinematic` for boss phases, victories and defeats.
- Pack opening had a ceremony component but its full-screen backdrop was still the ordinary store scene. 1.6 adds a dedicated pack-reveal cinematic plate.
- `app/tutorial.tsx` referenced `Pressable` without importing it. This was a real TypeScript/runtime defect and is fixed.
- `TabBar.tsx` consumes `@react-navigation/bottom-tabs`; 1.6 declares that package explicitly instead of relying on an undeclared transitive dependency.
- The Expo dependency family is now pinned to exact versions already selected for the SDK 54 / React Native 0.81.5 runtime, reducing dependency drift during Replit assembly.
- The release verification script now validates the new cinematic assets and `BattleCinematic` implementation.

## 3. Combat audit

The existing deterministic tactical engine was not replaced with a second local rules engine. The server-authoritative PvP path remains:

request → server resolver → `BattleResult` → `BattleEvent[]` → presentation/replay.

The local tactical engine remains an explicitly isolated training/presentation harness. Static and deterministic audits pass:

- 2,500 deterministic tactical runs: PASS, 0 failures.
- 500 interactive runs: PASS, 0 failures.
- HP never negative.
- Energy remains bounded.
- No dead actor is selected as the active actor.
- Event IDs remain unique.
- Replays remain deterministic for identical seeds.

Presentation now adds shockwaves, status auras, projectile travel, target rings, amount callouts and major-event cinematics without mutating combat authority.

## 4. Economy audit

The economy client remains server-authoritative. No local wallet or ledger settlement was added.

The existing local audit passes 10,000 deterministic economy simulations with:

- no negative balances;
- ledger reconciliation;
- idempotency protection;
- exact fee calculation;
- documented market fee of 8%;
- F2P withdrawal gate remaining server-policy controlled;
- no client settlement authority.

The release does not invent pack odds, token values, treasury addresses, withdrawal rules or new RPCs.

## 5. World systems audit

The client surface already contains implementation paths for:

- PvP matchmaking and authoritative resolution;
- interactive tactical training;
- PVE mission execution and reward claiming;
- world bosses and raid entry/contribution;
- collection and deck formation;
- marketplace listing/buy/cancel paths;
- wallet/deposit/withdrawal paths;
- packs, shop orders, payment submission, fusion and evolution;
- private/global/clan social messaging and presence;
- clan discovery/join/create;
- seasons, rankings and season rewards;
- lore codex;
- 19-step tutorial with combat drills.

The important boundary remains that live boss damage/reward settlement is not fabricated on the client. The backend contract must expose an authoritative resolver before economy-bearing boss encounters are enabled as live settlement.

## 6. Reference-dimension audit

### Marvel Snap
The relevant reference dimensions are fast readability, immediately legible card effects, short combat loops and strong card/location presentation. VEXFORGE 1.6 strengthens the event-to-FX path and card-first presentation, but it is intentionally a deeper RPG/DCCG world rather than a three-minute location-only combat loop.

### Hearthstone
The relevant reference dimensions are combat readability, strong feedback, recognizable states and a mature collection/deck loop. VEXFORGE keeps the same principle of readable combat state while using its own roles, formation model, world/lore systems and server-authoritative event stream.

### Yu-Gi-Oh! MASTER DUEL
The relevant reference dimension is tutorial depth: its Solo Mode teaches basic rules and then layers advanced summoning systems. VEXFORGE's tutorial is now a 19-step ecosystem route with live combat drills plus navigation into cards, formation, PVE, bosses/raids, economy, marketplace, store, fusion/evolution, social, ranked, lore and live operations. It is a structural foundation; native-device QA is still required to verify pacing and readability.

### Skyweaver
The relevant reference dimensions are player ownership, tradable assets, a market, wallet integration and a game economy that distinguishes tradable from non-tradable content. VEXFORGE follows the same architectural lesson of separating gameplay state from settlement authority, but its actual wallet/settlement rules remain those of the VEXFORGE Supabase contracts and are not replaced by a third-party economy.

## 7. Expo constraint and graphics strategy

Expo SDK 54 maps to React Native 0.81 and React 19.1. The runtime therefore stays on the existing Expo 54 line instead of migrating the project to a newer SDK merely for novelty. React Native Skia is used for procedural 2D/2.5D effects, while Reanimated drives transform and opacity motion.

This is deliberately not pretending to be a Unity/Unreal 3D renderer. The target is a premium mobile 2.5D TCG presentation: deep layered environments, controlled camera movement, card identity, event-driven FX, cinematic overlays, restrained particles and tactile transitions.

## 8. Verification executed in the available environment

PASS:

- `node scripts/verify.mjs`
- deterministic battle audit: 2,500 / 0 failures
- interactive battle audit: 500 / 0 failures
- economy audit: 10,000 / 0 failures
- economy policy audit: PASS
- required local import resolution: PASS
- runtime secret scan: PASS
- cinematic asset verification: PASS

Not claimable from this environment:

- full project TypeScript typecheck after dependency installation;
- `expo-doctor` in a fully installed dependency tree;
- Android native prebuild;
- EAS preview APK generation;
- production AAB generation;
- authenticated live Supabase smoke tests;
- production mutation tests.

Those are environment-dependent release gates, not missing implementation instructions.

## 9. Release conclusion

VEXFORGE Expo Runtime 1.6.0 is the implementation artifact, not a visual reference package. The client-side scenes, cinematic plates, combat presentation, FX, pack ceremony, route surfaces and integration contracts required by this release are contained in the package.

The remaining launch gates are execution/evidence gates: install the pinned dependencies, run the existing Expo/EAS pipeline, authenticate against the real Supabase project, and validate the actual Android artifact on hardware. No assembler should invent gameplay, visual assets, economic formulas or RPCs during that process.
