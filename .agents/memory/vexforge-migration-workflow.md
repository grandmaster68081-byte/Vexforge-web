---
name: Vexforge Unity authority
description: The user's decision to promote the completed Bootstrap and its build-authorization boundary.
---

`unity/**` is the single official Unity Android project. The user directed promotion of the completed Bootstrap into this role and removal of the former official Unity tree from the current branch. Do not recreate a second `unity-bootstrap/` project or treat historical migration instructions as current.

The user explicitly directed that this promotion proceed without a new APK validation build. Historical successful Bootstrap APKs do not verify the promoted official project, and earlier conditional migration-build authorization is no longer current. Require fresh, explicit approval before any future Unity/Android build or release.

Supabase remains authoritative and was not modified during the promotion. Preserve the web portal and existing backend contracts; do not change live schema, RPCs, RLS, authentication, or user data unless directly authorized.

**Why:** the user prioritized removing the previous official Unity project and establishing the complete Bootstrap as official, without making a fresh APK a prerequisite.

**How to apply:** Treat the current `unity/**` tree as canonical. Treat Bootstrap run history and migration documents as historical evidence only. Do not infer approval for a build from old notes or successful artifacts.
