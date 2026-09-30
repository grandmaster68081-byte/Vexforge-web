# 31 — VEXFORGE: VISUAL PRODUCTION ROADMAP (FREE, ANDROID, SIX-HOUR CI)

- **Fecha:** 2026-09-30.
- **Ruta para iniciar cada sesión:** `VEXFORGE_CONTEXT.md` → `docs/vexforge-canonical/00_START_HERE.md` → este archivo.
- **Base analizada:** `main` `738295dded931f9f6a7f86627786385f7892655f`.
- **Alcance:** apariencia, arte, composición, escenas, iluminación, VFX, animación, UI presentation, sonido visualizado y presupuesto Android/CI. No se rehacen reglas, estadísticas, balances, clanes, guerras, mazmorras, bosses, PvP/PvE ni datos live.
- **Recomendación técnica elegida:** mantener el cliente Android existente en **Unity 6.3.0f1 + URP 17.3.0** como runtime/renderer; aprovechar los sistemas y el pipeline que ya existen. **No migrar el juego a Unreal Engine.** Usar Fab sólo para assets gratuitos, licenciados y compatibles con Unity, complementados con arte propio hecho en herramientas gratuitas.
- **Costo esperado:** $0 en assets/plugins nuevos y builds estándar de GitHub Actions del repositorio público. Esto depende de usar sólo los tiers/licencias elegibles y no garantiza que cualquier tercero, servicio, asset o storage sea gratis.

## Texto breve para copiar en la introducción de cada sesión

> Lee `VEXFORGE_CONTEXT.md`, `docs/vexforge-canonical/00_START_HERE.md` y `docs/vexforge-canonical/31_VISUAL_PRODUCTION_ROADMAP.md` antes de trabajar. Para la presentación del juego, continúa en el Unity Android existente (Unity 6.3.0f1 + URP 17.3.0); no migres a Unreal ni reactives Expo. Enfócate sólo en elevar la calidad visual del contenido ya existente: escenas, arte, composición, iluminación, animaciones, VFX, presentación de cartas y audio ligado a eventos. Conserva los contratos, eventos, reglas, stats, clanes, guerras, mazmorras, bosses, PvP/PvE y Supabase sin cambios. Prioriza reemplazar placeholders genéricos con arte original/reutilizable y assets Fab que sean gratis, compatibles con Unity y tengan licencia verificada. Antes de añadir assets/shaders, corrige y mide el presupuesto de variantes: no lances `normal`/`final` mientras sigan sin límite, no repitas las ~287.000 variantes, y mantén cada job GitHub Actions en menos de 6 horas. Todo cambio de código y documentos va a `main`, verificado; no pagar assets/plugins, no escribir Supabase ni hacer builds de producción sin su gate.

## 1. Por qué esta es la mejor ruta para este proyecto

El repositorio no parte de cero: ya contiene el cliente Unity para Android, URP, backend/repositories, un sistema de eventos de batalla para presentación, resolutores de arte, directores de escena/VFX/audio, perfiles `Mobile / Balanced / Cinematic`, un validador Tier 1, manifiestos de recursos y un workflow Android. La base ya expone eventos de boss, entrada de carta, ataque/impacto, defensa, curación, derrota y victoria. La mejora de mayor valor es **sustituir la presentación genérica y cerrar el pipeline de arte**, no reescribir la lógica ni cambiar de motor.

La inspección concreta encontró que `VexforgeBattlefieldStage` compone la arena con primitivas Unity (`Cube`, `Cylinder`, anillos y marcadores) y crea un `BattleEntryFallback` cuando no hay vista de carta disponible. Es correcto como base funcional, pero explica por qué el escenario puede sentirse simple. `VexforgeTier1VisualFoundation` ya ajusta efectos/postproceso por nivel de dispositivo; se debe calibrar y alimentar con contenido final, no sustituirlo por una cadena más costosa.

**Unreal Engine no es la mejor ruta de ejecución para el objetivo actual.** La licencia de Unreal para juegos comienza sin costo y su royalty estándar sólo aplica después de los primeros USD $1M de ingresos brutos de cada producto; el costo que nos importa aquí es migrar el cliente y construir un pipeline Android que hoy no existe. Además, la referencia oficial de UE 5.8 marca Nanite y Lumen GI/reflections como no disponibles en los perfiles mobile documentados; el Desktop Renderer en Android/Vulkan figura experimental. Una migración no aportaría esos atajos visuales al público Android y sí obligaría a reconstruir integración, escenas, UI y CI.

