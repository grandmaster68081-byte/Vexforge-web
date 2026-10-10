# 17 — CURRENT BLOCK (UNITY CANÓNICO)

> Este documento registra el trabajo/verificación del runtime oficial `unity/**`.
> No representa el bloque activo de migración incremental del Bootstrap. Para
> este último, la autoridad es `replit.md` junto con
> `UNITY_BOOTSTRAP_WORKFLOW.md`.

## Bloque activo

La implementación Unity de los Hitos 01–07 sigue pendiente de verificación en
Unity Editor y dispositivo. El workflow manual de GitHub Actions fue restaurado
con 12 shards y un límite de 35.000 variantes por shard; no se ha ejecutado.
Las cuatro migraciones V7 están aplicadas en Supabase live desde el 2026-10-08.
No se ha compilado Unity, generado APK/AAB ni validado gameplay en dispositivo.

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
  presenta fichas del servidor; los RPC V7 de misión/jefe y su settlement
  canónico están instalados, pero todavía no se han probado desde Unity.
- No se encontraron assets Epic/Fab importados; esa ruta se retiró.
- Las tablas de sesión, eventos e idempotencia V7 tienen RLS activo, privilegios
  directos revocados y siguen vacías. La migración no creó sesiones ni alteró
  filas de jugadores/economía; las llamadas PvE sí usan los contratos live de
  energía y settlement existentes.

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

No generar APK/AAB ni afirmar QA de runtime/dispositivo sin evidencia. V7 ya está
instalado en Supabase live; toda futura modificación de datos o esquema live
requiere la autorización y verificación correspondientes.
