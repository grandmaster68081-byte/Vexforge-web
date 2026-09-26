# START HERE — Kivora

This package is the implementation package v1.3.0 for **Kivora**, the independent advertiser-funded rewards platform. It stays inside the existing VEXFORGE repository and existing Supabase project, but it does not reuse VEXFORGE application logic, authentication or data contracts.

## v1.3.0 release hardening

This revision adds local cinematic brand artwork, removes fabricated public metrics, strengthens payout validation at both API and database boundaries, rate-limits provider inventory refreshes, and adds focus-visible accessibility treatment.

## Safe overlay

Replit should overlay only the `faucet/**` app, the two Kivora migration files under `supabase/migrations/`, and `.github/workflows/kivora-quality.yml`. The documents under `faucet/docs/**` are implementation references and should not replace unrelated VEXFORGE root documents.

## What is already built

- Premium 2026-style responsive React/Vite UI
- Independent custom account/session system
- Internal Kivora Points wallet
- Server-side BitcoTasks offer retrieval
- Full BitcoTasks inventory surface: surveys, offers, PTC, video, faucet, shortlinks, tasks and read-article via the provider SDK, with server API fallback for core categories
- Server-side BitcoTasks S2S postback validation
- Idempotent reward/chargeback ledger
- Manual withdrawal request flow with reserved balance
- Admin review queue: approve / reject / paid
- Optional transaction-hash recording
- Same-origin Cloudflare Pages Functions API
- Isolated `faucet` schema in the existing Supabase project
- Kivora-native SVG brand mark, ambient background and noise texture
- Cloudflare Pages monorepo settings and security headers
- GitHub quality workflow scoped to Kivora changes
- Explicit commit → Cloudflare automatic deployment architecture via a separate Pages project

## What remains manual by design

1. Merge this package into the existing VEXFORGE repository at the exact paths documented in `IMPLEMENTATION_FOR_REPLIT.md`.
2. Run both Kivora SQL migrations against the existing VEXFORGE Supabase project, in filename order.
3. Add the `faucet` schema to Supabase API exposed schemas only if required by the deployed server-side client; keep browser roles denied as defined in the migration.
4. Create the first Kivora user and promote that account to `admin` with the one SQL statement in the runbook.
5. Register/approve the Kivora site in BitcoTasks from `https://bitcotasks.com/pub/dashboard` → **My Apps** → **Edit**, then copy its API Key, Bearer Token and Secret Key into Cloudflare encrypted environment variables.
6. Create the separate Kivora Pages project in the SAME Cloudflare account and connect it to the SAME GitHub repository, with root `faucet`, build `npm run build`, output `dist`, production branch `main`, and watch include `faucet/*`.
7. Configure the existing VEXFORGE Pages project to exclude `faucet/*` from its Build watch paths.
8. Attach the desired Kivora hostname to the Kivora Pages project and use that hostname in the BitcoTasks site configuration/postback URL.

No private key or treasury seed is part of this package.

## Deployment invariant

A commit that changes only `faucet/**` may deploy Kivora. It must never publish Kivora into the official VEXFORGE Pages project. The two Cloudflare Pages projects are separate deployments with separate hostnames.

## Economic behavior

The provider callback is the source of truth for user rewards. The database stores the provider's `reward` and `payout` values for audit/reconciliation. The 35% target is stored as a setting but is not falsely hard-coded as a guaranteed BitcoTasks revenue share.
