# VEXFORGE — Canonical Unity Android build operations

Status: RESTORED — MANUAL ONLY — NOT DISPATCHED

Current `main` contains the manual GitHub Actions workflow
`.github/workflows/vexforge-unity-android-github.yml`. It was restored from
repository history and has not been dispatched. Its shard mode partitions the
inventory into 12 shards and caps each shard at 35,000 variants. `normal` and
`final` use unfiltered builds without that cap. This document contains no
credential values or local build instructions.

## 1. Canonical ownership

| Area | Canonical value |
| --- | --- |
| Repository | `grandmaster68081-byte/Vexforge-web` |
| Branch | `main` |
| Unity root | `unity/` |
| Editor version | `unity/ProjectSettings/ProjectVersion.txt` |
| Workflow | `.github/workflows/vexforge-unity-android-github.yml` |
| Entry point | Manual `workflow_dispatch` only |
| Platform | Android target: Gradle, IL2CPP, ARM64; not verified |
| Trigger | Not configured |

This is the sole configured Android compilation workflow. Do not create a
parallel pipeline or use Unity Cloud Build.

## 2. Editor and project contract

The workflow checks out `main`, reads the Unity version from
`ProjectVersion.txt`, install that Editor with the required modules, and invoke
it with `-projectPath` set to `unity/`. It must not hardcode a different Editor
version or treat the repository root or retired `mobile/` as the Unity project.

Editor-only validation must not generate an Android package. A later Android
build path would need to validate the Editor exit code, artifact identity and
size, record evidence, and publish only when separately authorized and all
release gates pass.

## 3. Manual execution boundary

The workflow is available for manual dispatch. Do not dispatch it or start an
Android package build without explicit authorization.

The current migration performs no APK/AAB build; Editor and device gates remain
open.

## 4. Secret boundary

Replit control-plane secrets must never be placed in source, GitHub workflow
YAML, artifacts, logs or commits. Unity activation uses only GitHub Actions
secrets. Replit API and Unity Cloud credentials are separate and must not be
copied into GitHub Actions.

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
