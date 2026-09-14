# VE-MOB-14 — HONEST ACCOUNT IDENTITY

## Target

Meta Android: `mobile/app/meta.tsx`, panel `Cuenta y ajustes`.

## Bloque

La cuenta no debe presentar un nombre de jugador inventado cuando el registro vivo todavía no lo entrega.

## Implementación

- Un nombre confirmado se conserva exactamente después de normalizar espacios.
- Una fila de jugador existente sin nombre muestra `IDENTIDAD NO REPORTADA`.
- Cuando el registro de jugador todavía no está sincronizado, muestra `IDENTIDAD NO SINCRONIZADA`.
- Un correo ausente muestra `CORREO NO REPORTADO` y una fecha ausente muestra `FECHA DE REGISTRO NO REPORTADA`.
- El avatar conserva un marcador de estado explícito sin usar una identidad VEXFORGE inventada.
- Se mantienen Auth, `players`, ajustes, cierre de sesión, navegación, RPCs y web congelada.

## Verificación

- `node scripts/verify-mobile-meta.mjs`
- whitespace y conflictos en los archivos modificados
- lectura QA de solo lectura contra Supabase oficial para comprobar la presencia real de la identidad cuando la fuente la entrega

## Estado honesto

`IMPLEMENTED_UNVERIFIED`. No se ejecuta APK, workflow Android ni release hasta autorización explícita del operador.
