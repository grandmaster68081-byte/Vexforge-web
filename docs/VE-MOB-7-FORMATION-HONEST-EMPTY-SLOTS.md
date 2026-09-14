# VE-MOB-7-FORMATION — HONEST EMPTY SLOT SIGNALS

## Estado

`IMPLEMENTED_UNVERIFIED`

## Alcance

La previsualización Android de ForgeFormation conserva la diferencia entre una posición activa sin carta y una reserva sin cartas:

- las posiciones de Vanguardia, Campeón y Centinela ausentes muestran `POSICIÓN VACÍA`;
- una reserva sin cartas muestra `RESERVA VACÍA`;
- no se inventan cartas, nombres, estadísticas ni efectos;
- la formación continúa siendo sólo de lectura y deriva del mazo real recibido.

No se modifican la derivación autoritativa, Battle Run, settlement, Supabase, RLS, Auth, economía, navegación ni la superficie web.

## Gates

- `node scripts/verify-mobile-battle.mjs`
- `git diff --check`
- no compilar APK, no iniciar workflow Android y no publicar release sin autorización explícita del operador.