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
