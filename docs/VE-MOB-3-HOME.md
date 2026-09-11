Vigencia del contrato: desde el 2026-09-11, la referencia PNG descrita abajo queda como evidencia histórica del Home anterior. El consumidor Android vigente es una composición nativa en `mobile/app/(tabs)/index.tsx`; no monta el PNG ni usa hotspots transparentes. Los assets de fondo y atmósfera siguen viniendo del manifiesto oficial y Storage.

Referencia visual vigente: `mobile/assets/images/home-reference-scene.png`
mide `1080×2340`, PNG RGB/sRGB, proporción `9:19.5`. La imagen se muestra
como composición completa del Inicio; los recursos superiores no se pintan
como una segunda capa y sólo quedan hotspots transparentes sobre las acciones
visibles de la referencia.

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

## Lote visual — 2026-09-05 — acción y portales

- La acción primaria `ENTRAR A LA ARENA` queda inmediatamente después del
  frente activo y comparte el primer plano con una entrada secundaria real a
  `MI COLECCIÓN`; ambas conservan sus rutas existentes y `testID`.
- El progreso de XP se revela con una transición breve y se vuelve estático
  cuando `reduced-motion` está activo. No cambia el valor autoritativo ni
  introduce un loop por fila.
- No se modificaron Supabase, Auth, RLS, RPCs, Storage, navegación existente,
  assets canónicos ni la superficie web.
- Verificación del lote: `npm run typecheck` en `mobile/`, `npm run build` en
  la web de regresión, `npm run verify:telemetry`, `verify:motion`,
  `verify:ui-identity`, `verify:surface-art`, `verify:mobile-meta`,
  `verify:assets` y `npx expo export --platform android`.
- Estado correcto: `IMPLEMENTED_UNVERIFIED`; el workflow Android oficial,
  release correlativo y QA humana del APK siguen siendo gates de cierre.
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
- La composición conserva la acción primaria `ENTRAR A LA ARENA`, expone la entrada real `home-tutorial` hacia `/tutorial`, mantiene los portales existentes y conserva los estados explícitos de arte, error, retry y `reduced-motion`.
- Estado: `IMPLEMENTED_UNVERIFIED`; falta el workflow APK oficial y la QA humana separada.

## Addendum 2026-09-05 — AMBIENT PARTICLES

- La escena FOJA incorpora ocho partículas ambientales deterministas como VFX ligero, usando el color de acento canónico y sin cargar nuevos assets.
- Cada partícula tiene una deriva lenta y una variación de opacidad/escala; el movimiento queda desactivado cuando `reduced-motion` está activo.
- Las partículas viven detrás del contenido interactivo, no modifican datos, navegación, Supabase, Auth, RLS, RPCs ni la lógica de combate.
- Estado: `IMPLEMENTED_UNVERIFIED`; requiere el workflow APK oficial y revisión visual/táctil del operador para cualquier promoción.

## Evidencia de entrega — 2026-09-05