Epic sí aporta algo útil sin cambiar de motor: **Fab** ofrece assets gratuitos permanentes y promociones gratuitas limitadas. La licencia Standard permite usar contenido en herramientas compatibles, no sólo Unreal; cada publicación tiene que verificarse individualmente. Se excluyen contenido `UE-Only`, assets pagados, plugins y material que no pueda redistribuirse integrado en el juego. La licencia no permite redistribuir el asset suelto.

Para el motor existente, Unity Personal ofrece uso gratuito si la persona/organización se mantiene dentro del límite publicado de menos de USD $200K entre ingresos y fondos recaudados en los últimos 12 meses. Confirmar la elegibilidad de la cuenta antes de continuar con esa licencia.

## 2. Hallazgos de código y límites actuales

### Ya existe — preservar y terminar

- Unity `6000.3.0f1`; `com.unity.render-pipelines.universal` `17.3.0`.
- Presentación por eventos de backend en `unity/Assets/Scripts/Presentation/VexforgeBattlefieldStage.cs` y dirección complementaria en `unity/Assets/Scripts/Presentation/BattlePresentationDirector.cs`.
- Calidad/posprocesado adaptativo en `unity/Assets/Scripts/Tier1/VexforgeTier1VisualFoundation.cs`.
- Arte de cartas mediado por el resolver/manifiesto; el validador prohíbe copiar ilustración oficial al cliente (`local_card_art_copy_forbidden` / `copy_to_client_repo=false`). **No romper ese gate ni incluir arte oficial duplicado localmente.**
- Validación central en `unity/Assets/Editor/VexforgeTier1BuildValidator.cs`.
- Material existente que se debe inventariar y reutilizar, no duplicar: `docs/ART_DIRECTION.md`, `docs/ART_GENERATION_BIBLE.md`, `docs/VE-1-VISUAL-BIBLE.md`, `docs/vexforge-tier1/03_BATTLEFIELD_VISUAL_SYSTEM_V15.md`, `04_CINEMATOGRAPHY_VFX_AUDIO_V15.md`, `12_ASSET_PIPELINE_V15.md`, `16_VISUAL_CLOSURE_V15.md`, `VISUAL_QA_MATRIX.md`, `ART_ASSET_MANIFEST.json` y manifiestos Unity.

### Bloqueo de build antes de producir más shaders

- El workflow `.github/workflows/vexforge-unity-android-github.yml` declara `timeout-minutes: 360`, el máximo de 6 horas por job hosted según GitHub.
- El workflow documenta un inventario cercano a **287.000** variantes, sharding en 12 partes y cap **35.000 por shard**. Eso es una estrategia de inventario/diagnóstico, no un presupuesto aceptable del build final.
- Las rutas `normal` y `final` llaman al build Android sin límite de variantes. **No lanzar esos modos mientras no se aplique el mismo preflight/stripping y hard cap a la ruta real de producción.** Una ejecución que termina en 6 horas por timeout no es un build exitoso.
- El repo es público. GitHub declara gratuitas las ejecuciones estándar en repos públicos; cada job hosted aun así tiene límite máximo de 6 horas. Mantener artefactos/logs dentro de las reglas de almacenamiento.

El 2026-09-30 Supabase reportaba `art_direction=70`, `interface_life=80` y `audio_production=45` frente a mínimo 85; es una lectura histórica, no se alteró la base de datos. Esta hoja no pretende convertir el score en una medida de belleza.

## 3. Ruta de trabajo por gates

### V0 — Cerrar baseline visual y build-budget

