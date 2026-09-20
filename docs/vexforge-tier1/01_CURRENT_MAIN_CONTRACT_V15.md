# CURRENT MAIN CONTRACT · V15

## Observed public main

Observed repository: `grandmaster68081-byte/Vexforge-web`

Observed commit at audit time: `55b724e8f20fbc22abd1f6606d7c4dd617ee3270`

Unity runtime: `unity/**`
Unity editor: `6000.3.0f1`
Android package: `com.vexforge.android`
Backend authority: Supabase

The repository itself describes the Unity state as `IMPLEMENTED_UNVERIFIED`. That status is preserved. It means source/runtime surfaces exist, but the package must not claim a compile or device proof that has not been performed in that environment.

## Canonical files consumed as contracts

- `Assets/Scripts/Core/VexforgeApp.cs`
- `Assets/Scripts/UI/GameShellController.cs`
- `Assets/Scripts/UI/VexforgeAlphaHud.cs`
- `Assets/Scripts/Backend/VexforgeRepository.cs`
- `Assets/Scripts/Presentation/BattlePresentationDirector.cs`
- `Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs`
- `Assets/Scripts/Presentation/VexforgeVirtualizedCardGallery.cs`
- `Assets/Scripts/Presentation/VexforgeCardArtResolver.cs`
- `ProjectSettings/ProjectVersion.txt`

## Existing important contracts

The battle path already exposes `VexforgeRepository.ResolveBattleAsync(...)` and the server RPC `vexforge_battle_resolve`. Opponent discovery is exposed through `get_pvp_opponents`. The canonical presentation emits `BattleEvent` information and reaches `PresentationCompleted`.

The existing card gallery already supports vertical row scrolling. V15 therefore does not rebuild a second catalog or horizontal-only screen.

## Unity navigation surface

The current Unity `GameRoute` contract contains Boot, Nexus, Collection, Deck, Battle, Missions, Economy and Profile. It does not expose Store, Market, World or Meta as independent routes. V15 does not fake those routes.

## Unity Cloud discrepancy requiring manual reconciliation

The operator supplied a Unity Cloud URL using organization `2476052138227` and project `0bde4b64-3816-4b75-b2c1-bbdacff93352`.

Repository documentation observed during the audit refers to organization `2476049544959` and project `2906c165-f463-4253-bd53-731be7d136a0`.

The operator must verify which Unity Cloud Build target is attached to the canonical `main` Unity project before release. V15 deliberately does not overwrite either value.
