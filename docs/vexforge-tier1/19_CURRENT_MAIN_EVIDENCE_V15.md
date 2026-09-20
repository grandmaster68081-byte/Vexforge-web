# CURRENT MAIN EVIDENCE · V15

Audit date: 2026-09-20

The public repository was re-inspected immediately before the V15 package seal.

## Confirmed on public `main`

- `unity/**` is the active Android runtime.
- Unity editor target: `6000.3.0f1`.
- Android package: `com.vexforge.android`.
- Supabase is the backend source of truth.
- The repository itself states the Unity state is `IMPLEMENTED_UNVERIFIED` and requires separate evidence for compile, Android installation and physical QA.
- `VexforgeRepository.ResolveBattleAsync` calls the canonical `vexforge_battle_resolve` RPC.
- `BattlePresentationDirector` consumes the canonical `BattleEvent[]` stream and raises `PresentationCompleted`.
- `VexforgeCardArtResolver` validates and downloads official card art from the VEXFORGE Supabase Storage host.

## Consequences for V15

V15 does not replace the canonical repository, battle director, battlefield stage, card gallery, card-art resolver or GameShell. It adds a namespaced presentation/orchestration layer and leaves server-owned rules authoritative.

The known 127 card artworks are not copied into the Unity repository. Presentation polish is applied around the existing remote art.

## Cloud Build identity discrepancy

The public repository documentation currently records an existing Unity Cloud project under organization `2476049544959` / project `2906c165-f463-4253-bd53-731be7d136a0`.

The operator supplied a different Unity Cloud URL using organization `2476052138227` / project `0bde4b64-3816-4b75-b2c1-bbdacff93352`.

V15 deliberately does not overwrite either value. The operator must reconcile which external Build Automation target is attached to canonical `main` before using Cloud Build.

## External policy references

Apple App Store Review Guidelines:
https://developer.apple.com/app-store/review/guidelines/

Google Play Blockchain-based Content:
https://support.google.com/googleplay/android-developer/answer/13607354

Unity LevelPlay regulation/consent:
https://docs.unity.com/en-us/grow/levelplay/sdk/react/regulation-advanced-settings

Unity URP performance guidance:
https://docs.unity.com/en-us/engine/6000.0/manual/render-pipelines/universal-render-pipeline/introduction/configure-for-better-performance
