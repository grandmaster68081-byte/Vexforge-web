# 17 — CURRENT BLOCK (UNITY CANÓNICO)

## Bloque activo

Migración del cliente Android Expo heredado a Unity como runtime único. Los
Hitos 01 y 02 ya están publicados. El Hito 03 añadió alta por email con estado
de confirmación, mantuvo inicio/restauración y añadió invalidación remota al
cierre de sesión. Su comportamiento sigue sin verificarse en Unity Editor o
dispositivo. El siguiente es el Hito 04: colección, formación y tutorial.

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

1. Los Hitos 01 y 02 están en `main`; cerrar el Hito 03 en `main` mediante
   commit y push antes de iniciar otro hito.
2. Antes del Hito 04, hacer `git fetch --prune origin` y confirmar
   `main`, árbol limpio y `HEAD == origin/main`.
3. Completar colección, inspección de cartas, formación, validación/guardado y
   el recorrido de tutorial sobre los contratos existentes.
4. Mantener `mobile/**` hasta superar todas las gates de paridad y eliminación.

No generar APK/AAB ni modificar datos live durante esta migración.
