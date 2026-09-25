# Portal Architecture — V5

`src/pages` contains the public editorial routes.

`src/components` contains shared navigation, typography, visual sections, card presentation, reveal motion and the release gate.

`src/lib/assets.ts` is the canonical public art map.

`src/lib/cards.ts` performs one bounded, read-only public card catalog request and validates the returned display fields and canonical card-art prefix.

No new database tables are required. The public portal does not own player state.
