# VE-MOB-11 — ECONOMÍA

**Estado:** DERIVED_SCOPE / READY_FOR_IMPLEMENTATION  
**Fecha:** 2026-08-28  
**Fase:** P2 — Progresión y economía  
**Fuente de selección:** `docs/VE-MOB-0-PORT-INVENTORY.md`

## Propósito

Portar a Android las superficies económicas que ya existen en la web sin duplicar autoridad: cartera y ledger, mercado, depósitos, retiros y referidos. Android sólo presenta datos reales y solicita operaciones mediante los RPCs oficiales; Supabase conserva la validación, los límites, los saldos, las comisiones, la liquidación y la seguridad.

Este alcance es una decisión **DERIVADA** porque no existía un documento canónico específico de la unidad. Se deriva del inventario Android, las rutas web reales, los repositorios web de cada dominio y el catálogo vivo de Supabase. No convierte decisiones derivadas en hechos canónicos ni cambia la economía existente.

## Fuentes reconciliadas

- Protocolo maestro activo `vexforge_master_protocol_v2` en Supabase.
- `docs/VE-MOB-0-PORT-INVENTORY.md` y `CONTINUITY.md` de GitHub `main`.
- Rutas web: `EconomyRoute`, `MarketRoute`, `DepositRoute`, `WithdrawalRoute`, `ReferralRoute`.
- Repositorios web: `src/domains/economy/repository.ts`, `market/repository.ts`, `deposit/repository.ts` y `withdrawal/repository.ts`.
- Supabase vivo: tablas/views `player_wallet`, `economy_ledger`, `market_listings`, `player_cards`, `cards`, `vexforge_project_deposits`, `vexforge_withdrawal_requests_official`, `vexforge_referrals`, `players`, `vexforge_treasury` y contratos relacionados.

## Superficies Android

1. **Economía / cartera:** VEX In-game, VEX Tradeable, reservas, ledger paginado y estadísticas personales mediante `vexforge_get_my_economy_stats`.
2. **Mercado:** listados activos y propios; crear, comprar y cancelar sólo mediante `create_listing`, `buy_listing` y `cancel_listing`.
3. **Depósitos:** wallets de tesorería activas, tasa oficial, envío de USDT/TX hash/dirección y consulta mediante `vexforge_submit_deposit` y `vexforge_get_my_deposits`.
4. **Retiros:** saldo tradeable disponible/bloqueado, cálculo sólo informativo de 100 VEX = 1 USDT y comisión oficial del flujo web, historial y solicitud mediante `vexforge_request_withdrawal`.
5. **Referidos:** código del jugador, conteo de estados, historial y contenido de cómo funciona desde `players` y `vexforge_referrals`. La acreditación no se calcula ni se concede en Android.

## Contratos de operación

- Todas las lecturas y RPCs se ejecutan con la sesión Supabase del jugador y respetan la misma RLS de la web.
- No se permiten INSERT/UPDATE directos sobre cartera, ledger, listados, depósitos o retiros.
- No se crean saldos locales, recompensas, comisiones, tasas ni resultados de liquidación.
- Si una tabla, RPC o wallet oficial no está disponible, se muestra un estado explícito de error/vacío; no se usa mock ni placeholder genérico.
- Los identificadores de referencia para operaciones deben ser idempotentes y no revelar credenciales ni datos sensibles.

## Criterios de aceptación

- La app tiene una ruta Android de economía accesible desde Home y Perfil, con estados de carga, vacío, error, sesión requerida y refresh.
- Cartera y ledger reflejan datos reales de Supabase; los números no se recalculan como autoridad en el cliente.
- Mercado permite consultar y ejecutar las tres acciones RPC sólo para cartas/listados autorizados por el backend.
- Depósito muestra únicamente wallets activas devueltas por `vexforge_treasury` y confirma el resultado real del RPC.
- Retiro bloquea visualmente montos por debajo del mínimo del contrato web, pero el backend sigue siendo la autoridad final; muestra pendientes, comisión y resultado real.
- Referidos muestra estados y recompensas registradas; no fabrica ni adelanta VEX.
- Todas las superficies usan iconografía propia disponible en la app, son legibles en pantalla pequeña, soportan reduced-motion y no usan emojis ni datos inventados.
- La unidad se documenta como `IMPLEMENTED_UNVERIFIED` sólo después de typecheck, guards específicos, verificación web/móvil y publicación del workflow APK; la QA humana del operador permanece separada.

## Decisiones derivadas y reversibilidad

- **Decisión:** una superficie Android unificada con cámaras/segmentos para las cinco áreas, evitando cinco navegaciones duplicadas.  
  **Por qué:** el inventario las define como una unidad de economía y la app ya concentra Packs/Shop/Inventory en `store.tsx`.  
  **Reversión:** separar las cámaras en rutas independientes sin cambiar contratos ni datos.
- **Decisión:** el port puede mostrar fórmulas informativas de retiro que ya usa la web, pero nunca acreditar el neto localmente.  
  **Por qué:** conserva claridad sin trasladar autoridad económica al cliente.  
  **Reversión:** ocultar el cálculo si el contrato vivo cambia.
- **Decisión:** referidos se limita a lectura en esta unidad.  
  **Por qué:** el flujo de alta y acreditación pertenece a Auth/RPC y no debe duplicarse desde Android.  
  **Reversión:** ampliar sólo cuando exista un contrato móvil explícito y verificable.

## Siguiente acción

Implementar esta unidad sobre `mobile/`, añadir los consumidores a `mobile/lib/supabase.ts`, registrar la navegación sin romper Tabs, ejecutar las verificaciones proporcionales y publicar por el workflow Android oficial. No modificar tablas, RLS, RPCs, balances, economía ni releases manualmente.
