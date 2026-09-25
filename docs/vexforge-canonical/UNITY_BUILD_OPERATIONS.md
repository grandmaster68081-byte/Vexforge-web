# VEXFORGE — Canonical Unity Android build operations

Status: ACTIVE OPERATIONAL REFERENCE

The source of truth for the executable build remains
[`.github/workflows/vexforge-unity-android-github.yml`](../../.github/workflows/vexforge-unity-android-github.yml).
This document contains no credential values and no local build instructions.

## 1. Canonical ownership

| Area | Canonical value |
| --- | --- |
| Repository | `grandmaster68081-byte/Vexforge-web` |
| Branch | `main` |
| Unity root | `unity/` |
| Editor version | `unity/ProjectSettings/ProjectVersion.txt` |
| Workflow | `.github/workflows/vexforge-unity-android-github.yml` |
| Entry point | `Vexforge.Editor.VexforgeGitHubBuild.BuildAndroid` |
| Platform | Android, Gradle, IL2CPP, ARM64 |
| Trigger | `workflow_dispatch` only |

The workflow is the only authorized Android compilation path. Diagnostic,
inventory, shader shard, checkpoint and final operations are inputs/modes of
that same workflow. Do not create a second workflow or use an alternate build
service.

## 2. Editor and project contract

The workflow checks out `main`, reads the Unity version from
`ProjectVersion.txt`, installs that Editor with Android support, and invokes it
with `-projectPath` set to `unity/`. It must not hardcode a different Editor
version or treat the repository root or `mobile/` as the Unity project.

The Unity build entry point selects Gradle, IL2CPP and ARM64, then writes an
APK under `unity/Builds`. The workflow validates the Editor exit code, APK
presence and size, records a digest, uploads evidence and publishes a release
only when explicitly authorized and all gates pass.

## 3. Manual execution boundary

The workflow is `workflow_dispatch` only. No automatic Android build is enabled.
No run is launched by continuity updates, secret setup, documentation changes
or repository inspection. The owner must explicitly authorize a build before a
workflow dispatch is attempted.

The current request established the control plane and intentionally did not
launch a run.

## 4. Secret boundary

Replit control-plane secrets are never placed in source, GitHub workflow YAML,
artifacts, logs or commits. GitHub Actions receives only the GitHub repository
secrets required by the Unity activation path (`UNITY_LICENSE`, or
`UNITY_EMAIL`/`UNITY_PASSWORD`). These are separate from any Replit API
credentials.

## 5. Supabase and external services

Supabase live is the authority for backend data, auth, RLS, policies, RPCs,
economy, rewards and settlement. This build control-plane update performs no
schema or production-data mutation.

Unity Cloud Build / Build Automation is not the active build method. Its
existing project may remain documented as external reference, but it must not
be dispatched, connected, recreated or used to spend build quota for this
pipeline.

## 6. Evidence states

- `LICENSE_READY`: activation or ULF materialization completed.
- `EDITOR_BUILD_STARTED`: Unity reached the build entry point.
- `APK_VERIFIED`: APK checks and digest completed.
- `RELEASE_PUBLISHED`: evidence and prerelease were published.

Source inspection alone never elevates the project to
`EDITOR_VERIFIED`, `BUILD_VERIFIED` or `DEVICE_VERIFIED`.
