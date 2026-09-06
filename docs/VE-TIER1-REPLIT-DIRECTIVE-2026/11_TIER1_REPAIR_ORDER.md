# VEXFORGE — TIER-1 REPAIR ORDER

## Priority system

### Gate 0 — Boot integrity
Repair anything preventing the application from opening reliably.

### Gate 1 — Authentication integrity
Repair login/session/protected-route failures.

### Gate 2 — Navigation integrity
All five domains must be reachable, returnable, and free of dead-end loops.

### Gate 3 — Core interaction integrity
Buttons, tabs, cards, filters, search, sorting, deck actions, battle entry, and profile actions must respond correctly.

### Gate 4 — Data integrity
Real user data must appear correctly and update consistently.

### Gate 5 — Domain integration
FOJA ↔ BATALLA ↔ CARTAS ↔ FORJA ↔ PERFIL must connect logically.

### Gate 6 — Visual architecture
Apply the Tier-1 world/game-space transformation.

### Gate 7 — Motion / game feel
Add animation hierarchy, ambient life, transitions and interaction feedback.

### Gate 8 — Performance
Optimize images, render behavior, async loading and animation cost.

### Gate 9 — Regression
Re-test the full critical journey.

### Gate 10 — Human validation packet
Provide precise remaining checks that cannot be proven inside the available environment.

## Critical journey

`AUTH → FOJA → discover activity → open CARTAS → inspect card → open FORJA → select/edit deck → enter BATALLA → return → inspect PERFIL → return FOJA`

Whenever the implemented product supports more complete paths, extend this journey rather than replacing it.

## Rule

A later visual gate may not conceal an earlier functional failure.
