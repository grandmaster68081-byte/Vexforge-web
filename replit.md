# VEXFORGE — Unity Android Runtime

As of 2026-10-11, `unity/**` is the single official Android game project,
promoted from the completed Bootstrap project at the user's direction. The
previous separate official Unity tree was removed from the current branch.
Bootstrap migration documents below are historical unless explicitly marked
current. The promoted project uses `com.vexforge.android`; its new official
state was not rebuilt as part of the promotion.

The current manual build workflow is
`.github/workflows/vexforge-unity-android-github.yml`. Operational context is
in `VEXFORGE_CONTEXT.md` and `docs/vexforge-canonical/`.

## Integrations and credentials

- Do not use Replit connectors for this project. Access GitHub or Supabase APIs
  directly only when needed, using credentials stored as Replit Secrets.
- Never request or share credentials in chat. Request Unity Cloud, Hub, or Editor
  credentials as secrets only if a specific authorized workflow requires them.

## Historical Bootstrap migration checkpoint (through 2026-10-11)

- Stage 3 preparation began from clean `main` at
  `d4616089f1582c9994544b205a396d56b1c4e95b`.
- Bootstrap APK #2 remains only a pipeline smoke test and is not migration
  progress. APK #3 is the first verified official content slice: 8 auth/session
  scripts, 1,095 lines (6.4457%), zero Unity warnings/errors, 26,697,451-byte
  APK, SHA-256
  `4c61a45f9da457302db858053a0062d3788f2b6f52b7b3f94ec5380de4f031ff`.
  The downloaded artifact hash matches its build report.
- Run #3 restored the prior `unity-bootstrap/Library` using a compatible
  restore-key (1,821,722,229 bytes) and saved a new cache (1,829,028,455
  bytes). Its old summary misreported a restore-key hit as no cache because it
  checked only exact `cache-hit`; the workflow now reports `cache-matched-key`.
- Stage 2 passed in run #4: five official scripts, 1,165 lines (6.8578%),
  bringing the cumulative C# count to 2,260/16,988 (13.3035%). Its only C#
  dependency outside the slice is `Backend/ApiContracts.cs` from stage 1.
  UGUI is already in the bootstrap package manifest. The artifact is 26,772,411
  bytes with SHA-256
  `8a77ab7e4e54bb70569e03d91e9ba3b42ce5c239f2430f96645ad4883bb4f89b`;
  the downloaded APK matches its report and passes ZIP integrity checks.
- Run #4 restored the run #3 cache through a compatible restore-key
  (1,829,028,455 bytes) and saved a new cache (1,831,499,209 bytes). Its Unity
  `BuildReport.summary.totalSize` log value is 621,713,303 bytes; the packaged
  APK size is independently verified as 26,772,411 bytes.
- These GitHub Actions caches are snapshots of `unity-bootstrap/Library`, not
  Unity Cloud data or the older shader-shard checkpoints. Run #2 began with no
  compatible cache and saved 1,821,722,229 bytes; runs #3 and #4 restored the
  previous successful snapshot and saved 1,829,028,455 and 1,831,499,209 bytes.
  Runs #5 and #6 both restored the run #4 key. The old shard workflow instead
  used 7-day checkpoint artifacts under `unity/Library`; run #57 restored the
  run #56 checkpoint (2,521,775,127 bytes) and verified it, but its full build
  was cancelled after 21,098 seconds.
- Tier1 resource assets and the pack-reveal director are intentionally not
  included in this compile-only slice, so it is not a functional pack reveal.
- `unity/**` remains untouched. Stage 4 adds the canonical
  `VexforgeApp.cs.meta`, and Stage 5 restores the original bootstrap scene that
  resolves through that GUID.
  Stage 3 now contains the other 63 canonical C# scripts (14,728 lines), bringing
  the copied runtime script set to 76/76 and 16,988/16,988 lines. Run #5's two
  CS0246 errors for `VexforgeApp` were fixed by importing `Vexforge.Core` in the
  Bootstrap copy only. Run #6 restored the run #4 Library cache successfully,
  then failed with CS0234 in `VexforgeR5ProjectSetup.cs(45,13)` because its
  `Vexforge.Editor.VexforgeShaderStrippingSettings` dependency was absent from
  Bootstrap. The canonical editor-only helper and its `.meta` GUID are now
  copied to `unity-bootstrap/Assets/Editor`; a preflight checks the file/class/method
  before Unity setup. The user authorized one new manual build after this repair.
  No change is made under `unity/**`. This stage
  intentionally adds no new scenes, Resources, source `.meta` files or other
  excluded Unity project content. Passing the compile test will not prove game
  runtime, scene, resource or full-content parity.
