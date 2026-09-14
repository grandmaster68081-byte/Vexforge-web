# VE-MOB-11 — ECONOMY / HONEST DATE AND HASH SIGNALS

## Alcance

La superficie Android de Economía diferencia una fecha ausente de una fecha
presente pero ilegible, y comunica explícitamente cuando un depósito no trae
hash de transacción.

## Regla de integridad

- `FECHA NO REPORTADA` significa que el contrato no entregó una fecha utilizable.
- `FECHA NO VÁLIDA` significa que llegó un valor que no puede interpretarse.
- `HASH NO REPORTADO` significa que el depósito no publicó un hash utilizable.
- Las fechas y hashes válidos se conservan; el cliente no crea ni corrige
  valores.
- No se cambian saldos, fórmulas, RPCs, permisos, liquidación, consultas ni
  mutaciones.

## Verificación

- `node scripts/verify-mobile-economy.mjs`
- `git diff --check`

Estado: `IMPLEMENTED_UNVERIFIED`. La inspección visual y táctil en dispositivo
Android sigue reservada para una APK autorizada por el operador.