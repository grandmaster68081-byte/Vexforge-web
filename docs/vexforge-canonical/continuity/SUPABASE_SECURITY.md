# SUPABASE SECURITY

- `SUPABASE_LIVE` relation-level RLS metadata was read from `pg_class` without reading table rows.
- `SUPABASE_LIVE` RLS-enabled base/partitioned relation count: `252`.
- `SUPABASE_LIVE` RLS-disabled base/partitioned relation count: `20`.
- `SUPABASE_LIVE` public base/partitioned relations: `223`; enabled `223`; disabled `0`.
- `SUPABASE_LIVE` storage base/partitioned relations with RLS enabled: `8`.
- `SUPABASE_LIVE` policy row count: `278` total; public schema `275`.
- `SUPABASE_LIVE` role-table grant row count: `7844`.
- `SUPABASE_LIVE` trigger metadata row count: `142`.
- `SUPABASE_LIVE` routine metadata row count: `638`; routine bodies were not requested.

Evidence: `snapshots/continuity-20260919T062954Z/remote_rls.json`, `remote_policies.json`, `remote_grants.json`, `remote_triggers.json`, and `remote_routines.json`.

No policies, roles, grants, tables or data were changed.
