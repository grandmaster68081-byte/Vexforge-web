# VEXFORGE Official Portal V5.1 — visual acceptance checklist

The target is a premium official game-property portal, using the current VEXFORGE art as the primary visual material. The website must feel like a real game launch surface rather than a dashboard, admin interface, technical showcase, or design mockup.

## Mobile reference: 720 × 1640

- Full-bleed hero art reaches the viewport edges.
- The first viewport has no technical/status panel.
- Hero copy uses a 14px side gutter.
- Primary actions are legible and touch-safe.
- Card art maintains 2:3 proportions.
- No horizontal overflow.
- Navigation opens without leaving a visible desktop layout behind the mobile menu.
- Discovery/faction/world imagery remains dominant.

## Desktop reference: 1440 × 900

- Hero artwork dominates the opening frame.
- Navigation is compact.
- The page alternates visual storytelling and content rather than repeating dashboard cards.
- Featured cards have a clear lead card.
- Four factions use image-led panels.
- World is presented as a cinematic full-width surface.
- Download is presented as a real product gate, not a fake live store button.

## Copy acceptance

The public interface must not expose engineering or delivery language, including Unity, Supabase, backend, database, REST/API, runtime, deployment, build systems, Replit, environment variables, implementation status, asset IDs, or repository details.

Weak/incomplete phrases are also rejected: `PUBLICACIÓN PENDIENTE`, `ARTE NO DISPONIBLE`, `CUANDO SEA REAL`, `ESPERANDO EL ARCHIVO`, `SE ABRIRÁ PRONTO`, `SOLO HABRÁ`, `CUANDO LLEGUE EL MOMENTO`, and `EL ARCHIVO PÚBLICO`.

## Functional acceptance

`npm run verify` → `npm run typecheck` → `npm run build` → `npm run verify:build`

No merge is accepted until the full sequence passes.
