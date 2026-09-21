# VEXFORGE — Canonical Unity Android build operations

Status: ACTIVE OPERATIONAL REFERENCE

This document records the build and diagnostic methods used for the canonical Unity Android project. It contains no secret values. The source of truth for the executable workflow remains [.github/workflows/vexforge-unity-android-github.yml](../../.github/workflows/vexforge-unity-android-github.yml).

## 1. Execution paths and ownership

VEXFORGE has two separate Unity execution paths. They must not be treated as interchangeable:

| Path | What it does | Current relationship |
| --- | --- | --- |
| GitHub Actions direct Editor build | Installs Unity on an Ubuntu runner, activates a license, invokes the Editor, and creates the APK | Current executable CI path documented in this file |
| Unity Cloud Build / Build Automation | Uses the existing Unity Cloud project and existing Android target | Existing external infrastructure; manual and separate from the GitHub workflow |

The current GitHub workflow does **not** call Unity Build Automation. It compiles the project directly on the GitHub runner. The Unity Cloud project and target must be reused if that path is operated; do not create another project, target, or GitHub connection.

## 2. GitHub Actions direct build

Workflow: `.github/workflows/vexforge-unity-android-github.yml`

### Trigger

- Manual: `workflow_dispatch`.
- Automatic: push affecting `unity/**` or this workflow file.
- Runner: `ubuntu-latest`.
- Maximum job duration: 360 minutes.
- Permission: `contents: write`, needed for the prerelease publication step.

### Inputs and secret boundary

The GitHub workflow reads GitHub Actions secrets named:

- `UNITY_EMAIL` — Unity ID email for online activation.
- `UNITY_PASSWORD` — Unity ID password for online activation.
- `UNITY_LICENSE` — optional complete ULF license. When present, online activation is skipped.

These are separate from Replit control-plane secrets used to inspect or update external services from the agent. Replit secrets are not automatically forwarded to GitHub Actions, and no secret value belongs in this repository, an artifact, a log, or a commit.

### Environment installation

1. Checkout the repository with full history.
2. Read `m_EditorVersion` from `unity/ProjectSettings/ProjectVersion.txt`.
3. Install Node.js 22.
4. Install Unity Hub only to provide the Licensing Client.
5. Install the Unity Editor and Android module with Unity CLI: the project version from `ProjectVersion.txt`, Android module, component modules, and accepted Unity Editor and Android module licenses.
6. Store the resolved Editor path in `UNITY_EDITOR_PATH`.

Unity Hub is not used to install the Editor and is not the build driver in this path.

### License paths

The workflow supports two documented license methods:

**A. Stored ULF**

- Condition: `UNITY_LICENSE` is non-empty.
- The value is materialized only inside the temporary runner directory as `Unity_lic.ulf`.
- The workflow skips online activation.
- The ULF is never printed or committed.

**B. Online Unity Personal activation**

- Condition: `UNITY_LICENSE` is empty.
- Normalize the Unity ID email by removing line breaks, spaces, and wrapping quotes.
- Use `buildalon/activate-unity-license@v2`.
- Use Unity Hub's Licensing Client through `UNITY_HUB_PATH`.
- Use the temporary common directory in `UNITY_COMMON_DIR`.
- Use `license: personal` and `license-version: 6.x`.
- Use `UNITY_EMAIL` and `UNITY_PASSWORD` only through the action inputs.

The generated license is checked only for readiness. Its contents are never echoed.

### Editor build method

The workflow invokes the installed Editor directly:

The invocation has no additional agent-imposed step timeout. It is allowed to run until Unity completes or returns an error, subject only to the workflow job's existing 360-minute maximum. At exit it records the Editor exit code and elapsed seconds and prints the tail of `unity-editor.log`, so compiler and Gradle failures remain visible in the GitHub job log as well as the uploaded artifact. The Editor is also run with `-accept-apiupdate` to avoid an interactive API-update prompt in batch mode.


    Unity -batchmode -nographics -quit
      -projectPath <runner>/unity
      -buildTarget Android
      -executeMethod Vexforge.Editor.VexforgeGitHubBuild.BuildAndroid
      -logFile <runner>/build-artifacts/unity-editor.log

