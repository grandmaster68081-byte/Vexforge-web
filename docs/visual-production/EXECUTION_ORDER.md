# VEXFORGE — ORDEN ÚNICA DE PRODUCCIÓN VISUAL REAL PARA UNITY

**Tipo:** orden de implementación vinculante para Replit  
**Producto:** VEXFORGE Android TCG  
**Repositorio:** `grandmaster68081-byte/Vexforge-web`, rama de trabajo `main` salvo que el fingerprint vivo indique otra rama canónica  
**Proyecto Unity esperado:** `unity/`  
**Configuración observada en los archivos vivos consultados el 11-oct-2026:** Unity `6000.3.0f1`, URP `17.3.0`  
**Autoridad de juego/datos:** se conserva la implementación canónica existente y Supabase.  
**Objetivo:** producción e integración de la identidad visual real del videojuego; NO crear otra auditoría interminable.

---

## ORDEN EJECUTIVA — LEER ANTES DE MODIFICAR

Replit: ejecuta esta orden sobre el estado actual de `main`. No la conviertas en un plan, resumen, documento de recomendaciones ni otra auditoría. **Debes crear e integrar recursos de producción reales en el proyecto Unity, modificar el código visual existente, ejecutar verificaciones y hacer commits verificables.**

La tarea no se considera completada porque se haya escrito código, se haya generado una imagen bonita o se haya creado una escena que solamente se parezca al videojuego. El contenido debe estar conectado a los sistemas existentes, abrirse en el Editor y aparecer en el runtime Android.

No esperes a que el propietario confirme cada microtarea. Sigue la secuencia de esta orden, preserva el estado y continúa hasta completar lo posible con la cuota disponible. Si se agota la cuota, deja el trabajo implementado y comprometido hasta el último bloque completado, actualiza el estado exacto de continuación y no declares finalizado lo pendiente.

### No negociables

1. La identidad visual oficial que se conserva del contenido remoto es **el arte de las cartas oficiales**. El manifiesto actual declara `known_count: 127`, bucket `vexforge-assets`, prefijo `cards` y prohíbe copias locales/sustitución del arte oficial. Vuelve a comprobar el catálogo vivo; no asumas que el número no ha cambiado.
2. Todo el resto de la identidad de plataforma —entornos, arquitectura, props, materiales, iconografía, marcos de dominio, partículas, pantallas ambientales, audio y cinemáticas— se debe producir para VEXFORGE y versionar en el proyecto Unity. No reutilices como arte final los fondos no-cartas de Supabase Storage. No uses stock genérico ni recursos de otros juegos como sustituto de identidad.
3. No cambies la autoridad de Supabase ni inventes resultados del combate, daño, recompensas, balances, cartas, progreso, jugadores, lore o estados para que una animación funcione.
4. No cambies de motor ni migres a Unreal. El proyecto activo a ejecutar aquí es Unity + URP. Las herramientas de Unreal no aplican a esta entrega.
5. No inventes compatibilidad de paquetes. Verifica las versiones instaladas y la compatibilidad exacta con Unity `6000.3.0f1` antes de añadir dependencias. No actualices URP ni Unity como parte accidental de esta tarea.
6. No dejes primitivas geométricas, cubos, cápsulas, anillos planos o etiquetas `TextMesh` como arte visible final en Nexus/Battle/Archive/Forge. Se pueden usar en pruebas de editor o como colliders auxiliares si no son visibles.
7. Prohibido que un asset visual crítico ausente termine silenciosamente en negro, se sustituya por una carta neutral o se etiquete “production” sin que exista el archivo correspondiente y haya sido verificado.
8. No declares calidad AAA/Tier-1 por adjetivos. Debes demostrar las mejoras mediante recursos importados, escenas conectadas, captures del Game view/runtime, compilación y pruebas reales cuando estén disponibles.

---

## A. HECHOS TÉCNICOS QUE DEBES RESPETAR

Estos hechos se han comprobado en archivos públicos actuales del repositorio consultado. Al empezar, comprueba su correspondencia con el `HEAD` vivo y resuelve únicamente las diferencias que encuentres; no copies a ciegas una snapshot anterior.

### A1. Configuración del proyecto

- `unity/ProjectSettings/ProjectVersion.txt` declara Unity `6000.3.0f1`.
- `unity/Packages/manifest.json` declara `com.unity.render-pipelines.universal` `17.3.0`, Input System `1.20.0` y UGUI `2.0.0`.
- El manifiesto consultado no declara Cinemachine, Timeline, Addressables ni VFX Graph como dependencias directas. Eso no descarta todas las dependencias transitivas o módulos integrados; compruébalo mediante `manifest.json`, `packages-lock.json` y el Package Manager del proyecto real.

### A2. Problemas de arquitectura visual confirmados en archivos concretos

**`unity/Assets/Scripts/Presentation/NexusPresentationRoot.cs`**

- El comentario del componente lo define como una base estructural, no arte final.
- `BuildWorld()` genera el suelo y el núcleo con `CreatePrimitive`, configura fondo de cámara sólido casi negro y construye rutas con pedestales/cilindros/monolitos.
- `CreateWorldLabel()` usa `TextMesh` sobre los objetos de navegación.
- La luz clave y la iluminación de acento se crean en runtime.

**Acción requerida:** sustituir la representación final por un `Nexus` de escena autorada con mallas, prefabs, materiales y composición propios; mantener el `NavigationService` existente y el estado de las rutas.

**`unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs`**

- Mantiene una capa de presentación que consume eventos canónicos de combate.
- Construye en código parte de la arena y la presentación; sus efectos no constituyen un entorno de producción completo.
- La clase es explícitamente de presentación y no debe convertirse en autoridad del combate.

**Acción requerida:** conservar su contrato de eventos pero trasladar la representación a una escena/prefab autorado y un catálogo visual de combate; cada efecto debe ir al actor/objetivo correcto, no a una posición fija arbitraria.

**`unity/Assets/Scripts/Presentation/VexforgeCardView.cs`**

- `CreateRuntime()` crea un `Cube` y después un `Quad` con `CreatePrimitive`; el marco se genera mediante una malla en código.
- `InitializeVisuals()` depende de `VexforgePresentationResources.LoadRuntime()` y registra error si faltan materiales.
- `BindArtAsync()` es asíncrono y, si no llega textura válida, aplica `null`; el material usa un color muy oscuro para ese estado.

**Acción requerida:** mantener la API/estados de la carta, pero incorporar un prefab visual de producción reutilizable, superficie frontal con relación de aspecto correcta, grosor/bisel real, marco físico/materiales bien construidos y diagnóstico explícito de fallo de arte. No rehagas el contrato de `CardRecord`/`PlayerCardRecord`.

**`unity/Assets/Scripts/Presentation/VexforgeCardArtResolver.cs`**

- Es el resolver oficial de Supabase; restringe host/bucket/prefijo, comparte operaciones en vuelo, limita concurrencia y tamaño y devuelve `null` ante errores de carga/validación.

**Acción requerida:** conservar estas barreras de seguridad. Añadir telemetría no sensible por identificador de carta/estado/tipo de error, un estado de carga/recuperación visual y una prueba completa del catálogo. No relajar el host permitido ni convertir URL arbitrarias en válidas.

**`unity/Assets/Scripts/Tier1/VexforgeTier1AssetRegistry.cs`**

- Carga `Resources/VexforgeTier1/VexforgeTier1AssetManifest`; si el manifiesto no existe, actualmente retorna sin una validación fatal.
- Carga las texturas por `resources_key`; si falla, intenta el fallback declarado o explícito.

**Acción requerida:** validar el manifiesto y todos los assets locales críticos antes de declarar la build preparada. Separar fallbacks por dominio; una carta neutral no es un fondo válido de ciudadela/arena/forja.

