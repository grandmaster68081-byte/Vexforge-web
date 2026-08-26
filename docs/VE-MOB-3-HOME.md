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
- Workflow oficial completado: run 12 (`32911859725`) terminó `success` sobre el
  commit `bf6599ced6e2cbc1bcf8b41210befebcdc5d38ff`.
- Release correlativo: [vexforge-android-build-12](https://github.com/grandmaster68081-byte/Vexforge-web/releases/tag/vexforge-android-build-12)
  con `app-release.apk`; el asset tiene SHA-256
  `9f49cf26f1b4b6561b74c6c00ee69567c8a228e378a4d1d4a2c68df19b6f1ee0`,
  contiene `assets/index.android.bundle` y pasó la comprobación `APK Sig Block 42`.
- Cierre pendiente únicamente de QA funcional del operador en el APK instalado.

## Estado y deuda

- Estado de implementación: `IMPLEMENTED_UNVERIFIED`.
- Nivel Q: Q2 actual / Q3 objetivo.
- La QA funcional en APK requiere instalación y recorrido por el operador.
- La unidad se reabre si falla el release, cambia el contrato de Home en
  Supabase, aparece una superficie con ruta muerta o se pierde la equivalencia
  visual/datos con la fuente web.