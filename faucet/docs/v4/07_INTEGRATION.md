# KIVORA V4 — INTEGRATION MAP

Integrate presentation only. Preserve backend authority.

Existing data sources remain authoritative:
- config
- wallet
- ledger/activity
- offers/provider state
- withdrawals
- admin summary

Map them into V4 scene components.

Do not create duplicate state stores solely for visuals. Derive scene state from existing hooks/services.

BitcoTasks may be `not_configured` during design/preview. The V4 UI must render this state cleanly without provider credentials.
