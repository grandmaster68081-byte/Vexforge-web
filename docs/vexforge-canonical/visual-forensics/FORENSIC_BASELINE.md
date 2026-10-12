# VEXFORGE — F0 forensic baseline

**Scope:** source and asset inventory only. No Unity compilation, Android build, Supabase data access, or project-data mutation was performed.
**Status meanings:** `VERIFIED` means checked in the current source checkout or by a read-only service metadata response; it does not imply Unity Editor, build, or device verification.

## Provenance and service linkage

| Check | Result |
| --- | --- |
| Official source | `https://github.com/grandmaster68081-byte/Vexforge-web`, branch `main` |
| Working copy | `vexforge-web/`, tracked by its own Git repository so the Replit workspace's internal backup remains intact |
| HEAD before F0 changes | `75b5533926e596c8eceb6263637804168de56175` |
| `origin/main` after `git fetch --prune origin` | `75b5533926e596c8eceb6263637804168de56175` |
| Starting worktree | Clean; `main` matched `origin/main` |
| Supabase project reference | `rscuzqnfccqvltkdcdny` — **VERIFIED** by read-only Management API GET |
| Supabase project health/region | `ACTIVE_HEALTHY`, `us-west-2` |
| Supabase tables, Storage, Auth, RPC, schema, or rows | Not queried or changed in F0 |
| Connectors | Not used |

The Replit workspace's existing repository/backup configuration was preserved. The official GitHub checkout is available in `vexforge-web/` with `origin/main` as its source; all product changes and phase commits belong in that repository.

## Unity project identity and entry point

| Check | Result |
| --- | --- |
| Canonical Unity root | `unity/` |
| Editor version | `6000.3.0f1` |
| Manifest / lock | `unity/Packages/manifest.json` and `unity/Packages/packages-lock.json` |
| URP package | `com.unity.render-pipelines.universal` `17.3.0` is declared |
| Build scene | `Assets/Scenes/VexforgeBootstrap.unity` (enabled in `EditorBuildSettings.asset`) |
| Serialized scene component | `Vexforge.Core.VexforgeApp` |
| Shell creation | `VexforgeApp.Awake()` adds `GameShellController`; that controller creates the presentation camera consumers, card resolver, canonical `BattlePresentationDirector`, and `VexforgeBattlefieldStage` during runtime |
| Tier-1 bootstrap | `VexforgeTier1Bootstrap.Install()` creates one persistent bootstrap after scene load; it is not serialized as a scene component |
| Official Android workflow | `.github/workflows/vexforge-unity-android-github.yml`; manual `workflow_dispatch`, only `main`, checks out `unity/` |
| Local APK / matching commit | No APK is present in the repository. The APK commit is **NOT VERIFIED**. |
| Player log / full logcat | Not provided in this checkout; **NOT VERIFIED** |

### Project settings and runtime evidence

- Only three files are present in `unity/ProjectSettings/`: `EditorBuildSettings.asset`, `ProjectSettings.asset`, and `ProjectVersion.txt`.
- `GraphicsSettings.asset`, `QualitySettings.asset`, a URP pipeline asset, and a URP renderer asset were not found. The package declaration alone does not prove an active URP assignment; active pipeline/quality settings are **NOT VERIFIED**.
- Revalidation on synchronized `main` (`21c923f06e5f574f6cf308ac9dd584e20aa44c94`) found 35 dependencies in `Packages/manifest.json` and 33 in `packages-lock.json`. The lock omits `com.unity.inputsystem` 1.20.0, URP 17.3.0, and UGUI 2.0.0; it also contains `com.unity.modules.unitywebrequestxml`, which is absent from the manifest. Package resolution/import is **NOT VERIFIED**; F0 did not modify or resolve packages.
- The scene contains one `VexforgeApp` component and no serialized camera. The `MainCamera` and runtime presentation objects are created by code; successful runtime creation is **NOT VERIFIED**.
- No Unity Editor import, Player build, installation, or device run was attempted.

## Physical asset inventory

`unity/Assets/` contains **209 files**:

| Type | Count |
| --- | ---: |
| C# scripts | 82 |
| Unity scenes | 1 |
| PNG textures | 22 |
| WAV audio clips | 10 |
| Prefabs / materials / standalone model files / animation clips or controllers | 0 |
| Other files, including JSON manifests and `.meta` files | 94 |

The checked-in Unity build scene is the single scene. The extension inventory contains no prefab, material, FBX, OBJ, `.anim`, Animator Controller, or APK.

### Manifest-to-file cross-check

The Tier-1 manifest contains 32 local asset entries: **22 identity-critical PNGs** and **10 WAVs**. All 32 `resources_key` paths resolve to an exact file beneath `unity/Assets/Resources/`. A file on disk is not evidence that Unity imported or loaded it in a build.

