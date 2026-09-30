# VEXFORGE 1.8 — Public Repository Integration Audit

Date: 2026-09-29

## Observed public repository state

The public repository `grandmaster68081-byte/Vexforge-web` currently presents the V5.6 portal as its visual source of truth. Its root README describes that package as the visual/product implementation source for Replit, while `mobile/package.json` currently reports version `1.0.0` and an Expo 54 dependency family.

The 1.8 mobile runtime in this ZIP is intentionally a release package ahead of that public mobile directory. Replit must replace the target `mobile/` implementation with this release rather than mixing individual files from the older mobile tree.

## Visual authority reconciliation

The public root source-of-truth says:
- the portal should feel like entering an original premium dark-medieval fantasy TCG world;
- scene first, object second, copy third;
- official card artwork remains canonical;
- platform/environment art remains local;
- current visual implementation authority is V5.6.

The Expo runtime follows the same visual law while applying it to the game runtime: Nexus, Arena, Archive, Forge, Missions, World, Economy, Store, Social, Tutorial and Meta are world-first surfaces, with card identity remaining server/catalog controlled.

## Integration rule

Do not merge the public repository's older `mobile/` source file-by-file into this release. Replace the target mobile runtime with the 1.8 package, then preserve existing Supabase contracts and repository-level project files outside the runtime scope.
