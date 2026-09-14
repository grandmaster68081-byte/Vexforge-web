# VE-MOB-7-BATTLE — HONEST RANK SIGNALS

## Estado

`IMPLEMENTED_UNVERIFIED`

## Alcance

La Arena Android conserva la diferencia entre métricas PvP confirmadas y señales que el servidor no publicó:

- récord parcial mantiene victoria o derrota ausente como estado explícito;
- rango y MMR ausentes no se presentan como un rango provisional;
- escudos ausentes no se convierten en un guion;
- el orden de oponentes sigue sin calcular diferencias con MMR desconocido.

No se modifican el RPC de resolución, matchmaking, settlement, Supabase, RLS, Auth, economía, navegación ni la superficie web.

## Gates

- `node scripts/verify-mobile-battle.mjs`
- `git diff --check`
- no compilar APK, no iniciar workflow Android y no publicar release sin autorización explícita del operador.