# Kivora v2.1.0 — integrated release manifest

## Adds to the repository

- `faucet/**` — the complete Kivora app and documentation
- `supabase/migrations/202609260001_kivora_core.sql`
- `supabase/migrations/202609260002_kivora_hardening.sql`
- `supabase/migrations/202609270000_kivora_signup_and_boundary_fixes.sql`
- `supabase/migrations/202609270001_kivora_v2_economy.sql`
- `supabase/migrations/202609270002_kivora_launch_usdt_trc20.sql`
- `.github/workflows/kivora-quality.yml`

## Does not replace

- Existing VEXFORGE `src/**`
- Existing VEXFORGE `unity/**`
- Existing VEXFORGE auth/data contracts
- Existing VEXFORGE Cloudflare Pages project

## Cloudflare deployment model

Kivora is a separate Pages project connected to the same GitHub repository, rooted at `faucet/`, with `main` as production branch and `faucet/*` build-watch inclusion. The existing VEXFORGE Pages project must exclude `faucet/*` from its build-watch paths.

## Provider secrets

 No production credentials are included. The Kivora Pages **Production** environment must supply `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and the configured BitcoTasks secrets through encrypted environment variables; Replit secrets are not inherited by Cloudflare Pages. After changing these values, trigger a new Pages deployment before validating account creation. Apply all five listed migrations in timestamp order before production account creation is enabled.
