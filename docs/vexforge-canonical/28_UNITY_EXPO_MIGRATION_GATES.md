# 28 — UNITY / EXPO MIGRATION GATES

## Invariants

- Unity in `unity/**` is the only Android game runtime.
- Expo in `mobile/**` remains an implementation reference until all retirement
  gates pass.
- Supabase remains authoritative. This client migration does not alter live
  schema, RPCs, RLS, auth settings, data, or backend rules.
- The web portal and Kivora faucet are outside the migration scope.
- Do not generate an APK or AAB during this migration. An APK/AAB is neither a
  required artifact for this migration nor evidence of parity.
- Do not delete `mobile/**` while any parity, security, Editor, or device gate
  remains open.

## Gate status

| Gate | Status | Completion evidence |
|---|---|---|
| Authority reconciliation and source inventory | RECORDED | `VEXFORGE_CONTEXT.md`, `replit.md`, `16_IMPLEMENTATION_STATUS.md`, and `27_UNITY_EXPO_MIGRATION_INVENTORY.json`; commit and push the milestone before beginning another |
| Auth/session parity and secure storage | OPEN | Email sign-up with confirmation handling, sign-in, restored-session player-state refresh, and remote/local sign-out are implemented in source; verify end-to-end and Android Keystore/AES-GCM lifecycle in Unity Editor/device; live project requires email confirmation and has external providers disabled |
| Navigation, tutorial, and player state | OPEN | Tutorial replay and source navigation are implemented; verify route-by-route entry, loading, empty, error, return, and battle-completion behavior in Unity runtime |
| Collection, card detail, deck, and formation | OPEN | Source adds collection search/ownership filters, card details, and an editable formation draft wired to existing validation/save RPCs; verify filters, ownership, and mutation results in Unity runtime |
| Competitive battle and replay | OPEN | Unity now classifies and sequences the returned events, replays the last sequence without another battle request, and enables skipping only on interruptible frames; verify ordering, interruptions, result authority, and no local settlement in Unity runtime |
| Pack opening and rewards | OPEN | Unity source now lists packs, uses the existing buy/open RPCs, retries paid orders, reveals returned cards, and refreshes ownership/wallet; verify this behavior in Editor/device without client-generated rewards |
| Missions, world boss, raids, and seasons | OPEN | Unity source now provides a read-only active-boss atlas; verify it in Editor/device and confirm each additional action against an existing live contract |
| Profile, wallet, market, deposits, withdrawals, social, and visible errors | OPEN | Hito 07 source now reads existing profile/economy contracts, calls current market/deposit/withdrawal RPCs, and preserves failed social-message drafts; verify loading, empty, rejected, accepted, refresh, and sign-out states in Editor/device |
| Audio, haptics, quality, and reduced motion | OPEN | Existing battle clips and semantic haptic cues are mapped; reduced motion suppresses animated battle effects while keeping static feedback. Verify on Editor/device; presentation settings must not change rules |
| Asset identity and provenance | OPEN | Static per-file hashes, dimensions, byte sizes, duplicate candidates, Unity destinations, and import decisions are recorded in `30_EXPO_UNITY_ASSET_MIGRATION_MANIFEST.json`; visual identity and official provenance still require review, with no generated replacement for canonical art |
| Unity Editor validation | NOT_VERIFIED | Open the existing Unity project in the declared Editor version and record compile/play-mode evidence; do not create a new project |
| Android device validation | NOT_VERIFIED | Record input, lifecycle, safe-area, session, audio/haptics, and recovery behavior on a device when the no-build gate is separately cleared |
| Security and retirement review | BLOCKED | Verify no secrets, Expo-only runtime dependencies, or client-authority violations remain; review references and data preservation |
| Delete `mobile/**` | BLOCKED_UNTIL_ALL_GATES_PASS | Only after every applicable gate above is closed, all capabilities are classified, and the removal review passes |
| APK/AAB generation | NOT_RUN_AND_PROHIBITED_FOR_THIS_MIGRATION | No APK/AAB is produced as part of these migration steps |

## Milestone handling

Before each milestone, fetch `origin/main`, confirm branch `main`, a clean
worktree, and `HEAD == origin/main`. Finish and verify one bounded milestone,
then commit and push it to `main` before starting another. Do not reset, rebase,
merge, cherry-pick, or force-push.

## Hito 05 — Battle presentation and replay

Implemented in source, pending runtime verification:

- Unity uses the same ordered event-type rules as Expo and keeps the server
  event order. It assigns Unity-side duration, priority, and interruptibility
  metadata; the HUD exposes a playback cursor.
