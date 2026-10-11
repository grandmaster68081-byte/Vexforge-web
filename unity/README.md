# VEXFORGE Unity Android

This is the sole official Unity Android project. It was promoted from the
completed Bootstrap project on 2026-10-11 at the user's direction. It uses the
official product name `VEXFORGE`, Android application ID
`com.vexforge.android`, and Unity Editor `6000.3.0f1`.

The project contains all 197 canonical Unity paths from the former official
project, plus the Bootstrap build entry point and supporting files. The
promotion did not run a new build; historical Bootstrap APKs do not verify the
promoted project state. Supabase remains authoritative and was not modified.

The remaining sections are a historical migration record. Do not treat their
old Bootstrap paths or conditional build authorization as current instructions.

## Historical migration record (2026-10-11)

- Unity Editor: `6000.3.0f1`, matched to `unity/ProjectSettings/ProjectVersion.txt`.
- Android application ID: `com.vexforge.bootstrap`, distinct from the official
  `com.vexforge.android`.
- Stages 1–13 have passed. The full 76-file runtime C# set and all 81 official
  C# files are present and byte-identical to their official copies.
- Stage 11 passed in Bootstrap run #17 on
  `c5d5b81011cc2647533c0684055fb980bc19cec0`. It produced
  `VEXFORGE-Unity-Bootstrap-APK-17` (ID `11679358725`). Its 45,827,437-byte APK
  SHA-256 is `0101f9b9af7960c6a74b5b4e538015a5f9baaba1e57dfe260fb79c040cc727b0`;
  the downloaded APK hash matches the report and APK ZIP/structure checks pass.
  Unity reported 0 warnings and 1 error with `BuildResult.Succeeded`; record the
  counter for review under the existing non-blocking rule.
- Stage 12's canonical script GUID metadata passed in Bootstrap run #18 on
  `9250fdcec1f7a61396a345d7ea67d5060ee13d58`. Artifact
  `VEXFORGE-Unity-Bootstrap-APK-18` (ID `11680372661`) contains a
  45,827,421-byte APK with SHA-256
  `6625abf256d9dc266c24dba453e2ecd5a60fb1e56d9843af1e91f590f6169bcc`;
  downloaded and reported hashes match, and artifact/APK ZIP and structure
  checks pass. Unity reported 0 warnings and 1 error with
  `BuildResult.Succeeded`; record the counter under the existing non-blocking
  rule.
- Stage 13 passed in Bootstrap run #19 on
  `045127b73cf1c772e0867bed9346aa05178161cc`. Artifact
  `VEXFORGE-Unity-Bootstrap-APK-19` (ID `11680224893`, 45,168,148 bytes)
  contains a 45,827,441-byte APK with SHA-256
  `fec30a5f4e8264e4630a41d9b29934fad00f4bca7d4e39a00aebf58203915a9a`;
  the downloaded hash matches the report. Artifact/APK ZIP integrity and
  Android/Unity/ARM64 IL2CPP structure checks pass. Unity reported 0 warnings
  and 1 error with `BuildResult.Succeeded`; the counter remains recorded under
  the non-blocking rule. It restored a compatible cache of 2,010,423,176 bytes
  and saved a new cache of 2,010,449,557 bytes.
- Stage 14 adds the final 8/197 canonical paths (4.0609%), bringing Bootstrap
  path coverage to 197/197. All 81 official C# files, including
  `VexforgeR5CloudBuildGate.cs`, are byte-identical. The Bootstrap-specific
  entry point now creates and validates the R5 resources before `BuildPipeline`;
  the original gate remains unchanged and runs as authored. The real scene,
  scene list, packages, and Unity version are aligned. Only
  `ProjectSettings.asset` intentionally differs for the Bootstrap product name,
  package ID, and version code.
- Bootstrap run #20 (`38085930684`, source
  `3609d16093701b4d54ef5f0dd0e61596fb1c9571`) started Unity after checkout,
  compatible Library-cache restoration, and license setup, then was cancelled
  at the workflow's 360-minute limit. No Editor exit code or artifact exists;
  APK validation, upload, and cache-save were skipped. The project addition was
  about 35.8 KB, and a compatible cache restored successfully, so neither
  explains six hours. Runs 1–19 did not contain the R5 callback; run 20 was the
  first build to include it. Its generated URP pipeline, renderer, materials,
  and presentation-resource asset were absent from that checkout, so first
  creation/import happened inside `BuildPipeline`. This is the strongest
  suspected cause, but the exact stall remains unconfirmed because the Editor
  log was only printed after exit.
- The Bootstrap-specific builder creates and validates the R5 resources before
  `BuildPipeline`; the workflow streams Unity's log live. Bootstrap run #21
  (`38115064772`, commit `ead747414417ddbbda8fbb815c92f0cc7c900968`) restored
  the compatible 2,010,449,557-byte cache from run #19, then stopped at the R5
  gate before `BuildPipeline`: the allowlist expected 8 `GameRoute` values but
  the canonical enum has 9 (`Boot=0` through `World=8`). It was not a C#
  compiler or credential failure; no APK, artifact, report, or new cache was
  produced. The two gate copies now include `World` and retain the 0–8 index
  validation. The current user request authorizes one manual Bootstrap build
  after this repair; validate the APK/artifact/hash and stop if it fails.
- The successful historical APK #2 was a workflow smoke test using an empty
  generated scene. It proves neither migrated game content nor a cache restore.
- Stage 5 restored `Assets/Scenes/VexforgeBootstrap.unity` from the canonical
  Unity project, and stage 4 supplies its `VexforgeApp` script GUID. The builder
  requires that real scene and never creates a default or placeholder. APK
  success still does not prove gameplay parity or device behavior.

## Archived migration rules

- Keep `unity/**` as canonical. The only approved changes in this repair are
  the mirrored `using Vexforge.Core` import in `VexforgeTier1EconomyHub.cs` and
  the paired R5 gate correction adding `World=8`. Make no other official Unity
  source edits.
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
- The user's eventual goal is to retain Bootstrap after complete parity and
  retire the official Unity copy. Do not delete `unity/**` in this stage; that
  destructive action requires completed verification and explicit confirmation.

## Archived Bootstrap build and cache details

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
