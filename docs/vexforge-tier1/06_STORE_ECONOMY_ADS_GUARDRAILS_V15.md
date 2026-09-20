# STORE · ECONOMY · ADS · GUARDRAILS · V15

## Economy principle

The client is a presentation layer. It may display server-reported balances, prices, rewards and entitlements. It must not calculate issuance, inflation, market settlement, commissions, withdrawals or pack RNG.

## Store

The current Unity route contract does not expose a Store route and the observed repository class does not provide a complete Store write surface. Therefore V15 does not invent one. The package contains the compliance and presentation guardrails so the exact backend contract can be connected later without changing the authority model.

When the canonical pack/store contract is present, purchase and entitlement state must be server-authoritative. Randomized content must be determined server-side and the client should display the required probability disclosures before the purchase decision where the platform requires them.

## Ads

The intended architecture is Unity LevelPlay mediation with rewarded ads as the primary value exchange. Interstitials must never interrupt a live battle. App-level consent and regional privacy requirements must be configured before requesting personalized advertising.

V15 contains blank App ID/placement configuration rather than invented identifiers.

## Inflation and abuse guardrails

- all economically meaningful writes stay server-side;
- idempotency applies to retriable battle operations;
- the client never credits itself for completed ads;
- no local market settlement;
- no local pack roll;
- no local treasury accounting;
- no ROI or income promise in product copy.
