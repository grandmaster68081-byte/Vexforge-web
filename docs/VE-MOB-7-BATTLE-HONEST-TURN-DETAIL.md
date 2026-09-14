# VE-MOB-7-BATTLE — HONEST TURN DETAIL

## Estado

`IMPLEMENTED_UNVERIFIED`

## Alcance

La pantalla Android de Arena presenta cada turno del replay a partir del contrato recibido del servidor. Este bloque corrige únicamente la lectura del detalle de turno:

- identidad, facción y rareza ausentes conservan un estado explícito;
- HP actual y máximo ausentes se distinguen de valores numéricos confirmados;
- daño ausente no se convierte en `0`;
- daño confirmado igual a `0` permanece visible;
- las unidades activas ausentes conservan `NO REPORTADO`;
- eventos desconocidos conservan su código recibido en vez de convertirse en un efecto inventado.

No se modifican el RPC de resolución, el settlement, la formación autoritativa, Supabase, RLS, Auth, economía, navegación ni la superficie web.

## Gates

- `node scripts/verify-mobile-battle.mjs`
- `git diff --check`
- no compilar APK, no iniciar workflow Android y no publicar release sin autorización explícita del operador.