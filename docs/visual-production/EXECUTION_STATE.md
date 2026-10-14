# VEXFORGE — estado de producción visual

## Estado actual

- HEAD de implementación: `53fdc01` (`main`, publicado en GitHub).
- Bloque actual: **3 — Nexus: kit de mallas originales integrado al runtime; validación de Editor y escena de producción pendientes**.
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

## Assets, escenas y bloques

- Assets nuevos integrados: tres mallas 3D originales del Nexus, su generador determinista, cuatro texturas de material y el catálogo de carga.
- Escenas de producción completadas: ninguna.
- Los fondos y modelos existentes no se declaran como escenas de producción; sus campos descriptivos `quality: production` no se toman como evidencia.
- Bloque 3: implementación de fuente parcial; gates de Unity y escena serializada pendientes.
- Bloques 4–8: `NOT_RUN`; Battlefield, cartas, demás dominios, cinematics/audio y hardening siguen abiertos.

## Gates

| Gate | Estado | Evidencia / motivo |
|---|---|---|
| Sincronización GitHub `main` | PASS | Push confirmado; el kit de Nexus está en `53fdc01`. |
| Ciclo canónico de batalla, fuente | PASS | `node unity/verify-battle-presentation-lifecycle.mjs`; sólo contrato estático. |
| Recursos locales declarados | PASS | `npm run verify:unity-assets`; verifica fuentes/metadatos, no AssetDatabase. |
| Catálogo remoto completo y URLs accesibles | PASS | `npm run verify:card-art`; 127/127, sin descarga/decodificación de imagen. |
| Mallas Nexus, fuentes y rutas estáticas | PASS | `npm run verify:nexus-meshes`; no reemplaza el importador ni una captura. |
| Compilación C# / AssetDatabase import | NOT_RUN | No hay Unity Editor/Hub ni compilador C# en este entorno. |
| Importación OBJ, slots de material URP y aspecto real del Nexus | NOT_RUN | Requiere abrir el proyecto oficial con Unity `6000.3.0f1`. |
| Decode y asignación de arte en Unity | NOT_RUN | Requiere ejecutar el gate de catálogo dentro del Editor. |
| Play Mode, capturas Game View y rendimiento en Android | BLOCKED | Requiere Editor y dispositivo/runtime; no se infiere de pruebas estáticas. |
| APK oficial | NOT_RUN | La orden reserva la build para release candidate; este source aún no ha llegado a ese gate. |
| Escena serializada de Nexus / prefabs de producción | NOT_RUN | El runtime consume los modelos, pero aún no existe una escena de producción verificada ni capturas. |
| Bloques 4–8 | NOT_RUN | Battlefield, cartas, demás dominios, cinematics/audio y hardening siguen abiertos. |

## Bloqueador real y siguiente acción exacta

La validación restante del Bloque 3 requiere abrir `unity/` con `6000.3.0f1`, importar las mallas y texturas, confirmar los slots y shaders reales, probar cada hotspot en Play Mode y guardar capturas. Después crear/verificar la escena serializada y prefabs de producción del Nexus; luego continuar con Battlefield y los bloques restantes. La orden de GitHub ya contiene el kit de fuente y el verificador. Supabase y el catálogo oficial no se modificaron. No usar Unity Cloud Build. La APK queda reservada para un candidato; las credenciales Replit no se copian a GitHub Actions.
