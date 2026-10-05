# 17 — CURRENT BLOCK (UNITY CANÓNICO)

## Bloque activo

Migración del cliente Android Expo heredado a Unity como runtime único. Los
Hitos 01–03 están publicados en `main`. Los Hitos 04–06 tienen implementación
de fuente para colección/formación/tutorial, batalla/replay y paquetes/atlas.
El Hito 06 usa los RPC existentes para comprar y abrir paquetes; el atlas
consulta jefes activos y no inicia encuentros ni genera recompensas. Ninguno
de esos cambios de fuente equivale a validación de runtime. Auth, sesión,
colección/formación, combate/replay, packs, audio/háptica y atlas siguen
pendientes de verificación en Unity Editor/dispositivo. No se añadieron
recuperación de contraseña ni proveedores externos porque no forman parte del
flujo Expo/contrato live observado.

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
- Replay, ceremonia interactiva de packs y atlas de jefes tienen código Unity;
  su comportamiento de runtime no está verificado.
- Unity no calcula propiedad, resultados de combate ni recompensas. El atlas
  presenta fichas del servidor; un encuentro de jefe permanece no disponible
  hasta verificar un contrato autorizado.
- No se encontraron assets Epic/Fab importados; esa ruta se retiró.
- Supabase live no se modifica como parte del cliente. No se escribieron datos
  de Supabase.

## Siguiente unidad

1. Validar Hitos 04–06 en Unity Editor/dispositivo: estados autenticado,
   cargando, vacío y error; edición/validación/guardado de formación; replay y
   omisión; compra/apertura/reintento de paquetes; navegación del atlas.
2. Continuar con Hito 07 solo sobre acciones con contrato vigente; mantener
   inaccesibles las operaciones de encuentro o recompensa que no se puedan
   confirmar como server-authoritative.
3. Antes de iniciar otra unidad de código, hacer `git fetch --prune origin` y
   confirmar `main`, árbol limpio y `HEAD == origin/main`.
4. Mantener `mobile/**` y las gates abiertas hasta superar verificación de
   paridad, seguridad, Editor/dispositivo y eliminación.

No generar APK/AAB ni modificar datos live durante esta migración.