**`unity/Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json`**

- Declara `schema_version: 3.0`, la capa `Tier1ProductionClosureV15`, `known_count: 127` para arte de cartas y recursos críticos como `VF_NEXUS_CITADEL_HERO`, `VF_BATTLE_ARENA_CITADEL_A`, `VF_ARCHIVE_SANCTUM_HERO` y `VF_FORGE_CHAMBER_HERO`.
- El texto `quality: "production"` es un campo descriptivo; no prueba que un archivo exista ni que la imagen tenga calidad suficiente.

**Acción requerida:** hacer que el verificador pruebe la existencia, importación, dimensiones, material de uso, escena consumidora y presencia en build de cada recurso crítico.

**`unity/Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs`**

- Crea directores de calidad, base visual, audio, cinemática y VFX; crea `BattleGate`, tutorial y superficie de rutas; después busca el `BattlePresentationDirector` y `VexforgeBattlefieldStage` con un ciclo de búsqueda de hasta 600 frames.
- Utiliza reflexión para obtener el `artResolver` privado de `GameShellController`.
- Si no descubre el director y la escena en el intervalo de inicio, emite un warning y no realiza la conexión.

**Acción requerida:** eliminar la dependencia frágil de búsqueda/reflexión para el ciclo principal mediante un enlace explícito desde el propietario real del runtime; una sola instancia y un solo ciclo de vida canónico. No crear un motor de combate sustituto.

**`unity/Assets/Scripts/Tier1/VexforgeTier1BattleGate.cs`**

- `DiscoverAsync()` detiene el descubrimiento si `canonicalBattle` es nulo/no inicializado y muestra `CAMPO DE BATALLA AÚN NO LISTO`.
- `Build()` asigna fondo casi negro si no carga `VF_BATTLE_ARENA_CITADEL_A`; luego aplica un velo oscuro y una placa grande.

**Acción requerida:** solucionar la inicialización raíz; no ocultar el problema con un estado bonito. Para fallos recuperables se debe mostrar un estado legible y una acción de reintento; en Release nunca debe permanecer la composición negra cuando falta el escenario.

**`unity/Assets/Scripts/Tier1/VexforgeTier1QualityDirector.cs`**

- Decide Mobile/Balanced/Cinematic a partir de RAM gráfica, cantidad de núcleos, shader level y resolución, pero `Apply()` modifica principalmente `shadowDistance`, AA y `targetFrameRate`.

**Acción requerida:** sustituir la inferencia simplista por perfiles medibles/configurables de calidad; la resolución de pantalla no demuestra por sí sola capacidad de GPU.

**`unity/Assets/Scripts/Tier1/VexforgeTier1VisualFoundation.cs`**

- Genera en runtime un `VolumeProfile` global, Bloom, Vignette, Color Adjustments y una luz de clave si no encuentra luces.

**Acción requerida:** crear perfiles visuales autorados por escena; evitar un volumen global que oscurezca todas las pantallas o que duplique los volúmenes de la escena. Conservar fallback de desarrollo sólo para recuperarse de una escena mal configurada.

**`unity/Assets/Scripts/Tier1/VexforgeTier1CinematicDirector.cs`**

- Mueve directamente la cámara con corutinas y hace micro-shake por función seno; no demuestra por sí solo una secuencia cinematográfica autorada.

**Acción requerida:** sustituir el shake universal por perfiles de cámara definidos por evento y secuencias autoradas para introducción, invocación, boss y resultado; movimiento corto, controlable y que respete reduced motion.

**`unity/Assets/Scripts/Tier1/VexforgeTier1VfxDirector.cs`**

- Genera un Particle System en runtime con un material billboard; limita concurrencia a cinco; `OnEvent()` llama `Emit(Vector3.up * .30f, ...)`, de forma que la posición del efecto no está ligada de forma explícita al actor/objetivo del evento.

**Acción requerida:** mapear eventos a actor/objetivo real y a prefabs de VFX por tipo/facción; pooling y release determinista; no crear/destruir continuamente GameObjects en cada golpe como arquitectura final.

**`unity/Assets/Scripts/Tier1/VexforgeTier1AudioDirector.cs`**

- Añade un único `AudioSource` y asocia un conjunto pequeño de tipos de evento a nombres de clips cargados mediante `Resources.Load`.

**Acción requerida:** crear catálogo de audio requerido, `AudioMixer` y buses (Master/Music/Ambience/SFX/Voice), clips originales donde el generador lo permita, validación de todos los cues y eventos ligados a resultados canónicos. No afirmar que hay voces/audio final si no existen los clips.

### A3. Fuentes de código que se deben usar como punto de partida

- `unity/Assets/Scripts/VexforgeApp.cs`
- `unity/Assets/Scripts/Backend/SupabaseClient.cs`
- `unity/Assets/Scripts/Backend/VexforgeRepository.cs`
- `unity/Assets/Scripts/GameState/GameStateStore.cs`
- `unity/Assets/Scripts/Navigation/NavigationService.cs`
- `unity/Assets/Scripts/UI/GameShellController.cs`
- `unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs`
- `unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs`
- `unity/Assets/Scripts/Presentation/VexforgeCardArtResolver.cs`
- `unity/Assets/Scripts/Presentation/VexforgeCardView.cs`
- toda la implementación vigente de `unity/Assets/Scripts/Tier1/`

Si algún nombre cambió en el `HEAD` actual, busca su equivalente mediante referencias de código. No dupliques clases ni crees una segunda arquitectura de navegación/backend.

---

## B. RESULTADO VISUAL QUE DEBES CONSTRUIR

La regla de producto es: **cada dominio tiene que ser una escena con lugar, objeto principal, luz, profundidad, navegación e interacción**. No basta un fondo ilustrado detrás de una pantalla de paneles. Tampoco basta un modelo grande estático detrás de botones genéricos.

### B1. Dirección artística original

Identidad: fantasía medieval oscura, elegante y monumental; obsidiana/basalto, piedra tallada, hierro trabajado, oro antiguo no amarillo plástico, bronce oscurecido, pergamino, cristales arcanos, braseros, energía azul arcana, rojo carmesí controlado y verde sombra sólo cuando corresponda a la identidad canónica de facciones/rareza.

Materialidad exigida:

- Piedra: albedo con variación, normal map de relieve creíble, AO/roughness, bordes desgastados y escala física coherente.
- Metal: mapas de base/metallic-smoothness correctos para URP Lit; desgaste en zonas de contacto, bisel geométrico real donde sea visible; no limitarse a cambiar el color a dorado.
- Cristal: transmisión/fresnel/iluminación controlada compatible con URP y con un coste móvil comprobado; si la transparencia cara no rinde, utilizar malla facetada con shader transparente simple y emisión limitada.
- Tela/estandarte: silueta, pliegues, textura y animación de viento medida; evitar banderas perfectamente rígidas en una escena presentada como viva.
- Piel/cuero/madera: acabados diferenciados; no usar un único material universal para todo el mundo.
- Decales/runa/ornamento: integrados en la malla, decal compatible, textura o geometría fina; no texto aleatorio dibujado sobre cada plano.

No genérico “AI-looking”: descartar modelos con topología rota, caras flotantes, escalas incoherentes, detalles repetidos sin lógica, texturas derretidas, arquitectura imposible, UVs malos, texto ilegible incorporado en la imagen, asimetrías involuntarias o perspectivas incompatibles. Cada asset debe tener revisión visual y propósito.

### B2. No entregar un mundo plano

