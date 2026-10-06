# 28 — UNITY MIGRATION GATES (POST-RETIREMENT)

## Invariants

- Unity in `unity/**` is the only Android game runtime.
- Expo / React Native source under `mobile/**` was removed in Hito 10 on
  2026-10-05 at commit `77d31b5d` by explicit user direction while gates
  remained open. Retained Expo inventories are historical snapshots only.
- Supabase remains authoritative. This client migration does not alter live
  schema, RPCs, RLS, auth settings, data, or backend rules.
- The web portal and Kivora faucet are outside the migration scope.
- Do not generate an APK or AAB during this migration. An APK/AAB is neither a
  required artifact for this migration nor evidence of parity.
- This user-directed early retirement is an exception to the recorded gate
  order; it is not evidence that parity, security, Editor, or device gates
  passed.

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
| Asset identity and provenance | OPEN | Static per-file hashes, dimensions, byte sizes, duplicate candidates, Unity destinations, and import decisions are recorded in `30_EXPO_UNITY_ASSET_MIGRATION_MANIFEST.json`. The historical runtime manifest lists only generic boss aura/sigil support art and an unmapped boss-phase cinematic; no verified per-boss art mapping was found. The historical boss-lore list is marked superseded and cannot establish that mapping. Visual identity and official provenance remain open; do not invent or silently replace canonical art |
| Player-facing copy and error hygiene | STATIC_REVIEWED | Runtime C# string literals were scanned; player messages no longer expose backend names, raw validation details, or exception types. Runtime rendering remains unverified |
| Dedicated Unity Android workflow | DEFERRED_BY_USER | The previous `.github/workflows/vexforge-unity-android-github.yml` was inspected and found to build Expo; Hito 10 removed it. The user deferred configuring a Unity-only workflow to a later step |
| Unity Editor validation | NOT_VERIFIED | Open the existing project in `6000.3.0f1` and record compile/play-mode evidence; do not create a new project |
| Android device validation | NOT_VERIFIED | Record input, lifecycle, safe-area, session, audio/haptics, and recovery behavior when separately authorized |
| Security and retirement review | OPEN | Fresh scan on 2026-10-05: dependency audit reports 5 high, 14 moderate, and 2 low advisories in the frozen web portal dependency tree; SAST reports one medium weak-hash finding under separate `faucet/**`; HoundDog reports 0. No unrelated portal/faucet fixes were made. Full Unity client-authority review and Editor/device evidence remain open |
| Delete `mobile/**` | REMOVED_BY_USER_DIRECTION_WITH_GATES_OPEN | `mobile/**` was deleted in commit `77d31b5d` before all gates passed. This is a recorded exception, not a gate pass |
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
- The historical 1.8 runtime asset manifest contains generic `VF_BOSS_AURA` and
  `VF_BOSS_SIGIL` support files plus one `boss_phase.jpg` cinematic. The asset
  migration inventory classifies that cinematic as `DISCARD` for Unity because
  no Unity resource consumer or approved final-art destination is established.
  The only historical “Primeros Bosses Canónicos” lore list is marked
  superseded and does not provide an authoritative art mapping. No art was
  imported or created from this review.
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

## Hito 09 — full parity verification (partial; blocked)

The available static review is recorded, but Hito 09 is **not complete**:

- Player-facing validation, loading, economy, pack, social, strategy, and
  tutorial messages were changed to remove backend-specific wording and raw
  validation responses. A scan of 37 C# files in the UI, Tier1, and GameState
  surfaces found no prohibited implementation terms in string literals.
  Exception details remain confined to developer diagnostics where the code
  logs them; they are not shown as player status text.
- The project now selects the new Input System only (`activeInputHandler: 1`);
  `com.unity.inputsystem` is present, the runtime UI installs
  `InputSystemUIInputModule` and removes `StandaloneInputModule`, and no legacy
  `Input.Get*` calls were found outside Editor code. This is source/config
  evidence, not a runtime input test.
- The declared Editor remains `6000.3.0f1`, the Android application identity is
  `com.vexforge.android`, and the Unity build entry source requests IL2CPP and
  ARM64. Those settings have not been exercised by Unity.
- The workflow mismatch blocked the Android build-path gate: the file named as
  Unity workflow actually ran Expo prebuild and built from `mobile/android`.
  Hito 10 later removed that file at the user's request. No workflow was
  dispatched, and no Unity workflow has been configured.
- `npm run verify`, `git diff --check`, and the static Unity source/config
  checks passed. The portal verification does not compile Unity C#.
- Unity Editor/Unity Hub and C# compilers are unavailable here, and no Android
  device is attached. Unity compilation, Play Mode, authentication/session
  lifecycle, device input, audio/haptics, and recovery behavior therefore
  remain **NOT_VERIFIED**.
- During Hito 09, no Supabase contract/data, Expo source, or `mobile/**` file
  was changed. Hito 10 later removed Expo source by user direction. No workflow
  was run and no APK/AAB was generated.

**Exit status:** Hito 09 remains incomplete. Hito 10 was executed as an
explicitly authorized exception while parity/security/Editor/device gates were
open. Do not describe the retirement as verification. The user deferred Unity
Editor/device closure and a dedicated Unity workflow to a later step.

## Hito 10 — Expo runtime retirement

Completed and pushed as `77d31b5d`:

- Removed all tracked files under `mobile/**`, the Expo Android workflow that
  had been mislabeled as Unity, Expo-only runtime verifiers, and the Replit
  Expo workflow/environment entries.
- Retained the inventory and asset-manifest JSON as pre-retirement snapshots.
- Root React/Vite portal dependencies, Unity source, Supabase contracts,
  backend code, and Kivora/faucet files were preserved.
- No Unity workflow was created, no APK/AAB was built, and no Supabase data or
  schema was changed.
- The user authorized this removal before gates passed. All open status rows
  above remain open.

## Hito 11 — operational documentation

Current runtime, workflow, source-snapshot, and gate status are documented in
the canonical entry points. Unity Editor/device verification and a dedicated
Unity workflow remain deferred; do not claim either as completed.
