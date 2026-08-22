---
name: Supabase contract audits
description: Durable guidance for keeping VEXFORGE clients and authoritative Supabase functions aligned.
---

The live Supabase schema is authoritative for VEXFORGE domain contracts. Before changing a repository or RPC, inspect the actual columns, constraints, function definitions, RLS policies, and grants; do not infer names from older client code or prior migrations.

**Why:** The relic client expected `equipped`, while the live table used `is_equipped` and required `equipped_slot` whenever a relic was equipped. The starter-grant RPC also contained the stale column name, so a frontend-only fix would still have left the authenticated flow broken.

**How to apply:** For every economy, inventory, equipment, or reward task, run a read-only live contract audit first, preserve the existing canonical tables and values, and make migrations idempotent with explicit `SECURITY DEFINER`, `search_path`, grants, ownership checks, and retry-safe behavior.

Live ACLs can drift from the grants written in a migration, especially after manual SQL changes; launch-gate audits must inspect `pg_proc` ACLs directly and close anonymous execution on authenticated mutations.

Live tables and functions can also predate or outlive the repository migration history. When a live function is already consumed, preserve its return signature in the reconciliation migration and repair the missing provenance idempotently rather than replacing it blindly.

**Why:** VE-VIS-6 had its telemetry tables and coverage routine in Supabase while `main` still ended at the prior migration; changing the routine's return shape would have broken existing coverage probes.

**How to apply:** Treat live object existence plus its definition as the compatibility boundary; reconstruct the migration around it, then audit grants, policies, constraints, and live coverage before changing any status criterion.