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
- Stages 1 and 2 passed. Stage 3 contains all 76 canonical
  `Assets/Scripts/**/*.cs` files (16,988 lines); its 63 newly copied scripts are
  hash-identical to the official source. APK run #7 passed workflow, artifact,
  hash, and structural checks. Unity reported 2 warnings and 1 error in its
  BuildReport despite `Result: Success`; the unexplained error count is recorded
  and must not be described as a zero-error build.
- Stage 4 is the exact upstream `VexforgeApp.cs.meta` file. It restores the only
  script GUID referenced by the official bootstrap scene; the scene remains
  deferred. This one-file batch is prepared for the next manual APK build.
- The existing Bootstrap scene is a documented, modified copy of the official
  scene. It intentionally omits the `VexforgeApp` component. This code-only pass
  does not restore the canonical scene or migrate the remaining resources,
  metadata, or other Unity files.
- The successful historical APK #2 was a workflow smoke test using an empty
  generated scene. It proves neither migrated game content nor a cache restore.
- The current builder requires `Assets/Scenes/VexforgeBootstrap.unity` to exist
  and fails before building if it is missing. It never creates a default or
  placeholder scene. The code check only verifies that the file exists; it
  cannot prove the scene came from the official project or that its dependency
  closure is complete. Verify provenance and dependencies against `unity/`
  before accepting or building a slice.

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
