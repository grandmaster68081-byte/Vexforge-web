# Kivora v1.3.0

A standalone, advertiser-funded rewards platform living inside the same VEXFORGE GitHub repository and Supabase project, while remaining isolated from the VEXFORGE application.

## Product boundary

- Brand: **Kivora**
- Technical app directory: `faucet/`
- Own frontend: `faucet/`
- Own backend: `faucet/functions/`
- Own database schema: `faucet` inside the existing Supabase project
- Own accounts and sessions: custom `faucet.accounts` + `faucet.sessions` (does not use VEXFORGE auth or Supabase Auth)
- Provider integration: official BitcoTasks browser SDK for the user-facing Earn Hub, plus server-side API fallback and S2S postback verification
- Existing VEXFORGE `src/`, `unity/`, `mobile/` and game contracts are intentionally untouched

## Stack

React + Vite + Cloudflare Pages Functions + Supabase Postgres + BitcoTasks API/S2S postback.

## Local preview

1. `npm install`
2. Copy `.dev.vars.example` to `.dev.vars` and fill local secrets.
3. `npm run dev`

Vite will serve the SPA. Pages Functions require a Wrangler/Pages runtime for full API behavior; use a deployed preview or `wrangler pages dev dist` after `npm run build` for an end-to-end local test.

## Production deployment

Kivora is designed for **Cloudflare Pages Git integration**, not dashboard Direct Upload. This preserves the commit → automatic deploy flow while keeping Kivora in its own Pages project.

- Same GitHub repository as VEXFORGE
- Same Cloudflare account as VEXFORGE
- Separate Pages project: `kivora-rewards`
- Root directory: `faucet`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Build watch include: `faucet/*`

Do not add a second deployment workflow for Kivora. Cloudflare Git integration performs the deployment; the repository workflow only performs the Kivora quality gate. See `../CLOUDFLARE_PAGES_SETUP.md` for the exact setup and isolation rules.
