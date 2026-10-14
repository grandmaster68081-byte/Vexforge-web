# VEXFORGE — estado de producción visual

## Estado actual

- HEAD de implementación: `9dfbac5d` (`main`, publicado en GitHub).
- Bloque actual: **4 — Battlefield: arena y núcleo con mallas originales integradas en fuente; VFX transitorios, escena visual y validación de Editor pendientes**.
- Este estado sigue el HEAD de implementación; su propio commit sólo registra evidencia.
- Unity declarado: `6000.3.0f1`; URP `17.3.0`; Input System `1.20.0`; UGUI `2.0.0`.
- Proyecto Unity canónico: `unity/`; escena existente en Build Settings: `Assets/Scenes/VexforgeBootstrap.unity`.
- Supabase no recibió cambios de datos, esquema, RPC, economía ni configuración.

## Bloque 1 — ciclo de vida de batalla

- **Implementado:** Bootstrap único como componente de `VexforgeApp`, inicialización posterior a la app y enlace explícito desde `GameShellController`.
- **Implementado:** validación con el propietario persistente, reintento directo y error visible sin búsqueda periódica.
- **Implementado:** registro de fases para App, GameShell, director, escenario, Bootstrap y Battle Gate.
- **Prueba estática:** `node unity/verify-battle-presentation-lifecycle.mjs` — `PASS`; no reemplaza Play Mode.
- **Commit:** `0011b6d9eb29d5c49e2526575948d4acd1c8dc39`, publicado en `main`.
- **Unity Play Mode, compilación C# y Game View:** `NOT_RUN`; no hay Unity Editor/Hub ni compilador C# en este entorno.

## Bloque 2 — manifiesto y arte oficial

- **Implementado:** el registro ahora valida `schema_version`, entradas únicas y fallbacks; no sustituye una textura `identity_critical` por arte neutral ni admite fallbacks entre dominios.
- **Implementado:** el manifiesto separa los dominios locales; quitó los `fallback_id` al asset neutral y prohíbe fallback en recursos críticos.
- **Implementado:** los errores del registro incluyen el `asset_id` y la `resources_key`; el resolver emite estado por carta para URL, carga, decodificación, caché y asignación. La vista muestra carga o arte no disponible, y permite consultar el resultado asíncrono.
- **Implementado:** verificador de fuentes Unity y validador Editor/build para presencia, importación, tamaño, claves `Resources`, metadatos, dominio y contrato remoto de cartas.
- **Implementado:** gate de Editor `VEXFORGE/Production/Verify Official Card Art Catalog`; prueba hasta dos cartas concurrentemente por lote usando el resolver y material reales.
- **Prueba de fuentes local:** `npm run verify:unity-assets` — `PASS`; 32 entradas, 21 texturas críticas con archivo, metadatos de importador y dimensiones PNG legibles.
- **Catálogo público Supabase, sólo lectura:** 127 registros, 127 IDs/objetos únicos y 127/127 respuestas HTTP accesibles — `PASS`.
- **Importación AssetDatabase, decode/assign de las 127 texturas dentro de Unity:** `NOT_RUN`; el gate de Editor existe, pero Unity Editor no está instalado.
- **Commit:** `7f4c86b`, `fix(unity): enforce visual asset domains and card art validation`, publicado en `main`.

## Bloque 3 — Nexus y kit visual propio

- **Implementado en fuente:** generador determinista para tres mallas OBJ originales del Nexus (dais, espina de la ciudadela y portal), con 1.268 triángulos, cinco slots de material, biblioteca MTL y cuatro texturas de 256 × 256.
- **Implementado en fuente:** manifiesto independiente de mallas y fábrica Unity que exige registro, geometría importada y todos los slots declarados; si falta un recurso crítico o su material, falla explícitamente en lugar de mostrar primitivas.
- **Integrado al runtime:** tanto el director activo `VexforgeAlphaWorldDirector` como `NexusPresentationRoot` cargan el kit. Se mantienen los hotspots, colliders y navegación existentes; los dos constructores ya no dibujan primitivas ni rótulos `TextMesh` para el Nexus.
- **Prueba estática:** `npm run verify:nexus-meshes` — `PASS`; valida mallas, índices, triángulos, materiales, texturas y las rutas de runtime. No demuestra importación en Unity.
- **Verificación conjunta:** `npm run verify:visual-production` — `PASS`; también verificó ciclo de Battle, presentación de cartas, recursos locales y 127/127 objetos oficiales de Storage alcanzables.
- **No completado:** Unity AssetDatabase/importación OBJ, resolución real de slots y shaders, Game View, Play Mode, capturas, escena serializada y prefabs. El bloque 3 sigue abierto hasta esas comprobaciones visuales.
- **Commit:** `53fdc01`, `feat(unity): add authored VEXFORGE Nexus mesh kit`, publicado en `main`.

## Bloque 4 — Battlefield y VFX (parcial)

