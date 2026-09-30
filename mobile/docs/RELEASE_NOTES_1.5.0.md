# VEXFORGE 1.5.0 · RELEASE NOTES

## Runtime

The release promotes the visual/runtime package from the prior candidate to an explicit 13-scene registry, including a dedicated Live Ops/Season surface. Each scene ships in HIGH/MEDIUM/LOW derivatives and all are locally bundled.

Scene cinematics and the pack ceremony now resolve their background from the selected runtime quality tier instead of decoding a separate fixed full-resolution scene. The seasonal atlas switches to the dedicated `events` scene without inventing live event data.

## Combat

The interactive tactical session is the source of truth for the field, actor, targets and presentation events. Boss phases are thresholded and emitted once per phase. Rally/summon and support skills use legal, context-specific targets. Battle units expose status stacks, energy, role, rarity and boss state to the renderer.

A typed return contract was added to the deterministic lab's unit factory so the boss/status model is checked by TypeScript rather than relying on inference of `{}`.

## Economy and ownership

The release preserves server-authoritative ownership, pack odds, marketplace settlement and wallet settlement. The local audits exercise the formula/invariant model but do not grant the client settlement authority.

## Build integrity

The verifier now checks the complete 13-master/39-derivative official scene package. Superseded 1.4 manifests are removed so the ZIP has one unambiguous current asset and assembly authority. A current SHA256 list is shipped with the release.
