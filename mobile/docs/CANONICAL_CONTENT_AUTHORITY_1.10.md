# VEXFORGE 1.9 — Canonical Content Authority

## Runtime authority

1. Live Supabase records and verified RPC contracts.
2. Current repository source-of-truth documents that explicitly remain authoritative.
3. Release asset manifest and local assets shipped by this runtime.
4. Historical/superseded canonical-source documents are evidence only and must never become runtime content.

## Known historical conflict

The repository contains superseded documents describing older worlds/factions/bosses. Their correction blocks explicitly state that the implemented system uses five `regions` values: Forge Core, Iron Veins, Shadow Fracture, Cinders Realm and Warbound Zone, with current faction/card records coming from the database.

The runtime must not hardcode the superseded names as live game content.

## Card law

Official card records and their official image URLs remain canonical. The client may frame, animate and present a card, but it must not invent card identity, statistics, rarity, supply, lore or ownership.

## Boss law

Boss identity, health, rewards, phase definitions and settlement are backend-owned. A local boss presentation is a training/showcase layer only when no authoritative resolver contract is present.

## Economy law

The client may initiate a transaction and present its state. It may not decide the resulting balance, fee, supply, withdrawal eligibility, token value, pack odds or ownership transition.

## 1.10 release closure

The final runtime ships 13 canonical scene masters, 39 scene derivatives (HIGH/MEDIUM/LOW) and 8 registered cinematic plates. Runtime code contains no superseded lore names and no historical hard-coded season key. The package manifest and content-closure manifest are authoritative for this release.
