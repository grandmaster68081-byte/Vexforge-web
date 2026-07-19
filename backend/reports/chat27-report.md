# Chat 27 report

## What was built
Real Supabase Auth (email/password) wired for the first time --
`src/providers/AuthProvider.tsx` + `src/routes/AccountRoute.tsx`. This was
the single highest-leverage pending item flagged since chat 22.

## Domains moved to live this session
- **profile, progress, economy, settings** -- moved from `blocked_requires_auth`
  to `live_in_official_frontend`. Each repository now does a real
  `supabase.from(...)` call, scoped by the auth session, matching the exact
  RLS policies verified back in chat 21. Economy remains read-only by design
  (RLS blocks frontend writes on `player_wallet`/`economy_ledger`).
- **market, assets** -- moved from `repository_ready_route_pending` to
  `live_in_official_frontend`. Their repositories were already done in
  chat 22; this session only added the missing hook + route + App.tsx wiring.

## Domains explicitly NOT touched
- **inventory, fusion** -- still `blocked_no_frontend_path`. No public or
  authenticated RLS policy exists for either. Per this session's own
  protocol, these require an owner decision (new RLS policy or RPC) before
  any frontend work, so they were left alone.

## Files created
`src/providers/AuthProvider.tsx`, `src/routes/AccountRoute.tsx`,
`src/routes/ProfileRoute.tsx`, `src/routes/ProgressRoute.tsx`,
`src/routes/EconomyRoute.tsx`, `src/routes/SettingsRoute.tsx`,
`src/domains/market/useMarket.ts`, `src/routes/MarketRoute.tsx`,
`src/domains/assets/useAssets.ts`, `src/routes/AssetsRoute.tsx`.

## Files updated (no duplicates created)
`src/main.tsx` (wrapped in AuthProvider), `src/App.tsx` (registered new
routes), `src/domains/profile/repository.ts`, `src/domains/progress/repository.ts`,
`src/domains/economy/repository.ts`, `src/domains/settings/repository.ts`
(all four: real queries replacing `blocked_auth` stubs), `src/styles.css`
(added auth-form + generic list styles), `backend/architecture/domains.md`,
`backend/blockers/README.md`, `backend/pending/auth-and-writes.md`.

## Verification performed
- Re-read the full current file list from `vexforge_frontend_source_files`
  before writing anything (Paso 0), per protocol.
- Re-read `vexforge_web_registry` for every domain's current `web_role`
  before touching it.
- Static import-resolution check across all 42+10 files after writing:
  every relative import resolves to a file that exists in the table, no
  circular or missing imports found. Could not run a real `npm install` /
  `tsc -b` -- this sandbox has no network, same limitation as chat 25.
- Did not modify Supabase schema, RLS policies, or functions -- Supabase
  Auth's email/password provider is enabled by default and required no
  backend configuration change.

## Not done this session
- Player row auto-provisioning on sign-up (open owner decision)
- `market` write path (`createListing`) -- INSERT policy qual still not
  re-verified
- `player_settings` write path -- policy allows it, not implemented
- Live deploy -- still manual, no Cloudflare Pages deploy tool available in
  this session's connector set either
- The 18 SECURITY DEFINER views flagged by chat 26's security advisor run
  were not touched this session (out of scope: this was a frontend pass)

## Recommended next step
1. Decide on player provisioning strategy (trigger vs RPC vs manual), or
   explicitly accept the current "empty result, not error" behavior as final
2. Re-verify `market_write_owner` INSERT qual, then implement `createListing()`
3. First real deploy (`npm install && npm run build && wrangler pages deploy`)
4. Resolve or document the remaining SECURITY DEFINER views from chat 26

## Supabase updated this session
- `vexforge_frontend_source_files` -- 10 new files, 8 updated files (see above)
- `vexforge_web_registry` -- profile/progress/economy/settings/market/assets
  all moved to `live_in_official_frontend`
- `vexforge_project_decisions` -- 3 new decisions:
  `chat27_profile_domain_wired_real_auth`,
  `chat27_progress_economy_settings_wired_real_auth`,
  `chat27_market_assets_routes_connected`