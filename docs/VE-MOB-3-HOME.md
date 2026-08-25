# VE-MOB-3 — HOME

## Objetivo

Completar en la aplicación Android la superficie Home de VEXFORGE como puerta de
entrada al Nexus: identidad visual, datos globales vivos, estado del forjador,
evento/temporada, carta destacada, actividad pública y acceso rápido a la arena.

## Fuente canónica

- Código de `main` y Home web (`src/routes/HomeRoute.tsx`,
  `src/domains/home/`).
- Supabase oficial y sus RPCs existentes (`get_home_stats`,
  `get_public_player_names`).
- Assets públicos del manifiesto oficial y Storage (`lobby/main.jpg` y `cards/*`).
- `docs/VE-MOB-0-PORT-INVENTORY.md` y `VEXFORGE_PROTOCOL_V2.md`.

## Cambios

- `mobile/app/(tabs)/index.tsx` completa el Home móvil con:
  - estadísticas globales de cartas, forjadores, batallas y packs abiertos;
  - estado de conexión y sincronización con Supabase;
  - acceso funcional a colección y batalla;
  - batalla rápida contra IA enlazada al tablero existente;
  - temporada activa o estado en vivo de la temporada;
  - evento activo con progreso y cuenta regresiva;
  - carta del día con arte servido desde Storage;
  - estado del jugador, nivel, energía, VEX y victorias;
  - próximas misiones, top de arena y actividad reciente;
  - destacados de los sistemas de la Forja;
  - estados explícitos de error y vacío, además de pull-to-refresh.
- Las superficies todavía no portadas no se anuncian como rutas navegables desde
  Home; los CTAs sólo apuntan a pantallas Android existentes.
- La pantalla no crea resultados, recompensas, energía ni datos de jugador:
  continúa consumiendo el mismo Supabase, RLS y RPCs autoritativos.

## Criterios de aceptación

1. Home carga datos públicos y autenticados reales sin mocks.
2. El estado de conexión comunica carga, conexión, desconexión y reintento.
3. Las acciones de colección y arena abren rutas existentes y funcionales.
4. Carta del día, evento, temporada, misiones, ranking y actividad degradan a
   estados vacíos explícitos sin loaders eternos.
5. El layout usa safe area, tokens locales, contenido desplazable y controles
   accesibles con `testID`.
6. No se añaden emojis, texto como iconografía, arte genérico ni lógica
   autoritativa de juego al cliente móvil.

## Verificación

- `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund` en `mobile/`.
- `npm run typecheck` en `mobile/`.
- `npm run verify:mobile-auth`.
- `npm run verify:build` web correcto.
- `npm run verify:all` web alcanza las guardas y conserva el bloqueo vivo
  preexistente de telemetría sin `forge_action`; no se fabrica cobertura.
- Cierre pendiente: workflow oficial de APK sobre el commit publicado, release
  correlativo con `app-release.apk` y QA funcional del operador.

## Estado y deuda

- Estado de implementación: `IMPLEMENTED_UNVERIFIED`.
- Nivel Q: Q2 actual / Q3 objetivo.
- La QA funcional en APK requiere instalación y recorrido por el operador.
- La unidad se reabre si falla el release, cambia el contrato de Home en
  Supabase, aparece una superficie con ruta muerta o se pierde la equivalencia
  visual/datos con la fuente web.