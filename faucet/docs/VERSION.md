# Kivora v2.1.0

Production implementation of the Kivora Points economy, USDT/TRC20 withdrawal rail, provider adapter, deterministic recommendations and Treasury Control.

## Contract
- 1000 Kivora Points = $1 reference display value.
- Withdrawal minimum: 10,000 Kivora Points ($10 reference).
- Initial payout rail: USDT on TRC20 only.
- Treasury opening balance: 0.
- Payouts remain manual and require a transaction hash before the paid transition.
- BitcoTasks remains the only provider; no additional provider is introduced.

## Included
- Separate provider settlement, reward-pending, withdrawal-reservation and treasury movement accounting.
- Idempotent BitcoTasks postback and chargeback handling.
- Provider health states shared by the authenticated shell and Opportunity Field.
- Kivora Efficiency recommendations based only on provider facts.
- Cloudflare Pages deployment rooted at `faucet/`.