1. Inventariar la escena/battlefield real, cámaras, fondos, materiales, assets, resolutores, manifiestos y los documentos de dirección ya listados. Marcar cada pieza `REUSE`, `REPLACE`, `MISSING` o `FORBIDDEN`; no regenerar sistemas de gameplay.
2. Capturar baseline visual en Android del estado actual y clasificar placeholders reales. Separar una limitación de arte de una limitación del render o de la resolución del recurso.
3. Ejecutar análisis de shaders/URP desde el workflow de inventario existente sólo si está por debajo del presupuesto acordado; reutilizar los artefactos históricos válidos. No volver a generar el inventario de 287k como prueba ordinaria.
4. Auditar por qué `normal/final` evitan el límite. Rehacer el preflight para que reporte variantes estimadas antes de compilar, aplique stripping Android a todas las calidades y detenga el build si rebasa el presupuesto.
5. Fijar una meta inicial de **≤35.000 variantes incluidas en el perfil Android de producción** (es el techo actual por shard, ahora propuesto como presupuesto total de la configuración primaria). Validar el conteo requerido con prueba de runtime/strict variant matching; si una visual necesita excederlo, optimizar shaders/keywords o cambiar el recurso, no recuperar las 287k variantes por sharding.
6. Medir un build completo limpio en runner estándar: objetivo de trabajo **≤4 h** para dejar margen; tope duro **<6 h**. Registrar commit, runner, tiempo, tamaño de APK, conteos de variantes y artefacto. No se promete el tiempo hasta que la prueba real pase.

**Salida:** inventario de contenido y pipeline protegidos por un gate; ningún asset nuevo puede hacer crecer el build sin un reporte comparable.

### V1 — Firma visual no genérica

Partir de los documentos de arte existentes. Resolver una sola gramática reconocible para todas las rutas: siluetas, forma del escenario, jerarquía focal, escala, valores de color, materiales, iluminación, tipografía y transición. Reforjar la dirección existente sólo donde la QA demuestre una brecha; no inventar lore ni reemplazar el branding canónico.

Crear cuadros guía de 3 momentos: lectura de tablero en estado idle, acción de carta/impacto y entrada de boss/victoria. Deben conservar legibilidad de las cartas y del campo en móviles; el fondo nunca compite con el turno.

**Salida:** una hoja visual breve enlazada a la biblia existente, más un comparador de capturas antes/después; no una biblia paralela.

### V2 — Una arena insignia, terminada de punta a punta

Reemplazar el suelo, cubos, anillos y obeliscos genéricos por un escenario original de capas reutilizables, silueta clara, profundidad, iluminación controlada y puntos de interés ligados al mundo oficial. Terminar una composición completa (fondo, campo, zonas, cámara, personaje/amenaza, UI y efectos de ambiente) antes de producir variantes de todas las mazmorras.

El resultado deberá jugar sobre la escena existente y usar los eventos que ya entrega el juego. No se crean reglas de combate ni estados simulados para que la animación “parezca” correcta.

**Salida:** escena y secuencia de combate capturadas en Android, sin fallback primitivo visible, con todos los materiales correctamente compilados.

### V3 — Biblioteca de animación/VFX con dirección

Elevar las respuestas que ya existen: entrada de carta, invocación, ataque, bloqueo, impacto, curación, destrucción, transición de fase, llegada de boss y resultado. Cada familia tiene anticipación, contacto, lectura del resultado y recuperación; duración/jerarquía por importancia; animación cancelable al cambiar de escena o perder visibilidad. Usar cámara/luces/partículas/materiales a favor de la lectura, no ruido constante.

Compartir el mínimo de shaders/materiales. Preferir una cantidad pequeña de Shader Graphs optimizados y variar parámetros de material; no crear keywords exclusivas por cada carta/efecto. Mantener efectos compatibles con las GPUs objetivo y con el perfil `Mobile`.

**Salida:** cada `BattleEvent` esperado produce una respuesta visual deliberada; eventos desconocidos no inventan outcomes y la UI conserva accesibilidad/legibilidad.

### V4 — Aplicar el kit a clanes, guerras, mazmorras, bosses, PvP y PvE

Envolver los sistemas ya creados con identidades visuales, escenas y transiciones que los distingan, reutilizando modelos base, materiales y animaciones cuando el contenido lo permita. Los bosses reciben entrada, fase y derrota propias; las mazmorras, una secuencia ambiental; los modos PvP/PvE mantienen lectura común del campo y diferencian su contexto, no una copia genérica de la misma arena.

Producir por lotes pequeños; no importar packs completos de Fab con materiales/texturas que el juego no usa. Cada asset incluye procedencia/licencia, tamaño, formato, textura/LOD y ruta de uso; retirar assets que no aporten identidad o excedan el presupuesto.

### V5 — Perfiles Android y cierre de calidad

