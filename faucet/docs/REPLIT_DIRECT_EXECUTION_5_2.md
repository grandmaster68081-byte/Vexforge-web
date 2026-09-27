# KIVORA 5.2.0 — DIRECT EXECUTION

Source of truth: this package. Do not redesign or substitute the visual system.

1. Replace the current `faucet/` Kivora implementation with the package contents while preserving existing VEXFORGE scope boundaries.
2. Keep the production identity assets under `faucet/public/kivora/identity/`. These are production assets consumed by `KivoraFinalWorld.tsx`; do not treat them as references.
3. The five real scene environments are: hero-environment, field-environment, vault-environment, chronicle-environment, settlement-environment.
4. `KivoraFinalWorld.tsx` must consume those exact paths. Do not swap them for gradients or placeholder art.
5. Landing must consume `/kivora/identity/hero-environment.webp`.
6. Command Deck must use `/kivora/identity/engine-environment.webp` as the live Engine visual.
7. Preserve real wallet, ledger, withdrawal, provider-status, USDT/TRC20 and 10,000 KP behavior.
8. BitcoTasks remains NOT_CONFIGURED until the owner adds provider credentials; missing provider credentials must not block build/deploy.
9. Do not require `SUPABASE_DB_PASSWORD` for build/deploy. Only server-side runtime Supabase credentials are allowed in Cloudflare.
10. Build with `npm install`, then `npm run typecheck`, `npm test`, `npm run build`. Do not require `npm ci` because no lockfile is intentionally required in this handoff.
11. Deploy from `main` to the existing Cloudflare Pages project `kivora-rewards` using the existing `faucet` root and `dist` output.
12. Verify the production page visually after deployment; confirm the five scene backplates are actually rendered.
13. Do not modify Unity, mobile, historical VEXFORGE surfaces, or unrelated backend code.

Acceptance: the production page must visibly use the Kivora cinematic identity assets. A dashboard with generic gradients/cards is not accepted.
