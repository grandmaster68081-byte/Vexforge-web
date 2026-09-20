# ARCHITECTURE DECISIONS · V15

## ADR-01 · No second battle engine

The canonical repository and server resolver already exist. Tier-1 cannot create another rules engine.

## ADR-02 · Event stream is the cinematic spine

Combat presentation is driven by the canonical `BattleEvent` stream. This keeps animation, VFX, camera and audio synchronized to the authoritative result.

## ADR-03 · Presentation over legacy functionality

The legacy dashboard chrome may be suppressed where Tier-1 owns the route surface. Functional Collection/Forge/Profile bodies remain active.

## ADR-04 · Remote official art

The 127 official card images remain owned by the canonical Storage resolver. Local copies would create duplication and stale-art risk.

## ADR-05 · No invented store endpoints

A visually complete store is not worth a fake transaction contract. The package therefore prepares the product and compliance boundary without fabricating backend writes.

## ADR-06 · Account-scoped continuity

Device-local retry/tutorial state is namespaced by a deterministic hash of the signed-in player ID.
