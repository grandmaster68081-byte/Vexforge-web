# Replit execution order — VEXFORGE Portal V5.1

1. Checkout/confirm canonical `main`.
2. Back up/tag the current web state before replacement.
3. Copy this package into the public website root.
4. Replace the existing public source/config with the package files.
5. Remove all legacy dashboard routes/components/providers from the public site.
6. Preserve the canonical public asset map and existing approved card-data contract.
7. Do not edit `unity/`.
8. Run `npm install`.
9. Run `npm run verify`.
10. Run `npm run typecheck`.
11. Run `npm run build`.
12. Run `npm run verify:build`.
13. Inspect the built site at 720×1640 and 1440×900 before merge.
14. Confirm no player-facing engineering/status text is present.
15. Only after all checks pass, commit and push the web replacement to `main`.

Do not create an alternate web app, alternate route set, alternate build workflow, or second source of truth.
