# VEXFORGE Unity Bootstrap

This is the isolated, cumulative destination for migrating the official Unity
game into complete Android APKs. The authorized plan first completes the entire
canonical C# source set in one code-only pass; after that succeeds, the deferred
full-project content is migrated in bounded, dependency-complete batches. This
is not a second source of truth and must never replace or modify the official
game.

## Current state (2026-10-10)

- Unity Editor: `6000.3.0f1`, matched to `unity/ProjectSettings/ProjectVersion.txt`.
- Android application ID: `com.vexforge.bootstrap`, distinct from the official
  `com.vexforge.android`.
- Stages 1–10 have passed. The full 76-file canonical C# source set is present;
  the cumulative content inventory after Stage 10 was 148/197 files. Stage 10
  added five Nexus, pack, and reward textures with their original `.meta` files.
- Stage 10 was revalidated in Bootstrap run #16 on
  `022632a9a588412994b7f45854e3dd4116cda30c`. Artifact
  `VEXFORGE-Unity-Bootstrap-APK-16` (ID `11679136405`, 45,167,480 bytes) and its
  APK passed ZIP/CRC and structure checks. The 45,826,451-byte APK SHA-256 is
  `4dc519b8746a8512f128facdfe242609347335433aae87fd7c0c74f4f5da361c`.
  Unity reported 0 warnings and 1 error; `BuildReport.totalSize` was 721,256,066
  bytes. Keep that counter for review; the workflow and artifacts passed.
- Stage 11 is prepared with the production configuration JSON, its canonical
  `.meta`, and the Editor build validator. Its 18 required project paths are
  already present. This adds 3/197 files (1.5228%) for 151/197 cumulative files.
  There are 46 tracked files remaining: 44 under `Assets/` and the two canonical
  project-root files. The next build must use a new commit containing this slice;
  runs on the unchanged Stage 10 SHA do not count as migration progress.
- The successful historical APK #2 was a workflow smoke test using an empty
  generated scene. It proves neither migrated game content nor a cache restore.
- Stage 5 restored `Assets/Scenes/VexforgeBootstrap.unity` from the canonical
  Unity project, and stage 4 supplies its `VexforgeApp` script GUID. The builder
  requires that real scene and never creates a default or placeholder. APK
  success still does not prove gameplay parity or device behavior.

## Migration rules

- Keep `unity/**` unchanged; inspect it as the canonical source.
- Preserve the verified stages 1 and 2. Stage 3 is the user-directed one-time
  completion of all remaining canonical C# source, taking the code inventory to
  100%; it is intentionally larger than the historical 5–7% code slices.
- After stage 3 passes, migrate the remaining canonical Unity project files
  in dependency-closed batches capped at 10% of the complete tracked `unity/`
  inventory. The manifest defines the auditable file-count denominator and
  current cap; do not preselect a fixed number of batches.
- Record every canonical path and source/destination hash in
  `MIGRATION_MANIFEST.json`. Preserve upstream `.meta` files/GUIDs when those
  files enter a later content batch; do not add new `.meta`, scenes or Resources
  to the stage 3 code-only pass.
- Intermediate APKs are full Android builds of the accumulated project, but
  their scenes/runtime behavior may be incomplete. The Unity compile and APK
  build must still succeed. Temporary scene disconnects or compile seams must
  be recorded and removed/replaced by canonical source before final parity.
- Do not invent gameplay, data, scenes, art, or replacement assets.
- Retain every previously accepted slice in `unity-bootstrap/`; each APK is a
  full build of the accumulated project, not a shard or partial package.
- Keep the package ID, Unity version, and settings boundary described in
  `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md`.
- Supabase is not part of this build pipeline. Do not modify live schema, data,
  authentication, policies, RPCs, or configuration.

## Build and cache

The workflow `.github/workflows/vexforge-unity-bootstrap-android.yml` is
manual-only and builds this folder. It uploads the APK and report. Its only
cache is `unity-bootstrap/Library/`, saved after successful APK verification;
the Unity Editor, Hub state, licenses, and credentials are never cached.

The documented conditional authorization permits sequential Bootstrap builds
only after the previous APK passes all required checks. Stop on any failure;
do not retry without fresh authorization. Do not dispatch the official Unity
workflow or Unity Cloud Build. Follow the canonical workflow guide and
`MIGRATION_MANIFEST.json` for the current all-code preflight, commit/push, full
APK build, artifact/hash, and cache evidence sequence. Later non-code batches
must remain within the 10% complete-project cap.