- Las imágenes generadas pueden usarse como fuentes de textura/arte ambiental, matte painting por planos o material auxiliar, pero no como reemplazo de toda una escena 3D interactiva.
- Los fondos 2D ambientales pueden complementar el horizonte mediante skybox, planes por capas y parallax; el suelo transitable, los hitos interactivos, los props principales y las cámaras deben ser 3D real.
- Cada escena necesita separación foreground/midground/background, composición controlada y al menos un objeto protagonista de VEXFORGE.
- Las áreas interactivas deben tener collider/target independiente de la geometría decorativa para que la decoración no robe el input.

### B3. Resolución y composición Android

Diseñar para el formato vertical canónico `1080 × 2340` (9:19.5) con Safe Area y reflow; validar además en resoluciones equivalentes más pequeñas y grandes. No copiar coordenadas de un solo teléfono.

No convertir Battlefield a horizontal sólo porque una imagen conceptual tenía formato apaisado. En retrato, la composición debe reservar un área central clara para la arena, una zona superior legible para rival/estado, zona inferior legible para la mano/acciones y espacio explícito para accesos importantes. La cámara debe mantener personajes y cartas dentro del área segura.

Texto con escala real de lectura, objetivos táctiles cómodos, áreas de gesto sin obstrucción, contraste suficiente y versión con movimiento reducido. Ningún brillo/partícula debe tapar estadísticas ni nombres importantes de cartas.

---

## C. PIPELINE REAL DE ASSETS — NO SALTAR ESTA SECCIÓN

### C1. Producción de modelos y conversión

Usa las herramientas de generación de medios disponibles en la sesión de Replit para generar **assets originales** de VEXFORGE, no sólo una imagen final de pantalla. Prioriza modelos 3D estáticos para modularidad arquitectónica y props; para criaturas/personajes que necesiten actuar, produce mallas y materiales que puedan recibir rig y animación por un pipeline compatible.

Formatos preferidos:

- FBX para modelos que Unity debe importar nativamente cuando el generador/convertidor pueda entregarlo correctamente.
- GLB sólo si se incorpora un importer compatible con la versión Unity actual y se prueba en una escena de test. Alternativamente convierte GLB a FBX con Blender en modo batch si Blender está instalado y la conversión conserva materiales/UVs. **No renombres un `.glb` a `.fbx` ni declares importación aprobada sólo porque el archivo aparece en el Project window.**
- Texturas fuente PNG/TGA/EXR cuando proceda; comprimir mediante configuración de importación de Unity para el destino Android. Mantener formatos y canales documentados.
- Audio WAV/OGG conforme a los requisitos de importación de Unity, con frecuencia/mono-estéreo apropiada y perfil Android verificado.

Cada modelo debe especificar y comprobar:
- dimensiones físicas y escala en metros;
- pivote/origen y orientación;
- normales/tangentes;
- UV0 y UV de lightmap cuando sea necesario;
- materiales asignados y nombre estable;
- LODs para piezas que justifiquen LOD;
- collider adecuado (simple, no malla compleja salvo necesidad demostrada);
- número razonable de triángulos según proximidad/presupuesto móvil;
- referencias a texturas y dependencia de materiales;
- prueba de importación y reimportación limpia.

Si la herramienta sólo produce modelos estáticos y no riggeados, no la presentes como generadora de personajes animados. Para las unidades que se animen, crea/obtén mediante el pipeline disponible un rig humanoide/específico correctamente mapeado, clips de idle/entry/attack/hit/guard/defeat/victory y comprueba el avatar/retargeting. Si no existe ninguna herramienta capaz de rig/animación en el entorno, reporta exactamente qué unidad queda bloqueada y continúa con entornos, props, tarjetas, FX y UI; no inventes una animación acabada.

### C2. Carpetas de producción

Usa el espacio de proyecto vigente. Antes de crear uno nuevo, comprueba si ya existe un catálogo de assets de producción. Si no existe, utiliza una estructura canónica como esta, adaptada únicamente para evitar duplicados:

```text
unity/Assets/VexforgeProduction/
  Art/
    Environment/Nexus/
    Environment/Battlefield/
    Environment/Archive/
    Environment/Forge/
    Environment/Missions/
    Environment/World/
    Environment/PackVault/
    Environment/Treasury/
    Environment/Social/
    Props/Shared/
    Props/Factions/
    Characters/Champions/
    Characters/Creatures/
    Materials/Stone/
    Materials/Metal/
    Materials/Crystal/
    Materials/Cloth/
    Materials/Leather/
    Materials/Arcane/
    Textures/
    VFX/
    Audio/Music/
    Audio/Ambience/
    Audio/SFX/
    Audio/Voice/
  Prefabs/Environment/
  Prefabs/Characters/
  Prefabs/Cards/
  Prefabs/VFX/
  Scenes/
  ScriptableObjects/VisualCatalogs/
  Animation/Controllers/
  Animation/Clips/
  Timeline/
  UI/
```

Crea `.meta` mediante Unity/AssetDatabase cuando sea posible. No escribir a mano GUIDs de assets importados ni reutilizar GUIDs. Si el proyecto ya tiene una estructura equivalente activa, amplíala; no dupliques los sistemas de recursos existentes.

### C3. Kit mínimo de producción, no sólo fondos

Genera e integra un kit coherente; los siguientes son entregables mínimos de producción y no una sugerencia visual:

**Arquitectura modular compartida:** módulos de suelo/pavimento, bordes de plataforma, escalones, muros, arco gótico, columna/contrafuerte, puerta monumental, torre/contrafuerte, almenas, balaustrada, ventanas, escultura/guardianes, soportes de estandarte y elementos de unión. Las piezas deben encajar modularmente con pivotes y escala coherentes.

**Props hero originales:** núcleo de forja, portal de batalla, pedestal/altar de cartas, archivador/relicario, brasero, cristales arcanos, mural/sello de facción, gran mesa de forja, tablero/mapa de misiones, pedestal de pack, cofre/bóveda, estandarte de alianza y marcadores de arena.

**Superficies/materiales:** piedra tallada, piedra húmeda, obsidiana, hierro envejecido, oro antiguo, bronce, cuero, madera oscura, pergamino, cristal azul, fuego/brasas y materiales de facciones según los datos oficiales. Materiales y texturas compartidos deben ser realmente reutilizados por prefabs, no duplicados por cada objeto.

**Props específicos por dominio:** cada escena debe incluir hero prop + secundarios funcionales + arte ambiental propio. No se permite que todas las escenas sean el mismo suelo con iluminación de diferente color.

**Cartas:** prefab físico de carta; variantes de material/marco correspondientes a las rarezas que existen en el catálogo actual; trasera oficial cuando exista en los datos; material frontal que no distorsione el arte original; estados seleccionado/en foco/bloqueado/listado/en combate sólo cuando esos estados estén presentes en el contrato de datos. No inventar una rareza si no la trae el catálogo.

### C4. Crear un catálogo canónico de recursos

Usa ScriptableObjects tipados o amplía el registro existente. Cada entrada debe tener ID estable, dominio, asset/prefab/clip, dependencias, material de calidad, versión y si es obligatorio para Release.

Separa explícitamente:
- `world/environment`;
- `world/prop`;
- `card/frame`;
- `card/back`;
- `vfx`;
- `audio`;
- `cinematic`;
- `ui`.

No reutilices `VF_CARD_FALLBACK_NEUTRAL` para ilustrar una escena de mundo. Si falta un asset no crítico se permite una alternativa visual diseñada para su propio dominio y estado; si falta un asset `identity_critical`, el verificador de Release debe fallar y dar el ID/ruta concreta.

---

## D. IMPLEMENTACIÓN POR DOMINIO — CADA UNO DEBE QUEDAR FUNCIONAL

### D1. Boot / Auth: entrada al mundo

Objetivo: primera entrada visual memorable sin sacrificar velocidad ni autenticación.

