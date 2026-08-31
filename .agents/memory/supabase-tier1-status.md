---
name: Tier 1 criterion states
description: Constraint on the live VEXFORGE Tier 1 objective states in Supabase.
---

Live Tier 1 objectives accept `NOT_STARTED`, `PARTIAL`, `MET`, and `BLOCKED`; implementation that lacks human verification must be recorded as `PARTIAL`.

**Why:** The database constraint rejects `IMPLEMENTED_UNVERIFIED`, even though that is the narrative implementation state used by the protocol and `CONTINUITY.md`.

**How to apply:** Keep the distinction: use `PARTIAL` in the live Supabase row, explain the pending QA in `notes`/`evidence`, and leave `verified_at` empty until authorized runtime or human evidence exists.