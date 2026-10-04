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
| Navigation, tutorial, and player state | OPEN | Route-by-route matrix with entry, loading, empty, error, and return behavior |
| Collection, card detail, deck, and formation | OPEN | Compare filters, ownership, validation, and mutation results against existing backend contracts |
| Competitive battle and replay | OPEN | Prove results/events are server-derived; verify event ordering, replay/skip behavior, and no local settlement |
| Pack opening and rewards | OPEN | Show the server-authorized order/open result, correct owned cards, and interaction parity without client-generated rewards |
| Missions, world boss, raids, seasons, and social | OPEN | Verify every exposed action against an existing live contract; unsupported flows remain visibly unavailable |
| Audio, haptics, quality, and reduced motion | OPEN | Verify optional device services and reduced-motion behavior; presentation settings do not change rules |
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