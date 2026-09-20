# AUDIT FINDINGS AND FIXES · V15

## Finding 01 · PlayerPrefs collision risk

Previous continuity state sanitized player IDs directly. Different identifiers could converge to the same key.

Fix: deterministic SHA-256-derived account scope.

## Finding 02 · Decorative object accumulation

Room ornament construction could leave old decorative objects behind on route changes.

Fix: explicit lifecycle and replacement.

## Finding 03 · Route frame sprite lifetime

Runtime-created route sprites were not explicitly released with the host component.

Fix: cleanup on destroy.

## Finding 04 · Encounter timing dependency

Encounter presentation searched for a globally named battlefield after binding.

Fix: bootstrap passes the canonical `VexforgeBattlefieldStage` directly, with a guarded fallback search.

## Finding 05 · Stale identity marker

The asset manifest still carried a V10 layer label despite later overlays.

Fix: manifest updated to the V15 production-closure layer.

## Finding 06 · Missing battle backdrop risk

A failed arena support load could leave an unintended white fullscreen image.

Fix: deterministic VEXFORGE fallback path.

## Finding 07 · Dashboard leakage risk

Suppressing the entire legacy Alpha HUD on every route could hide real Collection/Forge/Profile functionality.

Fix: route-specific suppression. Tier-1 owns the dashboard-like chrome, not the underlying game functions.
