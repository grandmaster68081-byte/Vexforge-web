# PHASE_REPORT — F1: readiness canónica y entrada a Battle

## Resultado

**F1: READINESS CONTRACT IMPLEMENTED / STATIC CHECKS PASS / UNITY RUNTIME NOT VERIFIED**

Se sustituyeron las búsquedas independientes de Battle por un contrato único en `VexforgeTier1Bootstrap`: `Uninitialized → Initializing → Ready → FailedRetryable`. El estado `Ready` depende del `GameShellController` activo de la escena cargada, su `BattlePresentationDirector` inicializado, `VexforgeBattlefieldStage` inicializado, resolver de arte no liberado y cámara activa etiquetada `MainCamera`.

El director de Tier-1 publica referencias tipadas y gestiona reintentos con generación, timeout, cambio de escena y validación periódica. Un timeout conserva el fallo recuperable e informa causa, límite de frames, frame actual, tiempo, escena y objetos encontrados; el registro no crea un segundo director.

La ruta Battle, la consulta de rivales, el inicio de combate y el tutorial quedan condicionados al readiness compartido. Al cambiar de escena, los directores visuales persistentes pueden volver a enlazarse con el nuevo stage. La espera usa el fondo local de Arena con el fallback local del Nexus y un indicador pequeño; si ambos faltan, registra un error visible en consola y deja desactivados el fondo y la veladura para no tapar la escena en negro.

No se alteraron la autoridad del servidor, el contrato de Supabase, las claves de idempotencia ni los datos persistentes.

## HEAD before/after

- Before: `8962ce5fcf6efbef45cd8a68ce4cdaa01a7f986e` (`main == origin/main`; worktree limpio antes de F1).
- After: código y reporte F1 en el commit de esta fase sobre `main`; el hash final queda en el historial de `main` y en el mensaje de cierre.
- Repositorio: `https://github.com/grandmaster68081-byte/Vexforge-web.git`.

## Archivos cambiados

- `unity/Assets/Scripts/UI/GameShellController.cs` — validación tipada de la presentación canónica del host activo.
- `unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs` — expone su estado de inicialización.
- `unity/Assets/Scripts/Presentation/VexforgeCardArtResolver.cs` — expone si fue liberado.
- `unity/Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs` — contrato único de readiness, fallo recuperable, reintentos, diagnóstico y escena activa.
- `unity/Assets/Scripts/Tier1/VexforgeTier1RouteSurface.cs` — elimina su sondeo paralelo y espera la autoridad central.
- `unity/Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs` — espera antes de pedir rivales o iniciar acciones de combate; UI de espera y reintento.
- `unity/Assets/Scripts/Tier1/VexforgeTier1TutorialDirector.cs` — conserva el inicio pendiente y no abre el tutorial antes del readiness.
- `unity/Assets/Scripts/Tier1/VexforgeTier1CanonicalBattlefieldPolish.cs` — puede re-enlazarse al stage canónico tras cambiar de escena.
- `unity/Assets/Scripts/Tier1/VexforgeTier1EncounterPresentationDirector.cs` — reconstruye su manifestación visual al cambiar de stage.
- `unity/Assets/Scripts/Tier1/VexforgeTier1CardImmersionDirector.cs` — elimina suscripciones antiguas y enlaza el director/stage vigentes.
- `docs/vexforge-canonical/visual-forensics/PHASE_REPORT_F1.md` — este registro.

## Comprobaciones

| Comprobación | Resultado |
| --- | --- |
| Rama y origen | `main`, origen oficial correcto; HEAD coincide con `origin/main` antes de F1 |
| Estados explícitos, timeout y diagnóstico | Aprobado por inspección estática |
| Director, stage, resolver, cámara y escena | Validación tipada presente en el código |
| RouteSurface | Sin búsqueda propia ni marca `Ready` independiente |
| Tutorial | Conserva inicio pendiente mientras el readiness no está listo |
| `GetPvpOpponentsAsync` | Su llamada queda detrás del guard de readiness; vuelve a comprobarlo después del `await` |
| Reflexión añadida | Ninguna |
| `git diff --check` | Aprobado |
| Inicio en frío, autenticación tardía, logout/login, navegación Battle repetida | No ejecutados en Unity |
| Director tardío/ausente y pérdida/recuperación de escena | No ejecutados en Unity |
| Compilación Unity, APK, instalación o dispositivo | No ejecutados; reservados para la compilación final del usuario |
| Supabase y conectores | Sin operaciones ni cambios |

## Límite de evidencia y siguiente fase

Las comprobaciones ejecutadas son estáticas; no demuestran el comportamiento real del ciclo de vida de Unity ni la carga de texturas mediante `Resources.Load`. Los casos de ejecución de la tabla siguen **NOT VERIFIED** hasta la compilación y revisión final que realizará el usuario.

Siguiente fase autorizada: **F2**, siguiendo únicamente la siguiente sección de la orden forense V2. No iniciar F3 en este cierre.
