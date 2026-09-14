# VE-MOB-9 — ESTADOS PENDIENTES DE LOGROS Y TÍTULOS

## Alcance

Los paneles `LOGROS` y `TÍTULOS` del Perfil Android ya no muestran un estado
vacío durante la carga. Mientras la respuesta autoritativa no termina,
comunican explícitamente:

- `LOGROS EN ESPERA · SINCRONIZACIÓN NO CONFIRMADA`;
- `TÍTULOS EN ESPERA · SINCRONIZACIÓN NO CONFIRMADA`.

El mensaje `Todavía no hay registros disponibles` queda reservado para una
respuesta cargada que confirme una lista vacía.

## Límites

- No se inventan logros, títulos, puntos ni descripciones.
- No se modifican RPCs, Auth, economía, navegación ni la web congelada.
- El error de sincronización existente continúa siendo visible en el Perfil.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda valida el estado de carga; la revisión
visual queda pendiente de una APK autorizada.