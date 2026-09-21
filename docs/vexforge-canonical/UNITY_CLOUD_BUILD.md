# VEXFORGE — Existing Unity Cloud Build Infrastructure

STATUS:
EXISTING_EXTERNAL_INFRASTRUCTURE

Organization:
2476049544959

Project:
2906c165-f463-4253-bd53-731be7d136a0

Dashboard:
https://cloud.unity.com/organizations/2476049544959/projects/2906c165-f463-4253-bd53-731be7d136a0/cloud-build/config

Repository:
grandmaster68081-byte/Vexforge-web

Branch:
main

Unity project:
unity/

Unity version:
6000.3.0f1

Platform:
Android

Package:
com.vexforge.android

Cloud target:
EXISTING VEXFORGE ANDROID BUILD AUTOMATION TARGET

Exact target display name:
EXTERNAL STATE — DO NOT INVENT

Purpose:
Remote Unity Editor / Build Automation execution for the canonical Unity
Android project.

R5 underlying gate:
Vexforge.Presentation.Editor.VexforgeR5FoundationGate.ExecuteBatch

R5 Cloud adapter, when present:
Vexforge.Presentation.Editor.VexforgeR5CloudBuildGate.PreExport

Critical continuity rule:
The Unity Cloud project and Android Build Automation target already existed
before this block and must be reused rather than recreated.

Critical evidence rule:
Repository presence of the bridge does not prove the Cloud dashboard hook
is configured.

Critical execution rule:
EDITOR_VERIFIED requires an actual Unity Cloud run with real Editor logs.

Critical build rule:
BUILD_VERIFIED requires an actual Android artifact.

Critical device rule:
DEVICE_VERIFIED requires actual physical/device evidence.

Automation policy:
Auto-build OFF.
Schedule OFF.
Builds remain MANUAL.
## Current executable path

The current executable Unity Android path is the direct GitHub Actions workflow documented in [UNITY_BUILD_OPERATIONS.md](UNITY_BUILD_OPERATIONS.md). It installs the Editor with Unity CLI, keeps Unity Hub for licensing only, supports stored ULF or online Personal activation, invokes `Vexforge.Editor.VexforgeGitHubBuild.BuildAndroid`, verifies the APK, uploads evidence, and publishes a prerelease.

Unity Cloud Build / Build Automation remains existing external infrastructure and is not called by that GitHub workflow. The existing project and Android target remain manual and must be reused, never recreated.
