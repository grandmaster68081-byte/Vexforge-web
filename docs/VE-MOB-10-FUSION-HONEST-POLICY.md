# VE-MOB-10 FUSION — HONEST POLICY SIGNALS

## Alcance

Delta Android acotado sobre la cámara de Fusión para conservar la diferencia
entre una política autoritativa, una política incompleta y la ausencia de una
política para la rareza seleccionada.

## Criterios

- Costes ausentes o inválidos no se convierten en `0`.
- Resultado ausente no se convierte en una cadena vacía.
- La ausencia de una fila de política no se presenta como carga infinita.
- La cantidad de shards propia ausente no se convierte en `0`.
- La mutación de fusión queda deshabilitada si la política no está completa.
- El flujo sigue usando `vexforge_fusion_policy` y `vexforge_apply_fusion`;
  este delta no crea reglas ni valida economía en el cliente.

## Autoridad preservada

Supabase vivo confirmó políticas para Common, Uncommon, Rare, Epic y Legendary,
y ninguna política para Mythic en la consulta realizada. No se modificaron RPCs,
tablas, RLS, Auth, inventario, economía, assets ni la web congelada.

## Gates

- `node scripts/verify-mobile-store.mjs`
- `git diff --check`

Estado esperado: `IMPLEMENTED_UNVERIFIED`; la QA visual/táctil en APK continúa
pendiente de una compilación autorizada por el operador.