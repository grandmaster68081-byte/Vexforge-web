# Open blockers

Authoritative copy: Supabase `vexforge_web_registry` + `verified_read_path_specs_v1`
inside `vexforge_project_documents`. This is a local, human-readable mirror.

| Blocker | Domains affected | What unblocks it |
|---|---|---|
| No player row auto-provisioning on sign-up | profile, progress, economy, settings (edge case) | A signed-in user with no matching `players` row gets an explicit empty-with-reason result, not an error. Deciding whether/how to auto-create a `players` row on first sign-up is still open -- needs an owner decision (trigger? RPC? manual admin step?) |
| `market_write_owner` INSERT qual not fully re-verified | market (writes only; reads already work) | Re-run `pg_policies` check before implementing `createListing()` |
| No RLS policy at all (public or authenticated) | inventory, fusion | Owner decision + backend RLS/RPC change -- not fixable from the frontend |
| No Cloudflare Pages deploy tool in any connector used so far | whole project -- not live yet | Manual deploy per `backend/handoff/deployment.md`, or a session with a connector that has a deploy tool |
| 18 SECURITY DEFINER views still flagged ERROR by the security advisor (chat 26 revoked public grants but did not convert views to security_invoker) | backend, not directly frontend-blocking | Convert each view individually or document why it stays SECURITY DEFINER -- see `vexforge_project_decisions.chat26_security_hardening_definer_views_and_search_path` |

~~No auth provider wired~~ -- RESOLVED chat 27: `src/providers/AuthProvider.tsx`
(Supabase Auth, email/password) wired, unblocking profile/progress/economy/settings.

Update this table whenever a blocker opens or closes -- and update the same
facts in Supabase in the same session, since Supabase is authoritative.
