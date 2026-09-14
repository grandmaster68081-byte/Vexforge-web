# VE-MOB-7-BATTLE — HONEST RESULT SIGNALS

## Estado

`IMPLEMENTED_UNVERIFIED`

## Alcance

El resumen Android de un combate sólo presenta señales que llegaron desde la resolución autoritativa:

- identidad del jugador y del rival ausentes se distinguen de nombres conocidos;
- un `match_id` ausente no se convierte en un guion;
- turnos ausentes no se convierten en cero;
- un cambio de MMR ausente se distingue de `0`, y la práctica contra IA conserva el estado `SIN MMR`;
- el turno mostrado conserva su número recibido sin derivarlo del índice del replay.

No se modifican el RPC de resolución, el settlement, el event log, Supabase, RLS, Auth, economía, navegación ni la superficie web.

## Gates

- `node scripts/verify-mobile-battle.mjs`
- `git diff --check`
- no compilar APK, no iniciar workflow Android y no publicar release sin autorización explícita del operador.