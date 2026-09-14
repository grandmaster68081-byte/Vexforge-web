# VE-MOB-11 — Economy: readable status signals

## Alcance

Este microbloque mejora únicamente la lectura de estados ya entregados por
Supabase en `mobile/app/economy.tsx`.

## Regla aplicada

Los estados canónicos conocidos de depósitos, retiros y referidos se presentan
con etiquetas legibles: `pending`, `pending_review`, `approved`, `completed`,
`fulfilled`, `rejected`, `failed` y `cancelled`. Un estado que no esté en el
contrato conocido no se descarta ni se convierte en otra cosa: se conserva como
`ESTADO: ...`; la ausencia queda como `ESTADO NO REPORTADO`.

La función sólo traduce presentación. No modifica filtros, contadores,
permisos, RPCs, saldos, liquidación ni la autoridad del servidor.

## Evidencia

- `node scripts/verify-mobile-economy.mjs`
- `git diff --check`

No se inicia APK, workflow Android ni release en este bloque.