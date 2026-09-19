# 16 — IMPLEMENTATION STATUS

| Área | Estado actual | Status | Evidence | Blocker / next |
|---|---|---|---|---|
| Android runtime/navigation | Unity bootstrap, world navigation y presentation stage existen | IMPLEMENTED_UNVERIFIED | `unity/Assets/Scripts/**` | Unity Editor y dispositivo |
| Auth/session | cliente Unity y sesión en memoria existen | PARTIAL | `unity/Assets/Scripts/Session/**`, `Backend/**` | secure Android storage + QA |
| Home/collection/deck/profile | Nexus world-first y superficies Unity existen | IMPLEMENTED_UNVERIFIED | `unity/Assets/Scripts/Presentation/**`, `UI/**` | editor/device |
| Battle/formation | presentation and server-authoritative consumers | PARTIAL | `unity/Assets/Scripts/Presentation/**`, `Backend/**` | live contract + physical QA |
| Missions/rewards/world | read surfaces and Nexus hotspots exist | IMPLEMENTED_UNVERIFIED | `unity/Assets/Scripts/**` | live/QA |
| Economy/withdrawals | Unity read surface, backend authority preserved | EVIDENCE_REQUIRED | `unity/Assets/Scripts/UI/**`, live catalog | authenticated QA |
| Visual system | world-first foundation, states and bounded resources | IMPLEMENTED_UNVERIFIED | `unity/Assets/Scripts/Presentation/**` | device readability/performance |
| OTA | config/function/workflow presentes | EVIDENCE_REQUIRED | app.json, function, workflow | live publish/update evidence |
| Latest APK | release 249 recorded | VERIFIED_FOR_RECORDED_GATES | `CONTINUITY.md` | does not prove current commit install |
| Canonical continuity | this folder + context | IMPLEMENTED | current commit | keep updated per block |

Estados permitidos usados aquí: `PLANNED`, `IMPLEMENTED`, `IMPLEMENTED_UNVERIFIED`, `VERIFIED`, `BLOCKED`, `EVIDENCE_REQUIRED`, `HISTORICAL`, `FROZEN`, `UNKNOWN`.

## Runtime Android

| Área | Estado actual | Status | Evidence | Blocker / next |
|---|---|---|---|---|
| Unity runtime | cliente Android canónico de desarrollo | IMPLEMENTED_UNVERIFIED | `unity/**`, `26_UNITY_ENGINE_MIGRATION.md` | editor, build gate y QA física |
| Presentation Foundation | runtime, boot scene, render boundary y motion utilities existen | IMPLEMENTED_UNVERIFIED | `unity/Assets/Scripts/Presentation/**` | Unity Editor y QA física |
| Unity Cloud Build infrastructure | proyecto y target Android externos existentes, documentados sin recreación | IMPLEMENTED | `docs/vexforge-canonical/UNITY_CLOUD_BUILD.md` | dashboard y hook externos |
| R5 Cloud Editor execution | bridge Pre-Export preparado; ejecución externa aún no observada | EVIDENCE_REQUIRED | `unity/Assets/Editor/VexforgeR5CloudBuildGate.cs` | run manual del target existente |
| Supabase authority | auth, datos y settlement permanecen en backend | ACTIVE | `unity/Assets/Scripts/Backend/**` | no cambiar contratos |
| Expo/React Native legacy | legado, rollback y referencia histórica | PRESERVED | `mobile/**`, `mobile/app.json` | no eliminar ni mezclar runtimes |
