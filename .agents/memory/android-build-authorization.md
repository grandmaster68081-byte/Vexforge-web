---
name: Android build authorization
description: User authorization boundary for VEXFORGE APK/AAB compilations.
---

Default to requiring explicit user authorization for each VEXFORGE APK/AAB compilation. Exception: for the active experimental bootstrap migration, the user authorized sequential builds without per-run prompts, conditional on the current baseline succeeding and each subsequent APK passing verification. Stop after any failed run; do not retry without fresh authorization. This exception does not authorize the official game workflow.

**Why:** The user requires explicit control over Android builds but explicitly authorized this bounded bootstrap migration to proceed automatically after successful builds.

**How to apply:** Treat builds as opt-in except for the success-conditioned sequence documented in `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md`. Keep the official game workflow and other APK/AAB work separately gated.