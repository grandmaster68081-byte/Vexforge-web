# 17 — CURRENT BLOCK (EXPO CANÓNICO)

## Bloque activo

Continuidad del runtime Expo/React Native en `mobile/**`. La fuente del próximo
hito es `mobile/docs/SESSION_CHECKPOINT.md`; no existe un bloque Unity/Fab
activo.

## Estado del runtime

- Expo SDK `54.0.37`; React Native `0.81.5`; paquete `1.10.0`.
- Se mantienen navegación, consumidores Supabase, presentación de batalla,
  replay y laboratorio táctico existentes.
- El runtime 2.5D unificado y varias pruebas de aceptación siguen pendientes;
  consultar `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`.
- Unity es legado preservado. No iniciar sus builds ni workflows para este
  bloque.
- No se encontraron assets Epic/Fab importados; esa ruta se retiró.
- No se escribieron datos de Supabase. Cualquier cambio de backend requiere
  verificar el contrato live y autorización específica.

## Siguiente unidad

1. Ejecutar el verificador móvil y la auditoría de dependencias/compatibilidad.
2. Implementar el núcleo mínimo de runtime dentro de `mobile/**`.
3. Preservar la frontera de autoridad de Supabase.
4. Actualizar el checkpoint, verificar el cambio, y completar el hito en
   `main`.

No generar APK/AAB, iniciar builds EAS/producción ni modificar datos live sin
autorización explícita.
