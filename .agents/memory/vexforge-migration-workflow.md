---
name: Vexforge migration workflow
description: Milestone sequencing and authority boundaries for the official Expo-to-Unity migration.
---

For the official Vexforge Unity migration, work one bounded milestone at a time on `main`. Before each milestone, fetch from `origin` and confirm a clean worktree and `HEAD == origin/main`. Commit and push each completed milestone before beginning another. Never reset, rebase, merge, cherry-pick, or force-push.

Supabase remains authoritative. Do not change live schema, RPCs, RLS, authentication, data, economy, combat settlement, or rewards. Keep `mobile/**`, the portal, and `faucet/**` until parity, security, Unity Editor/device, and removal gates pass. Do not build APK/AAB packages during this migration.

**Why:** the user explicitly directed this milestone sequence and these authority/release boundaries.

**How to apply:** Before every Vexforge milestone, verify the branch/base and clean tree; keep client behavior within existing server contracts; preserve Expo surfaces and open validation gates until evidence supports closing them.
