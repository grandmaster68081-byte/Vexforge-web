# 17 — CURRENT BLOCK (UNITY CANÓNICO)

## Bloque activo

La implementación Unity de los Hitos 01–07 sigue pendiente de verificación en
Unity Editor y dispositivo. El workflow manual de GitHub Actions fue restaurado
con 12 shards y un límite de 35.000 variantes por shard; no se ha ejecutado.
Esta limpieza no valida runtime, no genera APK/AAB y no modifica Supabase live.

## Estado del runtime

- Unity Foundation tiene bootstrap, auth/sesión, repositorio, estado, UI y
  presentación implementados en distinto grado; Editor y dispositivo no están
  verificados.
- Supabase live observada permite alta por email y requiere confirmación. La
  inspección previa no encontró recuperación de contraseña y los
  proveedores externos estaban deshabilitados; no se añadieron rutas de
  autenticación no respaldadas.
- El estado central de Unity ahora expone estadísticas y rango. Si esas lecturas
  opcionales fallan, el error queda indicado sin bloquear la carga principal.
- Replay, ceremonia interactiva de packs y atlas de jefes tienen código Unity;
  su comportamiento de runtime no está verificado.
- Hito 07 añade cartera, mercado, registro de depósitos, retiros, estadísticas
  y rango al perfil, además de manejo seguro de fallos sociales; no se añadieron
  eventos de telemetría.
- Unity no calcula propiedad, resultados de combate ni recompensas. El atlas
  presenta fichas del servidor; un encuentro de jefe permanece no disponible
  hasta verificar un contrato autorizado.
- No se encontraron assets Epic/Fab importados; esa ruta se retiró.
- Supabase live no se modifica como parte del cliente. No se escribieron datos
  de Supabase.

## Siguiente unidad

1. Validar Hitos 04–07 en Unity Editor/dispositivo: estados autenticado,
   cargando, vacío y error; formación; replay y omisión; packs y atlas; economía
   con resultados aceptados/rechazados; perfil y social.
2. Mantener inaccesibles las operaciones de encuentro o recompensa que no se
   puedan confirmar como server-authoritative.
3. Antes de iniciar otra unidad de código, hacer `git fetch --prune origin` y
   confirmar `main`, árbol limpio y `HEAD == origin/main`.
4. Mantener abiertas las verificaciones de seguridad, Editor y dispositivo
   hasta que exista evidencia.

No generar APK/AAB ni modificar datos live durante esta migración.
