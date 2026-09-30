# VEXFORGE · Economy Safety Boundary 1.7

## Client guarantees

- No client-created balance is authoritative.
- No client-created fee is authoritative.
- No pack odds are resolved locally.
- No withdrawal eligibility is resolved locally.
- Concurrent identical mutations are rejected by `mutationGate`.
- Every economy-bearing UI action must tolerate a rejected/stale server result.

## Server requirements

Client concurrency protection is not equivalent to transaction idempotency. The Supabase RPC must remain authoritative and must accept a stable reference/idempotency key where a retry can repeat an economic mutation.

This is intentionally not fabricated in Expo. If a live RPC does not provide that contract, the operation is not considered retry-safe merely because the UI disables its button.
