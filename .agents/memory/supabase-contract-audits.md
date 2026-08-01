---
name: Supabase contract audits
description: Durable guidance for keeping VEXFORGE clients and authoritative Supabase functions aligned.
---

The live Supabase schema is authoritative for VEXFORGE domain contracts. Before changing a repository or RPC, inspect the actual columns, constraints, function definitions, RLS policies, and grants; do not infer names from older client code or prior migrations.

**Why:** The relic client expected `equipped`, while the live table used `is_equipped` and required `equipped_slot` whenever a relic was equipped. The starter-grant RPC also contained the stale column name, so a frontend-only fix would still have left the authenticated flow broken.

**How to apply:** For every economy, inventory, equipment, or reward task, run a read-only live contract audit first, preserve the existing canonical tables and values, and make migrations idempotent with explicit `SECURITY DEFINER`, `search_path`, grants, ownership checks, and retry-safe behavior.