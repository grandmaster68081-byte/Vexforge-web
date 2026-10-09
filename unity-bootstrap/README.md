# VEXFORGE Unity Bootstrap

This is an isolated, intentionally empty Android Unity project used to establish
a small, repeatable build baseline before game content is copied into it.

## Boundary

- Unity Editor version: `6000.3.0f1`, checked against `unity/ProjectSettings/ProjectVersion.txt`.
- Android build settings: Gradle, IL2CPP, ARM64, matching the official Unity build path.
- Android application ID: `com.vexforge.bootstrap`, kept separate from the official game.
- No game code, scenes, art, or other assets are copied from `unity/`.
- The build script creates a default empty Unity scene only when the bootstrap scene does not exist.
- Supabase is not part of this build pipeline; live Supabase schema and data are untouched.

## Build and cache

Run `.github/workflows/vexforge-unity-bootstrap-android.yml` manually from GitHub
Actions. It builds only this folder and uploads the APK and a build report.

The workflow restores and saves only this project's `Library/` directory, and
saves a new cache only after APK verification succeeds. Cache keys are isolated
from the official game's workflow. The Unity Editor installation, Unity Hub
state, license files, and credentials are never cached or committed. The
workflow has no push, pull-request, schedule, or other automatic trigger.

Future content should be added here in small, deliberate steps. Keep the
official `unity/` project intact and use it only as a reference.
