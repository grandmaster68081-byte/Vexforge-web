# VE-MOB-10 — PACKS / SHOP

## Alcance

La unidad porta a Android las superficies conectadas de packs, tienda, inventario, fusión y evolución. Se entrega como una ruta autenticada `store` con navegación táctil por cámaras, sin duplicar las reglas autoritativas del servidor.

## Contratos canónicos

- `vexforge_pack_catalog`, `player_wallet`, `vexforge_pack_orders`
- `vexforge_buy_pack_with_vex`, `vexforge_open_pack`
- `vexforge_shop_catalog`, `player_active_boosts`, `player_consumables`
- `vexforge_create_shop_order`, `vexforge_submit_shop_order_payment`, `vexforge_get_my_shop_orders`
- `player_cards`, `cards`, `vexforge_player_shards`
- `vexforge_fusion_policy`, `vexforge_apply_fusion`
- `card_evolution_paths`, `vexforge_evolve_card`

Android sólo lee catálogos/estado bajo la sesión autenticada y presenta las respuestas. Compras, apertura, pago, fusión, evolución, consumo de VEX, shards, cartas y activación de ítems permanecen en las RPCs y políticas de Supabase.

## Comportamiento entregado

- Packs: catálogo oficial, balance `VEX tradeable`, compra real, pedido pendiente, apertura real y revelación de cartas recibidas.
- Shop: catálogo real, boosts/consumibles activos, historial de órdenes, creación de orden, tesorería/cadena/token devueltos por el servidor y registro real de TX hash + wallet pagadora.
- Inventario: cartas de `GameContext` alimentado por `player_cards`, búsqueda por nombre/código, cantidad, rareza, imagen oficial y estados de carga/vacío.
- Fusión: fuentes elegibles, shards, política por rareza, candidatos de destino y RPC atómica.
- Evolución: caminos con costes/requisitos del catálogo y RPC autoritativa.
- La ruta tiene safe area, pull-to-refresh, `accessibilityRole`, estados de error/carga/vacío y no usa emojis, mocks ni datos de demostración.

## Evidencia técnica

- `cd mobile && npm run typecheck` — OK.
- `node scripts/verify-mobile-store.mjs` — guard específica de la unidad.
- Estado de la unidad: `IMPLEMENTED_UNVERIFIED`.
- La QA normal en dispositivo/emulador sigue siendo post-entrega y no se sustituye por typecheck o compilación.