Ejecuta:
1. Inspecciona el flujo vigente de Auth y conserva llamadas, estados, validaciones y errores canónicos.
2. Sustituye la composición dominada por fondo negro/formulario plano por una escena de entrada propia: cámara con profundidad, umbral de ciudadela, luz clave visible, detalles ambientales discretos, emblema VEXFORGE integrado como objeto/material y un área de formulario legible.
3. El formulario puede usar UGUI por legibilidad, pero los materiales, frame, transiciones y relación espacial deben pertenecer a la dirección visual.
4. Loading y error no pueden ser pantallas negras sin explicación: muestran estado verificable, retry cuando sea seguro y un fondo de escena que no dependa de red.
5. Probar login, registro/recuperación si ya están implementados, sesión persistente, cierre de sesión, error de red y reinicio de aplicación. No modificar Auth para mejorar visuales.

### D2. Nexus / Home: ciudadela hub

Objetivo: la escena principal que identifique inmediatamente VEXFORGE.

Ejecuta:
1. Autoriza una escena `VEX_Nexus_Main` (o amplía la escena canónica equivalente) con geometría 3D y composición definida: foreground con suelo/braseros/objetos, midground con portales físicos y hero core, background con ciudadela/towers/bridges/far silhouettes, cielo/niebla atmosférica.
2. Genera modelos/props y materiales originales. No basar la escena completa en una única textura panorámica.
3. Construye cinco entradas, según rutas existentes: Archive/Collection, Forge/Deck, Battlefield/Battle, Missions y Treasury/Economy. Añade World/Social/Profile sólo si las rutas/capacidades canónicas actuales los soportan.
4. Cada punto interactivo tendrá indicador de foco, feedback de selección, collider propio y una animación breve controlada; la decoración no debe interceptar raycasts.
5. Los portales deben integrarse arquitectónicamente, no ser anillos planos de color con etiquetas flotantes.
6. Cámara móvil: órbita/parallax acotado o dolly controlado; ninguna animación debe bloquear input ni causar mareo.
7. Mantén clima/humo/brasas limitados y culling correcto. No llenar la pantalla de partículas para aparentar calidad.

### D3. Battlefield: arena, cartas, unidades, cámara y lógica visual

Objetivo: la batalla debe parecer un TCG terminado, no un debug board.

Ejecuta en orden:
1. Resuelve la inicialización de una única instancia de `BattlePresentationDirector` y su `VexforgeBattlefieldStage`. El dueño del runtime debe exponer una referencia explícita de ready/initialized al Bootstrap o al Battle Gate. Elimina la búsqueda por 600 frames y la reflexión como contrato principal. No uses `FindObjectsByType` repetidamente para enlazar sistemas obligatorios. Permite un solo controlador canónico de combate.
2. Diagnostica la condición actual que hace que `DiscoverAsync()` termine con `CAMPO DE BATALLA AÚN NO LISTO`. Añade logs de fase con owner/estado (no PII ni secretos) y una prueba de inicialización. No silencies el error, no cambies el estado a listo artificialmente.
3. Conserva el ciclo de combate y la autoridad del servidor. La capa de presentación consume los eventos existentes y nunca calcula/valida los resultados.
4. Crea una escena/prefab de arena con pavimento modular, relieve, círculo/zonas integradas en material/arquitectura, estandartes, guardianes, braseros, portal/puerta, horizonte y luz. Sustituye los cubos/planos/anillos visibles provisionales con mallas/prefabs de producción. Si necesitas colliders simples detrás de la malla, pueden quedarse invisibles.
5. Establece puntos/slots estables para bando rival, bando jugador, reserva, cartas en mano, objetivo y centro de evento. Cada punto debe ser transform explícito o parte del prefab, no una posición global inventada.
6. Crea `BattleVisualCatalog` que mapee `event_type`, identificadores disponibles (`actor_id`, `target_id`, `card_id`, `boss_id` cuando existan) y perfiles visuales a prefab/clip/material/FX/audio. El mapeo no debe asumir que todos los campos opcionales existen.
7. Implementa presentaciones mínimas: entrada/invocación, ataque, impacto, defensa/escudo, curación, estado/buff, muerte/derrota, boss/encuentro, victoria y derrota. Cada una usa el transform correcto del actor/objetivo; el VFX actual en `Vector3.up * .30f` no es una localización de impacto válida para toda acción.
8. Para cada evento, el orden visual será: evento autoritativo → resolver actores/targets → animación → cámara → VFX → audio → actualización de HUD. El HUD obtiene números y estado del payload canónico/refresh del servidor, nunca los inventa la animación.
9. Ataques: anticipación visual breve, movimiento dirigido, trail/impacto en el objetivo correcto, hit pause muy breve cuando convenga, cámara discreta y retorno controlado. Defensa: respuesta clara del material/escudo, no sólo color aleatorio. Curación: efecto asociado al objetivo y lectura positiva. Victoria/derrota: ceremonia diferenciada después de la confirmación real.
10. Ningún efecto o timeline puede retrasar indefinidamente la UI ni impedir navegar/reintentar; agrega timeout/finally y reset de cámara al salir/interrumpir.
11. Añade un modo de prueba visual con eventos de fixture sólo en Editor/Development, nunca en Release y nunca como sustituto de un combate real. No fabrica recompensas ni se mezcla con el backend.
12. Presentación vertical 9:19.5: battlefield ocupa el centro de pantalla; rival/estado arriba, zonas de unidades en centro, mano/acciones abajo con cartas legibles. La cámara no aplasta las cartas ni las deja fuera del Safe Area.

### D4. Collection / Archive / Card Inspector

Objetivo: las cartas oficiales son el centro de la identidad del producto.

Ejecuta:
1. Conserva el resolver restringido al host/bucket/path oficiales y su cache/lease. No descargar imágenes de cartas a `Assets/Resources` ni empaquetarlas como arte local.
2. Verifica el catálogo vivo y la cantidad real de cartas; el manifiesto consultado declara 127 pero el estado actual del backend manda.
3. Crea un prefab de carta de producción con malla/bisel/grosor/material/frame físico. Debe consumir la imagen oficial exacta. Si `image_url` es el render completo de la carta, no superpongas otro marco que tape nombres, estadísticas o adornos; determina el modo real usando registros/imagen fuente.
4. Implementa estados: loading, ready, inspect, focused, selected, locked/listed sólo si el backend da ese estado. Arte remoto ausente muestra un estado de error legible durante diagnóstico, nunca una carta negra silenciosa; no pone arte inventado.
5. La galería debe ser virtualizada/pool, no instanciar 127 objetos complejos y descargar 127 texturas a la vez. Solicitar arte visible y precargar el siguiente grupo bajo límite concurrente; liberar leases al reciclar.
6. Card Inspector: carta protagonista, cámara/tilt/parallax sutil, iluminación material del marco, sombra/reflejo controlado, información canónica legible y acciones existentes. No alterar ni regenerar la ilustración oficial.
7. Deck y Formation deben usar las mismas views/materials/card semantics para mantener consistencia sin duplicar carga de arte.
8. Prueba cada carta a través del pipeline completo con batches acotados y genera resultado por `card_id`: URL validada, HTTP correcto, content-type, descarga dentro de límite, decodificación `Texture2D`, dimensiones, asignación al renderizador, liberación de memoria y reentrada por cache.
9. Aceptación: 100% del catálogo canónico debe poder pasar las pruebas de datos/URL; cada imagen debe cargar/decodificar o producir un fallo tipado con identificador. No equivale a cargar todas simultáneamente. En el juego no deben aparecer tarjetas negras causadas por carga fallida sin diagnóstico.

### D5. Forge / Deck / Formation

Objetivo: una mesa de forja donde se construye una estrategia, no una cuadrícula de paneles.

