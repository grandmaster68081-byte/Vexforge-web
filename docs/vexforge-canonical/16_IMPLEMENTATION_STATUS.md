# 16 — IMPLEMENTATION STATUS (UNITY CANÓNICO)

## Runtime y evidencia

| Área | Estado observado en código | Evidencia | Pendiente |
|---|---|---|---|
| Runtime Android | Unity 6.3 (`6000.3.0f1`), paquete `com.vexforge.android` | `unity/ProjectSettings/ProjectVersion.txt`, `unity/ProjectSettings/ProjectSettings.asset` | Abrir y compilar en el Editor objetivo; sin build Android durante esta migración |
| Bootstrap y navegación | Foundation con `VexforgeApp`, `NavigationService`, router diegético | `unity/Assets/Scripts/Core/**`, `unity/Assets/Scripts/Presentation/VexforgeDiegeticInputRouter.cs` | Paridad de flujo, lifecycle y tutorial |
| Auth y sesión | Inicio de sesión, restauración con recarga del estado del jugador, cierre remoto/local y alta por email con estado de confirmación implementados en código; almacén Android Keystore/AES-GCM presente | `SupabaseAuthService.cs`, `SessionService.cs`, `VexforgeApp.cs`, `SecureSessionStore.cs`, `GameShellController.cs` | Unity Editor/dispositivo sin verificar; Expo no expone reset y los proveedores externos están deshabilitados en la configuración live observada |
| Estado de jugador | Perfil, progreso, catálogo, colección, deck, misiones, wallet, estadísticas y rango; paquetes y órdenes se consultan bajo demanda; jefes activos se cargan al abrir el atlas | `GameStateStore.cs`, `VexforgeRepository.cs` | Igualar estados offline/sync y evitar que errores técnicos lleguen al jugador |
| Colección y formación | Búsqueda y filtros de propiedad, inspección de cartas y borrador de formación editable; validación y guardado por RPC | `VexforgeVirtualizedCardGallery.cs`, `VexforgeCardInspectionStage.cs`, `VexforgeTier1StrategyDirector.cs`, `VexforgeRepository.cs` | Verificar interacción, estados vacíos/error y resultados de mutación en Unity Editor/dispositivo |
| Combate | `vexforge_battle_resolve` sigue siendo la autoridad; Unity clasifica y reproduce eventos recibidos, guarda la última secuencia en memoria para replay y ofrece omitir solo frames interrumpibles | `VexforgeRepository.cs`, `BattlePresentationDirector.cs`, `VexforgeBattlefieldStage.cs`, `VexforgeTier1BattleGate.cs`, `VexforgeTier1BattleResultHud.cs` | Verificar orden, replay, omisión e interrupciones en Unity; no resolver reglas localmente |
| Pack | Unity consulta el catálogo, compra/abre mediante los RPC existentes, permite reintentar órdenes pagadas y revela las cartas del servidor; recarga ownership/cartera | `VexforgeTier1PackRevealDirector.cs`, `GameStateStore.cs`, `VexforgeRepository.cs` | Verificar ceremonia, órdenes pendientes, ownership y arte en Unity Editor/dispositivo |
| Mundo/tutorial/boss | Atlas de Unity lista jefes activos con datos del servidor y usa sigilo/aura canónicos; no inicia combate ni calcula recompensas | `VexforgeTier1WorldAtlasDirector.cs`, `VexforgeTier1RouteSurface.cs`, `VexforgeWorldHotspot.cs`, `VexforgeTier1TutorialDirector.cs`, `VexforgeBattlefieldStage.cs` | Verificar navegación y estado; revisar arte individual y contrato autorizado de encuentros antes de habilitarlos |
| Audio | Director Unity aplica la taxonomía Expo a los clips locales disponibles, incluido `pack_reveal` para boss | `VexforgeTier1AudioDirector.cs`, `BattlePresentationPolicy` | Verificar mezcla y reproducción opcional en Unity Editor/dispositivo |
| Haptics | Servicio semántico conectado a eventos de batalla; usa vibración genérica solo en plataformas móviles | `VexforgeHapticsService.cs`, `BattlePresentationPolicy` | Verificar soporte y comportamiento físico en dispositivo |
| Movimiento reducido | Preferencia persistida controla movimientos de cámara/escena, partículas y pulsos de cartas/boss; conserva una señal atmosférica estática | `PersistentRuntimeState.cs`, `BattlePresentationDirector.cs`, `VexforgeBattlefieldStage.cs` | Verificar cada superficie en Unity Editor/dispositivo |
| Social/economía | Unity conserva contratos/repositorio y algunas superficies; Supabase sigue siendo autoridad | `VexforgeSocialRepository.cs`, `VexforgeSocialHub.cs`, `VexforgeRepository.cs` | Portar solo consumidores con contrato vigente; no mover reglas al cliente |
| Portal web / faucet | Portal congelado; faucet Kivora es producto separado | `src/**`, `public/**`, `faucet/**` | Sin cambios como parte de la migración |
| Verificación | Unity Editor, dispositivo y workflow Android Unity no verificados | `28_UNITY_EXPO_MIGRATION_GATES.md` | Cerrar paridad, seguridad, Editor y dispositivo; la retirada de Expo fue una excepción solicitada y no cerró estas gates |

La matriz completa de capacidades, rutas inspeccionadas y clasificación está en
`27_UNITY_EXPO_MIGRATION_INVENTORY.json`. Los estados de código no equivalen a
verificación de runtime.

## Orden de migración

Los hitos 01–08 tienen evidencia de implementación de fuente. El Hito 10 retiró
`mobile/**` por instrucción explícita del usuario antes de cerrar las gates; el
Hito 11 actualiza esta documentación. Eso no marca como completas la paridad,
la revisión de seguridad ni la validación Unity Editor/dispositivo. No hay un
workflow Android Unity configurado; el usuario dejó esa tarea para una etapa
posterior. Cada unidad completada debe quedar en un commit y push a `main`.
