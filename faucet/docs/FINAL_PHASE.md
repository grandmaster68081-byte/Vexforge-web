# Kivora 5.2.0 — deployment-ready phase

This package is the visual/product phase to apply before BitcoTasks onboarding.

## Deployment contract
- Production project: `kivora-rewards`
- Production branch: `main`
- Root: `faucet`
- Build: `npm run build`
- Output: `dist`
- Provider credentials: **not required for build**
- Supabase DB password: **not required for build**
- Supabase server runtime credentials: required only for Pages Functions

## Product contract
- 5 spaces: Command Deck, Opportunity Field, Kivora Vault, Chronicle, Settlement Terminal
- 1,000 KP = $1 display reference
- 10,000 KP withdrawal minimum
- initial payout rail: USDT / TRC20
- provider state supports NOT_CONFIGURED without breaking the station UI
- BitcoTasks remains a later manual onboarding step
