# VEXFORGE — estado de producción visual

## Estado actual

- HEAD de implementación: `7f4c86b` (`main`, publicado en GitHub).
- Bloque actual: **2 — manifiesto, asset import y telemetría de arte de cartas**; cambios fuente comprometidos; gates de Editor pendientes.
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

## Assets, escenas y bloques

- Assets 3D nuevos integrados: ninguno.
- Escenas de producción completadas: ninguna.
- Los fondos y modelos existentes no se declaran como escenas de producción; sus campos descriptivos `quality: production` no se toman como evidencia.
- Bloques 3–8: `NOT_RUN`; no se han sustituido las representaciones provisionales ni verificado escenas/runtime.

## Gates

| Gate | Estado | Evidencia / motivo |
|---|---|---|
| Sincronización GitHub `main` | PASS | Push confirmado; el código del Bloque 2 está en `7f4c86b`. |
| Ciclo canónico de batalla, fuente | PASS | `node unity/verify-battle-presentation-lifecycle.mjs`; sólo contrato estático. |
| Recursos locales declarados | PASS | `npm run verify:unity-assets`; verifica fuentes/metadatos, no AssetDatabase. |
| Catálogo remoto completo y URLs accesibles | PASS | `npm run verify:card-art`; 127/127, sin descarga/decodificación de imagen. |
| Compilación C# / AssetDatabase import | NOT_RUN | No hay Unity Editor/Hub ni compilador C# en este entorno. |
| Decode y asignación de arte en Unity | NOT_RUN | Requiere ejecutar el gate de catálogo dentro del Editor. |
| Play Mode, capturas Game View y rendimiento en Android | BLOCKED | Requiere Editor y dispositivo/runtime; no se infiere de pruebas estáticas. |
| APK oficial | NOT_RUN | La orden reserva la build para release candidate; este source aún no ha llegado a ese gate. |
| Bloques 3–8 | NOT_RUN | Nexus, Battlefield, cartas, demás dominios, cinematics/audio y hardening siguen abiertos. |

## Bloqueador real y siguiente acción exacta

La validación del Bloque 2 que falta es Unity Editor: abrir `unity/` con `6000.3.0f1`, ejecutar `VEXFORGE/Tier1/Validate Production Closure V15.1` y `VEXFORGE/Production/Verify Official Card Art Catalog`, corregir errores de import/decode/asignación y conservar el resultado. Después continuar con el kit original y la escena autorada de Nexus del Bloque 3. No usar Unity Cloud Build. La única ruta de APK es el workflow manual de GitHub y sigue reservada para un candidato; las credenciales Replit no se copian a GitHub Actions.
