---
name: Vexforge migration workflow
description: Milestone sequencing and authority boundaries for the official and experimental Unity projects.
---

For Vexforge, work one bounded milestone at a time on `main`. Before each milestone, fetch from `origin` and confirm a clean worktree and `HEAD == origin/main`. Commit and push each completed milestone before beginning another. Never reset, rebase, merge, cherry-pick, or force-push.

Supabase remains authoritative. Do not change live schema, RPCs, RLS, authentication, data, economy, combat settlement, or rewards. Keep the official web portal and `unity/` source intact during bootstrap work. The experimental `unity-bootstrap/` project is the cumulative destination for gradually copying the complete official game; each APK contains all slices completed so far. For the current migration, the user authorized sequential continuation without per-build prompts only after the current baseline and every later APK succeeds. Stop on any failure and do not retry without new authorization. This does not authorize the official game workflow or Supabase changes. Follow `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md`.

The successful historical Bootstrap APK #2 was only a build-pipeline smoke test: the builder generated Unity's default empty scene because no official scene or game content had been migrated. Do not treat that APK as a content milestone. The next migration APK must contain a real official Vexforge scene and a small, dependency-complete slice of official code/assets; never add placeholder or invented game content. The APK SHA-256 was independently matched to its build report. That run saved the first successful `unity-bootstrap/Library` cache; no later build has yet proven cache restoration, so verify and report the next run's actual cache-hit result.

The experimental bootstrap workflow may cache only `unity-bootstrap/Library/`, after APK validation. Never cache the Unity Editor/Android toolchain, Unity Hub state, credentials, license material, or the official game's `unity/Library/`. Treat GitHub cache expiry and eviction as possible.

**Why:** the user wants the full official game represented in the APK through small, cumulative updates, while preserving the source project and live Supabase; they explicitly authorized success-conditioned continuation without another prompt at each build. The earlier editor/toolchain cache was retired; project import cache is a separate, narrower scope.

**How to apply:** Before every Vexforge milestone, verify the branch/base and clean tree; keep client behavior within existing server contracts; keep both Unity workflows manual. For the active bootstrap migration, port one coherent slice at a time into `unity-bootstrap/`, preserve previous slices and the separate package ID, build the complete accumulated APK after the prior build passes, cache only its `Library/` after validation, and follow the canonical guide. Stop on failure; never imply full parity or device verification without corresponding evidence.
