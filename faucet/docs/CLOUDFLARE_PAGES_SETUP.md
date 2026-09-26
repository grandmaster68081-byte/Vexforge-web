# Kivora — Cloudflare Pages isolation and automatic deployment

This is the one-time Cloudflare setup for keeping Kivora independent while preserving the existing VEXFORGE commit → automatic deploy workflow.

Cloudflare Pages supports multiple projects connected to the same GitHub repository. Each project can have its own root directory and build watch paths. This is the intended monorepo model.

## Project A — existing VEXFORGE

Keep the current production project exactly as it is. Do not recreate it.

Add/verify this Build watch exclusion:

```text
faucet/*
```

This prevents Kivora-only changes from triggering the official VEXFORGE Pages build.

## Project B — Kivora

Create this in the **same Cloudflare account**:

| Setting | Value |
|---|---|
| Project name | `kivora-rewards` |
| Git repository | `grandmaster68081-byte/Vexforge-web` |
| Production branch | `main` |
| Root directory | `faucet` |
| Build command | `npm run build` |
| Build output | `dist` |
| Watch include | `faucet/*` |

Then attach the desired Kivora hostname to the Kivora Pages project. Do not attach that hostname to the VEXFORGE project.

## Automatic deployment flow

```text
Replit / GitHub
      │
      │ commit + push main
      ▼
Vexforge-web
      │
      ├── change in faucet/** ──→ Kivora Pages build/deploy
      │                              ↓
      │                        Kivora hostname
      │
      └── other VEXFORGE change ─→ VEXFORGE Pages build/deploy
                                     ↓
                               official hostname
```

Cloudflare Pages Git integration performs automatic deployment on pushes. The Build watch paths prevent an unrelated directory from triggering a project build.

## Important: Pages Functions

Kivora contains a `/functions` directory. Keep it at the root of the Kivora Pages project (`faucet/functions/`). Do not put `functions/` under the built `dist/` directory. Cloudflare Pages Git integration handles Pages Functions as part of the Pages project deployment.

## Do not mix deployment methods

Do not connect Kivora with Cloudflare Git integration and also add a second GitHub Actions production deployment using Wrangler. Pick the Git integration path for this repository so that one Git push produces one Kivora production deployment.

## Secrets remain in Cloudflare

The Pages project must hold the server-side secrets for Supabase and BitcoTasks. They are never committed to GitHub.


## Source documentation

Cloudflare Pages Git integration: https://developers.cloudflare.com/pages/get-started/git-integration/
Monorepos: https://developers.cloudflare.com/pages/configuration/monorepos/
Build watch paths: https://developers.cloudflare.com/pages/configuration/build-watch-paths/
Pages Functions: https://developers.cloudflare.com/pages/functions/get-started/