Ejecuta:
1. Crea escenario propio de mesa/altar, herramientas, runas grabadas, portacartas, luz de fragua y profundidad de entorno.
2. La formación usa soportes/slots como objetos del mundo, pero cada operación continúa llamando a las rutas/contratos existentes para guardar y validar el mazo.
3. Las cartas usan el prefab común y sus estados, con movimientos de arrastre/tap suaves y feedback claro; añade alternativa accesible para selección por tap si hay drag.
4. Invalid deck/validation errors deben seguir llegando del sistema canónico; no añadas nuevas reglas locales.
5. Las animaciones de colocar/quitar carta no pueden cambiar el mazo hasta recibir resultado válido de la operación existente.

### D6. Missions / Quest hall

Objetivo: un salón de contratos/rutas con objetivos legibles y estado fiel al backend.

Ejecuta:
1. Diseña un muro de contratos/mapa tridimensional con nodos, sellos, pergaminos, relieve y luz dirigida. No se puede usar una lista vertical genérica como todo el dominio.
2. Cada objetivo muestra datos existentes, estado y recompensa exacta del contrato de servidor. No inventar progresos ni premios.
3. Las animaciones de claim/reward sólo corren tras respuesta canónica exitosa; si falla la red, revertir presentación provisional y permitir retry seguro.

### D7. World / Atlas / Boss / Raid

Objetivo: descubrimiento espacial con regiones de identidad propia.

Ejecuta:
1. Construye un atlas de escena con biomas/zonas/entradas como nodes físicos, materiales y silhouettes distintos; los datos/encuentros tienen que venir del catálogo/backend real.
2. Los boss/raid usan los IDs existentes para mapear prefab/presentation profile. Si no hay modelo específico, no uses cápsula genérica en Release; usa una presentación narrativa de carta/silueta diseñada como fallback explícito y registra el asset pendiente.
3. No anunciar zonas bloqueadas como disponibles si el backend no las desbloquea.

### D8. Packs / Store / Reward reveal

Objetivo: adquirir/abrir productos con ceremonia de videojuego sin falsear operaciones.

Ejecuta:
1. Crea vault/reliquary/mesa de apertura original, materiales y secuencia breve de apertura.
2. La secuencia usa el resultado real del servidor. No seleccionar cartas antes del `OpenPackResult` autorizado ni crear cartas de premio ficticias.
3. Permitir cancelar/omitir la secuencia; al volver, el estado/inventario debe seguir consistente.
4. El catálogo/precios/entitlements siguen siendo del backend/Store real; nada de precios de decoración ni oferta hardcodeada.

### D9. Treasury / Economy / Market

Objetivo: una bóveda física donde leer valor e historia de operaciones sin convertirlo en dashboard financiero.

Ejecuta:
1. Crear vault chamber, cajas/sellos/ledger físico y materiales legibles; números siguen siendo claros y exactos.
2. Cualquier saldo/fee/status procede del snapshot/resultado canónico. No inferir balances desde animaciones, no escribir tablas económicas directamente desde el cliente.
3. Los efectos de confirmación deben estar ligados a respuesta verificada; si pendiente, mostrar pending de manera inequívoca.

### D10. Social / Allies / Profile / Meta

Objetivo: comunidad y perfil dentro del mundo VEXFORGE.

Ejecuta:
1. Sala de alianzas/estandartes, pedestales de heraldry, identidad de perfil y presencia usando únicamente datos reales disponibles.
2. No inventar jugadores, clanes, noticias, actividad, rankings ni retratos de usuarios.
3. Los emblemas de facción pueden ser originales y propios, pero deben respetar los IDs/colores que existan en el catálogo actual.
4. Configuración, privacidad, accesibilidad y errores permanecen utilizables y claros, sin ocultarlos dentro de animaciones.

---

## E. CÁMARAS, ILUMINACIÓN, MATERIALES Y URP: CONFIGURARLO REALMENTE

No cambies a HDRP: el proyecto actual usa URP y el destino es Android. La mejor solución es exprimir URP de manera disciplinada, no cambiar de pipeline como excusa.

### E1. Perfiles de calidad

Crea perfiles configurables `Mobile`, `Balanced`, `High` (y `CinematicPreview` sólo para Editor/dispositivos realmente compatibles) mediante configuración central. `CinematicPreview` no debe forzarse en producción si cae rendimiento.

El criterio no debe basarse en resolución de pantalla como sustituto de GPU. Registra `SystemInfo` útil y realiza una prueba corta de capacidad/rendimiento; permite override en Settings. Ajusta target frame rate y calidad con mediciones y no reescribas configuraciones globales sin guardarlas/restaurarlas correctamente.

Objetivos de validación iniciales, sujetos a medición en los dispositivos reales:
- gama baja compatible: estabilidad próxima a 30 FPS sostenidos sin temperatura/memoria creciendo sin control;
- gama media/alta compatible: 45–60 FPS según perfil y capacidad real;
- no prometer 60 FPS en todos los teléfonos;
- no reducir la legibilidad de cartas al bajar resolución interna.

### E2. URP scene pipeline

1. Comprueba cuál `UniversalRenderPipelineAsset` está asignado en Graphics y en cada Quality Level. No crear un asset URP huérfano que no se utilice.
2. Crea un `VolumeProfile` autorado por escena. Usa Bloom de forma contenida; color grading con contraste legible; vignette mínima y nunca como forma de oscurecer media pantalla; Depth of Field sólo en cinemáticas/inspección controlada y no sobre HUD/cartas.
3. Key light direccional con sombras seleccionadas; hornea luz ambiental cuando la escena/objetos son estáticos; usa Light Probes para objetos móviles donde proceda; Reflection Probes para metal con número/coste razonable.
4. Iluminación de braseros/cristales: preferir emisión/material + luces baked/locales selectivas en vez de muchas luces realtime que proyecten sombras.
5. Fog/skybox deben aportar profundidad sin apagar los planos más cercanos. Comprueba exposición/móvil real; no dejar camera background casi negro como default para todos los estados.
6. Usa baked lightmaps con UV2 para geometría estática cuando aporte mejora; valide artefactos y memoria.
7. SSAO/decals/alta calidad de sombras sólo si el coste se comprueba en Android; aplica calidad por perfil. No activar features de alto coste sólo porque están disponibles.
8. Usa MaterialPropertyBlock o material compartido cuando corresponda; evita crear una nueva instancia de material cada frame/impacto. Libera mallas y materiales temporales.
9. En Unity 6/URP 17, revisa Render Graph y Frame Debugger. No añadas custom render passes sin comprobar su compatibilidad con Render Graph.
10. Shader Graph debe resolver materiales concretos (metal envejecido, energía arcana, borde/holografía de carta, cristal y efectos); evita un único shader universal con colores diferentes.

### E3. Modelado/importación y asset correctness

- Modelos de producción deben importar limpios sin missing materials, magenta shaders, normales rotas ni escalas inesperadas.
- Materiales URP usan `Universal Render Pipeline/Lit` o Shader Graph que funcione en el pipeline actual, no shaders Built-in incompatibles.
- Normal maps deben ser importados como Normal Map; metallic/smoothness en canales correctos; AO no se confunde con albedo; texturas no deben estirarse sin control.
- Establecer Max Size por tipo/uso y compresión Android según targets compatibles (ASTC si soportado, fallback ETC2/alternativa del proyecto), y verificar que la compresión no destruye detalles de cartas.
- Los modelos hero pueden conservar más detalle y LOD; props remotos usan LOD/Culling; batching/instancing para piezas repetidas cuando lo permita el material.
- Usa Occlusion Culling sólo si el layout y sus volúmenes tienen sentido; no activarlo ciegamente en una arena abierta.
- No utilizar VFX Graph por obligación. Primero verifica compatibilidad real URP/Android de la versión que ofrece Unity Package Manager. Si no es adecuada, emplea Particle System, Shader Graph y mallas de FX optimizadas; calidad visual no debe depender de un paquete que no corre en los móviles objetivo.