- The playback HUD shows sequence progress. “Omitir” is disabled for boss,
  victory, and defeat frames; accepted skips only finish presentation and do
  not resolve or settle a battle. “Ver otra vez” replays the last returned
  event sequence without a new repository request.
- Camera zoom, battlefield effects, existing audio clips (including
  `pack_reveal` for boss events), and semantic haptic cues are selected from
  the shared event classification.
- Reduced motion removes battle camera, particle, card, and boss movement while
  retaining static atmospheric feedback. Haptics use Unity's generic mobile
  vibration fallback; semantic patterns and device behavior remain unverified.
- The competitive-battle and audio/haptics gates remain OPEN until Unity Editor
  compilation and device behavior are checked. No Supabase changes or Android
  package builds are part of this milestone.

## Hito 06 — Pack, boss and world interactions

Implemented in source, pending Unity Editor/device verification:

- Treasury opens a native pack vault that reads the active catalog and paid
  pending orders through the existing Supabase contracts. Buying calls
  `vexforge_buy_pack_with_vex`; opening calls `vexforge_open_pack`. Unity displays
  only returned cards, retries a paid order after an open failure, then reloads
  collection ownership and wallet state from Supabase.
- The seal, charge, rupture, and card-by-card reveal are presentation only.
  Official card art is requested through the bounded canonical card-art
  resolver; no local reward, rarity, ownership, or price calculation was added.
- Nexus now opens a world atlas that lists active bosses from `world_bosses` and
  presents the selected server record with the existing boss sigil/aura assets.
  The encounter control remains unavailable: Unity does not simulate a boss
  fight or settle rewards.
- Only the existing `VF_PACK_VAULT_HERO`, `VF_PACK_RELIC`, `VF_BOSS_AURA`, and
  `VF_BOSS_SIGIL` assets are used. Per-boss art identity remains unverified.
- Pack, world/boss, asset-provenance, and runtime gates remain OPEN until
  compilation, interaction, ownership, and presentation are checked in the
  declared Unity Editor/device. No Supabase schema/data changes, Expo removal,
  or APK/AAB generation are part of this milestone.

## Hito 07 — Profile, economy, social and error UX

Implemented in source, pending Unity Editor/device verification:

- The profile surfaces the existing server-loaded rank and player statistics.
- A native economy hub exposes wallet balances and server aggregates, active
  market listings and owned cards, treasury addresses, deposit history, and
  withdrawal history. Listing, buying, deposit registration, and withdrawal
  requests use the existing RPCs. The UI distinguishes pending requests from
  settled balances and shows only values returned by the server.
- Unity does not calculate transaction fees, market prices, balances,
  eligibility, conversion, or settlement. Deposit registration only submits
  the transaction details for review; it does not transfer funds or credit VEX.
- Social action failures now reach a user-safe status, and an unsent message is
  retained when the server rejects the send or the request fails.
- The Expo economy page's local audit simulation is not ported: it assumes a
  fixed fee rate and simulates client-side balances, so it is not evidence of
  the live server's financial rules. Expo has no analytics/telemetry contract;
  Unity adds no telemetry.
- The profile/economy/social and error-UX gate remains OPEN until compilation,
  interaction, accepted/rejected results, and lifecycle behavior are checked
  in the declared Unity Editor/device. No Supabase schema/data changes, Expo
  removal, or APK/AAB generation are part of this milestone.

## Hito 08 — Expo-to-Unity asset inventory and deduplication

Static source analysis is recorded; it does not constitute visual, Editor, or
device verification:

- `scripts/build-unity-asset-migration-manifest.mjs` inventories all 168 tracked
  files in `mobile/assets/` (89,512,333 source bytes), records SHA-256, raster
  dimensions, source byte size, duplicate candidates, role, Unity destination,
  and a conservative `KEEP` / `PORT` / `DISCARD` decision per file.
- The audit found 14 exact-duplicate groups within the Expo asset tree and 22
  files (33,629,368 bytes) that are byte-identical to an asset already listed
  in the Unity Tier1 resource registry. Those use their existing Unity paths;
  no second copy is needed.
- The remaining 146 files are classified `DISCARD` from Unity import scope
  because the current Unity resource registry does not establish a consumer
  and destination for them. This is not approval to delete them or proof that
  future features cannot need them. Any proposed `PORT` requires an evidenced
  Unity consumer, approved destination, and provenance review.
- Estimated RGBA8 decode memory totals 869,178,544 bytes only if every raster
  were loaded at once. This is a formula-based estimate, not measured Unity
  runtime/GPU memory. Actual imported and built size remains unknown because
  Unity import/build was not run.
- No asset was copied into Unity, no file under `mobile/**` was changed or
  deleted, and no Supabase data or schema was changed. The asset provenance,
  Editor, device, parity, and retirement gates remain open.
