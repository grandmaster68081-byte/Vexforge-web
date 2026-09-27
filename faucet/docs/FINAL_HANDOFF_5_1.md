# KIVORA 5.2.0 — Final Replit Handoff

## Source of truth
Apply this package to the `faucet/` application on `main` and deploy to the existing Cloudflare Pages project `kivora-rewards`.

## Build requirements
Use Node 20+ and run:

```bash
npm install
npm run verify
npm run typecheck
npm test
npm run build
```

This package intentionally does **not** require BitcoTasks credentials or `SUPABASE_DB_PASSWORD` to build.

## Provider state
BitcoTasks may remain `NOT_CONFIGURED` until the manual onboarding phase. The application must still render, navigate and deploy.

## Runtime secrets
Only the existing server-side Supabase runtime key is required for Kivora API functions. Never place database passwords, wallet private keys, seed phrases, or BitcoTasks Secret/Bearer credentials in source control or the client bundle.

## Product contract
- Kivora Points: 1000 KP = $1 display reference.
- Minimum withdrawal: 10,000 KP.
- Initial payout rail: USDT / TRC20.
- Treasury address: `TLAujgYmQAtFW6BZg4fVs1pUHx6vyX5SJD`.
- Provider is optional until BitcoTasks onboarding.
- Existing Supabase v2 economics/RPC contract remains authoritative.

## Visual contract
The implementation is not a dashboard reskin. The five spaces are part of one station: Command Deck, Opportunity Field, Vault, Chronicle and Settlement Terminal. The Command Deck centers the Kivora Engine; Opportunity Field presents signals in a spatial field; Vault, Chronicle and Settlement use their own scene treatment. Preserve the cinematic VEXFORGE-compatible sci-fi/fantasy direction and do not replace it with generic SaaS cards.

## Deployment
Cloudflare Pages remains the only deployment target:

- project: `kivora-rewards`
- production branch: `main`
- root: `faucet`
- build: `npm run build`
- output: `dist`

After push, verify the new commit is the deployment commit and open `https://kivora-rewards.pages.dev/` for visual QA.