### E4. Cinemachine/Timeline

1. Comprueba si están instalados. Si no, selecciona las versiones que Unity Package Manager marque compatibles con el Editor `6000.3.0f1`; fija versión en manifest/lock y ejecuta compile test. No adivinar versiones.
2. Usa Cinemachine para cámaras de batalla, revelación de boss, inspección de carta y planos de victoria cuando la integración demuestre beneficio.
3. Usa Timeline para intro/transition/reveal/boss/victory/deck-ceremony sincronizando cámara, animación, FX y audio.
4. Timeline no decide resultados; solamente representa eventos confirmados. Toda secuencia se debe poder interrumpir, saltar o terminar al cambiar de ruta, recibir error o desactivar el objeto.
5. Evitar una cinemática de muchos segundos cada vez que se juega una carta. Planos de impacto cortos, el control del jugador prevalece y reduced motion elimina shake excesivo.

---

## F. LÓGICA DE PRESENTACIÓN: EL JUEGO DEBE SENTIRSE VIVO SIN INVENTAR REGLAS

Crea perfiles de presentación por tipo de evento y mapeo por identidad cuando el dato exista. El pipeline obligatorio es:

`EVENTO CANÓNICO -> RESOLVER ACTOR/TARGET -> ANIMACIÓN -> CÁMARA -> VFX -> AUDIO -> HUD/ESTADO VISUAL`

### Eventos mínimos

- `battle_start`/entrada a arena;
- `boss_start`/spawn/raid si el contrato lo usa;
- `play`/`summon`/`deploy`;
- `attack`/`strike`/`damage`;
- `guard`/`defend`/`shield`;
- `heal`;
- efectos/estados que existan en los payloads;
- `death`/eliminación;
- `victory`;
- `defeat`/fin de batalla.

Busca todos los valores de `event_type` en contratos/repositorio y crea un map completo de alias actual. No supongas que el string contiene siempre el mismo casing o que todos los eventos incluyen `card_id`/`target_id`. Los campos opcionales se deben resolver de forma segura y loguear como asset/event no mapeado.

### VFX

- Un sistema de pooling; no crear/destruir un GameObject en cada hit.
- Cada perfil define prefab, attach point, duration, quality profile, material/shader y trigger.
- El VFX queda anclado al actor/target real si el evento los identifica; fallback de centro del tablero sólo para eventos globales explícitos.
- Sin puntos aleatorios ni un único burst naranja para todas las acciones.
- Espectro de materiales por sistema de juego/facción sólo según datos canónicos y dirección de arte; el color debe ser semántico, no al azar.
- Efectos de muerte, curación, escudo, daño, invocación y victoria visualmente distinguibles a tamaño de pantalla móvil.
- Reduced motion y perfil mobile reducen partículas, screen shake y transparencias sin quitar información.

### Audio y voces

- Crear/usar un `AudioMixer` con grupos `Master`, `Music`, `Ambience`, `SFX`, `Voice` y guardar volumen/preferencia según sistema de Settings existente.
- Crear catálogo con cues obligatorios y tabla evento→cue. Validar archivos, duración, clipping/silencio, import settings y volumen relativo.
- Producir música original de identidad oscura/medieval, ambiente de Nexus/arena/forja y FX diferenciados. No descargar ni copiar música/sonido de Hearthstone, Master Duel, Marvel Snap u otros juegos.
- Voces: producir sólo las líneas para las que exista texto canónico aprobado. No inventar lore/personajes. Si la herramienta de voz disponible no proporciona calidad aceptable, mantener la pista como `VOICE_PENDING`, completar efectos/ambiente y registrar un bloqueo preciso; no llamar “voz final” a un placeholder TTS.
- Los eventos de sonido dependen de eventos canónicos. No reproducir victoria hasta recibir la victoria real.
- El verificador debe enumerar todos los cues requeridos que no existen. `Resources.Load` devolviendo null nunca puede pasar silenciosamente como “audio completo”.

---

## G. HERRAMIENTAS DE PRODUCCIÓN QUE DEBES USAR, NO SÓLO NOMBRAR

1. **Unity Editor + AssetDatabase:** importar y construir prefabs, materiales, ScriptableObjects, escenas y catálogos. No añadir archivos como texto sin comprobar que Unity los importa.
2. **Model import pipeline:** GLB con importer compatible probado o conversión FBX comprobada. Valida escala, UV, tangentes, materiales y colliders.
3. **URP + Shader Graph:** crea los shaders finales requeridos, inspecciona Render Pipeline Asset y profiles asignados.
4. **Lighting/Lightmapping/Probes:** prepara luz de escena y materiales, luego hornea/revisa artefactos. No crear toda la iluminación como luces puntuales por script.
5. **Cinemachine + Timeline:** sólo tras versión compatible e integración probada.
6. **Animator:** estados/clip mappings por actores seleccionados. El sistema debe recuperar estado al cancelar o cambiar de escena.
7. **Particle System/Shader Graph:** FX de impacto/energía con pooling y perfiles por calidad. VFX Graph sólo si se verifica su soporte real en la URP y hardware final.
8. **Profiler, Frame Debugger, Memory Profiler y Build/Render diagnostics disponibles en la instalación:** medir CPU, GPU, draw calls/batches, overdraw, memoria/texturas, GC, shader variants y carga. No dar números ficticios si una herramienta no se ejecutó.
9. **Play Mode y builds Development controladas:** capturar 1080×2340 portrait, logs, rutas y eventos; build final sólo después de que el pipeline esté listo para no consumir cuota en cada microtarea.
10. **Screenshots reales de Unity/runtime:** deben provenir del Game View/Device o APK ejecutado, no de un generador de imágenes. Las imágenes conceptuales no demuestran integración.

### Reglas al instalar paquetes

- No instalar todos los paquetes “por si acaso”.
- Verificar paquete y versión compatible con Unity 6000.3.0f1, revisar release notes y dependencias.
- Añadir una dependencia a la vez; reimport/compile-test; actualizar `manifest.json` y `packages-lock.json` coherentemente.
- Si un paquete falla o no es compatible con Android/URP, revertir sólo esa dependencia y usar alternativa soportada. No dejar package manifest roto.

---

## H. CAMBIOS DE CÓDIGO QUE DEBES EJECUTAR

### H1. Un dueño del runtime de presentación

- Inspecciona `GameShellController` y `BattlePresentationDirector`.
- Asegura que el propietario canónico crea/inicializa la escena y director una única vez y expone estado/evento de listo.
- El Bootstrap se suscribe al ready event o recibe referencias explícitas. No usa reflection sobre campo privado como contrato. No busca el director todos los frames de inicio.
- Battle Gate no hace consultas de combate ni búsqueda de rivales hasta que la presentación esté inicializada, pero el estado de inicialización debe tener timeout/respuesta y diagnóstico real.
- Al salir/auth signout/destruir, desconecta subscriptions, cancela tasks/corutinas y libera recursos sin alterar operaciones de servidor pendientes.

### H2. Catálogo visual en lugar de generación de geometría final por código

- Mantén scripts de interacción y navegación como control.
- Introduce referencias serializadas/ScriptableObjects para escenas/prefabs/materials, con validador.
- Reemplaza `CreatePrimitive` en la ruta final de Nexus/Battle/CardView por instanciación de prefab de producción.
- Si el catálogo no está asignado en Release, no generar un falso mundo con cubos: la validación de build debe fallar mostrando el asset ID; en Development se puede habilitar un modo prototipo explícito.
- Prohíbe material instantiation por cada frame, leaks de Mesh/Material, decoraciones con colliders que roben input y efectos sin límite.

### H3. Fallbacks y errores visibles

