# VEXFORGE V15.1 repair state

Status: **REPAIR PACKAGE READY / TARGET PENDING APPLICATION**

Baseline observed: `55b724e8f20fbc22abd1f6606d7c4dd617ee3270`

## Target truth

The current public `main` contains much of the V15 Tier-1 layer, but the active `GameShellController` and `VexforgeAlphaHud` still expose a legacy Battle path. V15.1 exists to close that integration seam.

## Gates

- repository identity: PENDING
- branch main: PENDING
- V15.1 apply: PENDING
- static target verify: PENDING
- Unity Editor validator: PENDING
- Play Mode zero exceptions: PENDING
- Supabase opponent discovery: PENDING
- authenticated battle smoke: PENDING
- PresentationCompleted: PENDING
- interruption/idempotency smoke: PENDING
- Android device QA: PENDING
- Unity Cloud target reconciliation: PENDING
- store/compliance verification: PENDING

Only real evidence may replace `PENDING`.

## Canonical rule

The server resolves combat. Unity presents the authoritative event stream. Collection/Deck/Profile functional bodies remain intact. Nexus/Battle/Missions/Economy are Tier-1 owned surfaces.
