# 17 — CURRENT BLOCK

## CURRENT ACTIVE BLOCK

`UNITY_CANONICAL_RUNTIME_AND_BUILD_CONTROL_PLANE`

### Objetivo

Mantener Unity bajo `unity/**` como único runtime Android activo y establecer
un solo método de compilación: GitHub Actions ejecutando el Unity Editor según
`.github/workflows/vexforge-unity-android-github.yml`.

### Estado

El proyecto Unity existe en `main`, la versión objetivo se lee de
`unity/ProjectSettings/ProjectVersion.txt` y el workflow canónico contiene los
modos normal, diagnóstico, baseline, inventory, shard y final. Supabase sigue
siendo la autoridad de backend y datos. La configuración fue reconciliada sin
iniciar una compilación.

### Gates

| Gate | Estado | Evidencia / bloqueo |
|---|---|---|
| Unity project scaffold | IMPLEMENTED_UNVERIFIED | `unity/**`; falta verificación independiente del Editor |
| Unity version source | VERIFIED_IN_REPOSITORY | `ProjectVersion.txt` declara `6000.3.0f1` |
| Canonical GitHub workflow | CONFIGURED_UNVERIFIED | workflow único, manual, sin dispatch en esta sesión |
| Supabase authority | VERIFIED_READ_ONLY | Management API respondió proyecto activo/saludable; no hubo mutación |
| Auth/session | PARTIALLY_IMPLEMENTED | requiere verificación del runtime Unity |
| Nexus / World | IMPLEMENTED_UNVERIFIED | código existente; no se declara QA visual o física |
| Cards / Collection | IMPLEMENTED_UNVERIFIED | contratos existentes; requiere verificación del Editor |
| Deck / Formation | PARTIALLY_IMPLEMENTED | formación y contratos existentes |
| Battle | PARTIALLY_IMPLEMENTED | presentación y RPC existentes; requiere verificación |
| Missions / Economy / Profile | IMPLEMENTED_UNVERIFIED | superficies existentes; no se inventaron datos |
| Expo / React Native legacy | PRESERVED | `mobile/**` conservado, sin pipeline activo |
| Unity Cloud Build | REFERENCE_ONLY | no es método actual y no se utilizó |
| First Unity build | BLOCKED_BY_AUTHORIZATION | explícitamente no iniciado en esta fase |

### No tocar

No borrar `mobile/**` ni alterar Supabase para compensar una carencia de Unity.
No introducir claves privadas, service-role keys, licencias, `.ulf`, APK, AAB,
Player, Gradle generado ni workflows de compilación paralelos.

### Condición de cierre

El estado no sube a `EDITOR_VERIFIED`, `BUILD_VERIFIED` o `DEVICE_VERIFIED`
hasta contar con la evidencia correspondiente. Una futura compilación requiere
autorización explícita del propietario y debe ejecutarse en el workflow canónico.
