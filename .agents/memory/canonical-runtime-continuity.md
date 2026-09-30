---
name: Canonical runtime continuity
description: Owner-confirmed runtime choice and reconciliation of historical VEXFORGE runtime documentation.
---

As of 2026-09-30, the owner explicitly selected Expo / React Native under `mobile/**` as the only active game runtime. Unity and other client implementations are legacy for new game work and must be preserved, not deleted or modified as part of this decision. This explicit owner direction supersedes older canonical repository documents that say Unity is active.

**Why:** The repository records an earlier Unity migration, but the owner clarified the desired active runtime while planning the competitive TCG roadmap. Current source files and historical notes do not by themselves override this explicit direction.

**How to apply:** Read `VEXFORGE_CONTEXT.md`, `docs/vexforge-canonical/00_START_HERE.md`, and `docs/vexforge-canonical/30_TIER1_COMPETITIVE_GAME_ROADMAP.md` first. Verify current `main` and Expo readiness; do not dispatch Unity workflows, delete legacy trees, claim an Expo release is verified, or modify Supabase without the relevant authorization and live contract audit.
