# Open blockers

Authoritative copy: Supabase `vexforge_web_registry` + `verified_read_path_specs_v1`
inside `vexforge_project_documents`. This is a local, human-readable mirror.

| Blocker | Domains affected | What unblocks it |
|---|---|---|
| No auth provider wired | profile, progress, economy, settings | Wire Supabase Auth into `src/providers/` (folder exists, empty — see its README) |
| No RLS policy at all (public or authenticated) | inventory, fusion | Owner decision + backend RLS/RPC change — not fixable from the frontend |
| `market_write_owner` INSERT qual not fully re-verified | market (writes only; reads already work) | Re-run `pg_policies` check before implementing `createListing()` |
| No Cloudflare Pages deploy tool in any connector used so far | whole project — not live yet | Manual deploy per `backend/handoff/deployment.md`, or a session with a connector that has a deploy tool |
| SECURITY DEFINER views not enumerated | unknown, not yet scoped | Run a view audit in a future session before trusting any view as client-safe |

Update this table whenever a blocker opens or closes — and update the same
facts in Supabase in the same session, since Supabase is authoritative.
