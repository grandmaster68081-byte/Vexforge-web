# 16 — IMPLEMENTATION STATUS (UNITY CANÓNICO)

## Runtime y evidencia

| Área | Estado observado en código | Evidencia | Pendiente |
|---|---|---|---|
| Runtime Android | Unity 6.3 (`6000.3.0f1`), paquete `com.vexforge.android` | `unity/ProjectSettings/ProjectVersion.txt`, `unity/ProjectSettings/ProjectSettings.asset` | Abrir y compilar en el Editor objetivo; sin build Android durante esta migración |
| Bootstrap y navegación | Foundation con `VexforgeApp`, `NavigationService`, router diegético | `unity/Assets/Scripts/Core/**`, `unity/Assets/Scripts/Presentation/VexforgeDiegeticInputRouter.cs` | Paridad de flujo, lifecycle y tutorial |
| Auth y sesión | Inicio de sesión, restauración, cierre remoto/local y alta por email con estado de confirmación implementados en código; almacén Android Keystore/AES-GCM presente | `SupabaseAuthService.cs`, `SessionService.cs`, `SecureSessionStore.cs`, `GameShellController.cs` | Unity Editor/dispositivo sin verificar; Expo no expone reset y los proveedores externos están deshabilitados en la configuración live observada |
| Estado de jugador | Perfil, progreso, catálogo, colección, deck, misiones, wallet, estadísticas y rango cargados desde el repositorio | `GameStateStore.cs`, `VexforgeRepository.cs` | Igualar estados offline/sync y evitar que errores técnicos lleguen al jugador |
| Colección y formación | Vista/pool/resolver de cartas; validación y guardado por RPC | `VexforgeCardView.cs`, `VexforgeVirtualizedCardGallery.cs`, `VexforgeRepository.cs` | Portar filtros, inspección, selección y feedback de Expo |
| Combate | Resolución por `vexforge_battle_resolve`; director reproduce eventos recibidos | `VexforgeRepository.cs`, `BattlePresentationDirector.cs`, `VexforgeBattlefieldStage.cs` | Portar semántica de eventos, replay y controles; nunca resolver reglas localmente |
| Pack | Director Unity muestra una secuencia visual; Expo llama al RPC y valida cartas recibidas | `VexforgeTier1PackRevealDirector.cs`, `mobile/src/services/repository.ts` | Integrar ceremonia interactiva con resultado y ownership autoritativos |
| Mundo/tutorial/boss | Nexus, hotspots, tutorial y manifestación estructural de boss presentes | `NexusPresentationRoot.cs`, `VexforgeWorldHotspot.cs`, `VexforgeTier1TutorialDirector.cs`, `VexforgeBattlefieldStage.cs` | Paridad de navegación/estado; verificar disponibilidad de identidad visual separable |
| Audio | Director Unity reproduce clips por eventos de batalla | `VexforgeTier1AudioDirector.cs` | Portar taxonomía completa de cues y categorías donde exista fuente |
| Haptics | Hay intención semántica Expo; no se encontró una abstracción Unity equivalente | `mobile/src/app/GameProvider.tsx` | Crear servicio Unity; Android puede implementarse después |
| Movimiento reducido | Preferencia persistida existe en Unity; Expo la aplica a sus animaciones | `PersistentRuntimeState.cs`, `mobile/src/render/**` | Conectar la preferencia a cámara, animación, VFX y revelado |
| Social/economía | Unity conserva contratos/repositorio y algunas superficies; Supabase sigue siendo autoridad | `VexforgeSocialRepository.cs`, `VexforgeSocialHub.cs`, `VexforgeRepository.cs` | Portar solo consumidores con contrato vigente; no mover reglas al cliente |
| Portal web / faucet | Portal congelado; faucet Kivora es producto separado | `src/**`, `public/**`, `faucet/**` | Sin cambios como parte de la migración |
| Verificación | No hay evidencia de Unity Editor, dispositivo ni build Android ejecutados aquí | `28_UNITY_EXPO_MIGRATION_GATES.md` | Completar gates de paridad y seguridad antes de retirar Expo |

La matriz completa de capacidades, rutas inspeccionadas y clasificación está en
`27_UNITY_EXPO_MIGRATION_INVENTORY.json`. Los estados de código no equivalen a
verificación de runtime.

## Orden de migración

Seguir los 12 hitos del paquete Unity suministrado por el usuario: reconciliar
autoridad e inventariar, portar capacidades por orden, verificar paridad y
seguridad de eliminación, eliminar `mobile/**` solo entonces, y finalizar la
documentación. Cada hito completo debe quedar en un commit y push a `main`
antes de iniciar el siguiente.
