---
name: Kivora migration sequencing
description: Migration naming constraint for the isolated Kivora Supabase schema.
---

Kivora migration filenames must use unique timestamps and preserve dependency order; do not reuse a timestamp for two different migration files.

**Why:** Duplicate timestamps make migration discovery and replay ambiguous even when the live schema already contains the expected Kivora tables and functions.

**How to apply:** Before adding or renaming a Kivora migration, compare its timestamp with every file under `supabase/migrations/`, then verify the live schema and settings independently.