- Stage 4 passed in Bootstrap run #8 (`d195090`): one canonical VexforgeApp
  script `.meta` file, 0.5076% of the full content inventory. Its APK is
  27,905,651 bytes with SHA-256
  `3fa3193f3a6be2423764ee02f7452a312a5233fb8983e0fadeaad718e3cf0b3b`; the
  downloaded APK hash matches and both artifact and APK ZIP integrity checks
  pass. It restored 1,863,822,113 bytes from the compatible run #7 cache and
  saved a new cache. Unity reported warnings=0/errors=1; the user directs that
  BuildReport counters be recorded and collected for later review, not used
  alone to block a successful workflow with a validated APK.
- Stage 5 passed in Bootstrap run #9 (`a2dd2c3`): the canonical
  `VexforgeBootstrap.unity` scene (one file, 0.5076%; the Bootstrap copy adds
  one final LF). Its sole script GUID resolves through stage 4 and its scene
  `.meta` matches the source. The downloaded 27,905,771-byte APK SHA-256
  `b1a033c1651f0d33554df5e029de380ebf71ede26f09740f5f0913463035dbe9` matches
  the report; outer artifact and APK ZIP integrity checks pass. It restored
  1,863,686,866 bytes from the compatible run #8 cache and saved a new cache.
  Unity reported warnings=0/errors=1 with `BuildReport.totalSize` 640,014,896;
  record for later review and do not treat the counter alone as a failed build.
- Stage 6 passed in Bootstrap run #10 (`d3a9c4a`): the ten original Tier1 audio
  WAVs under `Resources/VexforgeTier1/Audio` (10/197 files, 5.0761%). The
  existing audio director loads these by resource path; all source/destination
  hashes match. The 27,921,453-byte APK SHA-256
  `3d7d1a70461a3e14ca3cbcee7696abda324ba708208cd897105ab4a6bed0e3bb` matches
  the downloaded build info; the artifact and APK ZIPs pass integrity checks,
  with ARM64 IL2CPP and Unity data present. Artifact
  `VEXFORGE-Unity-Bootstrap-APK-10` (ID `11674220109`, 27,304,880 bytes) was
  uploaded. It restored 1,863,920,952 bytes from the compatible run #9 cache and
  saved a new cache. Unity reported warnings=0/errors=1 with
  `BuildReport.totalSize` 640,044,480; keep the counter for later review.
  Repository verify run #637 also passed for this commit. Later batches remain
  dependency-closed and capped at 19 canonical files.
- Supabase's project status was checked read-only as `ACTIVE_HEALTHY`; this
  handoff made no Supabase changes. Unity Cloud Build is not part of this path.
- Stage 8 passed in Bootstrap run #12 on
  `67da68ed10822218383bd75a0d3334a07c4d9f21`. Its downloaded 31,252,903-byte
  Android/IL2CPP/ARM64 APK SHA-256
  `c498b81fd1a4e8f3556462763a7f620656bae53be10431db460ffb60786cb7fc`
  matches the build report; artifact `VEXFORGE-Unity-Bootstrap-APK-12`
  (ID `11675681802`, 30,604,997 bytes) and APK passed integrity checks.
  Unity reported warnings=2/errors=1 with `BuildReport.totalSize` 664,903,458;
  keep the counters for review, per the existing non-blocking rule. Run #12
  restored 1,864,932,017 bytes from the compatible run #11 cache and saved
  1,891,051,220 bytes.
- Stage 9 passed in Bootstrap run #13 on
  `fd6226f63865318d77136ed289fe329f3b967a83`. Its downloaded 45,028,601-byte
  Android/IL2CPP/ARM64 APK SHA-256
  `b634043078a8f596846415839512386690619b6df055b9b68eaa4d83c35d2107`
  matches the report; artifact `VEXFORGE-Unity-Bootstrap-APK-13` (ID
  `11676937099`, 44,385,181 bytes) and APK passed integrity checks, with Android
  manifest, Unity data, and ARM64 IL2CPP present. Unity reported warnings=0,
  errors=1 and `BuildReport.totalSize` 714,070,552; keep the counter for review,
  per the existing non-blocking rule. Run #13 restored 1,891,051,220 bytes from
  the compatible run #12 cache and saved 2,003,837,946 bytes.
- Stage 10 passed in Bootstrap run #16 on
  `022632a9a588412994b7f45854e3dd4116cda30c`. Its downloaded 45,826,451-byte
  APK SHA-256 `4dc519b8746a8512f128facdfe242609347335433aae87fd7c0c74f4f5da361c`
  matches the report; artifact `VEXFORGE-Unity-Bootstrap-APK-16` (ID
  `11679136405`, 45,167,480 bytes) and APK passed ZIP/CRC and structure checks.
  Unity reported warnings=0, errors=1 and `BuildReport.totalSize` 721,256,066;
  keep the counter for review. Runs #14–#16 used the same source SHA; #16 is
  verification of Stage 10, not a new content stage.
