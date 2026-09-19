# SUPABASE LIVE STATE

- `SUPABASE_LIVE` project inventory was read through the Supabase Management API.
- `SUPABASE_LIVE` project identity summary: ref `rscuzqnfccqvltkdcdny`, region `us-west-2`, status `ACTIVE_HEALTHY`, database `17` / version `17.6.1.127`.
- `SUPABASE_LIVE` Management API database metadata query returned HTTP `201` for read-only SELECT statements.
- `SUPABASE_LIVE` project listing returned HTTP `200`.
- `BLOCKED` direct PostgREST/Storage request using the supplied service-role key returned HTTP `401`; the exact response is in `snapshots/continuity-20260919T062954Z/supabase-rest-openapi.status` and `storage-inventory.txt`.
- `BLOCKED` Supabase CLI is unavailable in the execution environment; no `supabase link` was attempted.
- `SUPABASE_LIVE` no INSERT, UPDATE, DELETE, TRUNCATE, ALTER, deploy, upload or auth mutation was executed.
- `SUPABASE_LIVE` no player rows, emails, addresses or account PII were queried.

Management API evidence is in `supabase-management-projects.json`, `supabase-management-query-probe.txt`, and the `remote_*.json` snapshots.