`unity/Assets/Editor/VexforgeGitHubBuild.cs` is the build entry point. It:

- requires at least one enabled scene;
- selects Gradle;
- selects IL2CPP for Android;
- selects ARM64;
- writes `unity/Builds/VEXFORGE-GitHub.apk`;
- fails the Editor invocation when `BuildPipeline` does not return `Succeeded`.

### Post-build evidence

The workflow does not consider a compiler invocation alone to be a successful release. It then:

1. Finds a generated `.apk` under `unity/Builds`.
2. Requires a non-empty APK larger than 1 MB.
3. Records editor version, branch, commit, run id, output path, byte size, and SHA-256 in `build-artifacts/vexforge-build-info.txt` and the step summary.
4. Uploads the APK and diagnostic files with `actions/upload-artifact@v4`.
5. Publishes a prerelease with `softprops/action-gh-release@v2` only after the APK verification passes.

The evidence levels are therefore:

- `LICENSE_READY`: activation or ULF materialization completed.
- `EDITOR_BUILD_STARTED`: the Editor reached `BuildAndroid`.
- `APK_VERIFIED`: the APK checks and digest completed.
- `RELEASE_PUBLISHED`: the GitHub artifact and prerelease were published.

Do not call a build `EDITOR_VERIFIED`, `BUILD_VERIFIED`, or `DEVICE_VERIFIED` from source inspection alone.

## 3. Unity Cloud Build / Build Automation path

The existing external infrastructure is recorded in [`UNITY_CLOUD_BUILD.md`](UNITY_CLOUD_BUILD.md). Its constraints are:

- reuse the existing Unity Cloud organization, project, and Android target;
- use the documented Unity Cloud API credential and Basic authorization method when operating that external API;
- keep builds manual unless the project owner explicitly changes that policy;
- do not create a second Unity Cloud project, target, or GitHub connection;
- verify a real Cloud run with Editor logs before claiming Editor verification;
- verify an actual Android artifact before claiming build verification.

This external path is not invoked by `.github/workflows/vexforge-unity-android-github.yml`. A successful GitHub Actions APK does not by itself prove that the Cloud target is configured, and a successful Cloud run does not prove that the direct GitHub workflow is healthy.

## 4. Control-plane inspection used during recovery

The recovery process used read/write GitHub API operations to inspect workflow definitions, commits, runs, jobs, logs, artifacts, and releases; update the existing `main` branch without copying secret values into files; dispatch one clean Unity build after the source correction; and download the diagnostic artifact when the Editor wrote its detailed log there.

It used the Supabase Management API only to confirm the existing project health. No schema or production data mutation is part of this build recovery.

## 5. Failure diagnosis record

The failed Unity run reached license activation successfully and failed only when Unity compiled the project scripts. The compiler reported three source errors:

- a local variable scope collision in `GameShellController`;
- a normal `return` in an `IEnumerator` startup method where `yield break` is required;
- the Unity 6 particle API requires `ShapeModule.shapeType`, not `ShapeModule.shape`.

Those source corrections are now on `main`. Any future failure should first be classified by the last successful evidence level above instead of changing license or Cloud infrastructure blindly.

## 6. Safe operating rules

- Never print, echo, commit, or store credential values.
- Never replace the existing Unity Cloud project or target to work around a transport or authentication error.
- Do not import the same ULF manually after the Licensing Client has already activated the runner.
- Do not diagnose a compiler failure as a license failure when the activation step is green.
- Keep the Editor version derived from `ProjectVersion.txt`; do not hardcode a different version in the workflow.
- Do not cancel a long Unity build based only on elapsed time; wait for Unity to complete or return an error. The existing six-hour GitHub job limit remains the outer safety boundary.
- Require the APK artifact and its digest before declaring the build complete.
