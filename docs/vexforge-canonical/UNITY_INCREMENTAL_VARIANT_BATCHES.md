# VEXFORGE — Incremental variant batch continuity

Status: CONFIGURED — NOT LAUNCHED

## Canonical workflow

The only authorized Unity Android build workflow for this process is:

- `.github/workflows/vexforge-unity-android-github.yml`
- Workflow name: `Build VEXFORGE Unity Android on GitHub`
- Runtime: Unity `6000.3.0f1`
- Project path: `unity/`
- Build entry point: `Vexforge.Editor.VexforgeGitHubBuild.BuildAndroid`

The workflow remains manual-only through `workflow_dispatch`. No push event,
Expo workflow, Unity Cloud Build job, or second Unity workflow can start this
process.

## Required execution order

1. Start from the existing inventory and a checkpoint created by shard `0`.
2. Run shards `1` through `11` sequentially. Each shard requires the previous
   shard's checkpoint run and artifact, uses the next deterministic hash range,
   and must finish successfully before the next shard is started.
3. Each checkpoint must contain both `Library/ShaderCache` and
   `Library/PlayerDataCache`, including `ScriptsOnlyCache.yaml` and
   `DataBuildDirtyInfo.json`. The workflow stores a SHA-256 manifest of those
   files and refuses a shader-only or otherwise incomplete checkpoint.
4. The workflow verifies that the checkpoint's Unity project tree matches the
   current `unity/` tree before restoring it. Documentation/workflow-only
   changes do not invalidate the Unity build state; Unity project changes do.
5. The final operation must use shard index `11`, restore the last checkpoint,
   prove complete manifest coverage against `inventory.tsv` with no duplicates,
   gaps, or extras, and only then build one APK.

The old checkpoint artifact that contains only `ShaderCache` is intentionally
not sufficient for this contract. It must not be presented as a complete
incremental checkpoint.

## Final APK contract

The final APK is a single unfiltered Android build. It is not assembled from
partial shard APKs, and shard APKs remain evidence-only artifacts.

- `Vexforge.Editor.VexforgeGitHubBuild.BuildAndroid` calls Unity
  `BuildPipeline.BuildPlayer`.
- Android uses Gradle, IL2CPP, and ARM64.
- `VEXFORGE_FULL_BUILD_FILTER=disabled` is required.
- The Editor logs `shader_filter=disabled`; the workflow rejects logs that show
  a hard cap, selected/removed variant filtering, or a variant limit.
- APK validation still requires a non-empty APK and the successful Unity build
  result.

The final operation does not use the shader-shard `BuildAndroid` method and
does not apply the former 35,000-variant limit.

## Evidence gates

Every shard records its commit, shard range, selected/removed counts, Unity
version, build target, APK digest, cache observations, and manifest. For
shards after `0` and for `final`, the workflow requires cache reuse evidence
from the Unity Editor log; counting restored files is not accepted as proof.

The final coverage gate compares the union of all shard fingerprints against
the inventory:

- every inventory fingerprint must appear;
- no fingerprint may appear in more than one shard;
- no shard may contain a fingerprint outside the inventory;
- exactly `SHARD_COUNT` shard manifests must be present.

This establishes shader-compilation continuity. It does not claim gameplay or
content-variant coverage, public rollout completeness, device QA, or a release
until those separate gates are verified.

## Operational rules

1. Work only in the canonical GitHub Actions workflow above.
2. Do not create another workflow, Unity project, build target, or GitHub
   connection.
3. Do not dispatch any shard, final build, APK release, or device validation
   without explicit authorization.
4. Do not publish a partial APK as a public rollout artifact.
5. Keep Supabase as the backend authority; this build flow does not alter
   schema, data, auth, RLS, RPCs, storage, or functions.