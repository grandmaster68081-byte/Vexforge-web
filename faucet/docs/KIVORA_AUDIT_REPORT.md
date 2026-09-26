# Kivora v1.3.0 — production-oriented review

## Scope

This revision reviewed the existing Kivora v1.2 package before release to Replit. The review covered the public landing, logged-in dashboard/earn flow, wallet/cashout, provider integration, Cloudflare monorepo boundaries, server/session code and the Supabase reward ledger.

## Market-pattern reference

Current rewards products expose combinations of multi-category earning, featured/high-value opportunities, visible reward amounts, histories, levels/streaks/goals and multiple cashout choices. Current product documentation/examples from Freecash, JumpTask and Cointiply show these patterns. Kivora adapts the interaction ideas rather than copying their branding or layouts.

## Resolved issues

### 1. Compile-time type mismatch

`OverviewPage.tsx` referenced a non-existent `Offer` type. It now imports and uses `EarnItem`.

### 2. Fabricated public metrics

The earlier landing hero used example balances, opportunity counts and activity totals that could be mistaken for real Kivora metrics. These have been removed. The public experience now communicates product capabilities without inventing live social proof.

### 3. Premium visual identity

The landing now uses a packaged local Kivora cinematic hero image and a stronger composition around it. The visual system remains dark, glassy and restrained, while the artwork gives the product an identifiable focal point rather than a generic gradient-only presentation.

### 4. Provider inventory abuse control

The `/api/offers` route now has a per-account/IP rate limit to avoid repeatedly hammering BitcoTasks from a single session.

### 5. Payout boundary hardening

The payout API and the database RPC now both enforce the asset/network combinations present in `faucet.settings.supported_payouts`. A client cannot bypass the UI to request an unsupported pair.

### 6. SDK loading robustness

The browser integration avoids duplicate BitcoTasks SDK script injection and disables unnecessary caching on provider configuration retrieval.

### 7. Accessibility polish

Interactive controls received explicit `:focus-visible` treatment and larger default control heights for core actions, while reduced-motion preferences remain respected.

## Integrity architecture retained

- Same GitHub repository as VEXFORGE.
- Same Supabase project, with a dedicated `faucet` schema.
- Independent Kivora accounts and sessions; no VEXFORGE authentication reuse.
- Provider credentials remain backend/deployment secrets.
- BitcoTasks S2S callback remains the authoritative reward/chargeback signal.
- `transId` is idempotent per provider/status.
- Reward hold and chargeback accounting are represented in the ledger.
- Manual withdrawals reserve points before review and require a recorded transaction hash to mark paid.
- Kivora is a separate Cloudflare Pages project rooted at `faucet/`; the official VEXFORGE deployment remains a separate Pages project.

## Remaining release gates

This environment could parse all TypeScript/TSX files and resolve local imports, but it could not complete `npm install` against the public npm registry, so a full dependency-backed `npm run check` must still be executed in Replit or CI. BitcoTasks app approval, production credentials, the final Kivora domain, legal review and Cloudflare secrets are also deployment-time gates.
