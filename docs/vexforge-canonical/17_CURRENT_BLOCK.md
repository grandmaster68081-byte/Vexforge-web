# 17 — CURRENT BLOCK (UNITY CANÓNICO)

## Bloque activo

Migración del cliente Android Expo heredado a Unity como runtime único. Los
Hitos 01, 02 y 03 están publicados en `main`. El Hito 03 añadió alta por email
con estado de confirmación, mantuvo inicio/restauración, añadió invalidación
remota al cierre de sesión y recarga el estado del jugador al restaurar una
sesión. El Hito 04 implementa búsqueda y filtros de colección por posesión,
detalle de carta, edición de borrador de formación y un acceso para repetir el
tutorial. La validación y el guardado del borrador llaman los RPC existentes y
recargan el estado desde Supabase. Estos cambios de fuente todavía no están
verificados en Unity Editor o dispositivo. Auth y almacenamiento seguro de los
hitos anteriores tampoco están verificados. No se añadieron recuperación de
contraseña ni proveedores externos porque no forman parte del flujo
Expo/contrato live observado. El siguiente trabajo es validar estos flujos en
Unity sin cerrar las gates hasta contar con evidencia de runtime.

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

1. Terminar el Hito 04 como cambio acotado en `main`; conservar abiertas las
   gates de colección/formación, tutorial, Unity Editor y dispositivo hasta
   verificar los flujos en runtime.
2. La siguiente validación debe usar el Unity Editor declarado por el proyecto
   y comprobar estados autenticado, cargando, vacío y error; verificar
   edición/validación/guardado contra los RPC existentes y repetir el tutorial
   sin resultados o recompensas locales.
3. Antes de iniciar otra unidad de código, hacer `git fetch --prune origin` y
   confirmar `main`, árbol limpio y `HEAD == origin/main`.
4. Mantener `mobile/**` hasta superar todas las gates de paridad y eliminación.

No generar APK/AAB ni modificar datos live durante esta migración.
