---
name: Vexforge migration workflow
description: Milestone sequencing and authority boundaries for the official and experimental Unity projects.
---

For Vexforge, work one bounded milestone at a time on `main`. Before each milestone, fetch from `origin` and confirm a clean worktree and `HEAD == origin/main`. Commit and push each completed milestone before beginning another. Never reset, rebase, merge, cherry-pick, or force-push.

Supabase remains authoritative. Do not change live schema, RPCs, RLS, authentication, data, economy, combat settlement, or rewards. Keep the official web portal and `unity/` source intact during bootstrap work. The experimental `unity-bootstrap/` project is the cumulative destination for gradually copying the complete official game; each authorized APK contains all slices completed so far. The official game and experimental bootstrap workflows are separate, manual-only lanes; do not dispatch either or build APK/AAB packages without explicit authorization for that particular run. Follow `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md`.

The experimental bootstrap workflow may cache only `unity-bootstrap/Library/`, after APK validation. Never cache the Unity Editor/Android toolchain, Unity Hub state, credentials, license material, or the official game's `unity/Library/`. Treat GitHub cache expiry and eviction as possible.

**Why:** the user wants the full official game represented in the APK through small, cumulative updates, while preserving the source project and live Supabase. The earlier editor/toolchain cache was retired; project import cache is a separate, narrower scope.

**How to apply:** Before every Vexforge milestone, verify the branch/base and clean tree; keep client behavior within existing server contracts; keep both Unity workflows manual and require fresh authorization for each APK. For bootstrap work, port one coherent slice at a time into `unity-bootstrap/`, preserve previous slices and the separate package ID, build the complete accumulated APK, cache only its `Library/` after validation, and follow the canonical guide. Never imply full parity or device verification without corresponding evidence.
