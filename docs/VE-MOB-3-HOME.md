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
## Orden de trabajo vigente — QA visual-first del dominio Forja

**Decisión del operador:** el primer dominio de QA será **Forja**, representado por la superficie Android `VE-MOB-3 HOME` y las tres capturas de referencia entregadas para su lectura completa.

La ejecución se divide en dos fases obligatorias y no se mezclan:

1. **Fase VISUAL — reconstrucción de experiencia de juego.** Elevar la pantalla desde una presentación administrativa hacia un home de videojuego de cartas: hacer que la escena del Nexus tenga presencia y profundidad, mejorar la lectura del fondo oficial, reforzar la jerarquía tipográfica, enriquecer marcos, paneles, bordes, contraste, composición, estados y micro-motion, y conservar la identidad VEXFORGE. El fondo y cualquier elemento diegético deben proceder del manifiesto/Storage oficial; se reutilizan primero `mobile/constants/visual.ts`, `ScreenShell` y los componentes authored existentes.
2. **Fase FUNCTIONAL — matriz de botones, enlaces y estados.** Después del pase visual y con las capturas adicionales del operador, revisar cada control visible del dominio Forja: cabecera, colección, arena, tutorial, forja/recursos, economía/mercado, mundo, batalla rápida, evento, carta destacada, misiones y navegación inferior. Cada control debe abrir una ruta existente, ejecutar una acción real o mostrar un estado explícito; ninguna interacción se considera correcta por cambiar sólo la apariencia.

### Alcance visual de la Fase VISUAL

- Escena principal: `CANONICAL_BACKGROUNDS.home` / `lobby/main.jpg`, con mayor visibilidad y capas de atmósfera sin esconder el contenido autoritativo.
- Identidad: tipografía Cinzel/Rajdhani ya cargada, escala de títulos y etiquetas coherente, contraste suficiente y lenguaje de Forja reconocible.
- Superficies: marcos y paneles con profundidad, separación entre escena y UI, jerarquía de acción clara y tarjetas tratadas como objetos del juego, no como filas administrativas.
- Feedback: estados de carga, vacío, error, sincronización y `reduced-motion` deben conservarse y seguir siendo explícitos.
- Límites: no se modifica la autoridad de Supabase, la economía, combate, recompensas, inventario, Auth ni contratos; no se usan emojis, placeholders ni arte genérico.

### Gate de salida

La Fase VISUAL no se declara cerrada sólo por compilar: debe alcanzar al menos Q4 en la revisión visual de superficie principal, conservar los gates de identidad, datos, mobile, accesibilidad, performance y reduced-motion, y producir evidencia reproducible. La Fase FUNCTIONAL requiere además la matriz de recorrido real y la QA manual del operador en el APK. Hasta entonces, `VE-MOB-3 HOME` permanece `IMPLEMENTED_UNVERIFIED` y no se declara `PASS`, `OPERATIONAL` ni `TIER1_READY`.


## Addendum 2026-09-05 — PROGRESS / STATES / PORTALS

- El Home Android incorpora en la escena el pulso real del Forjador: nivel, XP y avance del rito de entrada consumidos desde `player_progress`, sin inventar progreso ni cambiar autoridad.
- El HUD de conexión ahora distingue `NEXUS ONLINE`, `SINCRONIZANDO` y `NEXUS OFFLINE`; un frente sin evento se muestra como `SIN FRENTE ACTIVO` en lugar de presentarse como actividad viva.
- La composición conserva la acción primaria `ENTRAR A LA ARENA`, los portales de rutas existentes y los estados explícitos de arte, error, retry y `reduced-motion`.
- Estado: `IMPLEMENTED_UNVERIFIED`; falta el workflow APK oficial y la QA humana separada.
