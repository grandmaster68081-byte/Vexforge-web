# VE-MOB-13 — SOCIAL / HONEST DATE SIGNALS

## Alcance

La superficie Social conserva la diferencia entre una fecha que no llegó desde
Supabase y una fecha que llegó, pero no se puede interpretar como fecha válida.
Esto aplica a solicitudes, desafíos, clanes, guerras registradas e historial
PvP.

## Regla de integridad

- `FECHA NO REPORTADA` significa que la fuente no entregó una señal utilizable.
- `FECHA NO VÁLIDA` significa que llegó un valor, pero su representación no es
  interpretable por el cliente.
- Las fechas válidas mantienen el formato localizado existente.
- No se añade una fecha local, no se corrige el valor recibido y no se cambia
  ningún contrato, RPC, RLS, consulta o mutación.

## Verificación

- `node scripts/verify-mobile-social.mjs`
- `git diff --check`

Estado: `IMPLEMENTED_UNVERIFIED`. La inspección visual y táctil en dispositivo
Android sigue reservada para una APK autorizada por el operador.