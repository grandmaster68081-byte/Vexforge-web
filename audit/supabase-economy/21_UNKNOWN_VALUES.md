# Unknown Values Requiring Further Evidence

This list is intentionally limited to values that were not proven by the live definitions, current configuration rows, aggregate queries, or static repository comparison. No mutating RPC or settlement job was executed.

1. Complete battle reward amounts by outcome/source and anti-fraud thresholds.
2. Exact post-approval deposit verifier/confirmation worker and final credit path.
3. Exact withdrawal approval, payout, rejection reversal, and failed-payout behavior.
4. Treasury allocation semantics for marketplace fees; `buy_listing` writes a fee ledger row with `player_id = NULL`, but no treasury table write is present in that function.
5. All hidden/legacy reward sources not reachable by static name/definition matching.
6. NFT verification and mint execution authority because no current rows were present and no mutation/call was attempted.
7. Whether the 5% legacy marketplace value remains an intended contract or stale UI documentation; live policy is 8%.
8. Whether `metadata.card_count` or `vexforge_pack_catalog.card_count` is canonical for pack opening.
9. Whether dynamic SQL dependencies are fully represented by definition/name matching; dependency matching is conservative.

## Evidence needed

- Approved non-mutating privilege checks.
- Complete function dependency graph review.
- Separate staging execution for mutation paths.
- Explicit product decision for contradictory policies.
