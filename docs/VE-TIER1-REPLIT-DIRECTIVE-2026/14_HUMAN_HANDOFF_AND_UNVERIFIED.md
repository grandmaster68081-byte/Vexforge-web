# VEXFORGE — HUMAN HANDOFF / UNVERIFIED CHECKS

The agent must maintain a precise list of what it cannot prove.

## Examples

### Device-specific behavior
If only browser/emulator was tested, record that real-device validation remains.

### External services
If an integration requires an external account or wallet action unavailable to the agent, record the exact manual step.

### Visual acceptance
A machine can confirm rendering and interaction; subjective final art direction remains human-reviewable.

### Production release
Preview is not the same as production. A release candidate still requires final publication checks.

## Handoff format

```text
UNVERIFIED ITEMS
1. [Path] — [what remains] — [why unavailable]
2. [Path] — [what remains] — [why unavailable]

HUMAN TEST STEPS
1. Open ...
2. Tap ...
3. Confirm ...

EXPECTED RESULT
...
```

Never hide an unresolved test behind a generic "looks good" statement.
