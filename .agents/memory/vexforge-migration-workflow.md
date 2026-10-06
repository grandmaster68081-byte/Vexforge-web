---
name: Vexforge migration workflow
description: Milestone sequencing and authority boundaries for the official Unity project.
---

For Vexforge, work one bounded milestone at a time on `main`. Before each milestone, fetch from `origin` and confirm a clean worktree and `HEAD == origin/main`. Commit and push each completed milestone before beginning another. Never reset, rebase, merge, cherry-pick, or force-push.

Supabase remains authoritative. Do not change live schema, RPCs, RLS, authentication, data, economy, combat settlement, or rewards. Keep the official web portal and Unity source intact during repository cleanup. The Unity GitHub Actions workflow is manual; do not dispatch it or build APK/AAB packages without explicit authorization.

**Why:** the user requires live Supabase and the official web and Unity source trees to remain unchanged during cleanup, and Unity compilation is separately gated.

**How to apply:** Before every Vexforge milestone, verify the branch/base and clean tree; keep client behavior within existing server contracts; keep the Unity build manual and do not imply validation without real evidence.
