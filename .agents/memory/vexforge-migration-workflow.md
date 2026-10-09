---
name: Vexforge migration workflow
description: Milestone sequencing and authority boundaries for the official and experimental Unity projects.
---

For Vexforge, work one bounded milestone at a time on `main`. Before each milestone, fetch from `origin` and confirm a clean worktree and `HEAD == origin/main`. Commit and push each completed milestone before beginning another. Never reset, rebase, merge, cherry-pick, or force-push.

Supabase remains authoritative. Do not change live schema, RPCs, RLS, authentication, data, economy, combat settlement, or rewards. Keep the official web portal and `unity/` source intact during bootstrap work. The official game and experimental bootstrap workflows are separate, manual-only lanes; do not dispatch either or build APK/AAB packages without explicit authorization for that particular run. The bootstrap is a build baseline, not a second gameplay runtime; follow `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md` for its incremental process.

The experimental bootstrap workflow may cache only `unity-bootstrap/Library/`, after APK validation. Never cache the Unity Editor/Android toolchain, Unity Hub state, credentials, license material, or the official game's `unity/Library/`. Treat GitHub cache expiry and eviction as possible.

**Why:** the user requested an isolated, incremental build experiment while preserving the official game and live Supabase. The earlier editor/toolchain cache was retired; project import cache is a separate, narrower scope.

**How to apply:** Before every Vexforge milestone, verify the branch/base and clean tree; keep client behavior within existing server contracts; keep both Unity workflows manual and require fresh authorization for each APK. For bootstrap work, change only `unity-bootstrap/`, preserve the separate package ID, cache only its `Library/` after validation, and follow the canonical bootstrap guide. Never imply device verification without device evidence.