- Stage 12 passed in Bootstrap run #18 on
  `9250fdcec1f7a61396a345d7ea67d5060ee13d58`. Artifact
  `VEXFORGE-Unity-Bootstrap-APK-18` (ID `11680372661`) contains a
  45,827,421-byte APK whose SHA-256
  `6625abf256d9dc266c24dba453e2ecd5a60fb1e56d9843af1e91f590f6169bcc`
  matches the report; APK ZIP/CRC and Android/Unity/ARM64 IL2CPP structure checks
  pass. Unity reported warnings=0/errors=1 with `BuildResult.Succeeded`; record
  the counter for later review under the existing non-blocking rule.
- Stage 13 passed in Bootstrap run #19 on
  `045127b73cf1c772e0867bed9346aa05178161cc`. Artifact
  `VEXFORGE-Unity-Bootstrap-APK-19` (ID `11680224893`, 45,168,148 bytes)
  contains a 45,827,441-byte APK with SHA-256
  `fec30a5f4e8264e4630a41d9b29934fad00f4bca7d4e39a00aebf58203915a9a`,
  matching the report. APK and artifact ZIP integrity and Android manifest,
  Unity data, and ARM64 IL2CPP structure checks pass. Unity reported
  warnings=0/errors=1 with `BuildResult.Succeeded`; record the counter under the
  existing non-blocking rule. The run restored a compatible cache (2,010,423,176
  bytes) and saved a new cache (2,010,449,557 bytes).
- Stage 14 copies the final 8 canonical paths (8/197, 4.0609%) into Bootstrap.
  All 197 canonical paths and all 81 official C# files are present and byte-
  identical. The Bootstrap-specific builder now materializes R5 resources
  before `BuildPipeline`; the copied R5 build hook remains identical to `unity/`.
  No runtime content or file under `unity/**` changed.
  The scene, scene list, packages, and Unity version match the source; only
  `ProjectSettings.asset` intentionally differs for the Bootstrap identity.
- Bootstrap run #20 (`38085930684`, source `3609d16093701b4d54ef5f0dd0e61596fb1c9571`)
  launched Unity after checkout, compatible Library-cache restore, and license
  setup, then was cancelled at the workflow's 360-minute limit. Unity produced
  no exit code; APK verification/upload/cache-save were skipped and the run has
  no artifacts. The cache restore and 35.8 KB Stage 14 addition do not explain
  the duration. Actions confirms the hook was absent in runs 1–19 and first
  appeared in run 20, byte-identical to the official source. The R5 pipeline,
  renderer, materials, and presentation-resource asset it creates were absent
  from that checkout, so their first creation/import occurred inside
  `BuildPipeline`. This is the strongest code-level risk, not a proven cause:
  run #20 did not stream Unity's log, so its internal stall phase is unknown.
- The Bootstrap-specific build entry point now creates and validates those
  resources before `BuildPipeline`; the original hook remains byte-identical and
  will run unchanged afterward. The workflow streams Unity's log live. This
  mitigation has not yet been validated by an APK; one manual validation build
  was authorized for that repair.
