# Kivora v1.3.0

Production-oriented visual, UX and security refinement over v1.2.0.

## Changes
- Local cinematic Kivora hero artwork; no hotlinked brand art.
- Public landing no longer presents fabricated balances, activity counts or scarcity claims.
- Fixed `OverviewPage` type mismatch (`EarnItem`).
- Added offer endpoint rate limiting.
- Enforced supported payout pairs in the API and at the database boundary.
- Added focus-visible accessibility treatment and larger primary interaction targets.
- Hardened BitcoTasks SDK loading and provider inventory requests.
- Kept the same GitHub repository, same Supabase project, isolated `faucet` schema and separate Cloudflare Pages project.