| `asset_id` | Resolved file under `Assets/Resources/` | File/import metadata | Static consumer references → likely route |
| --- | --- | --- | --- |
| `VF_ARCHIVE_SANCTUM_HERO` | `VexforgeTier1/Art/VF_ARCHIVE_SANCTUM_HERO.png` | PNG; `TextureImporter` `.meta` | `TutorialDirector`, `LegacyRouteFrame` → Archive/route presentation |
| `VF_BATTLE_ARENA_CITADEL_A` | `VexforgeTier1/Art/VF_BATTLE_ARENA_CITADEL_A.png` | PNG; `TextureImporter` `.meta` | `BattleGate`, `CanonicalBattlefieldPolish`, `EncounterProfile`, `TutorialDirector` → Battle |
| `VF_BOSS_AURA` | `VexforgeTier1/Art/VF_BOSS_AURA.png` | PNG; `TextureImporter` `.meta` | `WorldAtlasDirector` → World/boss |
| `VF_CARD_BACK_CORE` | `VexforgeTier1/Art/VF_CARD_BACK_CORE.png` | PNG; `TextureImporter` `.meta` | `PackRevealView` → pack reveal |
| `VF_CARD_FALLBACK_NEUTRAL` | `VexforgeTier1/Art/VF_CARD_FALLBACK_NEUTRAL.png` | PNG; `TextureImporter` `.meta` | Manifest-driven fallback; no direct literal consumer found |
| `VF_CARD_FRAME_COMMON` | `VexforgeTier1/Art/VF_CARD_FRAME_COMMON.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_CARD_FRAME_EPIC` | `VexforgeTier1/Art/VF_CARD_FRAME_EPIC.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_CARD_FRAME_LEGENDARY` | `VexforgeTier1/Art/VF_CARD_FRAME_LEGENDARY.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_CARD_FRAME_MYTHIC` | `VexforgeTier1/Art/VF_CARD_FRAME_MYTHIC.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_CARD_FRAME_RARE` | `VexforgeTier1/Art/VF_CARD_FRAME_RARE.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_CARD_FRAME_UNCOMMON` | `VexforgeTier1/Art/VF_CARD_FRAME_UNCOMMON.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_FORGE_CHAMBER_HERO` | `VexforgeTier1/Art/VF_FORGE_CHAMBER_HERO.png` | PNG; `TextureImporter` `.meta` | `TutorialDirector`, `LegacyRouteFrame` → Forge/route presentation |
| `VF_MISSION_HALL_HERO` | `VexforgeTier1/Art/VF_MISSION_HALL_HERO.png` | PNG; `TextureImporter` `.meta` | `TutorialDirector`, `DiegeticRoomDirector` → Missions |
| `VF_NEXUS_CITADEL_HERO` | `VexforgeTier1/Art/VF_NEXUS_CITADEL_HERO.png` | PNG; `TextureImporter` `.meta` | `TutorialDirector`, `DiegeticRoomDirector`, `BattleGate`, `PackRevealView`, `LegacyRouteFrame` → Nexus/Battle/pack |
| `VF_PACK_RELIC` | `VexforgeTier1/Art/VF_PACK_RELIC.png` | PNG; `TextureImporter` `.meta` | `RoomOrnamentDirector`, `PackRevealView` → pack/reward |
| `VF_PACK_VAULT_HERO` | `VexforgeTier1/Art/VF_PACK_VAULT_HERO.png` | PNG; `TextureImporter` `.meta` | `PackRevealView` → pack reveal |
| `VF_REWARD_SIGIL_COMMON` | `VexforgeTier1/Art/VF_REWARD_SIGIL_COMMON.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_REWARD_SIGIL_PREMIUM` | `VexforgeTier1/Art/VF_REWARD_SIGIL_PREMIUM.png` | PNG; `TextureImporter` `.meta` | `RoomOrnamentDirector` → reward/economy |
| `VF_TREASURY_VAULT_HERO` | `VexforgeTier1/Art/VF_TREASURY_VAULT_HERO.png` | PNG; `TextureImporter` `.meta` | `DiegeticRoomDirector` → treasury/economy |
| `VF_BATTLE_SIGIL_ATLAS` | `VexforgeTier1/Art/VF_BATTLE_SIGIL_ATLAS.png` | PNG; `TextureImporter` `.meta` | `TutorialDirector`, `CanonicalBattlefieldPolish` → Battle |
| `VF_NEXUS_OBSIDIAN_PATTERN` | `VexforgeTier1/Art/VF_NEXUS_OBSIDIAN_PATTERN.png` | PNG; `TextureImporter` `.meta` | Manifest-driven; no direct literal consumer found |
| `VF_BOSS_SIGIL` | `VexforgeTier1/Art/VF_BOSS_SIGIL.png` | PNG; `TextureImporter` `.meta` | `CanonicalBattlefieldPolish`, `WorldAtlasDirector`, `RoomOrnamentDirector` → Battle/World |
| `attack` | `VexforgeTier1/Audio/attack.wav` | WAV; `.meta` missing | `TurnCombatGate`, `Repository`, `StrategyDirector`, `BattlePresentationDirector` → combat |
| `battle_intro` | `VexforgeTier1/Audio/battle_intro.wav` | WAV; `.meta` missing | `EncounterProfile` → Battle |
| `defeat` | `VexforgeTier1/Audio/defeat.wav` | WAV; `.meta` missing | `StrategyDirector`, `EncounterProfile`, `ApiContracts` → combat result |
| `fusion` | `VexforgeTier1/Audio/fusion.wav` | WAV; `.meta` missing | `Repository`, `ApiContracts` → fusion |
| `guard` | `VexforgeTier1/Audio/guard.wav` | WAV; `.meta` missing | `GameShellController`, `TurnCombatGate`, `BattleGate`, `StrategyDirector`, `ApiContracts` → UI/combat |
| `impact` | `VexforgeTier1/Audio/impact.wav` | WAV; `.meta` missing | `BattlefieldStage`, `BattlePresentationDirector` → Battle |
| `pack_reveal` | `VexforgeTier1/Audio/pack_reveal.wav` | WAV; `.meta` missing | `BattlePresentationDirector` → reveal |
| `reward` | `VexforgeTier1/Audio/reward.wav` | WAV; `.meta` missing | `GameShellController`, `AlphaHud`, `TurnCombatGate`, `Repository`, `RoomOrnamentDirector`, related event contracts → reward/UI |
| `shield` | `VexforgeTier1/Audio/shield.wav` | WAV; `.meta` missing | `TurnCombatGate`, `BattlefieldStage`, `StrategyDirector`, `Repository`, `BattlePresentationDirector`, `ApiContracts` → combat |
| `victory` | `VexforgeTier1/Audio/victory.wav` | WAV; `.meta` missing | `EncounterProfile`, `CinematicDirector` → Battle result |

