# 26 — UNITY ENGINE MIGRATION

## Decisión activa

Unity es el runtime principal de desarrollo Android para VEXFORGE. Expo /
React Native (`mobile/**`) se conserva completo como runtime secundario,
respaldo y referencia de comportamiento; no se elimina ni se mezcla con la
ejecución de Unity.

## Estado de implementación

| Capa | Estado |
|---|---|
| Proyecto Unity | IMPLEMENTED_UNVERIFIED |
| Unity target | `6000.3.0f1`, declarado como objetivo porque no existía `ProjectVersion.txt` |
| Android identity | `com.vexforge.android`, version `0.1.0`, versionCode `4` |
| Foundation | IMPLEMENTED_UNVERIFIED |
| Supabase REST/RPC client | IMPLEMENTED_UNVERIFIED |
| Auth/session | PARTIALLY_IMPLEMENTED; secure device token storage is pending |
| Nexus / World | IMPLEMENTED_UNVERIFIED; development geometry only |
| Archive / Collection | IMPLEMENTED_UNVERIFIED; data-driven surface |
| Forge / Deck | IMPLEMENTED_UNVERIFIED; validation and save remain server RPCs |
| Arena / Battle | PARTIALLY_IMPLEMENTED; resolve path is server-authoritative |
| Missions / Economy / Profile | IMPLEMENTED_UNVERIFIED read surfaces |
| Expo fallback | PRESERVED |
| APK / Android Player | BLOCKED by explicit no-build gate |

## Autoridad

```text
PLAYER INTENT
    ↓
SUPABASE AUTHENTICATED REST / RPC
    ↓
AUTHORITATIVE RESULT / EVENTS
    ↓
UNITY GAME STATE + PRESENTATION
```

Unity no calcula settlement competitivo, balances, recompensas, resultados de
batalla ni reglas que el backend ya autoriza.

## Build gate

Esta reactivación no autoriza ningún build. No ejecutar Unity Android Build,
Unity Player Build, Gradle assemble, APK/AAB generation, GameCI, Build
Automation ni GitHub Actions de compilación. La primera compilación requiere
validar el editor `6000.3.0f1`, activar Unity Personal en un equipo autorizado,
revisar almacenamiento seguro de sesión y definir el mecanismo oficial de
compilación.

## Unity project map

- `unity/Assets/Scripts/Core/` — bootstrap, environment, navigation, logging y estado persistente.
- `unity/Assets/Scripts/Session/` — sesión autenticada en memoria y estados de auth.
- `unity/Assets/Scripts/Backend/` — REST/RPC Supabase y contratos mínimos.
- `unity/Assets/Scripts/GameState/` — estado local derivado de respuestas autorizadas.
- `unity/Assets/Scripts/World/` — geometría de desarrollo del Nexus.
- `unity/Assets/Scripts/UI/` — shell y superficies de dominio.
- `unity/Assets/Scenes/VexforgeBootstrap.unity` — escena de entrada.

## Blockers

1. No existía un proyecto Unity previo ni `ProjectVersion.txt`; el target
   `6000.3.0f1` queda declarado, no verificado por apertura en editor.
2. La sesión se mantiene en memoria hasta implementar un almacén seguro
   específico de Android. No se persisten tokens en Git ni en PlayerPrefs.
3. Los modelos anidados de algunas respuestas PostgREST deben validarse en
   Unity Editor con datos reales antes de cerrar Collection/Deck.
4. Assets oficiales, audio, VFX y QA física requieren una etapa posterior y no
   se sustituyen con datos de producción inventados.