- Bootstrap run #21 (`38115064772`, commit
  `ead747414417ddbbda8fbb815c92f0cc7c900968`) passed setup, Unity activation and
  compatible cache restore (2,010,449,557 bytes from run #19), then failed before
  `BuildPipeline` because the R5 gate expected 8 `GameRoute` values while the
  canonical enum has 9 (`Boot=0` through `World=8`). This is a gate mismatch,
  not a C# compiler or credential failure; no APK, artifact or new cache exists.
  Both gate copies now include `World` and enforce indices 0–8. The current user
  authorizes exactly one manual Bootstrap validation build after this repair;
  validate the APK, artifact, report and hash, then stop on any failure.

## Active scope

- `unity/**` is the sole official Unity Android project. The former project at
  `unity/**` was removed and the completed Bootstrap project was promoted there
  on 2026-10-11 at the user's explicit direction.
- Its Android identity is `com.vexforge.android`, product name `VEXFORGE`, and
  Unity Editor version `6000.3.0f1`.
- The manual workflow
  `.github/workflows/vexforge-unity-android-github.yml` now uses the promoted
  Android builder. It is not dispatched automatically.
- The promotion deliberately did not run a new Unity/Android build. Do not claim
  the promoted state compiles or is device-verified; a future build requires
  fresh explicit user authorization.
- The official web portal is under `src/**` and `public/**`; leave it unchanged
  unless the user directly requests portal work.
- Supabase remains authoritative for identity, ownership, combat, settlement,
  economy, progress, and rewards. Do not alter the live project unless directly
  authorized.
- Keep the official branch on `main`; before milestones, fetch and confirm a
  clean tree with `HEAD == origin/main`. Commit and push completed work.
- Never reset, rebase, merge, cherry-pick, or force-push the official branch.
- Responses to the user are in Spanish.

Out of scope unless requested:

- Changes to `src/**` or `public/**` during Unity work.
- Supabase live schema, RPC, RLS, authentication, data, and backend rules.
- Unity/Android builds, APK/AAB releases, and Unity Cloud Build unless directly
  and freshly requested.

No Epic/Fab asset payloads or listing identifiers were found in the repository.
Epic/Fab sourcing is retired from the active direction. The game's `epic`
card rarity is unrelated and must remain intact.

## Run & verify

- The Replit container has .NET SDK 10 for auxiliary tooling, but it does not
  host Unity Editor or Unity Hub. Do not treat .NET as a Unity compiler.
- A local `unityhub` Nix package attempt is not viable in this Replit sandbox:
  its FHS launcher fails because `bwrap` capabilities are unavailable, and
  bypassing that launcher exits with `SIGILL`. The unsupported local package was
  removed; do not report local Hub/Editor availability or repeat that install.
- Unity Editor and Android builds run on the official GitHub Actions runner via
  `.github/workflows/vexforge-unity-android-github.yml`. That workflow installs
  Unity Hub, the exact editor version from `unity/ProjectSettings/ProjectVersion.txt`,
  and Android modules before compiling/building the official project.
- Use `npm run unity:android` to dispatch and monitor that workflow. It requires
  a clean local `main`, `HEAD` synchronized with GitHub `main`, and the Replit
  Secret `GITHUB_PAT`. It reuses a run for the same commit and refuses to start
  a concurrent build for a different commit. Unity license credentials remain
  in GitHub Actions Secrets; never copy Replit secret values to GitHub.
- The workflow proves only the gates it actually runs. It performs a batch
  Android build; it does not by itself prove interactive Game View, Play Mode,
  real-device performance, or a ten-minute device soak. Check workflow logs and
  artifacts before reporting any gate as passed.
- Before dispatching manually or with the helper, inspect Actions for an
  already-running build. Avoid duplicate Unity installations/builds.
- `npm run verify:visual-production`, `npm run verify`, `npm run typecheck`, and
  `npm run build` are source/portal checks; only the first checks Unity source
  contracts, and none substitutes for Unity Editor or device evidence.

## Runtime stack

- Unity Editor `6000.3.0f1`
- Android package `com.vexforge.android`
- Product name `VEXFORGE`
- C# / Unity runtime under `unity/**`

## Where things live

- `unity/Assets/Scripts/Core/` — app bootstrap, state and navigation.
- `unity/Assets/Scripts/Backend/` — Supabase client, contracts and repositories.
- `unity/Assets/Scripts/Presentation/` and `Tier1/` — world, battle, tutorial,
  audio and other runtime presentation.
- `unity/Assets/` — Unity scenes and project assets.
- `docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md` — manual build boundaries.
- `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md` — archived migration
  history; not the current build guide.
- `supabase/`, `backend/` — existing authority/contracts; do not change their
  behavior for this client migration.
- `src/`, `public/` — official web portal.

## Architecture decisions

- Supabase remains authoritative for authentication, ownership, combat
  settlement, rewards and economy; presentation must not calculate them.
- Implement Unity behavior against existing backend contracts; do not duplicate
  the backend's authority.
- Official card artwork is canonical and must not be repainted or silently
  replaced by generated art.
- A local laboratory or training presentation must be labelled as such and
  cannot be promoted to competitive settlement.
- Quality, animation, audio, haptics, and reduced-motion settings affect
  presentation only, never game rules.
- Every bounded milestone receives targeted validation, a checkpoint update,
  a commit and a push to `main`.

## Supabase

- Project: `rscuzqnfccqvltkdcdny`
- URL: `https://rscuzqnfccqvltkdcdny.supabase.co`
- Runtime code requires the public client configuration; PATs are never stored
  in source files or runtime bundles.

## Gotchas

- The user explicitly said not to remove VexforgeSPP. That name is absent from
  the current official Unity tree and repository history; do not treat its
  absence as permission to delete or replace it if its canonical source is
  supplied or found later.
- `SecureSessionStore` contains Android Keystore/AES-GCM code, but Editor/device
  behavior has not been verified.
- Unity source implementation alone does not prove runtime parity; the open
  Editor/device checks remain required evidence.
- Do not infer live Supabase columns, constraints, functions or grants from
  old migrations; inspect the live contract before changing economy or battle
  consumers.
- Repository cleanup does not count as Unity Editor, device, parity, or security
  verification; keep those checks open until real evidence closes them.
