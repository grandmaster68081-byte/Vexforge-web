# VEXFORGE — Active Runtime Documents 1.10

This file is the runtime document order for the final Expo 1.10 package.

## Authority order

1. `VEXFORGE_PROTOCOL_V2.md` / current Supabase contracts: gameplay, settlement, event log, raid/boss authority.
2. Current Supabase schema/RPC behavior actually present in production or verified by the release gate.
3. Current repository source-of-truth documents for V5.6 visual identity and canonical content.
4. This Expo 1.10 package: client presentation, navigation, asset registry, replay, tutorial theatre, and release automation.
5. Historical/superseded documents are reference-only and must not be reintroduced into runtime.

## Final release rule

Replit is an assembler, not a designer. It must replace `mobile/` exactly, install the declared dependencies, run the release audits, and stop on any failure. It must not infer missing RPCs, formulas, card data, bosses, lore, scenes, or economy values.
