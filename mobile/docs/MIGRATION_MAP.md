# VEXFORGE · Unity → Expo reconstruction map

This is the concrete mapping used by the new runtime. It is not an instruction for Replit to invent a design.

| Unity source | Expo runtime target |
|---|---|
| `VexforgeRepository` | `src/services/repository.ts` |
| `VexforgeApp` / `GameStateStore` concepts | `App.tsx` + scene data loaders |
| `VexforgeBattlefieldStage` | `src/render/BattlefieldCanvas.tsx` |
| `VexforgeBattlePresentationDirector` | `src/engine/replay.ts` + `src/engine/presentation.ts` + Arena presentation |
| `BattleResult` / `BattleEvent` / `BattleTurn` | `src/types/api.ts` |
| `VexforgeVirtualizedCardGallery` | `ArchiveScene` + bounded render list |
| `VexforgeCardArtResolver` concept | remote `image_url` resolution through `VexforgeCard` |
| `VexforgeTextureLruCache` concept | bounded card/image loading policy in `src/core/quality.ts` and `assetBudget.ts` |
| procedural Nexus scene | `NexusScene` + Skia background/scene layers |
| Unity formation vocabulary | `src/engine/formation.ts` |
| Unity event classification | `src/engine/presentation.ts` |
| Unity secure session boundary | Supabase auth + Expo secure storage |
| Unity quality/build settings | `src/core/quality.ts` + Expo/EAS configuration |

## Rules preserved

- Server-authoritative PvP resolution.
- Idempotency on repeatable battle operations.
- Formation vocabulary: Champion, Vanguard, Sentinel, Reserve.
- Official card art comes from verified card identity/data.
- Dynamic values stay data, never baked into artwork.
- Economy remains server-authoritative.
- Collection rendering is bounded rather than loading the whole catalog at full resolution.

## Rules deliberately not reimplemented in the client

- Combat resolution.
- RNG for server-owned outcomes.
- Reward minting.
- Wallet mutation.
- Marketplace settlement.
- Pack entitlement/result generation.

Those operations belong to the active Supabase authority. The client calls them and renders their verified output.
