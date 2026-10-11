# VEXFORGE — Canonical Unity Android build operations

Status: PROMOTED OFFICIAL PROJECT — MANUAL ANDROID APK WORKFLOW — NOT RUN AFTER PROMOTION

This document applies to the single official Unity project in `unity/`, promoted
from the completed Bootstrap project on 2026-10-11. The previous shard-based
official workflow was retired and replaced at
`.github/workflows/vexforge-unity-android-github.yml` with the proven Bootstrap
Android entry point, retargeted to the official path and identity. No build was
run during the promotion.

## 1. Canonical ownership

| Area | Canonical value |
| --- | --- |
| Repository | `grandmaster68081-byte/Vexforge-web` |
| Branch | `main` |
| Unity root | `unity/` |
| Editor version | `unity/ProjectSettings/ProjectVersion.txt` |
| Workflow | `.github/workflows/vexforge-unity-android-github.yml` |
| Entry point | Manual `workflow_dispatch` only |
| Platform | Android target: Gradle, IL2CPP, ARM64; not verified after promotion |
| Trigger | `workflow_dispatch` only; no automatic trigger |

This is the only current Android compilation workflow. It builds `unity/` and
uploads an APK plus a build report only after APK verification. It uses GitHub
Actions Unity activation secrets; Replit credentials do not belong in the
workflow. Do not use Unity Cloud Build.

## 2. Editor and project contract

The workflow checks out `main`, reads the Unity version from
`ProjectVersion.txt`, install that Editor with the required modules, and invoke
it with `-projectPath` set to `unity/`. It must not hardcode a different Editor
version or treat the repository root or retired `mobile/` as the Unity project.

The Android workflow validates the Editor exit code, APK identity and size,
records a SHA-256 report, and uploads the APK as a workflow artifact. An APK
build or release still requires fresh explicit user authorization.

## 3. Manual execution boundary

The workflow is available for manual dispatch. Do not dispatch it or start an
Android package build without explicit authorization.

Only the single official workflow remains. Editor, package and device gates for
the promoted official game remain open until new evidence verifies them.

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