- Cada asset crítico obtiene resultado de carga: `READY`, `MISSING_FILE`, `IMPORT_FAILED`, `MATERIAL_MISSING`, `NOT_IN_BUILD`, `URL_REJECTED`, `HTTP_ERROR`, `DECODE_FAILED` u otro código tipado apropiado.
- Una escena no se marca `ready` si su catálogo obligatorio no está cargado.
- Los fallbacks se definen por dominio. Una pantalla de error todavía se debe ver diseñada, pero nunca simula que la escena está operativa.
- Los errores técnicos quedan en logs con asset ID y ruta, sin secretos ni PII.

---

## I. CONTENIDO FINAL OBLIGATORIO POR PANTALLA

Implementa estas identidades sin cambiar el significado funcional de las rutas existentes:

1. Boot/loading/auth.
2. Nexus/Home.
3. Battle Gate/selección de rival.
4. Battlefield durante combate.
5. Resultado/victoria/derrota.
6. Collection/Archive.
7. Card Inspector.
8. Forge/Deck/Formation.
9. Missions/Quest Hall.
10. World/Atlas/Boss/Raid donde estén soportados.
11. Pack Vault/Pack Opening.
12. Store.
13. Treasury/Economy/Market donde estén soportados.
14. Social/Allies/Clan donde esté soportado.
15. Profile.
16. Settings/error/loading/empty states de todos los dominios.

Descubre las rutas reales presentes en el código. No elimines subpantallas o estados porque no aparezcan en esta lista. No crees datos ficticios para llenar una pantalla vacía; diseña el empty state en el mismo mundo visual y explícita por qué está vacío.

### Diferenciar los dominios

- Nexus: arquitectura de hub monumental y rutas espaciales.
- Battle: lectura competitiva, siluetas, foco de cámara e impacto.
- Archive: luz de galería/archivo que pone el arte original de las cartas en primer plano.
- Forge: mesa, herramientas y formación física.
- Missions: mural de contratos/rutas y sellos.
- World: descubrimiento, escala y regiones.
- Pack Vault: reliquario/altar de apertura.
- Treasury/Market: cámara/bóveda con lectura precisa de la economía.
- Social: salón de alianzas/estandartes sin datos falsos.
- Profile: presencia del jugador y su progreso real.

Las escenas pueden compartir arquitectura modular, pero no repetir el mismo prefab grande con diferente color como solución para todos los dominios.

---

## J. ORDEN DE EJECUCIÓN PARA REPLIT — HAZLO EN ESTE ORDEN

Cada bloque debe acabar con implementación real y commit pequeño. No escribir el plan de todos los bloques y esperar instrucciones.

### BLOQUE 0 — Fingerprint en un máximo de una pasada

1. Registra `git rev-parse HEAD`, `git status --short`, `git log -1 --oneline`, Unity version, manifest/lock y escenas incluidas en build.
2. Ejecuta una única inspección de rutas/recursos con el tool opcional incluido en `Tools/VexforgeVisualProductionGate.cs` (si lo copias a `unity/Assets/Editor/`, usa `VEXFORGE/Production/Run Visual Production Gate`). Si el script no compila, arréglalo o ejecuta comandos equivalentes.
3. Guarda el resultado en un único archivo de estado de implementación dentro del repo, no una colección de informes repetidos. Esta inspección no es el entregable final y no puede consumir la sesión entera.
4. Comprueba que los hallazgos descritos en sección A siguen coincidiendo con `HEAD`. Si un archivo cambió, actualiza el mapeo interno y continua.

### BLOQUE 1 — Fix crítico de inicialización

1. Reproducir en Play Mode el estado de `CAMPO DE BATALLA AÚN NO LISTO` si el Editor lo permite.
2. Crear instrumentación de fases para `VexforgeApp`, `GameShellController`, `BattlePresentationDirector`, `VexforgeBattlefieldStage`, `VexforgeTier1Bootstrap` y `VexforgeTier1BattleGate`.
3. Eliminar el enlace obligatorio mediante reflection/polling y conectar explícitamente la única presentación canónica.
4. Ejecutar test que pruebe `not initialized → initialized → bound → battle gate can discover`; si falla, el test debe identificar el componente faltante.
5. No iniciar la producción de pantallas nuevas usando un ciclo de vida roto. Commit funcional con una prueba y sin cambios de economía/backend.

### BLOQUE 2 — Asset import, manifest y card telemetry

1. Validar los resources locales declarados para los hero assets del manifiesto.
2. Asegurar que el verificador diferencia `card art remote` de `world/art local`.
3. Reemplazar el fallback mundial a arte neutral de carta por política correcta por dominio.
4. Añadir diagnóstico de carga, decodificación y asignación de carta.
5. Ejecutar el test del catálogo completo en batches; no cargar todas a la vez. Commit.

### BLOQUE 3 — Nexus completo de producción

1. Generar/importar el kit arquitectónico modular y props originales requeridos.
2. Crear materiales PBR/URP y prefabs con pivotes/escala correctos.
3. Crear/autorizar escena y cámaras, luz, fog, probes/lightmaps/Volumes.
4. Rehacer la representación de Nexus para instanciar los prefabs/catálogos.
5. Mantener rutas existentes y probar cada hotspot.
6. Capturar Game View real en portrait. No pasar este bloque con cubos/monolitos provisionales visibles. Commit con assets y código juntos.

### BLOQUE 4 — Battlefield y Presentation Director

1. Construir/autorizar la arena real y prefabs.
2. Sustituir placeholders visibles y anchors geométricos por slots de escena.
3. Implementar mapeo actor/target y VFX/audio de cada evento canónico.
4. Integrar cámara y secuencias con paquetes compatibles o soluciones Unity ya disponibles.
5. Probar fixture en Development y combate real usando respuesta canónica. Confirmar que no cambia el resultado de servidor.
6. Capturar combate real en portrait; commit.

### BLOQUE 5 — Prefab de carta y 127 cartas

1. Construir prefab de carta y materiales de rarities reales.
2. Conectar al resolver/cache actual y asegurar release de leases.
3. Integrar colección, detalle, deck y mano de batalla.
4. Verificar 127/todo el catálogo vivo mediante pipeline de carga completo; el reporte debe mostrar fallos individuales y resultado global.
5. Capturar cards reales desde Supabase dentro de Unity; commit.

### BLOQUE 6 — Forge/Deck, Missions, World, Packs y dominios económicos/sociales

Hacer un dominio por commit o grupo lógico, sin duplicar repositorios/datos/rutas. Cada dominio debe recibir escena/props/materiales propios, datos reales y estados de loading/empty/error. Ninguna animación puede falsificar operaciones canónicas.

### BLOQUE 7 — Cinemáticas, audio, VFX final

1. Producir clips/cues originales, catalogarlos e integrarlos.
2. Crear cinemáticas cortas autoradas: entrada al Nexus, apertura de arena, invocación/boss cuando exista, inspección de carta y resultado.
3. Verificar skip/reduced motion/route change/low profile.
4. Si voces no pueden generarse con calidad aprobada por las herramientas disponibles, dejar `VOICE_PENDING` explícito y no declarar audio completo; seguir cerrando el resto.

### BLOQUE 8 — Hardening visual y rendimiento

1. Eliminar todos los placeholders visibles y los black fallback paths.
2. Validar referencias rotas/materiales magenta/mesh missing/clip missing/shader fallback/asset-stripping.
3. Medir CPU/GPU/memoria/GC/texture memory/overdraw/frame time en los dispositivos a los que pueda accederse. Si no hay dispositivo físico, marcar ese gate como no verificado, no aprobarlo ficticiamente.
4. Build de Android solamente cuando el estado del source haya alcanzado release-candidate, para no quemar cuota en cada microtarea.
5. Si la compilación no está disponible por cuota/infraestructura, terminar la integración y compilación de Editor/validators que sí puedan ejecutarse, guardar el error exacto y no declarar APK final.

