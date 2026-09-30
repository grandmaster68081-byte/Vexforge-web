# VEXFORGE 1.6.0 · OFFICIAL ASSEMBLY ORDER

1. Replace the existing mobile runtime directory with this package's `mobile/` directory contents.
2. Preserve the package's `app.json`, `eas.json`, `plugins/withEmbeddedJsBundle.js`, `src/`, `app/`, `assets/`, `scripts/` and `docs/` exactly.
3. Do not merge old Expo screens over the new routes.
4. Do not regenerate anything under `assets/vexforge/scenes/` or `assets/content-packs/`.
5. Keep official card artwork server/catalog supplied. Do not replace card URLs with local generated art.
6. Set `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the build environment. Never put service-role or private keys in this package.
7. Install dependencies from `mobile/package.json` in the target environment. This package intentionally has no `node_modules` and no generated lockfile because the offline audit environment cannot reach the registry.
8. Run: `npm run verify`.
9. Run: `npm run audit:battle`.
10. Run: `npm run audit:interactive`.
11. Run: `npm run audit:economy`.
12. Run: `npm run audit:economy-policy`.
13. Run: `npm run typecheck`.
14. Run the configured EAS preview APK build.
15. Smoke-test the installed APK on a physical Android device before production AAB publication.

## Non-negotiable runtime rules

- Battle state and battle presentation must remain one source of truth.
- Supabase remains authoritative for ownership, rewards, PvP settlement and economic settlement.
- Boss presentation may be local and deterministic; boss reward/damage settlement is not local.
- Pack odds come from the server; the ceremony is presentation only.
- Scene art is already finalized for this release; Replit is an assembler, not the art director for this package.
