# 17 — CURRENT BLOCK

## CURRENT ACTIVE BLOCK

`UNITY_RUNTIME_REACTIVATION`

### Objetivo

Continuar el Unity actual como runtime principal de desarrollo sin destruir
Expo / React Native. Completar la mayor cantidad posible de Foundation, Nexus,
Archive, Forge, Arena y Missions usando Supabase como autoridad y sin ejecutar
ningún build.

### Estado

El proyecto Unity ya tiene una escena de entrada, configuración Android,
bootstrap, logging, navegación, estado persistente no sensible, cliente
Supabase REST/RPC, auth en memoria, GameState derivado, Nexus development
geometry y superficies data-driven para los dominios principales.

### Gates

| Gate | Estado | Evidencia / bloqueo |
|---|---|---|
| Unity project scaffold | IMPLEMENTED_UNVERIFIED | `unity/**`; falta abrir con editor objetivo |
| Supabase client | IMPLEMENTED_UNVERIFIED | `unity/Assets/Scripts/Backend/**` |
| Auth/session | PARTIALLY_IMPLEMENTED | secure Android token store pendiente |
| Nexus / World | IMPLEMENTED_UNVERIFIED | citadel geometry, diegetic portals; assets oficiales pendientes |
| Cards / Collection | IMPLEMENTED_UNVERIFIED | reusable card renderer; contratos REST deben verificarse en editor |
| Deck / Formation | PARTIALLY_IMPLEMENTED | physical card slots, RPC validation/save wired; formation editor pendiente |
| Battle | PARTIALLY_IMPLEMENTED | battlefield presentation and resolve RPC; event replay pendiente |
| Missions / Economy / Profile | IMPLEMENTED_UNVERIFIED | read surfaces wired to Supabase |
| Expo fallback | PRESERVED | `mobile/**` sin eliminación |
| First Unity build | BLOCKED | explícitamente prohibido en esta fase; no implica detener código |

### No tocar

No borrar `mobile/**`. No introducir claves privadas, service role keys,
licencias, `.ulf`, APK, AAB, Player, Gradle o workflows de compilación.
No modificar Supabase para compensar una carencia de Unity.

El resultado de este bloque debe registrarse como `IMPLEMENTED_UNVERIFIED`
hasta que exista evidencia independiente de editor, build, instalación y QA.