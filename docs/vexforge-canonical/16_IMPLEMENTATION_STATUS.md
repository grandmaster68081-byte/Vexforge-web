# 16 — IMPLEMENTATION STATUS

| Área | Estado actual | Status | Evidence | Blocker / next |
|---|---|---|---|---|
| Android shell/navigation | Expo Router y tabs existen | IMPLEMENTED_UNVERIFIED | `mobile/app/**` | device matrix |
| Auth/session | loaders, forms, guards y persistence existen | IMPLEMENTED_UNVERIFIED | `auth.tsx`, `supabase.ts` | QA autenticada |
| Home/collection/deck/profile | screens y consumers reales | IMPLEMENTED_UNVERIFIED | routes + verifiers | APK/device |
| Battle/formation | renderer, formation y battle consumers | PARTIAL | `battle.tsx`, components, protocol | live contract + physical QA |
| Missions/rewards/world | screens/actions/loaders reales | IMPLEMENTED_UNVERIFIED | routes + verifiers | live/QA |
| Economy/withdrawals | UI y consumers, backend amplio | EVIDENCE_REQUIRED | `economy.tsx`, live catalog | authenticated QA |
| Visual system | tokens, scenes, states y guards | IMPLEMENTED_UNVERIFIED | constants/components/verifiers | device readability/performance |
| OTA | config/function/workflow presentes | EVIDENCE_REQUIRED | app.json, function, workflow | live publish/update evidence |
| Latest APK | release 249 recorded | VERIFIED_FOR_RECORDED_GATES | `CONTINUITY.md` | does not prove current commit install |
| Canonical continuity | this folder + context | IMPLEMENTED | current commit | keep updated per block |

Estados permitidos usados aquí: `PLANNED`, `IMPLEMENTED`, `IMPLEMENTED_UNVERIFIED`, `VERIFIED`, `BLOCKED`, `EVIDENCE_REQUIRED`, `HISTORICAL`, `FROZEN`, `UNKNOWN`.

## Migración de motor

| Área | Estado actual | Status | Evidence | Blocker / next |
|---|---|---|---|---|
| Unity 6.3 LTS / URP project | `unity/` existe con editor `6000.3.24f1` y URP | IMPLEMENTED_UNVERIFIED | `unity/ProjectSettings/ProjectVersion.txt`, `unity/Packages/manifest.json` | Foundation APK |
| React Native/Expo client | Cliente Android real y releaseable, pero legado para nueva dirección | FROZEN | `mobile/**`, `05_ANDROID_RUNTIME_AND_BUILD.md` | rollback hasta Unity Foundation |
| Unity Foundation | proyecto y build method existen; APK no verificado | IMPLEMENTED_UNVERIFIED | `unity/Assets/VexForge/**`, workflows Unity aislados | ejecutar matriz de rutas |
| Unity final Android active | No alcanzado | BLOCKED | no existe APK Foundation verificable en el commit actual | no avanzar a Etapa 2 |
