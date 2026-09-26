# VEXFORGE portal art provenance

The 14 files under `portal/` are original VEXFORGE platform scenes generated for the V5.6 portal using the visual direction in `docs/ART_GENERATION_BIBLE.md`. They are local, versioned platform art; they contain no player data, card identity, stats, dates, URLs, or UI text.

Official card artwork remains the only visual content consumed from Supabase Storage, through the bounded read-only card catalog in `src/lib/cards.ts`.