Conservar las tres intenciones actuales (`Mobile`, `Balanced`, `Cinematic`) y probarlas en dispositivos representativos antes de subir detalle. Medir frame time, memoria, carga de textura, overdraw, draw calls, calentamiento, navegación entre escenas y tamaño de paquete; fijar targets tras conocer los dispositivos reales. En teléfonos de gama baja reducir postproceso/partículas, no la legibilidad ni el arte principal.

Ajustar stripping URP en todos los `URP Asset` incluidos; mantener strict shader variant matching en QA para descubrir shaders faltantes. No elevar calidad basada sólo en RAM/resolución; hacer un test de escena y temperatura en dispositivo real.

**Salida:** cada perfil mantiene el mismo diseño y resultados visuales, con escalado documentado; el build Android de producción pasa el cap de variantes y termina bajo el objetivo temporal.

## 4. Presupuesto y herramientas gratuitas

- **Unity:** editor/runtime existente; Unity Personal sólo si se cumple la elegibilidad oficial vigente.
- **Epic/Fab:** seleccionar únicamente recursos marcados gratuitos al adquirirlos y compatibles con Unity. Guardar identificador, autor, licencia, fecha de adquisición y formato; revisar si es Standard, CC-BY o `UE-Only`. No contar con promociones temporales para assets que aún no están en el proyecto.
- **Autoría gratuita complementaria:** Blender para modelado/rig/animación; Krita o GIMP para texturas/ilustración; herramientas incluidas de Unity para URP/Shader Graph/Particle System. No introducir plugins, packs o servicios que requieran pago después del prototipo.
- **Assets:** mantener el arte oficial de cartas por el resolver/manifiesto aprobado; crear/importar sólo escenarios, props, FX, transiciones y recursos con uso/derechos válidos. Comprimir textura/audio y limitar resoluciones según el baseline de dispositivos; el tamaño máximo se fija en V0.
- **CI:** repo público + runner estándar; una ejecución de release por gate, timeout de workflow inferior a 360 minutos. El historial de shards sólo sirve de herramienta diagnóstica, nunca para ocultar un build final que no termina.

## 5. Definition of Done visual

- La escena de batalla deja de depender de primitivas/fallbacks para aparentar producción; todo elemento visible es arte intencional, animado y validado o un placeholder marcado fuera del release.
- Dirección consistente entre home, colección, cartas, batalla, boss, misión, clan y resultado; transiciones y feedback siguen la importancia de la acción.
- Se conserva el resolver de arte/ownership; cero copias locales prohibidas de arte oficial.
- Capturas/video reproducibles de los momentos guía en perfiles y dispositivos acordados; se incluyen fallos de textura/shader, calidad baja, interrupciones y recarga.
- Auditoría de licencias y procedencia completa para cada recurso externo; cero compras o plugins pagados.
- Build Android normal/final protegido por preflight; conteo de variantes y duración archivados; compilación de release completa bajo seis horas con margen medido.
- No se llama “calidad de competición” a un mockup o una escena de editor; se verifica en runtime instalado.

## 6. Alcance que no se toca

No tocar reglas, stats, matchmaking, balance, rewards, economía, tablas/RPC, auth/RLS, Supabase, cartas canónicas, flujos funcionales de clanes/guerras/mazmorras/bosses/PvP/PvE, identidad de marca, ni el portal web. Si un defecto visual depende de una acción/evento inexistente, documentarlo como dependencia del propietario y continuar con los eventos presentes. La mejora visual jamás puede aparentar que el backend confirmó algo que no confirmó.

## 7. Fuentes oficiales consultadas el 2026-09-30

- Unreal mobile rendering features 5.8: https://dev.epicgames.com/documentation/unreal-engine/rendering-features-reference?lang=en-US
- Unreal Engine licensing: https://www.unrealengine.com/license
- Fab Standard License: https://www.fab.com/eula?lang=en
- Fab free content: https://www.unrealengine.com/fabfreecontent
- Unity Personal eligibility: https://unity.com/products/unity-personal
- Unity 6.3 shader variant stripping: https://docs.unity3d.com/6000.3/Documentation/Manual/shader-variant-stripping.html
- GitHub Actions limits: https://docs.github.com/en/actions/reference/limits
- GitHub Actions billing: https://docs.github.com/en/billing/managing-billing-for-github-actions

La primera unidad de implementación, cuando se inicie, es **V0: inventario visual más presupuesto de build**. No producir un paquete grande de arte antes de que el build Android de producción tenga un límite real de variantes.