---

## K. GATES DE CALIDAD: NO ACEPTAR “SE VE MEJOR” SIN EVIDENCIA

### K1. Gate técnico

- Cero errores de compilación C#.
- Cero errores de importación de assets críticos.
- Cero materiales magenta o shaders incompatibles en escenas requeridas.
- Cero referencias perdidas en prefabs/escenas/animators/timelines.
- Bootstrap/Scene owners inicializados de forma determinista.
- No hay doble subscribe/doble director/doble estado de combate.
- No se modifica Auth, Supabase, RPC/DTO ni economía fuera de lo estrictamente necesario y aprobado por contrato.
- Toda mutación del juego sigue esperando resultado del servidor.

### K2. Gate de contenido visual

- Ninguna superficie negra por falta de asset en flujo normal.
- Cero cubos/cápsulas/planos/anillos geométricos usados como arquitectura final visible en Nexus, Battlefield, Archive o Forge.
- Los hero assets `identity_critical` del catálogo existen, importan y son referenciados por la escena que los necesita.
- Todas las cartas del catálogo vivo se prueban individualmente: acceso a URL correcta, imagen decodificada y asignación al material/renderizador.
- Las escenas principales poseen fondo, midground, foreground, iluminación y objeto protagonista; no una única imagen plana.
- Cada dominio es reconocible por su composición/material/prop, no sólo por el título.
- Todas las animaciones se pueden cancelar/terminar sin dejar cámara, material, UI o estado bloqueado.
- El sonido de cada cue requerido tiene un asset real que valida su importación.

### K3. Gate visual por puntuación interna

Puntúa cada escena del 0 al 10 en: identidad VEXFORGE, composición, profundidad, materialidad, iluminación, integración de cartas/datos, motion, audio, legibilidad móvil y consistencia/bugs. Adjunta una captura real por escena y la justificación breve. Cualquier dimensión menor a 8 obliga a una corrección concreta. No presentar una media de 9 si una escena principal queda con agujeros visuales o con assets faltantes.

La puntuación es un control interno, no una certificación de que el juego supera a los competidores. La comparación final se hace con juego ejecutándose, no con una ilustración generada.

### K4. Gate de rendimiento móvil

- Medir al menos un recorrido de 10 minutos si se dispone de dispositivo físico; registrar FPS frame-time, memory, GPU/CPU, calentamiento y cargas.
- Comparar Balanced/High en dispositivo real; no basar toda la selección en RAM declarada/resolución.
- Limitar partículas, transparencias, luces realtime, sombras, postproceso y cargas de textura según datos del profiler.
- Sin allocs continuos descontrolados ni crecimiento sostenido de memoria en navegación/combate.
- Safe Area, texto y objetivos táctiles correctamente colocados en resoluciones target.

### K5. Gate de evidencia

Por cada bloque entregar dentro del repo:
- commit SHA;
- archivos creados/modificados;
- assets reales integrados;
- validaciones ejecutadas con salida;
- capturas del Game View/runtime real;
- fallos pendientes exactos.

No uses la imagen generada por IA como evidencia de la escena Unity. No uses sólo screenshots del Editor en modo edición si el objetivo es demostrar runtime.

---

## L. GOBERNANZA DE CAMBIOS Y LÍMITE DE CUOTA

- Trabaja directamente sobre el branch/HEAD actual que el owner haya establecido como canónico.
- Antes de tocar, fingerprint. No cambies archivos ajenos al bloque sin causa documentada.
- Cada commit contiene un incremento real y compilable/importable, no un enorme batch imposible de revisar.
- No hacer builds Android completos en cada microtarea; hacer validación de scripts/assets y Play Mode; reserva una build de candidato al cierre.
- No repetir la misma auditoría después de cada tarea. Mantén un único estado `docs/visual-production/EXECUTION_STATE.md` con campos: HEAD, bloque actual, commits hechos, assets completos, escenas completas, gates PASS/FAIL/NOT_RUN, bloqueador real y próxima acción exacta.
- Si la cuota de Replit se acaba, deja el último bloque real committed y la próxima tarea escrita en ese estado. En la siguiente sesión continúa desde esa tarea, sin volver a analizar el repositorio desde cero salvo que haya cambiado el HEAD.
- No inventar PASS. Usa `PASS`, `FAIL`, `BLOCKED` o `NOT_RUN` con evidencia.

---

## M. DEFINITION OF DONE

VEXFORGE no está terminado cuando “tiene todas las pantallas” ni cuando compila.

Está listo para revisión de candidato cuando:

1. La inicialización canónica de combate está arreglada y probada.
2. Nexus, Battlefield, Archive/Collection y Forge han sustituido su presentación provisional por contenido visual real autorado y son interactivos.
3. Las 127 cartas (o el número verificado del catálogo actual) cargan su arte oficial desde Supabase sin copias locales y sin tarjetas negras silenciosas.
4. Las demás escenas/dominos de la lista están completadas con recursos propios y funcionales o etiquetados con bloqueador real; ningún bloque importante queda falsamente anunciado como listo.
5. Los eventos de batalla ejecutan animación/cámara/VFX/audio coherentes con actor/target/resultado reales.
6. Cinemáticas y audio están integrados o su bloqueo exacto está declarado; sin assets de audio falsos.
7. URP profiles, materials, lights, textures, LOD/pooling y quality settings están medidos, no sólo declarados.
8. Asset/build validation no detecta referencias rotas, recursos críticos faltantes ni fallbacks negros.
9. La compilación de Editor y Android ha pasado cuando la infraestructura/cuota lo permita; cualquier gate no ejecutado figura como `NOT_RUN`.
10. Hay capturas/registro de gameplay real del candidato y lista del estado de cada gate.

**Empieza ahora por el Bloque 0, limita la inspección a una pasada y continúa inmediatamente con el Bloque 1. El primer resultado de implementación de la sesión no puede ser otro documento: debe ser el arreglo comprobable del ciclo de vida de Battle o, si se demuestra otro bloqueo anterior, la corrección de ese bloqueo con test y commit. Después produce assets reales y reemplaza las escenas de prototipo en la secuencia indicada.**

---

## N. REFERENCIAS TÉCNICAS OFICIALES

Usa estas referencias para decisiones técnicas actuales, junto con las versiones instaladas y release notes del Package Manager:

- Unity Project Version (`main`): https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/ProjectSettings/ProjectVersion.txt
- Unity Package manifest (`main`): https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/Packages/manifest.json
- URP 17 / Unity 6: https://docs.unity.com/en-us/engine/6000.0/manual/render-pipelines/universal-render-pipeline/urp-whats-new
- Cinemachine + Timeline shots: https://github.com/Unity-Technologies/com.unity.cinemachine/blob/main/com.unity.cinemachine/Documentation~/concept-timeline.md
- Render Graph URP: https://docs.unity.com/en-us/engine/6000.5/manual/render-pipelines/universal-render-pipeline/customizing-urp/render-graph/introduction
- VEXFORGE Nexus root: https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/Assets/Scripts/Presentation/NexusPresentationRoot.cs
- VEXFORGE Battlefield stage: https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs
- VEXFORGE Card View: https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/Assets/Scripts/Presentation/VexforgeCardView.cs
- VEXFORGE card resolver: https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/Assets/Scripts/Presentation/VexforgeCardArtResolver.cs
- VEXFORGE Tier1 Bootstrap: https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/Assets/Scripts/Tier1/VexforgeTier1Bootstrap.cs
- VEXFORGE manifest: https://raw.githubusercontent.com/grandmaster68081-byte/Vexforge-web/main/unity/Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json

**Fin de la orden. Ejecutar; no reinterpretar como encargo de documentación.**
