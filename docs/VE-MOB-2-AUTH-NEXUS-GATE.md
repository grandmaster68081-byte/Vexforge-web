# VE-MOB-2 — AUTH NEXUS GATE

## Alcance

Este bloque refuerza la puerta de acceso de Android sin modificar el contrato de
Supabase Auth, la sesión, la provisión `ensure_player_row`, las rutas ni la web.

## Delta visual

- La pantalla de acceso comunica su estado vivo mediante un rail propio de la
  puerta del Nexus: espera, autenticación, confirmación pendiente o enlace
  interrumpido.
- El estado se deriva únicamente de `authLoading`, el error normalizado y la
  notificación ya existentes. No se inventa identidad, progreso ni estado de
  cuenta.
- Las acciones de acceso, recuperación, modo de formulario y recordar sesión
  tienen una compresión táctil breve para hacer explícito el punto de decisión.

## Límites

- No se añaden assets, dependencias, endpoints, RPCs ni datos.
- No se usa un placeholder visual como sustituto del estado real.
- Los estados de carga, error y confirmación siguen siendo funcionales y visibles.
- `reduced-motion` y el flujo de Auth existente permanecen intactos.

## Evidencia

- `scripts/verify-mobile-auth.mjs` cubre el rail de estado y la profundidad de
  las acciones además de los gates existentes.
- El bloque queda en `IMPLEMENTED_UNVERIFIED` hasta que el operador autorice una
  APK y haga QA visual/táctil en dispositivo.