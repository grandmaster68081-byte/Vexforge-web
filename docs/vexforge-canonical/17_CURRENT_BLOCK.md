# 17 — CURRENT BLOCK (UNITY CANÓNICO)

## Bloque activo

Migración del cliente Android Expo heredado a Unity como runtime único. Los
Hitos 01, 02 y 03 están publicados en `main`. El Hito 03 añadió alta por email
con estado de confirmación, mantuvo inicio/restauración, añadió invalidación
remota al cierre de sesión y recarga el estado del jugador al restaurar una
sesión. Estos cambios están implementados en código, pero auth y almacenamiento
seguro siguen sin verificarse en Unity Editor o dispositivo. No se añadieron
recuperación de contraseña ni proveedores externos porque no forman parte del
flujo Expo/contrato live observado. El siguiente es el Hito 04: colección,
formación y tutorial.

## Estado del runtime

- Unity Foundation tiene bootstrap, auth/sesión, repositorio, estado, UI y
  presentación implementados en distinto grado; Editor y dispositivo no están
  verificados.
- Supabase live observada permite alta por email y requiere confirmación. Expo
  no contiene flujo de recuperación de contraseña y los proveedores externos
  están deshabilitados; no se añadieron rutas de autenticación no respaldadas.
- El estado central de Unity ahora expone estadísticas y rango. Si esas lecturas
  opcionales fallan, el error queda indicado sin bloquear la carga principal.
- El inventario de fuente y las decisiones por capacidad están en
  `27_UNITY_EXPO_MIGRATION_INVENTORY.json`.
- Replay, ceremonia de packs, UX completa, háptica, movimiento reducido y
  varias superficies requieren port/paridad.
- No se encontraron assets Epic/Fab importados; esa ruta se retiró.
- Supabase live no se modifica como parte del cliente. No se escribieron datos
  de Supabase.

## Siguiente unidad

1. Los cambios fuente de los Hitos 01, 02 y 03 ya están comprometidos y
   publicados en `main`; auth/sesión conserva su gate de verificación de runtime
   abierto y no se considera paridad verificada.
2. Antes de iniciar el Hito 04, hacer `git fetch --prune origin` y confirmar
   `main`, árbol limpio y `HEAD == origin/main`.
3. Completar filtros, ownership y detalle de colección; edición de formación,
   validación y guardado autoritativos; y tutorial guiado sobre sistemas reales,
   sin crear resultados o recompensas locales.
4. Mantener `mobile/**` hasta superar todas las gates de paridad y eliminación.

No generar APK/AAB ni modificar datos live durante esta migración.
