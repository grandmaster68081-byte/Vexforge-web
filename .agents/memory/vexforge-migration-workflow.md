---
name: Vexforge migration workflow
description: Milestone sequencing and authority boundaries for the official Expo-to-Unity migration.
---

For the official Vexforge Unity migration, work one bounded milestone at a time on `main`. Before each milestone, fetch from `origin` and confirm a clean worktree and `HEAD == origin/main`. Commit and push each completed milestone before beginning another. Never reset, rebase, merge, cherry-pick, or force-push.

Supabase remains authoritative. Do not change live schema, RPCs, RLS, authentication, data, economy, combat settlement, or rewards. `mobile/**` was removed by explicit user direction before all gates passed; do not restore it or treat its removal as parity evidence. Keep the portal and `faucet/**` outside this migration. Do not build APK/AAB packages during this migration.

**Why:** the user explicitly authorized early Expo retirement on 2026-10-05 while requiring Unity parity, security, Editor, and device evidence to remain open.

**How to apply:** Before every Vexforge milestone, verify the branch/base and clean tree; keep client behavior within existing server contracts; preserve the user-directed Expo retirement and keep validation gates open until real evidence closes them.
