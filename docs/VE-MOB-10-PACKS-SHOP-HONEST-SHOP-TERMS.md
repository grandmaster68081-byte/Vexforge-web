# VE-MOB-10 PACKS / SHOP — HONEST SHOP TERMS

## Alcance

Delta Android acotado sobre `mobile/app/store.tsx` para que precios y términos
de pago dependan de los valores vivos entregados por el catálogo y la orden.

## Criterios

- Un precio USDT válido se muestra con dos decimales.
- Un precio ausente o inválido muestra `PRECIO NO REPORTADO` y no permite crear
  una orden desde esa tarjeta.
- La cadena, token, estándar y tesorería de una orden no reciben valores
  predeterminados inventados; cada dato ausente queda explícito.
- El placeholder de TX usa el token recibido, o comunica que el token no fue
  reportado.

## Autoridad preservada

No se modifican `vexforge_create_shop_order`,
`vexforge_submit_shop_order_payment`, catálogo, tesorería, RLS, economía,
Auth, assets ni la web congelada.

## Gates

- `node scripts/verify-mobile-store.mjs`
- `git diff --check`

Estado esperado: `IMPLEMENTED_UNVERIFIED`; la QA visual/táctil en APK continúa
pendiente de una compilación autorizada por el operador.