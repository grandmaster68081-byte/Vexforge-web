# VEXFORGE Official Portal — reference research

This document records the current public guidance used for the portal architecture and delivery decisions. It is reference material for maintainers, not player-facing copy.

## Official game-portal patterns

- MARVEL SNAP: concise top navigation, large visual hero, download CTA, news/media/support surfaces.
  https://marvelsnap.com/
- Riftbound: game introduction, how-to-play, card/product surfaces, news, and a dedicated official site rather than a duplicate game client.
  https://playriftbound.com/en-us/
- Shadowverse: image-led game identity, news/support/legal surfaces, and a clearly separated player client.
  https://shadowverse.com/

The VEXFORGE portal follows the information architecture pattern only. It does not reproduce another game's branding, copy, UI artwork, or layout one-for-one.

## Supabase public-client security

Supabase currently recommends publishable keys for browser/mobile/public components. Publishable keys may be exposed when Row Level Security and least-privilege policies are correctly configured; secret/service-role keys must never be exposed in browser code.

https://supabase.com/docs/guides/database/secure-data
https://supabase.com/docs/guides/getting-started/api-keys
https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys

The portal therefore uses only a publishable client key for the single public card catalog request and does not use Auth, player sessions, wallet, inventory, admin, or economic state.

## Cloudflare Pages

The portal uses a Pages `_redirects` file for the SPA fallback. Cloudflare documents `_redirects` in the static asset directory as the supported mechanism for custom redirects on Pages.

https://developers.cloudflare.com/pages/configuration/redirects/

## Design principle

The portal deliberately avoids generic SaaS patterns, particle fields, fake metrics, overuse of glass panels, or internal implementation terminology. Visual depth comes from composition, typography, lighting gradients, image cropping, angular rails, restrained motion, and the existing VEXFORGE artwork.