- **Implementado en fuente:** el director de presentación expone el ancla espacial del evento vigente. El escenario resuelve objetivo/actor usando `target_id`/`actor_id` y las zonas canónicas; eventos de jefe/victoria usan el núcleo del escenario.
- **Implementado en fuente:** el director VFX reserva cinco sistemas de partículas al inicializar y los reutiliza; cada efecto usa el ancla del evento, respeta movimiento reducido y limpia/libera el sistema al terminar.
- **Prueba estática:** `npm run verify:battle-vfx` — `PASS`; comprueba delegación de ancla, mapeo de actor/objetivo y reutilización. No prueba emisión ni posición dentro de Unity.
- **Implementado en fuente:** kit OBJ original de arena y núcleo de batalla, con 1.032 y 164 triángulos; usa el catálogo compartido de mallas, URP/Lit, texturas locales y un fallo explícito si faltan recursos/materiales. El escenario carga ambos modelos y conserva los anclajes de jugador, rival y núcleo.
- **Prueba estática:** `npm run verify:nexus-meshes` — `PASS`; comprueba las dos entradas del manifiesto, geometría, slots y que `BuildArena()` no crea primitivas/anillos como arquitectura. No demuestra la importación OBJ ni su apariencia.
- **No completado:** los efectos transitorios y la manifestación de jefe aún crean algunas formas de runtime; faltan prefabs/escena serializada de producción, catálogo de VFX por tipo, importación, Play Mode, captura y medición real de rendimiento.
- **Commit:** `b3875b8`, `fix(unity): anchor battle vfx and reuse particles`, publicado en `main`.
- **Commit de assets e integración:** `9dfbac5d`, `feat(unity): add authored battlefield arena meshes`, publicado en `main`.

## Assets, escenas y bloques

- Assets nuevos integrados: tres mallas 3D originales del Nexus y dos del Battlefield, total de 2.464 triángulos; generador determinista, texturas de material compartidas y catálogo estricto de carga.
- Orden del usuario conservada en `docs/visual-production/EXECUTION_ORDER.md`; la herramienta opcional de Unity se conserva en `docs/visual-production/Tools/` y no se ejecutó.
- Escenas de producción completadas: ninguna.
- Los fondos y modelos existentes no se declaran como escenas de producción; sus campos descriptivos `quality: production` no se toman como evidencia.
- Bloque 3: implementación de fuente parcial; gates de Unity y escena serializada pendientes.
- Bloque 4: implementación de fuente parcial; geometría, arte final y gates de Unity pendientes.
- Bloques 5–8: `NOT_RUN`; cartas, demás dominios, cinematics/audio y hardening siguen abiertos.

## Gates

| Gate | Estado | Evidencia / motivo |
|---|---|---|
| Sincronización GitHub `main` | PASS | Push confirmado; el último cambio de fuente visual está en `9dfbac5d`. |
| Ciclo canónico de batalla, fuente | PASS | `node unity/verify-battle-presentation-lifecycle.mjs`; sólo contrato estático. |
| Recursos locales declarados | PASS | `npm run verify:unity-assets`; verifica fuentes/metadatos, no AssetDatabase. |
| Catálogo remoto completo y URLs accesibles | PASS | `npm run verify:card-art`; 127/127, sin descarga/decodificación de imagen. |
| Mallas Nexus, fuentes y rutas estáticas | PASS | `npm run verify:nexus-meshes`; no reemplaza el importador ni una captura. |
| Anclas de eventos y reutilización VFX, fuente | PASS | `npm run verify:battle-vfx`; no reemplaza Play Mode ni verifica efectos por tipo. |
| Arena y núcleo Battlefield, geometría/fábrica/ruta fuente | PASS | Dos modelos OBJ nuevos; `BuildArena()` ya no crea arquitectura de primitivas. |
| Compilación C# / AssetDatabase import | NOT_RUN | No hay Unity Editor/Hub ni compilador C# en este entorno. |
| Importación OBJ, slots de material URP y aspecto real del Nexus | NOT_RUN | Requiere abrir el proyecto oficial con Unity `6000.3.0f1`. |
| Decode y asignación de arte en Unity | NOT_RUN | Requiere ejecutar el gate de catálogo dentro del Editor. |
| Play Mode, capturas Game View y rendimiento en Android | BLOCKED | Requiere Editor y dispositivo/runtime; no se infiere de pruebas estáticas. |
| APK oficial | NOT_RUN | La orden reserva la build para release candidate; este source aún no ha llegado a ese gate. |
| Escena serializada de Nexus / prefabs de producción | NOT_RUN | El runtime consume los modelos, pero aún no existe una escena de producción verificada ni capturas. |
| Bloque 4 — escena y VFX completos | BLOCKED | La arquitectura base usa modelos originales, pero quedan formas de VFX transitorias, escena/prefabs y validación visual en Editor. |
| Bloques 5–8 | NOT_RUN | Cartas, demás dominios, cinematics/audio y hardening siguen abiertos. |

## Bloqueador real y siguiente acción exacta

El entorno actual no contiene Unity Editor/Hub, .NET ni Mono, por lo que la validación AssetDatabase y Play Mode no se puede ejecutar aquí. Para completar esos gates se necesita Unity `6000.3.0f1` activado con una licencia válida del propietario; luego importar modelos/texturas, comprobar shaders/slots, revisar Game View, guardar escenas/prefabs, recorrer Play Mode y registrar evidencia. Primero cerrar así el Bloque 3; después validar esta arena en el Editor, reemplazar las formas transitorias que sigan siendo placeholders y continuar los bloques 4–8. El repositorio contiene el orden del usuario, sus cambios y verificadores estáticos. Supabase y su catálogo oficial no se modificaron. No usar Unity Cloud Build ni copiar secretos Replit a GitHub Actions. La APK queda reservada para un candidato.
