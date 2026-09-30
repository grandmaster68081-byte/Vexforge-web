# VEXFORGE · Runtime Content Pipeline 1.7

The release uses four content classes:

1. Core runtime — code, navigation, contracts and small support assets.
2. Scene packs — low/medium/high environment derivatives grouped by world route.
3. Cinematic plates — battle, boss, reward, pack and live-ops presentation layers.
4. Server-resolved content — cards, ownership, economy values, live events and lore records whose authoritative values belong to Supabase/catalog data.

The rule is simple: if changing the content should not require changing the gameplay rules, it belongs in content rather than code.

## Tier-1 lesson adopted

Marvel SNAP's public Unity case study emphasizes content management, Addressables and continuous delivery. VEXFORGE cannot use Unity Addressables in Expo, so the equivalent discipline is represented by explicit content-pack directories, deterministic manifests, bounded quality tiers, and a release asset hash registry.

## Memory discipline

HIGH quality is a presentation budget, not a license to decode every card or scene simultaneously. Card images remain on-demand. Environment derivatives are selected by quality tier. The release must never turn every content pack into a permanent in-memory cache.
