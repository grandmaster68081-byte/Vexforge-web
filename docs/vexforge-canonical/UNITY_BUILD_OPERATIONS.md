# VEXFORGE — Canonical Unity Android build operations

Status: DEFERRED — NO ACTIVE UNITY BUILD WORKFLOW

Current `main` has no Unity Android workflow. The old workflow path was changed
to build Expo on 2026-10-01 and was removed on 2026-10-05. This file records
constraints for the later Unity workflow milestone; it is not an executable
workflow description. Current workflow status is recorded in
`28_UNITY_EXPO_MIGRATION_GATES.md` and `05_ANDROID_RUNTIME_AND_BUILD.md`.
This document contains no credential values and no local build instructions.

## 1. Canonical ownership

| Area | Canonical value |
| --- | --- |
| Repository | `grandmaster68081-byte/Vexforge-web` |
| Branch | `main` |
| Unity root | `unity/` |
| Editor version | `unity/ProjectSettings/ProjectVersion.txt` |
| Workflow | None configured on current `main` |
| Entry point | None currently invoked |
| Platform | Android target: Gradle, IL2CPP, ARM64; not verified |
| Trigger | Not configured |

When configured in the later workflow milestone, one Unity-only workflow must
be the sole approved Android compilation path. Do not reactivate the historical
Expo workflow, create a parallel Unity pipeline, or use Unity Cloud Build.

## 2. Editor and project contract

The future workflow must check out `main`, read the Unity version from
`ProjectVersion.txt`, install that Editor with the required modules, and invoke
it with `-projectPath` set to `unity/`. It must not hardcode a different Editor
version or treat the repository root or retired `mobile/` as the Unity project.

Editor-only validation must not generate an Android package. A later Android
build path would need to validate the Editor exit code, artifact identity and
size, record evidence, and publish only when separately authorized and all
release gates pass.

## 3. Manual execution boundary

No Unity workflow is currently available to dispatch. Do not dispatch a
historical workflow ID or use the retired workflow path. No automatic Android
build is enabled. The owner must explicitly authorize any Android package build.

The current migration performs no APK/AAB build; Editor and device gates remain
open.

## 4. Secret boundary

Replit control-plane secrets must never be placed in source, GitHub workflow
YAML, artifacts, logs or commits. If/when a workflow is configured, Unity
activation must use only the existing GitHub Actions secrets. Replit API and
Unity Cloud credentials are separate and must not be copied into GitHub Actions.

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
