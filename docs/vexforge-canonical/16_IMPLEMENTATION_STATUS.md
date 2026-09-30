# 16 — IMPLEMENTATION STATUS (EXPO CANÓNICO)

> Actualizado para reflejar la dirección vigente. Los registros Unity que
> permanecen en `CONTINUITY.md` y en la documentación histórica no son estado
> actual ni instrucción para trabajo nuevo.

## Runtime y evidencia

| Área | Estado observado | Evidencia | Pendiente |
|---|---|---|---|
| Runtime móvil | Expo / React Native activo, versión `1.10.0` | `mobile/package.json`, `mobile/app.json` | Continuar sobre las rutas existentes |
| Plataforma | Expo SDK `54.0.37`, React Native `0.81.5`, React `19.1.0` | manifiestos de `mobile/` | Mantener compatibilidad del SDK |
| Navegación | Expo Router con tabs y rutas de juego | `mobile/app/**` | Integración de runtime de juego |
| Presentación de batalla | Director, replay, canvas, efectos y laboratorio táctico existentes | `mobile/src/engine/**`, `mobile/src/render/**` | Completar la superficie 2.5D y sus pruebas |
| Autoridad de juego | Supabase/repositorio como límite para auth, combate y economía | `mobile/src/services/**` | Verificar contrato live antes de cambios de backend |
| Runtime unificado `mobile/game/**` | No implementado | `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md` | Crear el núcleo mínimo compatible |
| Verificación | Verificador, typecheck y Expo Doctor disponibles | scripts de `mobile/package.json` | Ejecutar al iniciar el siguiente hito |
| APK/AAB, EAS y QA física | No ejecutados en el checkpoint | `mobile/docs/SESSION_CHECKPOINT.md` | Requieren gate/autorización y evidencia |
| Unity | Legado preservado, no canónico | `unity/LEGACY_STATUS.md` | No reactivar en trabajo Expo |
| Epic/Fab | Ruta de adquisición/importación retirada; no se encontraron payloads | auditoría del repositorio | No aplica |

## Siguiente hito registrado

Consultar `mobile/docs/SESSION_CHECKPOINT.md`. La siguiente unidad es ejecutar
las verificaciones móviles y auditoría de compatibilidad, y después crear el
núcleo de runtime mínimo sin alterar la frontera de autoridad de Supabase.
