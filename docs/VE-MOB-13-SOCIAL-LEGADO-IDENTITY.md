# VE-MOB-13 — SOCIAL / LEGADO IDENTITY

## Closed block

Social is a secondary system inside `LEGADO`, not a detached administrative
screen. Android now presents the parent domain identity before the existing
Social surface, which keeps friends, clans and PvP presence connected to the
forger's identity and progression.

## Preserved contracts

- `mobile/app/social.tsx` remains the source of the live friends, clans,
  challenges, wars, ranking and recent-match presentation.
- Supabase/RPC authority, RLS, Battle Run navigation, mutations, and empty,
  loading, error, refresh and feedback states are unchanged.
- No names, ranks, roster values, MMR, results or artwork are fabricated.

## Evidence

- `node scripts/verify-mobile-social.mjs`
- `git diff --check`

## Honest status

`IMPLEMENTED_UNVERIFIED` — visual/tactile device QA remains pending an APK
explicitly authorized by the operator. No APK or Android release is generated
by this block.