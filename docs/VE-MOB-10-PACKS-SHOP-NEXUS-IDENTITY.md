# VE-MOB-10 — PACKS / SHOP NEXUS IDENTITY

## Alcance

Este bloque conecta las cámaras de Packs, Tienda, Fusión, Evolución e Inventario
con el Nexus de la Forja sin alterar las reglas de compra, pago, fusión,
evolución o inventario.

## Delta visual

- La ruta usa `DomainHeader` con `domain="foja"` y declara la cámara activa a
  partir del modo real seleccionado por el usuario.
- La señal `CATÁLOGO VIVO` acompaña el modo activo y no afirma disponibilidad,
  precio, balance ni recompensa que no provenga de las fuentes existentes.
- Las acciones de catálogo y el rail de cámaras responden con profundidad
  táctil; volver conserva la ruta actual.

## Límites

- Se conservan los catálogos vivos, `player_wallet`, inventario y todas las RPCs
  autoritativas de compra, apertura, pago, fusión y evolución.
- No se añaden datos, assets, precios, recompensas, endpoints ni dependencias.
- Carga, error, vacío, pedido pendiente, pago pendiente y resultados siguen
  siendo estados explícitos.
- El bloque queda en `IMPLEMENTED_UNVERIFIED` hasta QA visual/táctil en APK.