# KIVORA V4 — MASTER EXECUTION

## Objective
Replace the current generic dashboard presentation with the Kivora V4 diegetic station experience defined in this package.

## Non-negotiable
Replit is an executor. It must not invent another visual direction, add generic glassmorphism, rename scenes again, or create placeholder illustrations.

## Required scenes
1. Command Deck — the station core, daily run and provider signal.
2. Opportunity Field — opportunities presented as distinct mission gates.
3. Vault — balance state as a physical vault chamber.
4. Chronicle — earning history as an event rail.
5. Settlement Terminal — withdrawals as a staged settlement procedure.
6. Profile/Settings may remain conventional but must visually inherit the same universe.

## Required art assets
Use the supplied assets in `public/assets/kivora-v4/`. Do not replace them with gradients-only placeholders.

## Required behavior
- The first viewport must be dominated by environment + hero object, not a stack of cards.
- Each scene must have a primary object or spatial anchor.
- Navigation changes the world context, not only the heading text.
- Motion must communicate state.
- Reduced-motion mode must collapse transitions without losing information.
- Mobile uses scene-first composition; never simply shrink desktop cards.

## Data binding
Bind the existing Kivora values to the V4 visual objects:
- available points -> Core / Vault
- pending points -> Vault
- reserved points -> Vault / Settlement
- ledger events -> Chronicle
- provider state -> Provider Signal
- offer inventory -> Opportunity Field
- withdrawal state -> Settlement Terminal

## No business logic duplication
The V4 presentation cannot credit rewards, settle points, approve withdrawals, or mark payouts. Existing server-side authority remains authoritative.

## Acceptance
Fail the implementation if:
- the first viewport still looks like a SaaS dashboard;
- more than 50% of visible surface is repeated cards;
- the supplied art assets are omitted;
- all pages reuse one generic background;
- motion is only fade/slide with no state choreography;
- mobile is merely desktop stacked vertically;
- provider credentials are required for build/visual preview.
