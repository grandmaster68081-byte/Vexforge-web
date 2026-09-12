# VE-MOB-14 — META

## Alcance

Portar a Android la superficie Meta agregadora de VEXFORGE:

- **Account / Settings:** identidad del jugador, sesión, notificaciones, Telegram, idioma y modo de interfaz.
- **Cosmetics:** catálogo visible, cosméticos propios, estado equipado y equipar/retirar mediante los contratos existentes.
- **Relics:** reliquias propias, efectos proporcionados por Supabase, reclamar reliquias iniciales y equipar/retirar mediante RPCs.
- **NFT:** contrato visible, wallet Polygon vinculada y cola de minteo. La app acepta una dirección `0x` válida y no simula conexión ni transacción de wallet.
- **Forge Ads:** estadísticas reales, límite diario de cinco anuncios, reproducción verificable de 30 segundos y registro de `+20 VEX` mediante la tabla existente.
- **Assets:** estado administrativo honesto; la administración permanece en el panel oficial y no se expone un catálogo inventado dentro de Android.

La ruta Android es una superficie no-tab accesible desde Perfil. Los estados de sesión, carga, error, vacío, refresh y feedback de acciones son explícitos. Los controles tienen roles y etiquetas de accesibilidad.

## Contratos vivos

- Settings: `player_settings` con la política `player_own_settings`; lectura y `UPDATE` limitado al `player_id` propio.
- Cosmetics: `cosmetics`, `player_cosmetics`, `equipped_cosmetics` y RPC `equip_cosmetic`.
- Relics: `relics`, `player_relics` y RPCs `grant_starter_relics`, `equip_relic`, `unequip_relic`.
- NFT: `vexforge_nft_contracts`, `vexforge_nft_wallet_links` y `vexforge_nft_mint_queue`; vinculación con `chain_id=137`.
- Forge Ads: `vexforge_ad_views`, misma cuota y recompensa que `ForgeAdsRoute`.
- Assets: manifiesto/Storage oficial y guardia administrativa existente; no se agregan imágenes placeholder.

La pantalla no calcula efectos, economía, propiedad, minteo, cuotas ni resultados de combate en el cliente. Las escrituras de negocio se delegan a RPCs o a las mismas tablas con RLS que consume la web.

## Criterios de aceptación

1. `cd mobile && npm run typecheck` pasa sin errores.
2. El workflow oficial `Build VEXFORGE Android APK` termina en `success` y verifica `assets/index.android.bundle`.
3. El APK/release correlativo existe en GitHub.
4. El estado permanece `IMPLEMENTED_UNVERIFIED` hasta QA manual del operador en dispositivo o emulador. No declarar `OPERATIONAL`, `PASS` ni `TIER1_READY` sólo por compilar.

## Estado

Implementación: `IMPLEMENTED_UNVERIFIED`.