All 22 PNGs have `TextureImporter` metadata with a consistent recorded profile (`sRGBTexture=true`, alpha transparency enabled, texture compression enabled, filter mode `2`, wrap mode `1`). Image files are physically valid PNGs; sizes range from 768×1024 to 1440×2560. The 10 WAV files have no adjacent `.meta`, so their stable Unity GUID and serialized audio-import settings are **NOT VERIFIED**.

`Resources.Load` success, exact consumer-to-route binding, build inclusion, decoded dimensions in Unity, and rendered appearance are **NOT VERIFIED** for all 32 entries. These require the next inventory/runtime phases and must not be reported as `PASS` from the filesystem check alone.

## Official card art checkpoint

The manifest declares `known_count=127` and `local_card_art_copy_forbidden=true`. The supplied checkpoint reports 127 active rows with `image_url`; 24 URLs previously returned valid JPEGs. That partial evidence was reused and not repeated in F0. The remaining URLs, Unity decode results, and renders through Collection/detail/Deck/hand remain **NOT VERIFIED**. No card art was copied, regenerated, or changed.

## Current-code findings relevant to F1

The supplied diagnosis is consistent with the current checkout:

- `VexforgeApp` initializes session/state, then `GameShellController` creates the canonical presentation objects. The scene itself serializes only `VexforgeApp`.
- `VexforgeTier1Bootstrap.Build()` initializes `VexforgeTier1BattleGate` and `VexforgeTier1RouteSurface` with a `null` director. Its separate binding coroutine retries discovery for 600 frames and returns without binding when discovery fails.
- `VexforgeTier1RouteSurface.WaitForBattleAndApply()` has a second independent 600-frame search and sets `ready=true` after the loop even if `canonicalBattle` is still null.
- `VexforgeTier1Bootstrap.OnAuth()` can call `tutorial.TryStart()` on authentication independently of canonical battle binding.
- `VexforgeTier1BattleGate.DiscoverAsync()` checks for an initialized canonical director before calling `GetPvpOpponentsAsync`; it displays a not-ready status and returns when that director is absent.
- `VexforgeTier1AssetRegistry.Initialize()` sets `initialized=true` before checking that the manifest loads and parses, so a first failed load cannot be retried through the current guard.

These are source-level observations, not runtime reproductions. F1 should address the single readiness contract without creating another battle engine or changing Supabase/gameplay contracts.

## Boundaries and blockers

- No Supabase DB/storage/auth/RPC/schema/data changes.
- No Unity Cloud Build or Unity-account login. The repository's canonical Android build operation is manual GitHub Actions; fresh approval is required before any Unity/Android build, and F0 did not request one.
- No APK/logcat/player-log provenance is available, so device-level cause and status remain open.
- No active SRP/quality assignment can be established from the checked-in project settings.
- No Unity importer/load success or rendered screenshot was produced.
