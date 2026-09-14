# VE-MOB-9 — ESTADOS PENDIENTES DE HISTORIAL Y RANKING

## Alcance

Los paneles sociales del Perfil Android ya no confunden una instantánea aún no
sincronizada con una lista vacía. Mientras falta la respuesta viva, muestran:

- `HISTORIAL EN ESPERA · SINCRONIZACIÓN NO CONFIRMADA`;
- `RANKING EN ESPERA · SINCRONIZACIÓN NO CONFIRMADA`.

Cuando Supabase confirma la instantánea, se conserva el estado vacío real o se
renderizan los combates y posiciones recibidos.

## Límites

- No se fabrican combates, posiciones, MMR, nombres ni resultados.
- No se modifican RPCs, Auth, economía, progreso ni la web congelada.
- El estado de error existente continúa visible fuera del panel.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda valida las ramas explícitas; la revisión
visual queda pendiente de una APK autorizada.