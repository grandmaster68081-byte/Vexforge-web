# Deployment (Cloudflare Pages)

This project was scaffolded in a chat session that had a Cloudflare MCP
connector with only **read/inspection tools** (list/get Workers, D1/KV/R2
management, docs search) — no Pages deploy tool was available, so the AI that
built this could not push it live itself. Deploying is a manual step:

```bash
npm install
npm run build
npx wrangler login          # one-time, opens a browser for your Cloudflare account
npx wrangler pages deploy dist --project-name=vexforge-web
```

This creates the Pages project on first run and gives you a permanent
`*.pages.dev` URL (or attach a custom domain afterward in the Cloudflare
dashboard).

`.env` already contains the real, RLS-protected Supabase URL and publishable
anon key for this project (`rscuzqnfccqvltkdcdny`) — these are safe to ship
in a public client bundle because every table they can touch is protected by
Row Level Security, verified per-table in chat 21/22.