# Kivora v1.3.0 — integrated release manifest

## Adds to the repository

- `faucet/**` — the complete Kivora app and documentation
- `supabase/migrations/202609260001_kivora_core.sql`
- `supabase/migrations/202609260002_kivora_hardening.sql`
- `.github/workflows/kivora-quality.yml`

## Does not replace

- Existing VEXFORGE `src/**`
- Existing VEXFORGE `unity/**`
- Existing VEXFORGE auth/data contracts
- Existing VEXFORGE Cloudflare Pages project

## Cloudflare deployment model

Kivora is a separate Pages project connected to the same GitHub repository, rooted at `faucet/`, with `main` as production branch and `faucet/*` build-watch inclusion. The existing VEXFORGE Pages project must exclude `faucet/*` from its build-watch paths.

## Provider secrets

No production credentials are included. Replit/Cloudflare must supply the configured BitcoTasks and existing Supabase secrets through encrypted environment variables.
