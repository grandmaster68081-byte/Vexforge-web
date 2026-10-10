# VEXFORGE Unity Bootstrap

This is the isolated, cumulative destination for migrating the official Unity
game into complete Android APKs in small, dependency-complete steps. It is not a
second source of truth and must never replace or modify the official game.

## Current state (2026-10-10)

- Unity Editor: `6000.3.0f1`, matched to `unity/ProjectSettings/ProjectVersion.txt`.
- Android application ID: `com.vexforge.bootstrap`, distinct from the official
  `com.vexforge.android`.
- This folder currently contains Unity project settings, package manifests, and
  the build entry point; it has no migrated official scene or gameplay content.
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
- Add exactly 5–7% of the pinned official C# line inventory per stage. Resolve
  dependencies using prior stages or within the current slice, and record each
  canonical path and hash in `MIGRATION_MANIFEST.json`. Preserve upstream `.meta`
  files/GUIDs; assign stable metadata only where the official source has none.
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
`MIGRATION_MANIFEST.json` for the preflight, exact 5–7% source slice,
commit/push, full APK build, artifact/hash, and cache evidence sequence.