- Commit Android: `bb1d0842b971e76bc62fa74a69a37113d21073a5`.
- Workflow APK: run `33957157748`, `success`; el workflow ejecutó `npm run typecheck`, las guardas de telemetría, el prebuild Expo y la compilación release con bundle JS embebido.
- Verificación: run `33957157749`, `success`.
- Release: [vexforge-android-build-92](https://github.com/grandmaster68081-byte/Vexforge-web/releases/tag/vexforge-android-build-92), con `app-release.apk` de 95,305,264 bytes y SHA-256 `305a1cace9edc3c0bbc0fa05adf39ec95ca9bdd2e395d3757d7aa1603b921194`.
- Esta evidencia técnica no sustituye la QA humana ni permite promover la unidad a `PASS`, `Q4`, `TIER1_READY` u `OPERATIONAL`.

## Addendum 2026-09-06 — accesibilidad de acciones

- El reintento de sincronización, el frente activo, las misiones, Forja/recursos
  y economía exponen etiquetas accesibles canónicas aunque su affordance visual
  sea un icono o una flecha.
- `ForgeButton` comunica a TalkBack cuando está deshabilitado, conservando el
  mismo feedback visual y la misma acción existente.
- Estado: `IMPLEMENTED_UNVERIFIED`; no cambia la navegación ni sustituye la QA
  táctil del APK.

## Lote visual y de estados — 2026-09-07 — núcleo del Nexus y sincronización parcial

- La escena Home conserva `lobby/main.jpg` y los assets de facción del manifiesto; se añadió una plataforma central authored detrás de la carta destacada para dar continuidad espacial al objeto focal sin introducir arte nuevo.
- `ENTRAR A LA ARENA` recibe una jerarquía ligeramente superior a `MI COLECCIÓN`, manteniendo ambas rutas existentes, `testID` y accesibilidad.
- Las cuatro cargas de Home ahora comunican degradación parcial: si una señal falla pero otras llegan, el Home muestra reintento explícito en lugar de ocultar el estado; si todas fallan, conserva el error total existente.
- La atmósfera de facción limpia su estado de error cuando cambia la carta y deja de renderizarse si el asset oficial no carga; no se sustituye por un placeholder silencioso.
- No se modifican Supabase, Auth, RLS, RPCs, economía, combate, navegación ni web.
- Guardas estáticas del lote: `verify:motion`, `verify:ui-identity`, `verify:surface-art`, `verify:mobile-meta`, `verify:assets` y `verify:mobile-battle` pasan.
- Estado: `IMPLEMENTED_UNVERIFIED`; falta typecheck/build del workflow Android oficial y QA visual/táctil humana en APK.

## Addendum 2026-09-07 — ASSET OFICIAL DEL NÚCLEO NEXUS

- El Home consume `OFFICIAL_ASSETS.homeNexusBurst`, registrado en `mobile/constants/visual.ts` como `misc/IMG_20260619_122314.jpg`.
- El asset se usa únicamente como capa estática de atmósfera detrás del escenario central y la carta destacada; `CANONICAL_BACKGROUNDS.home` (`lobby/main.jpg`) continúa siendo el fondo principal.
- El consumidor comunica carga y error explícitos (`home-nexus-burst-loading`, `home-nexus-burst-error`) y expone una etiqueta accesible. No añade movimiento ni cambia el comportamiento bajo `reduced-motion`.
- La ruta deja de ser reserva residual porque existe un consumidor Android autorizado. Los otros cinco archivos del lote permanecen reservados y sin sustitutos.
- No se modifican Supabase, Auth, RLS, RPCs, economía, combate, navegación ni la web como superficie de producto.
- El estado sigue `IMPLEMENTED_UNVERIFIED`; requiere typecheck/build del workflow APK oficial y QA visual/táctil humana.

## Evidencia de entrega — 2026-09-07 — lote Nexus core

- Commit Android: `2d98d0f7097f4ecfff90a88bd366acaf28402986`.
- Workflow de verificación: run `229` (`34143020880`), `success`.
- Workflow Android: run `121` (`34143020831`), `success`; ejecutó typecheck móvil, telemetría, prebuild Expo, compilación release, verificación standalone y publicación.
- Release correlativo: [vexforge-android-build-121](https://github.com/grandmaster68081-byte/Vexforge-web/releases/tag/vexforge-android-build-121), con `app-release.apk` de `95,335,180` bytes y SHA-256 `b881111862f0cd3405a7c01111d2cf27c32a3dfead2f5391a842a3297cfb1904`.
- El bundle standalone contiene `assets/index.android.bundle` y conserva `forge-battlefield`, `CAMPO DE BATALLA`, `vexforge_battle_resolve`, `ARTE NO DISPONIBLE` y `battle-next-turn`.
- Esta evidencia técnica no sustituye la QA visual/táctil humana ni permite promover la unidad a `PASS`, `Q4`, `TIER1_READY` u `OPERATIONAL`.

## Addendum 2026-09-07 — FOJA VISUAL HUB / FUNCTIONAL MATRIX

- La superficie Android se reconstruyó como una escena nativa vertical de Foja,
  usando `CANONICAL_BACKGROUNDS.home`, el asset oficial `homeNexusBurst`, la
  capa de facción autorizada y el arte real de la carta destacada. La referencia
  visual no se incrusta como una textura estática ni recibe botones transparentes.
- El HUD conserva jugador, nivel, Energía, VEX, temporada, estado Nexus,
  mensajes y ajustes. La escena expone hotspots diegéticos para Foja, Arena,
  Archivo y Forja, además de carta destacada, misión diaria, evento y rito de
  entrada.
- El contenido continúa leyendo `GameContext` y las cargas reales de Supabase.
  No se añadieron rutas, datos, recompensas, personajes, contratos ni lógica
  autoritativa nuevos. `reduced-motion`, safe-area, pull-to-refresh, estados
  parciales, error total, error de arte y accesibilidad se mantienen explícitos.

### Matriz funcional de recorrido

| Control visible | Ruta/acción real | Datos/estado | Evidencia |
| --- | --- | --- | --- |
| Mensajes | `/missions` | Misiones y sincronización | `home-inbox` |
| Ajustes | `/meta` | Sistemas Android existentes | `home-settings` |
| Perfil / medallón | `/profile` | `player`, `progress`, wallet | `home-profile` |
| Foja | `/` | Superficie Home actual | `home-hotspot-foja` |
| Arena | `/battle` | Combate Android existente | `home-battle` |
| Archivo | `/collection` | Colección real | `home-hotspot-archivo`, `home-featured-card` |
| Forja | `/deck` | Mazo/formación existente | `home-hotspot-forja` |
| Misión diaria | `/missions` | `loadHomeMissions` | `home-missions` |
| Evento especial | `/world` | `active_event` de Home | `home-event` |
| Continuar rito | `/tutorial` | `tutorial_step` persistido | `home-tutorial` |
| Mundo | `/world` | Superficie Mundo existente | `home-world` |
| Economía | `/economy` | Economía Android existente | `home-economy` |

- Guardas ejecutadas en la copia de trabajo: typecheck móvil, `verify:motion`,
  `verify:mobile-home-official-assets`, `verify:mobile-tutorial` y `git diff
  --check` pasan. El workflow Android oficial y la QA visual/táctil humana del
  APK siguen siendo gates de cierre.
- Estado: `IMPLEMENTED_UNVERIFIED`; no se declara `PASS`, `Q4`,
  `TIER1_READY` ni `OPERATIONAL`.


## Lote de estados honestos — 2026-09-07 — VE-MOB-3-HOME-STATES

- El Home distingue `loading`, `empty`, `error`, `partial` y `ready` para las señales agregadas sin cambiar la autoridad de los datos.
- Durante la carga, la carta y la misión muestran una espera explícita; cuando no existe contenido publicado, muestran un vacío honesto; cuando falla el arte de una carta existente, muestran un error de asset separado.
- Un evento inexistente ya no desaparece silenciosamente: se comunica como `Sin evento activo`. Los errores totales o parciales exponen una acción accesible de reintento mediante `testID=home-retry`.
- La implementación permanece limitada a Android y conserva `reduced-motion`, safe-area, rutas existentes y la regla de cero genéricos. El workflow Android oficial y la QA humana del APK son gates pendientes.
- Estado: `IMPLEMENTED_UNVERIFIED`; no se declara `PASS`, `Q4`, `TIER1_READY` u `OPERATIONAL`.

## Evidencia APK 129 — 2026-09-07

- Commit: `eb87f20ce5fed27c91cf9a6f768210aa2a1caa9c`.
- Workflow: `129` (`34167262779`), `success`; ejecutó typecheck, telemetría, prebuild Expo, Gradle release, verificación standalone y publicación.
- APK: `vexforge-android-build-129/app-release.apk`, 95,339,228 bytes, SHA-256 `50e8f09ee063b4b1aa0ce7d7cfdf313424b06cfc18b57b375b01132f87836ae6`.
- La inspección del bundle embebido confirmó `home-scene`, `home-world`, `home-featured-card`, `home-battle`, `home-missions`, `home-event`, `home-tutorial`, `FOJA`, `ARENA` y `ARCHIVO`.
- Esta evidencia confirma que la compilación contiene el Home de escena continua y flujos nuevos; no sustituye la QA humana de instalación, touch, safe areas, legibilidad y rendimiento.


## Lote visual y táctil — 2026-09-10 — REFERENCE REPLACEMENT / IMPLEMENTED_UNVERIFIED

- Se reemplazó por completo `mobile/assets/images/home-reference-scene.png` por la referencia entregada por el operador. Se normalizó a `1080×2340`, PNG RGB/sRGB y proporción `9:19.5`, sin pintar una pantalla adicional encima del arte.
- Las zonas transparentes se recalibraron a la composición visible: ajustes → `/meta`, avisos → `/missions`, Forja → `/deck`, Arena → `/battle`, Fusión → `/store?mode=fusion`, Archivo → `/collection`, Tienda → `/store?mode=shop`, Evolución → `/store?mode=evolution` y Packs → `/store?mode=packs`.
- Se añadió feedback localizado en el punto real del toque: aro luminoso breve, núcleo de color acorde al portal y selección háptica; `reduced-motion` conserva una señal visible sin expansión animada.
- Videos no tiene una superficie Android existente en el inventario. El hotspot no inventa una ruta: muestra un estado explícito al tocarlo para evitar una navegación falsa.
- No se modificaron Supabase, Auth, RLS, RPCs, economía, combate ni la web congelada.
- Verificación local: `npm run typecheck` en `mobile/`, `node scripts/verify-mobile-home-official-assets.mjs`, `node scripts/verify-motion.mjs`, `node scripts/verify-mobile-store.mjs` y validación de imagen `1080×2340 RGB` pasan.
- Por instrucción explícita del operador no se ejecuta el workflow ni se genera una APK nueva. Estado: `IMPLEMENTED_UNVERIFIED`; queda pendiente QA visual/táctil humana en el APK ya publicado.

## Addendum 2026-09-11 — RECONSTRUCCIÓN NATIVA TIER 1

- Se reemplazó la composición estática de referencia por una escena nativa vertical con HUD de sincronización, identidad del Forjador, progreso real, acceso a Arena, tutorial, Mundo, Misiones, Colección, Forja y Economía.
- La pantalla consume `get_home_stats`, `loadDailyFeaturedCard`, `loadHomeMissions` y `loadRecentActivity` en paralelo, conserva el estado del jugador desde `GameContext` y no fabrica progreso, economía, recompensas ni resultados.
- La atmósfera usa `ScreenShell` con `CANONICAL_BACKGROUNDS.home` y `OFFICIAL_ASSETS.homeNexusBurst`; la carta destacada usa `image_url` oficial y muestra `ARTE NO DISPONIBLE` si Storage no entrega un asset válido.
- Se añadieron estados explícitos `loading`, `partial`, `error`, vacío, sincronización y `reduced-motion`, además de pull-to-refresh, labels accesibles y `testID` de revisión.
- La guardia del Home y la guardia de recompensas fueron actualizadas para validar esta composición nativa; ninguna superficie web ni contrato Supabase fue modificado.
- Estado: `IMPLEMENTED_UNVERIFIED`; queda pendiente el workflow APK correlativo y la QA visual/táctil humana sobre el APK instalado.
