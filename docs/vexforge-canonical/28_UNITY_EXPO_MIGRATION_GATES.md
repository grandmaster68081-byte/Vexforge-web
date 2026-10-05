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
| Pack opening and rewards | OPEN | Show the server-authorized order/open result, correct owned cards, and interaction parity without client-generated rewards |
| Missions, world boss, raids, seasons, and social | OPEN | Verify every exposed action against an existing live contract; unsupported flows remain visibly unavailable |
| Audio, haptics, quality, and reduced motion | OPEN | Existing battle clips and semantic haptic cues are mapped; reduced motion suppresses animated battle effects while keeping static feedback. Verify on Editor/device; presentation settings must not change rules |
| Asset identity and provenance | OPEN | Reconcile official card/boss/world assets and manifest references; no generated replacement for canonical art |
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