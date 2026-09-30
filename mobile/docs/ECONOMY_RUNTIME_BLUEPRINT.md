# VEXFORGE Economy Runtime Blueprint

The economic system is a product-critical subsystem. This client treats it as server-authoritative infrastructure rather than UI arithmetic.

## Preserved principles
- Single authoritative balance mutation path.
- Wallet and ledger must remain atomic server-side.
- Idempotency for repeatable reward/purchase operations.
- Client displays balances returned by the server; it never creates them.
- Marketplace fees and withdrawal eligibility are read from canonical policy/data.
- Pack results are authoritative and must never be generated on-device.

## Monetization surfaces
The client is designed to host:
- pack acquisition and reward reveal;
- progression and season-style rewards;
- optional cosmetics;
- marketplace discovery;
- non-intrusive ad hooks where a verified server/product policy allows them.

No price, reward, odds, withdrawal promise or revenue figure is hard-coded here. Those are policy/data values owned by the backend/product configuration.

## Content economics and download economy
Large visual packages should be downloadable and cacheable independently from the core APK. This allows visual quality tiers without changing economic state.
