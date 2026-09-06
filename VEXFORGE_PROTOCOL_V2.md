# VEXFORGE — Protocolo Maestro Universal v2
**Última actualización:** 2026-09-04 — base Android OTA publicada y umbral visual Home/Forja calibrado | **Mantenido por:** Replit Agent
**Documento clave en Supabase:** `vexforge_master_protocol_v2`

---

## LEY SUPREMA — EJECUCIÓN EXCLUSIVA ANDROID Y CONGELACIÓN WEB

**Entrada en vigor:** 2026-08-31
**Decisión explícita del operador:** el único producto activo para el trabajo restante es la aplicación Android oficial en mobile/.
**Prioridad:** esta ley prevalece sobre cualquier texto histórico que describa la web como superficie de mantenimiento o como destino del roadmap.

1. **Superficie única de implementación:** todas las unidades pendientes, mejoras, correcciones, verificaciones funcionales y entregas del roadmap se ejecutan exclusivamente sobre Android en mobile/, siguiendo el inventario VE-MOB-0 y sus gates.
2. **Web congelada:** src/, public/, dist/, las rutas web, componentes web, estilos web, telemetría web, pruebas web y cualquier otro consumidor web son solo referencia de lectura. Ninguna IA puede modificarlos, refactorizarlos, corregirlos, instrumentarlos, añadirles features, generarles assets ni abrir unidades nuevas para ellos.
3. **Uso permitido de la web:** se puede leer el código y la documentación web únicamente para portar a Android comportamiento, contratos, textos, diseño y reglas ya existentes. El port debe producir cambios en mobile/; no se devuelve el cambio a la web.
4. **Supabase compartido:** solo se permiten cambios de Supabase cuando sean estrictamente necesarios para una capacidad Android del inventario y estén trazados a esa unidad. Queda prohibido cualquier trabajo de backend, datos, Storage o RPC destinado únicamente a la web.
5. **Entrega y validación:** la entrega del producto restante se hace con cambios Android, el workflow oficial .github/workflows/vexforge-android-apk.yml, su release y el APK correlativo. El deploy web no es un objetivo de implementación de esta fase.
6. **Guarda de selección:** antes de editar, la IA debe comprobar que el objetivo es Android. Si la tarea apunta a la web o no tiene una unidad VE-MOB-*/Android explícita, debe detener la implementación, registrarla como no elegible y seleccionar la siguiente unidad Android del inventario. Las actualizaciones de este protocolo y de CONTINUITY.md para registrar decisiones o evidencia sí están permitidas y no cuentan como trabajo de producto web.
7. **Levantamiento:** esta congelación solo puede levantarse mediante una nueva decisión explícita del operador registrada como oficial en Supabase y sincronizada en GitHub. Ninguna IA puede inferir una excepción a partir de documentos históricos.

---

## LEY DE TRANSICIÓN VIGENTE — ENTORNO ACTIVO = APLICACIÓN ANDROID

**Decisión del operador registrada:** 2026-08-25.

Esta ley no crea un plan paralelo ni elimina los gates del Protocolo Maestro. Define el orden de ejecución del producto mientras el port oficial permanezca incompleto:

1. El producto activo es la aplicación Android en `mobile/` del repositorio oficial, con Expo 54, React Native 0.81 y expo-router.
2. La web en `src/` queda congelada como referencia de lectura para el port Android; no es superficie de mantenimiento ni destino de implementación. No se abren unidades web.
3. La FASE PORT es prioritaria: se trasladan a Android las superficies y flujos existentes, con datos reales de Supabase, assets del manifiesto oficial, audio, motion y estados de carga/vacío/error. Cada superficie o flujo es una unidad `VE-MOB-*` con criterios y evidencia propios.
4. El orden de la FASE PORT es el inventario oficial `docs/VE-MOB-0-PORT-INVENTORY.md`; durante esta fase la siguiente unidad se determina por el siguiente elemento no completado del inventario, no por reabrir una tarea histórica ni por saltar a una unidad web.
5. La app usa el mismo Supabase oficial, las mismas RPCs, RLS y datos autoritativos. El cliente Android presenta y consume contratos; no duplica lógica de combate, recompensas, inventario, progreso, economía o autenticación.
6. La entrega Android sólo ocurre por push a `main` con cambios en `mobile/**`, el workflow oficial `.github/workflows/vexforge-android-apk.yml`, el release correlativo y el APK `app-release.apk`. No se autorizan EAS, builds manuales, releases manuales ni canales paralelos.
7. Cada unidad Android conserva todos los gates del protocolo: análisis integral, datos reales, cero genéricos, accesibilidad, reduced-motion, rendimiento, verificación proporcional, correspondencia commit/run/release y continuidad. La QA humana del operador es una validación post-entrega y no bloquea la continuidad del trabajo: su ausencia deja la unidad en `IMPLEMENTED_UNVERIFIED`, permite seleccionar y ejecutar la siguiente unidad elegible, y se conserva como evidencia pendiente. El agente no debe declarar `OPERATIONAL`, `TIER1_READY`, `PASS` ni cerrar la QA en nombre del operador.
8. Una vez completado el port, la FASE CONTINUIDAD retoma el roadmap Tier 1/T0-T10 y sus criterios sobre la app, sin perder la evidencia ni las protecciones acumuladas.

## LEY OBLIGATORIA — CONSUMO VISUAL OFICIAL Y COBERTURA SIN SUSTITUTOS

**Fecha de entrada en vigor:** 2026-08-30  
**Estado:** OBLIGATORIA — aplica a toda unidad existente, nueva o reabierta, en web, Android y cualquier otro cliente oficial.

Esta ley conecta la regla **Cero Genéricos** con la Directiva de **Análisis Integral y Ejecución Autónoma**. El plan de trabajo no se detiene porque falte una pieza visual: el trabajo funcional y la producción del arte pueden avanzar en paralelo. Sin embargo, ninguna unidad puede cerrarse, publicarse como completa o presentarse como visualmente conforme mientras consuma un sustituto genérico.

1. **Inventario antes de renderizar.** Antes de implementar una pantalla, estado, carta, criatura, objeto, decoración, efecto, icono, animación o sonido, el agente debe identificar su recurso oficial, su rol semántico, su ruta canónica y su consumidor. No se permite introducir una referencia visual sin procedencia.
2. **Si el recurso existe, se consume el oficial.** La implementación debe enlazar el asset del manifiesto oficial y del bucket canónico `vexforge-assets`, a través del registro visual del cliente (`src/lib/assetManifest.ts`, `mobile/constants/visual.ts` o el equivalente oficial). No se copian versiones paralelas ni se inventan sustitutos locales.
3. **Si el recurso no existe, se crea antes de cerrar la unidad.** La Directiva de Ejecución Autónoma autoriza a diseñar o generar el recurso faltante siguiendo la identidad VEXFORGE, los criterios Tier 1 y la extensión visual vigente. Después debe subirse al Storage oficial, inscribirse en `public.vexforge_official_asset_manifest`, asignársele un rol semántico y enlazarse desde el consumidor real. Crear el archivo sin registrarlo y consumirlo directamente no cumple esta ley.
4. **Cero sustitutos diegéticos.** Quedan prohibidos para representar elementos del universo VEXFORGE: palitos, matas, criaturas, armas, cartas, edificios, fondos, adornos, iconos de acción, emojis, Unicode, imágenes stock, placeholders visibles, dibujos temporales, gradientes o formas CSS que pretendan ser el arte final. Las formas CSS sí pueden usarse para geometría de interfaz, separadores, barras de progreso y feedback no diegético; nunca para simular un objeto del mundo que requiere arte propio.
5. **No hay fallback silencioso.** Si el asset oficial no carga, la pantalla debe mostrar un estado de error o vacío explícito, accesible y con identidad VEXFORGE, sin sustituirlo por otra imagen, emoji, icono genérico o recurso de demostración.
6. **La continuidad no se bloquea; el cierre visual sí.** Si falta arte, el agente debe abrir inmediatamente la pista de producción/enlace del asset y continuar las partes independientes del plan. La unidad se conserva como incompleta visualmente (`ASSET_REQUIRED`, `ASSET_IN_PROGRESS` o `IMPLEMENTED_UNVERIFIED`, según corresponda) hasta que el recurso esté creado, registrado, enlazado y comprobado.
7. **Gate obligatorio de cobertura.** Cada unidad debe conservar una matriz `elemento → rol semántico → ruta Storage → registro → consumidor → evidencia`. El cierre requiere que no existan referencias visuales sin registro, registros sin objeto en Storage, consumidores con fallback genérico ni elementos nuevos sin decisión de procedencia.
8. **Evidencia proporcional.** El agente debe ejecutar la guarda de manifiesto disponible (`npm run verify:manifest`, `npm run verify:assets` o su equivalente móvil), comprobar el consumidor real y actualizar `CONTINUITY.md`. La QA humana posterior puede quedar pendiente según la ley de continuidad, pero no puede inventarse ni sustituirse por una afirmación del agente.
9. **Precedencia y conexión.** Esta ley prevalece sobre documentos históricos que permitan placeholders y se aplica junto con la ley de transición Android, la regla de continuidad sin bloqueo por QA humana, la regla Cero Genéricos y la Directiva de Ejecución Autónoma. La autonomía permite producir lo que falta; no permite declarar oficial un recurso que aún no fue inscrito y consumido por el producto.

**Definición operativa:** una superficie está **VISUALMENTE CUBIERTA** sólo cuando todos sus elementos de mundo y de identidad tienen procedencia oficial comprobable y sus consumidores apuntan a esa procedencia. Un estado explícito de carga, vacío o error no cuenta como sustituto genérico; un placeholder que intenta parecer el elemento final sí cuenta como violación.

## REGLA DE CONTINUIDAD SIN BLOQUEO POR QA HUMANA

1. La QA manual del owner, operador o usuario real es una validación post-entrega y pertenece a la evidencia de uso real; no es una condición para que la IA continúe con la siguiente unidad elegible.
2. Cuando el código, los datos, los contratos, los gates técnicos y la verificación proporcional están completos, la IA debe integrar y documentar la unidad como `IMPLEMENTED_UNVERIFIED` si todavía falta la QA humana, y continuar según el orden oficial.
3. La ausencia de QA humana no permite inventar resultados, simular una sesión, modificar datos para fabricar evidencia ni declarar `OPERATIONAL`, `TIER1_READY`, `PASS` o launch gate.
4. El owner puede validar posteriormente el APK, dispositivo, navegador o flujo real. Un hallazgo suyo reabre la unidad afectada con su historial intacto; no invalida ni bloquea las demás unidades ya elegibles.
5. Sólo un bloqueo técnico, contractual, de datos, fuente, asset, herramienta o verificación necesaria para implementar/comprobar el paquete puede detener la ejecución, y debe registrarse con causa y alternativa intentada.

## REGLA DE RECONCILIACIÓN ENTRE FUENTES

1. La fila activa `vexforge_master_protocol_v2` en `public.vexforge_official_documents`, leída completa desde Supabase Management API, es la autoridad normativa del protocolo.
2. GitHub `main`, `CONTINUITY.md`, el inventario Android, Supabase vivo, el release y el deploy son fuentes de estado operativo y evidencia; no sustituyen el texto normativo del protocolo.
3. Si la copia del protocolo en `main` difiere de la fila activa de Supabase, el trabajo dependiente queda detenido hasta reconciliar. La reparación conserva el contenido vivo completo, incorpora sólo decisiones oficiales ya registradas y vuelve a sincronizar ambas copias; nunca se elige una fuente por suposición ni se borra historia.
4. El plan `vexforge_forge_formation_engine_v1` está marcado `superseded`: se consulta para historial y checkpoints compatibles, pero no puede reabrir ni reemplazar el plan vigente.
5. Mientras la FASE PORT esté incompleta, su orden de inventario gobierna la selección de la unidad Android. Los criterios Tier 1, el roadmap T0-T10 y los gates técnicos de calidad siguen siendo obligatorios y se mapean a cada unidad; la falta de QA humana no se considera criterio bloqueante de continuidad. Al completar el port, vuelve a aplicarse la priorización por fase abierta más baja y criterio bloqueante.

---

# LEY PRIORITARIA — TRANSPORTE HTTPS DE CREDENCIALES Y ACCESO OFICIAL

**Fecha de entrada en vigor:** 2026-08-28  
**Estado:** OBLIGATORIA — prevalece sobre cualquier instrucción histórica de transporte.

Esta ley fija el método único para operar sobre las fuentes oficiales. La palabra “HTTPS” aquí significa solicitudes HTTPS directas a las APIs oficiales; no significa usar Git Smart HTTP como vehículo para un secreto.

1. Las credenciales sólo se solicitan y almacenan mediante el mecanismo seguro de secretos de la plataforma. Nunca se imprimen, se escriben en archivos, se incluyen en URLs, se pasan como argumentos visibles, se guardan en remotos Git ni se registran en logs.
2. GitHub se consulta, descarga y modifica mediante su API REST oficial sobre HTTPS (`https://api.github.com`) usando el PAT únicamente en el header `Authorization: Bearer ...`. Para leer el repositorio se usa la API de contenidos o el endpoint oficial de archive; para escribir se usan los endpoints REST oficiales de contenidos o Git Data API. Queda prohibido usar `git clone`, `git fetch`, `git pull`, `git push`, Git Smart HTTP, una URL con el PAT incrustado o cualquier remoto autenticado como método de transporte del secreto.
3. Supabase se consulta y modifica mediante Management API, PostgREST o Storage API sobre HTTPS. El `SUPABASE_PAT` se envía sólo como bearer header a Management API; las claves derivadas se envían sólo en headers HTTPS de la API correspondiente. Nunca se colocan secretos en query strings, cuerpos de documentación, commits o logs.
4. Un fallo de transporte, endpoint, header, formato, permisos, alcance, rate limit o redirect no autoriza a declarar que una credencial es incorrecta. El agente debe diagnosticar el canal y registrar el código HTTP y el mensaje no sensible. Sólo se clasifica una credencial como inválida cuando el proveedor lo confirma explícitamente después de verificar que se usó el endpoint, método y header correctos.
5. Si una herramienta sólo ofrece transporte Git o intenta incrustar secretos en una URL, no se adapta el protocolo para usarla: se cambia al endpoint HTTPS oficial equivalente o se registra un bloqueo técnico exacto sin exponer la credencial.
6. Esta ley tiene precedencia sobre las instrucciones históricas de clonado, commit o push que aparezcan más abajo. Toda continuidad nueva debe indicar que el acceso se hizo por HTTPS directo y separar claramente el transporte de la credencial del mecanismo de versionado.

---

## REGLA ABSOLUTA DE CONTINUIDAD

Antes de tocar cualquier archivo, sigue este orden estricto:

1. Obtén la fuente oficial mediante la API REST HTTPS de GitHub (`https://api.github.com`); no uses `git clone` ni incrustes el PAT en una URL.
2. Lee este documento completo
3. Lee `CONTINUITY.md` en la raíz del repo
4. Lee `vexforge_forge_formation_engine_v1` en Supabase (plan activo)
5. Confirma qué está implementado mirando el código real — no asumas
6. Continúa EXACTAMENTE desde donde quedó la última sesión
7. Nunca reinicies trabajo ya hecho
8. Nunca inventes tablas, rutas, columnas ni lógica que no existan

---

## DIRECTIVA DE ANÁLISIS INTEGRAL Y EJECUCIÓN AUTÓNOMA

Esta es una orden operativa permanente del Protocolo Maestro. Cada vez que aparezca un trabajo nuevo, una mejora, un bloqueo o una discrepancia entre documentación, código y datos, el agente debe comprender primero el sistema completo y después ejecutar la solución completa sin solicitar autorización intermedia para decisiones técnicas.

### Antes de implementar cualquier trabajo

1. **Analizar el proyecto completo:** producto, rutas, componentes, dominios, repositorios, estado de autenticación, contratos, esquema real de Supabase, RPCs, RLS, triggers, Storage, assets y despliegue.
2. **Entender la lógica y los números:** reglas de combate, economía, estadísticas, escalados, límites, probabilidades, cooldowns, recompensas, fórmulas, estados y relaciones entre datos. No modificar una fórmula sin comprender sus entradas, salidas y efectos secundarios.
3. **Comparar fuentes:** verificar el código real y el esquema vivo contra este protocolo, el plan activo y los documentos oficiales relacionados. La fuente oficial y el estado real prevalecen sobre suposiciones o resúmenes antiguos.
4. **Trazar el impacto:** identificar dependencias frontend/backend/datos, rutas afectadas, compatibilidad móvil, rendimiento, seguridad, economía, migraciones y despliegue.
5. **Elegir el enfoque completo:** decidir por cuenta propia la solución más segura y de mayor calidad, incluyendo los cambios auxiliares necesarios para que la funcionalidad quede terminada y no solo parcialmente conectada.

### Ejecución autónoma obligatoria

- No pedir aprobación intermedia para crear, ajustar, refactorizar o completar código, componentes, rutas, estilos, assets, documentación, consultas, funciones, migraciones, tablas, columnas, relaciones, RPCs, políticas RLS o triggers cuando sean necesarios para cumplir una tarea aprobada del protocolo o del plan activo.
- La ausencia de una pieza previa no es un bloqueo automático. Si el análisis integral demuestra que una pieza es necesaria, el agente debe diseñarla e implementarla autónomamente dentro del código fuente oficial, incluyendo contratos, migraciones, consumidores, controles y verificaciones.
- No dejar deliberadamente trabajo a medio hacer ni trasladar al owner decisiones técnicas que el análisis permita resolver. Si una tarea pertenece al alcance, implementarla de extremo a extremo, integrarla, verificarla y actualizar todas sus dependencias.
- No reiniciar trabajo ya hecho. Reutilizar lo existente y mejorar un paso más, manteniendo compatibilidad con la arquitectura, las fórmulas y los datos reales.
- Crear infraestructura técnica nueva está permitido cuando sea la solución necesaria y justificable: tablas, columnas, relaciones, migraciones, RPCs, políticas RLS, triggers, rutas, servicios, componentes, efectos, assets y contratos frontend/backend. Debe incluir trazabilidad, autenticación, límites, manejo de errores, integridad referencial, compatibilidad, rendimiento, seguridad y reversibilidad cuando corresponda.
- Diseñar lógica nueva de producto o de flujo también está permitido cuando el objetivo esté dentro del plan y el análisis general permita derivarla de las reglas, datos, economía, experiencia y arquitectura existentes. La lógica debe documentarse, integrarse completamente y validarse contra los efectos cascada antes de cerrarse.
- **No inventar hechos oficiales del juego sin base.** Está prohibido falsificar atributos canónicos, balances, recompensas, permisos, resultados, lore, datos de producción o reglas oficiales y presentarlos como si ya existieran. Diseñar una implementación técnica o una lógica nueva para materializar una capacidad aprobada no equivale a falsificar un hecho.
- Si existe un bloqueo externo real, intentar resolverlo con las fuentes oficiales disponibles y una alternativa compatible. Solo si no existe solución válida después del análisis completo se documentará el bloqueo exacto; la falta de una tabla, RPC, relación o contrato previo no es por sí sola motivo para detener el trabajo.
- Verificar el resultado con build, comprobaciones de tipos, consultas de seguridad/datos, pruebas funcionales, rendimiento y deploy antes de cerrar. Actualizar continuidad, plan activo y artefactos generados.

### Límites que siguen vigentes

La autonomía no autoriza a exponer secretos, desactivar RLS sin reemplazo seguro, romper triggers, falsificar datos oficiales, alterar arbitrariamente la economía, ejecutar acciones destructivas irreversibles sin las salvaguardas exigidas por la plataforma o declarar como existente algo que no se verificó. Sí autoriza a crear toda infraestructura y lógica nueva necesaria para una tarea aprobada cuando el análisis integral demuestre que encaja y las verificaciones confirmen que no rompe el sistema. No se requiere autorización intermedia del owner para decisiones técnicas dentro del alcance.
---

## IDENTIDAD DEL PROYECTO

**VEXFORGE** es un DCCG (Digital Collectible Card Game) premium de categoría tier 1.
Cada decisión técnica, visual y de audio debe estar a la altura de los mejores juegos del género (Hearthstone, Legends of Runeterra, Marvel Snap). No se aceptan soluciones genéricas.

**Stack tecnológico:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Supabase (PostgreSQL + RLS + RPCs + Storage)
- Deploy: Cloudflare Pages (dist/ committido al repo, auto-deploy desde main)
- Build: `npm run build` → `vite build` (~3s, 65 chunks)
- Publicación oficial: build → preparar el cambio → actualizar `main` mediante la API REST HTTPS de GitHub; no transportar el PAT mediante Git, remotos ni URLs.

**Fuentes oficiales:**
- Supabase: https://rscuzqnfccqvltkdcdny.supabase.co
- GitHub: https://github.com/grandmaster68081-byte/Vexforge-web.git
- Deploy live: https://vexforge-web.pages.dev

---

## CREDENCIALES Y ACCESO

Solicita ÚNICAMENTE estas dos claves secretas mediante el mecanismo seguro de la plataforma (Add Secret / requestSecrets):
- `GITHUB_PAT` — Personal Access Token de GitHub para la API REST oficial sobre HTTPS (lectura/escritura)
- `SUPABASE_PAT` — Management API token de Supabase

Con el SUPABASE_PAT obtienes el service_role key así:
```
GET https://api.supabase.com/v1/projects/rscuzqnfccqvltkdcdny/api-keys
Authorization: Bearer $SUPABASE_PAT
```
Usa el service_role key para todas las operaciones de base de datos.
Columna de contenido en vexforge_official_documents: `content_markdown`

---

## ARQUITECTURA — REGLAS QUE NUNCA SE ROMPEN

1. **Economía del juego intacta** — No alterar tablas de VEX, shards, packs, fusión ni rewards
2. **RLS y triggers** — No desactivar Row Level Security ni modificar triggers existentes sin análisis completo
3. **dist/ siempre committido** — Cloudflare Pages lee del repo, no hace build propio
4. **No entornos paralelos** — Todo cambio va directo al código fuente oficial. Sin copias locales separadas
5. **Sistema de cartas intacto** — Las 24 cartas fundadoras tienen imagen_url oficial; no inventar nuevas sin arte
6. **ForgeFormation como núcleo de combate** — Todas las batallas (PvP, Raids, Jefes) deben usar ForgeFormationBoard
7. **Performance** — Efectos y animaciones deben mantener 60fps en móvil; optimizar antes de añadir más partículas
8. **Logging** — Nunca console.log en producción; usar el sistema de errores silenciosos existente (try/catch)
9. **Cobertura visual oficial** — Todo elemento diegético nuevo debe existir en Storage oficial, estar registrado en el manifiesto y ser consumido por su registro visual; si falta, se produce y enlaza antes del cierre.

---

## SISTEMA FORGE FORMATION — REGLAS DE JUEGO (INMUTABLES)

- Mazo: hasta 30 cartas por jugador
- Una carta es el Campeón (condición principal de victoria)
- Pre-batalla: seleccionar 2 cartas de apoyo (Vanguardia + Centinela)
- Formación inicial: Vanguardia | Campeón | Centinela
- Si el Campeón muere → partida terminada inmediatamente
- El Campeón NO puede ser atacado si existe una carta defensiva válida protegiéndolo
- Las cartas restantes del mazo (reserva) aumentan el poder del Campeón (Champion Deck Bonus)
- Cuando una carta de formación muere → activar reserva para reemplazo
- Cada decisión (qué mantener, qué sacrificar, cómo usar la reserva) debe tener peso estratégico real

---

## ESTADO COMPLETO DEL PLAN — LO QUE ESTÁ HECHO

### FASE 1 — Reparación y estabilización ✅ COMPLETA

| ID | Descripción | Estado |
|----|-------------|--------|
| A1 | Discrepancia conteo cartas en header de /cards | ✅ done |
| A2 | Bots eliminados del leaderboard | ✅ done |
| A3 | Misiones con system_locked/production_ready filtradas correctamente | ✅ done |
| A4 | Flujo execute_mission funciona (energía + cooldown + claim reward) | ✅ done |
| A5 | Leaderboard muestra champion_card + avg_dps_score | ✅ done |
| A6 | Filtro de facción en leaderboard renderiza correctamente | ✅ done |
| PvP | get_leaderboard type mismatch corregido | ✅ done |
| PvP | Selector de dificultad IA presente | ✅ done |
| SQL | inventory GRANT, fuse_cards RPC, create_clan RPC, market RPCs | ✅ done |
| SQL | ensure_player_row RPC + AuthProvider | ✅ done |
| RewardsIA | Anti-farm VEX para batallas IA (sistema de recompensas escalonado) | ✅ done |

### FASE 2 — Forge Formation Engine ✅ COMPLETO

| ID | Descripción | Estado |
|----|-------------|--------|
| FFE | forgeFormation.ts — motor completo (FormationState, buildFormation, computeChampionBonus, isChampionProtected, getNextReserveUnit, simulateFormationBattle) | ✅ done |
| FFE | FormationSelector.tsx — UI pre-batalla 3 slots, preview bonus Campeón | ✅ done |
| FFE | ForgeFormationBoard.tsx — tablero de batalla 3 posiciones completo (2514 líneas) | ✅ done |
| FFE | KeywordActivationFX.tsx — 15+ keywords con animaciones únicas | ✅ done |
| FFE | WinStreakDisplay.tsx — racha de victorias con niveles (spark/blaze/inferno) | ✅ done |

### FASE 2 — Mejoras visuales y audio ✅ COMPLETAS

| ID | Descripción | Estado |
|----|-------------|--------|
| B1 | Cinemáticas únicas por carta (UnitSummonCinematic + ChampionSummonCinematic) | ✅ done |
| B2 | Efectos de tablero mejorados (hex tiles, fog dinámico, terrain particles) | ✅ done |
| B3 | Holographic shimmer v3 por rareza (Common→Mythic con intensidad escalada) | ✅ done |
| B4 | Micro-interacciones globales (hover lift, glow de rareza, transiciones) | ✅ done |
| C1 | Audio contextual por sección/ruta | ✅ done |
| C2 | SFX de invocación por facción (Guerrero/Mago/Paladín/Pícaro) | ✅ done |
| D1 | Tutorial mejorado Forge Formation | ✅ done |
| D2 | Onboarding nuevos jugadores | ✅ done |
| G1 | KEYWORD_SUMMON_FX + getCardMotto() — 15 keywords con color/emoji/overlay | ✅ done |
| G2 | Cinemática Unidad: motto per-carta, keyword badges, rings tintados | ✅ done |
| G3 | Cinemática Campeón: image_url, keyword overlay, badges, motto per-keyword | ✅ done |
| H1 | Shield Arc visual mejorado (pulse, doble arco, badge GUARD ACTIVO) | ✅ done |
| H2 | Target Lock UI (border pulsante, scan-line, corner brackets, badge OBJETIVO) | ✅ done chat113 |
| H3 | Terrain particles ricos por facción (9 partículas, orb/spark/wisp) | ✅ done chat113 |
| H4 | Post-battle scoreboard ForgeFormation (stats, daño, kills, supervivencia) | ✅ done chat113 |
| I1 | Battle cards responsive < 480px | ✅ done |
| I2 | Nav hamburger + BottomNav mobile (≤ 768px) | ✅ done |
| Assets | Faction icons: Guerrero, Mago, Paladín, Pícaro (Storage) | ✅ done |
| Assets | Route backgrounds: PvP, Missions, Packs, Clans (Storage) | ✅ done |
| Assets | Region art: Forge Core, Iron Veins, Shadow Fracture, Cinders Realm, Warbound Zone | ✅ done |

---

## TAREAS PENDIENTES — IMPLEMENTAR PRIMERO, MEJORAR DESPUÉS

### PRIORIDAD ALTA — Implementar (no existe aún)

#### P1 — Identidad audiovisual completa por carta (elemento, tipo de criatura, poder, personalidad)
**Qué falta:** Las cinemáticas diferencian por facción y rareza, pero el protocolo exige efectos únicos basados en 4 ejes adicionales que aún no están implementados:
- **Elemento** (fuego, agua, tierra, aire, arcano, sombra, luz, vacío) → color de partículas, overlay y sfx distintos
- **Tipo de criatura** (Guerrero, Bestia, Elemental, Dragón, Espectro, Golem, etc.) → forma de entrada y animación de ataque distintas
- **Poder del personaje** (power_score de la carta) → escala de la cinematic, intensidad del impacto
- **Personalidad** (agresiva, defensiva, arcana, caída, etc.) → motto y comportamiento en tablero
**Archivos clave:** `src/components/battle/ForgeFormationBoard.tsx` (UnitSummonCinematic ~línea 408-900), `src/lib/forgeFormation.ts`
**Regla:** Usar los datos que ya existen en la tabla `cards` (element, creature_type, power, personality) — no inventar campos nuevos

#### P2 — Raids con combate ForgeFormation real
**Qué falta:** RaidsRoute.tsx (246 líneas) muestra raids activas y el botón "Contribuir" existe, pero no lanza un combate ForgeFormation real. El resultado de la raid debe depender del outcome del combate.
**Archivos clave:** `src/routes/RaidsRoute.tsx`, `src/domains/raids/repository.ts`, `src/components/battle/ForgeFormationBoard.tsx`
**Integración esperada:** Botón Contribuir → FormationSelector → ForgeFormationBoard (dificultad según raid) → si ganas: contribute_to_raid RPC → actualizar progreso raid

#### P3 — Jefes del Mundo con combate ForgeFormation real
**Qué falta:** WorldBossesRoute.tsx (226 líneas) muestra los jefes con arte regional pero el botón ATACAR no lanza combate. Los jefes deben tener HP compartido entre jugadores.
**Archivos clave:** `src/routes/WorldBossesRoute.tsx`, `src/domains/bosses/repository.ts`
**Arte disponible en Storage:** region_forge_core.jpg, region_iron_veins.jpg, region_shadow_fracture.jpg, region_cinders_realm.jpg, region_warbound_zone.jpg

#### P4 — Reliquias con efectos reales sobre el Campeón
**Qué falta:** RelicsRoute.tsx tiene solo 105 líneas. Las reliquias deben mostrar su efecto real (buff de ATK/DEF/HP al Campeón), permitir equipar/desequipar y reflejarse en el ForgeFormationBoard durante el combate.
**Archivos clave:** `src/routes/RelicsRoute.tsx`, tabla `relics` en Supabase

#### P5 — Animación cinematográfica de reserva al entrar al campo
**Qué falta:** Cuando una carta de formación muere, el reemplazo de reserva aparece de forma abrupta. Debe tener una cinematic compacta propia ("RESERVA ACTIVADA") con overlay y sfx diferenciados del invoke inicial.
**Archivos clave:** `src/components/battle/ForgeFormationBoard.tsx` — lógica de reserva en fases (~línea 1680-1850), keyframes existentes: `formation-enter-board`, `reserve-card-draw`

#### P6 — Rutas públicas sin login obligatorio
**Qué falta:** /cards, /lore y /leaderboard piden login incluso para contenido que debería ser público. Un visitante nuevo debe poder explorar el juego antes de registrarse.
**Archivos clave:** `src/routes/CardsRoute.tsx` (~línea 470), `src/routes/LoreRoute.tsx`, `src/routes/LeaderboardRoute.tsx`

### PRIORIDAD MEDIA — Mejorar lo que ya existe

#### M1 — Iconos propios en toda la interfaz (eliminar emojis genéricos)
**Protocolo dice:** "cada icono debe estar diseñado para su función, no puede haber elementos genéricos"
**Qué hay:** El menú usa emojis del sistema (🏠🃏📦⚔️🏆📋📜🐉🌟🏅📖◇💰🛒🏪🔮✨📥💸🛡️🤝📊🏅)
**Qué se necesita:** SVG icons diseñados para VEXFORGE, coherentes con la estética dark-fantasy forge. Pueden generarse con código o con assets. Los faction icons ya existen en Storage.
**Archivos clave:** `src/App.tsx` (SIDEBAR_GROUPS y BOTTOM_ITEMS ~línea 68-130)

#### M2 — Cinemáticas de batalla al siguiente nivel
**Base ya implementada:** UnitSummonCinematic, ChampionSummonCinematic, terrain particles, Target Lock, Shield Arc
**Mejorar:**
- Efectos de cámara más dramáticos en el impacto del ataque (shake + zoom momentáneo)
- Partículas de muerte más espectaculares (explosión de fragmentos de carta por rareza)
- Transición entre fases (intro → battle → scoreboard) más cinematográfica
- El tablero debe "respirar" con tensión creciente conforme el Campeón pierde HP

#### M3 — PvP mejorado (experiencia jugador vs jugador)
**Base:** PvPRoute.tsx (155KB) con ForgeFormation integrado, leaderboard real, win streak
**Mejorar:**
- Sala de espera de PvP con avatar de rival, stats de su campeón y formación (sin revelar)
- Countdown cinematic antes del combate
- Replay del último turno ganador
- Sistema de revanchas más prominente con rivalidad persistente

#### M4 — Scoreboard post-batalla más épico
**Base:** ForgeFormationScoreboard ya implementado
**Mejorar:**
- Animación de "carta MVP" (la que más daño hizo o la que sobrevivió)
- Bonus de XP desglosado (kills, crits, supervivencia de Campeón, cartas de reserva usadas)
- Compartir resultado (screenshot visual del scoreboard)

#### M5 — PackOpenSequence cinematográfico al tier 1
**Base:** PackOpenSequence.tsx (784 líneas) ya existe con pity timer
**Mejorar:**
- Cada rareza de carta revelada debe tener su propia explosión visual
- Mythic debe congelar la pantalla con efecto void antes de revelarse
- Legendary debe tener destello dorado y vibración del dispositivo (en móvil)
- Sonido de rareza escalado en impacto

### BLOQUEADO EN EL OWNER (no puede resolver la IA)

#### BLOQUEO-1 — Visual assets zip bundles
**Qué falta:** Desempaquetar en Supabase Storage estas carpetas (solo existen como .zip):
- `founders_badge` — cosmética de fundadores
- `misc` — assets misceláneos
- `sessions` — assets de sesión
- `ui_system` — elementos de interfaz del sistema
**Acción del owner:** Descomprimir cada zip y hacer upload de los archivos individuales en la carpeta correspondiente de Supabase Storage (bucket: `vexforge-assets`)

---

## ORDEN DE EJECUCIÓN OBLIGATORIO

Cuando una IA retoma el trabajo, debe seguir este orden:

```
1. LEER → CONTINUITY.md (estado real del repo)
2. LEER → vexforge_forge_formation_engine_v1 (plan activo con último estado)
3. VERIFICAR → npm run build (debe ser 0 errores antes de tocar nada)
4. INVENTARIAR → Cada elemento visual nuevo: procedencia, rol, Storage, manifiesto y consumidor
5. IMPLEMENTAR → Primero tareas P (Pendientes: P1, P2, P3, P4, P5, P6 en ese orden), con su pista visual paralela
6. MEJORAR → Después tareas M (Mejoras: M1, M2, M3, M4, M5), sin sustitutos visuales
7. CONFIRMAR → build limpio, cobertura del manifiesto y guarda específica después de cada lote
8. PUBLICAR → actualizar `main` mediante la API REST HTTPS de GitHub, sin `git push` ni PAT en URLs/remotos
9. ACTUALIZAR → este bloque operativo en el protocolo maestro y CONTINUITY.md con estado real
10. REPORTAR → Reporte claro de lo implementado, la cobertura visual y cualquier asset aún en producción
```

---

## ESTÁNDARES DE CALIDAD (NO NEGOCIABLES)

- **Tier 1:** Cada feature debe compararse mentalmente con Hearthstone/Legends of Runeterra. Si se vería amateur en ese contexto, mejorar.
- **Sin genéricos:** Ninguna animación, icono, efecto o sonido puede ser igual para todas las cartas.
- **Performance:** Probar en pantallas < 480px. Los efectos no deben causar lag visible.
- **Continuidad:** Siempre hacer push al final. Nunca dejar trabajo solo local.
- **Reportar:** Siempre dejar un CONTINUITY.md actualizado y un PATCH al documento activo en Supabase.
- **No romper:** Economía, RLS, triggers, arquitectura de rutas, sistema de combate ForgeFormation.

---

## DOCUMENTOS ÚTILES EN SUPABASE

Consultar con SELECT content_markdown FROM vexforge_official_documents WHERE doc_key = '...':

| doc_key | Contenido |
|---------|-----------|
| `vexforge_master_protocol_v2` | **ESTE DOCUMENTO — Protocolo Maestro Universal** |
| `vexforge_forge_formation_engine_v1` | Plan histórico superseded; sólo contexto y checkpoints compatibles |
| `vexforge_combat_core_detailed` | Reglas detalladas del sistema de combate |
| `vexforge_cards_core` | Estructura de cartas, atributos, rareza |
| `vexforge_economy_core` | Econom��a del juego (VEX, shards, packs) |
| `vexforge_factions_foundation` | Las 4 facciones y su identidad visual/lore |
| `vexforge_founder_cards_catalog` | Las 24 cartas fundadoras con sus atributos |
| `vexforge_pvp_system` | Sistema PvP, rankings y temporadas |
| `vexforge_rewards_catalog` | Catálogo de recompensas y drops |
| `vexforge_screen_manifest` | Mapa de rutas y pantallas de la app |
| `vexforge_player_journey` | Flujo completo del jugador (onboarding→endgame) |

---



---

## PROTOCOLO TÉCNICO DE BUILD Y DEPLOY — CLOUDFLARE PAGES (REGLAS PERMANENTES)

> **Este bloque surgió de 3 deploys fallidos en producción (2026-08-01). Nunca omitir.**

### ⚠️ REGLA 1 — NUNCA commitear un package-lock.json generado en Replit sin verificar

Replit inyecta automáticamente su proxy interno (`http://package-firewall.replit.local/npm/`) como registry de npm. Cuando `package-lock.json` se genera en este entorno, **todas las URLs `resolved` apuntan a ese host privado**. Cloudflare Pages no puede acceder a ese host → npm cuelga ~70 segundos → crash fatal.

**Síntoma reconocible en el log de Cloudflare:**
```
npm error Exit handler never called!
npm error This is an error with npm itself.
```
Ocurre en el step `Installing project dependencies: npm clean-install`, siempre en ~60-75 segundos. **No es error de versión de Node — es la URL privada inaccesible.**

**Verificación obligatoria antes de cualquier commit de lockfile:**
```bash
grep -c "package-firewall.replit.local" package-lock.json
# Debe devolver 0. Si devuelve > 0 → lockfile INVÁLIDO para producción.
```

**Procedimiento correcto para regenerar package-lock.json desde Replit:**
```bash
rm -f package-lock.json
npm install --registry=https://registry.npmjs.org
grep -c "package-firewall.replit.local" package-lock.json   # debe ser 0
# Si aún quedan URLs internas (por config del entorno Replit):
sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json
grep -c "package-firewall.replit.local" package-lock.json   # 0 ahora sí
```

**Protección permanente instalada:** el repo tiene `.npmrc` con `registry=https://registry.npmjs.org/` en raíz. Si en el futuro el lockfile vuelve a tener URLs de Replit, repetir el sed.

---

### ⚠️ REGLA 2 — .nvmrc DEBE estar en la RAÍZ del repo

Cloudflare Pages **solo lee `.nvmrc` de la raíz del repositorio**. Cualquier `.nvmrc` en un subdirectorio (`vexforge/.nvmrc`, `src/.nvmrc`, etc.) es completamente ignorado.

- Versión correcta: `22` (`@supabase/supabase-js` y sub-dependencias requieren `node >= 22`)
- Ubicación correcta: `/.nvmrc` (mismo nivel que `package.json` y `wrangler.toml`)
- Verificar: `cat .nvmrc` desde la raíz clonada debe devolver `22`

---

### ⚠️ REGLA 3 — wrangler NO debe estar en devDependencies

`wrangler` en devDependencies trae `iceberg-js` y decenas de binarios nativos que complican el install. Cloudflare Pages tiene wrangler propio — no necesita el del proyecto. Para uso en local: `npx wrangler` o `npm install -g wrangler`. No añadirlo de vuelta a `package.json`.

---

### Variables de entorno — Cloudflare Pages Dashboard

Las variables `VITE_*` son leídas por Vite en tiempo de build y compiladas dentro del bundle JS. Deben estar configuradas en:
**Cloudflare Dashboard → Pages → vexforge-web → Settings → Environment variables (Production + Preview)**

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://rscuzqnfccqvltkdcdny.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | clave anon pública del proyecto Supabase |

Sin estas variables el build compila pero el app no conecta a Supabase.

---

### Checklist de Deploy — Antes de Reportar Trabajo como Completado

```
[ ] npm run build → 0 errores TypeScript, dist/ generado
[ ] grep -c "package-firewall.replit.local" package-lock.json → 0
[ ] cat .nvmrc desde raíz del repo → 22
[ ] publicar el cambio en `main` mediante la API REST HTTPS de GitHub, sin transportar secretos por Git
[ ] Cloudflare Pages build exitoso (sin "Exit handler never called")
[ ] https://vexforge-web.pages.dev carga y conecta a Supabase
[ ] Rutas modificadas en esta sesión funcionan en el deploy live
```


## REGLA ABSOLUTA DE PROPAGACIÓN AL FRONT Y DEPLOY LIVE

Toda orden, cambio, actualización, corrección o mejora definida en este Protocolo Maestro o en el plan activo es una obligación del producto oficial y debe verse reflejada en el front real y en el deploy oficial. El trabajo no se considera terminado, válido ni reportable si existe únicamente en un entorno local, una copia temporal, un build no publicado o una rama que no sea main.

Flujo obligatorio para cada lote:

1. Implementar en el repositorio oficial de GitHub: grandmaster68081-byte/Vexforge-web.
2. Ejecutar las verificaciones de calidad y build exigidas por este protocolo.
3. Generar y dejar dist/ actualizado y commiteado cuando la arquitectura del proyecto lo requiera.
4. Hacer commit y push a origin main; nunca dejar el resultado solo local.
5. Verificar el deploy oficial declarado aquí: https://vexforge-web.pages.dev.
6. Confirmar que el front live responde correctamente y que el cambio implementado está realmente servido allí; un HTTP 200 por sí solo no basta cuando el lote modifica comportamiento o contenido visible.
7. Si el deploy no refleja el commit, investigar y resolver el desfase de build, publicación, caché o routing antes de reportar el trabajo como completado.
8. Actualizar CONTINUITY.md en el repositorio oficial y aplicar el PATCH correspondiente al plan activo en Supabase con el estado real.

Los archivos locales sólo pueden usarse como espacio de trabajo temporal para preparar la implementación. No son una fuente oficial, no sustituyen al repositorio remoto ni al deploy, y no deben presentarse como entrega final. Esta regla obliga a publicar el resultado en la cadena oficial; no impide crear infraestructura o lógica técnica nueva dentro del repositorio y Supabase cuando una tarea aprobada## DIRECTIVA DE PRESERVACIÓN ESTRUCTURAL Y EJECUCIÓN CON CONTEXTO COMPLETO — Actualización 2026-08-01

    El Protocolo Maestro preserva la integridad del producto, pero no congela su arquitectura. Su función es permitir que cualquier IA complete el plan entero con autonomía técnica y contexto completo. La autoridad del agente incluye crear la infraestructura y la lógica necesarias cuando una tarea aprobada las requiere; no incluye falsificar hechos del juego ni alterar reglas sin fundamento.

    ### Regla principal: comprender, diseñar, encajar y completar

    Cuando una tarea aprobada requiera crear, ajustar o validar algo, el agente debe:

    1. Comprender primero el contexto completo: protocolo, plan activo, código real, esquema vivo de Supabase, relaciones, RPCs, RLS, triggers, Auth, Storage, contratos, consumidores frontend/backend, economía, despliegue, assets, rendimiento y continuidad.
    2. Comparar las fuentes oficiales entre sí y confirmar qué existe realmente. La documentación, el código y el esquema vivo prevalecen sobre suposiciones, nombres plausibles o patrones genéricos.
    3. Reutilizar las tablas, columnas, RPCs, funciones, políticas, tipos, componentes y flujos existentes siempre que resuelvan la necesidad.
    4. Si falta una pieza técnica necesaria, diseñarla y crearla autónomamente. Esto incluye tablas, columnas, relaciones, migraciones, RPCs, políticas RLS, triggers, rutas, servicios, componentes, efectos, assets y contratos frontend/backend.
    5. Si falta una decisión de flujo o lógica de producto, diseñarla autónomamente a partir del objetivo aprobado, las reglas existentes, los datos, la economía, la experiencia del jugador y el estándar Tier 1. La decisión debe ser coherente, trazable y validada; no se puede detener el trabajo sólo porque el detalle no estuviera escrito literalmente en un documento anterior.
    6. Trazar entradas, salidas, propietarios, autenticación, límites, estados de error, integridad referencial, compatibilidad móvil, rendimiento, seguridad, economía, migración y consumidores antes de escribir.
    7. Mantener la economía, la seguridad, los triggers, las fórmulas y las reglas canónicas intactas salvo que la tarea aprobada exija explícitamente modificarlas. Si se necesita una extensión, implementarla de forma mínima, coherente, trazable y compatible.
    8. Diferenciar infraestructura o lógica nueva de hechos inventados: se permite crear la solución técnica o de flujo que no existía; no se permite inventar atributos oficiales, balances, recompensas, resultados, permisos, lore, datos canónicos ni reglas oficiales sin fundamento.
    9. No detenerse por una ausencia técnica que el análisis pueda resolver. Sólo documentar un bloqueo cuando sea externo, real e irresoluble mediante una alternativa compatible; nunca usar la falta de una tabla, RPC, relación o contrato como excusa automática para abandonar una tarea aprobada.

    ### Ejecución autónoma responsable

    El agente debe ejecutar sin pedir aprobación intermedia todas las decisiones técnicas dentro del alcance: seleccionar el diseño, crear la infraestructura faltante, definir la lógica de flujo necesaria, integrarla en frontend/backend/datos, verificarla, publicarla y actualizar continuidad y plan activo. No debe reiniciar trabajo completado, dejar capacidades deliberadamente a medias ni presentar como terminado algo que no esté conectado y comprobado. El owner no necesita aprobar tablas, RPCs, migraciones, rutas, componentes, efectos o decisiones de arquitectura cuando el análisis integral demuestre que son necesarias y seguras.

    ### Estándar universal de calidad Tier 1

    VEXFORGE debe aspirar siempre a la calidad de los mejores juegos del mundo. Cada bloque debe elevar la experiencia, no sólo hacerla funcionar: identidad audiovisual propia por carta y contenido, cinemáticas, animaciones, motion, audio, iconografía, assets, estados vacíos, feedback, responsive y micro-interacciones deliberadas. No se aceptan placeholders genéricos, iconos de sistema, imágenes de relleno ni efectos repetidos cuando el contexto permite una identidad propia. La calidad visual y funcional se evalúa como producto Tier 1, con atención especial a móvil, claridad, rendimiento y emoción.

    ### Cadencia obligatoria de bloque y checkpoint

    1. Analizar el contexto y el impacto completo antes de escribir.
    2. Diseñar e implementar un bloque completo, creando autónomamente las piezas técnicas y de flujo faltantes que sean necesarias.
    3. Crear el checkpoint: commit del bloque, CONTINUITY.md actualizado y PATCH del documento del plan activo con el estado real.
    4. Ejecutar después del checkpoint build, typecheck, comprobaciones funcionales, datos, seguridad, rendimiento y deploy que correspondan; corregir cualquier fallo antes de avanzar.
    5. Hacer push a main y regenerar o commitear dist/ cuando la arquitectura lo requiera.
    6. Verificar que Cloudflare Pages sirve el commit y el comportamiento nuevo, no solamente un HTTP 200. Si existe desfase, investigar y resolver build, publicación, caché o routing antes de reportar.
    7. La mesa de trabajo oficial es una sola cadena: repositorio GitHub main como fuente de código, Supabase como fuente viva de datos, esquema, RPC, RLS y documentos, dist/ como salida publicada cuando corresponda y Cloudflare Pages como deploy que debe reflejar el commit. Los entornos locales y copias temporales sirven únicamente para preparar cambios y nunca son una entrega.

    Esta directiva es universal para cualquier IA que retome el proyecto. Debe comprender, decidir, crear, integrar, verificar y publicar sin trasladar decisiones técnicas al owner ni detener tareas aprobadas por ausencia de infraestructura previa.

---
## DIRECTIVA UNIVERSAL DE AUTONOMÍA TÉCNICA, LÓGICA Y CALIDAD TIER 1 — Actualización 2026-08-01

La interpretación correcta de este protocolo es: comprender primero y ejecutar después. Cuando el plan aprobado requiere una capacidad que todavía no tiene tablas, RPCs, columnas, relaciones, rutas, componentes, efectos, assets o una decisión de flujo escrita literalmente, la IA debe diseñarla y crearla autónomamente si puede derivarla del contexto integral y verificar que encaja sin efectos cascada. La IA no debe detenerse por falta de autorización intermedia ni pedir al owner decisiones técnicas que están dentro de su responsabilidad.

La autorización para crear infraestructura y lógica nuevas no autoriza a falsificar hechos oficiales del juego. Los datos canónicos, balances, recompensas, permisos, resultados, lore y reglas oficiales deben permanecer basados en fuentes verificables o en el objetivo aprobado; la IA puede definir la implementación y los flujos necesarios para materializar ese objetivo, documentando sus supuestos y comprobando sus efectos.

El objetivo de calidad es Tier 1 mundial: toda implementación debe buscar una experiencia competitiva con los mejores juegos del género, con identidad audiovisual propia, assets no genéricos, cinemáticas, animaciones, audio, iconografía y micro-interacciones específicas del producto.

La mesa de trabajo es GitHub main + Supabase + dist/ + Cloudflare Pages. Nada se considera terminado si no está en el repositorio oficial, sincronizado con las fuentes de datos oficiales cuando aplica, generado en dist/ cuando corresponde y verificado en el deploy live.

---

## DIRECTIVA MAESTRA DE UNIFICACIÓN TIER 1 — PLAN OFICIAL PRE-LANZAMIENTO

**Revisión:** 2026-08-01 · **Estado:** PLAN OFICIAL ACTIVO · **Alcance:** pre-lanzamiento cerrado
**Autoridad:** esta sección es la directiva de ejecución que prevalece sobre cualquier lista histórica de pendientes anterior dentro de este documento.

### 1. Propósito y estado real del producto

VEXFORGE se encuentra en desarrollo y pruebas internas. No está oficialmente abierto al público, no tiene jugadores reales y no debe describirse como open beta ni como producto lanzado.

Las cuentas y registros actuales pertenecen al owner, a administradores o a pruebas internas. La cuenta administrativa con un volumen elevado de victorias y posición superior en leaderboard es una cuenta de test del owner. Sus estadísticas son telemetría de validación y no representan retención, balance competitivo, actividad de usuarios ni salud de producción.

Reglas de interpretación:

- No usar rankings, victorias, derrotas, wallets, colecciones ni runs actuales como evidencia de comportamiento de jugadores reales.
- No borrar ni resetear datos de prueba durante este plan sin una estrategia de lanzamiento, backup, migración y verificación separada.
- Antes del lanzamiento se preparará una separación explícita entre datos administrativos, fixtures de QA y universo limpio de producción.
- El estado de lanzamiento canónico es **PRE-LAUNCH INTERNAL QA**. La etiqueta histórica **OPEN BETA READY** queda subordinada a esta declaración y no autoriza abrir el producto.

### 2. Jerarquía de autoridad y reconciliación documental

La antigüedad de un documento no puede superar al sistema actualmente implementado. La fecha, el estado de continuidad y la verificación del código determinan qué texto sigue vigente.

Orden obligatorio de autoridad:

1. Código real en GitHub `main` y la entrada más reciente de `CONTINUITY.md`.
2. Esquema vivo de Supabase, funciones RPC, RLS, triggers, Storage y contratos reales.
3. Esta directiva maestra dentro de `vexforge_master_protocol_v2`.
4. El plan activo de ForgeFormation como registro de ejecución y checkpoints.
5. Documentos anteriores, resúmenes de sesiones y especificaciones históricas.

Normas de reconciliación:

- Si una sección antigua dice P1, P2, P3, P4, P5, P6, M1 o J1 pendiente, pero `CONTINUITY.md` y el código reciente verifican su implementación, se considera historial superseded, no trabajo pendiente.
- Las listas antiguas no se borran: se conservan para trazabilidad y se subordinan a esta sección.
- Ningún agente puede reabrir una tarea completada sólo porque aparezca pendiente en una tabla vieja.
- Una capacidad se considera implementada únicamente cuando existe en código, está conectada a sus datos reales, pasa build y tiene continuidad verificable.
- Una capacidad visual no se considera un sistema de juego completo si no tiene resultado, persistencia, seguridad e idempotencia correspondientes.
- Toda discrepancia debe registrarse como decisión de autoridad antes de modificar datos o fórmulas.

### 3. Alcance de este plan

Este plan cubre exclusivamente la preparación del juego como experiencia TCG/DCCG Tier 1:

- Combate ForgeFormation.
- PvE: misiones, expediciones, dungeons, eventos, jefes y raids.
- PvP, matchmaking, temporadas, rankings y replays.
- Cartas, mazos, reserva, Campeón, reliquias, keywords y progresión.
- Narrativa, regiones, facciones, enemigos y contenido de combate.
- Cinemáticas, animaciones, VFX, SFX, música, feedback y accesibilidad.
- Seguridad, persistencia, RLS, RPCs, integridad de resultados, rendimiento y deploy.
- Economía interna ya existente, únicamente en lo necesario para que las recompensas sean consistentes, trazables y equilibradas.

Quedan expresamente fuera del plan de ejecución:

- Pagos, monetización, suscripciones, checkout y proveedores comerciales.
- Licencias comerciales o de distribución.
- Blockchain, contratos, NFTs, wallets externas y enlaces on-chain.
- Cualquier infraestructura externa de valor real.

Los bloques históricos relacionados con esos temas se conservan por continuidad, pero no se ejecutan ni se consideran requisitos para declarar terminado este plan de gameplay Tier 1.

### 4. Estado canónico que debe preservarse

El sistema actual es la base; no se reemplaza por un sistema paralelo.

- ForgeFormation es el núcleo obligatorio del combate.
- El mazo tiene hasta 30 cartas.
- Existe un Campeón como condición principal de victoria.
- La formación inicial utiliza Vanguardia, Campeón y Centinela.
- El Campeón termina la partida al morir.
- La protección del Campeón depende de defensas válidas vivas.
- Las cartas restantes forman la reserva y contribuyen al poder del Campeón.
- La muerte de una unidad activa puede activar un reemplazo desde la reserva.
- Las fórmulas, keywords, reliquias, cartas, facciones, regiones y relaciones existentes se reutilizan antes de crear extensiones.
- Las implementaciones recientes verificadas, incluidas P1-P6, M1 y J1 según `CONTINUITY.md`, permanecen completadas.
- El sistema real observado de datos es la referencia actual; las cantidades históricas de documentos no se convierten automáticamente en nuevos registros.

### 5. Objetivo de salida Tier 1

El plan termina cuando VEXFORGE pueda abrirse oficialmente como un juego completo, coherente y pulido, no cuando sólo existan pantallas o componentes visuales.

La experiencia final debe conseguir que:

- El jugador entienda el valor estratégico de su Campeón, apoyos y reserva.
- Cada actividad PvE relevante implique un combate ForgeFormation real.
- PvP y PvE compartan reglas, feedback y calidad de presentación.
- Cada carta tenga identidad audiovisual derivada de sus atributos reales.
- Cada victoria, derrota, abandono y recompensa sea verificable y persistida.
- Bosses y raids tengan progreso cooperativo real y no sólo botones de contribución.
- El contenido tenga variedad de patrones, fases, modificadores y decisiones.
- La experiencia funcione con claridad y rendimiento en móvil y escritorio.
- El jugador pueda completar sesiones satisfactorias de 5 a 20 minutos.
- El juego pueda entrar en lanzamiento sin documentación contradictoria, datos de prueba confundidos con producción o tareas antiguas reabiertas accidentalmente.

### 6. Arquitectura objetivo: Combat Content Layer

Todos los modos deben adaptarse a un contrato común de **Battle Run**. El cliente presenta el combate; la autoridad del resultado debe estar protegida por el backend y por un registro verificable.

Cada Battle Run debe definir, como mínimo:

- Identificador único e idempotente.
- Jugador y modo: misión, dungeon, evento, boss, raid o PvP.
- Encuentro, región, dificultad y versión de reglas.
- Snapshot del mazo, Campeón, Vanguardia, Centinela, reserva y reliquias.
- Semilla determinista o mecanismo equivalente de reproducibilidad.
- Reglas del oponente, IA, fases y modificadores.
- Estados: created, started, completed, defeated, abandoned, expired o rejected.
- Turnos, eventos de combate, daño, curaciones, keywords, sustituciones y supervivencia.
- Resultado final, causa de terminación y estado del Campeón.
- Resultado de recompensa y estado de liquidación.
- Referencia de ledger cuando se aplique economía interna.
- Protección contra reintentos, duplicados, manipulación de parámetros y doble reclamación.

El servidor debe validar identidad, cartas, formación, reliquias, energía, cooldowns, semilla, resultado, daño y recompensa. El cliente puede controlar animaciones, cámara, audio, partículas, timeline y presentación del replay, pero no debe ser la única autoridad de una victoria o recompensa.

### 7. Plan de trabajo oficial por fases

#### FASE T0 — Reconciliación y baseline de pre-lanzamiento

**Objetivo:** congelar la verdad operativa antes de añadir sistemas.

- Auditar GitHub `main`, `CONTINUITY.md`, build, deploy y documentos.
- Clasificar documentos como vigente, superseded, histórico o pendiente real.
- Inventariar RPCs, firmas, tablas, columnas, RLS, triggers, Storage y consumidores.
- Clasificar cuentas actuales como owner, admin, QA o fixture; nunca interpretar sus métricas como producción.
- Confirmar cantidades vivas de cartas, regiones, facciones, misiones, bosses, raids, reliquias y jugadores de prueba.
- Registrar discrepancias sin borrar datos ni reescribir historia.
- Definir la versión de reglas que identifica cada nuevo Battle Run.

**Salida:** baseline en continuidad y matriz de autoridad documental.

#### FASE T1 — Contrato Battle Run y resolución autoritativa

**Objetivo:** eliminar caminos divergentes entre combate visual, RPC y recompensa.

- Diseñar el contrato común de inicio, ejecución, resultado y liquidación.
- Reutilizar RPCs existentes cuando sus firmas y garantías sean suficientes.
- Crear sólo las extensiones mínimas de esquema, RPC, RLS o tipos que falten.
- Hacer idempotente el settlement de recompensas.
- Persistir resultado, daño, causa de derrota, abandono y referencias de actividad.
- Hacer que cada contribución de boss o raid corresponda a un Battle Run válido.
- Separar telemetría de pruebas administrativas de datos competitivos de lanzamiento.
- Cubrir doble click, refresh, reintentos, errores de red y timeouts.

**Salida:** una sola autoridad de resultado reutilizable por todos los modos.

#### FASE T2 — ForgeFormation completo como motor de reglas

**Objetivo:** convertir todas las reglas declaradas en comportamiento jugable real.

- Verificar protección del Campeón en todos los estados y simultaneidades.
- Hacer efectiva la reserva durante la simulación y el tablero, no sólo en helpers.
- Formalizar selección u orden de reemplazo y reglas de entrada.
- Persistir o reproducir correctamente las sustituciones.
- Resolver turnos, velocidad, prioridades, estados, daño, escudos, curación, control y empates.
- Definir límites de turno y causas de finalización.
- Mantener Champion Deck Bonus, Formación Pura y reliquias compatibles con el código vigente.
- Crear pruebas de invariantes para Campeón, protección, reserva y formación inválida.

**Salida:** motor ForgeFormation verificable, reproducible y listo para todos los modos.

#### FASE T3 — Vertical slice PvE: una misión completa

**Objetivo:** demostrar el nuevo gameloop sin multiplicar deuda.

Flujo obligatorio:

1. Selección de misión.
2. Briefing narrativo y enemigo.
3. Formación enemiga y modificadores.
4. Selección de Campeón, Vanguardia y Centinela.
5. Previsualización de reserva y reliquias.
6. Cinemática de entrada.
7. Combate ForgeFormation.
8. Resultado detallado.
9. Settlement único de energía, progreso y recompensas.
10. Notificación, siguiente nodo o revancha.

La misión de referencia debe cubrir victoria, derrota, Campeón caído, abandono, error de red, cooldown, energía insuficiente y doble reclamación.

**Salida:** una misión normal jugable con datos reales y aceptación móvil/escritorio.

#### FASE T4 — Sistema PvE completo

**Objetivo:** extender la vertical slice a todo el contenido PvE.

- Convertir misiones normales, elite, expediciones, dungeons y eventos en encuentros reales.
- Añadir patrones de enemigos, fases, modificadores regionales y condiciones de victoria.
- Crear cadenas de nodos con decisiones de peso estratégico.
- Diferenciar dificultad mediante comportamiento y mecánicas, no sólo estadísticas.
- Mantener energía, cooldowns, progreso, quests y recompensas conectados al resultado real.
- Definir estados bloqueados, vacíos, retry y recuperación de sesión.

**Salida:** PvE consistente, variado y completo.

#### FASE T5 — World Bosses y Raids cooperativos

**Objetivo:** hacer que la cooperación dependa de combates y progreso persistidos.

World Bosses:

- HP compartido y actualización transaccional.
- Fases, vulnerabilidades, patrones y cambios de comportamiento.
- Encuentros individuales persistidos.
- Daño validado desde Battle Run.
- Recompensa individual y global sin duplicación.
- Historial, ranking de contribución y expiración.

Raids:

- Join, participación, combate, contribución y completion conectados.
- Progreso de grupo y score individual.
- Fases o salas con identidad propia.
- Recompensas proporcionales a participación válida.
- Derrota, expiración, reintentos y resolución idempotente.
- Nunca registrar una contribución fija cuando el combate produzca otro resultado.

**Salida:** bosses y raids operativos como sistemas cooperativos reales.

#### FASE T6 — PvP competitivo y paridad de reglas

**Objetivo:** llevar PvP al mismo estándar de integridad y presentación que PvE.

- Snapshot de ambos mazos y formaciones.
- Validación estricta de Campeón y mazo.
- Battle Run PvP con resultado verificable.
- Matchmaking, MMR, temporada, abandono y desconexión.
- Replay del último turno o combate cuando la arquitectura lo permita.
- Revancha y rivalidad sin afectar la integridad del ranking.
- Auditoría de rankings y separación de fixtures de QA.
- Leaderboard público con contexto correcto durante pre-lanzamiento.

**Salida:** PvP competitivo confiable y coherente con ForgeFormation.

#### FASE T7 — Cartas, colección y profundidad estratégica

**Objetivo:** asegurar que la colección tenga decisiones reales y no sólo volumen.

- Reconciliar el catálogo vivo con documentos históricos sin crear cartas ficticias.
- Validar atributos, rarezas, facciones, regiones, keywords y comerciabilidad actuales.
- Diseñar identidad de carta a partir de datos existentes: elemento, criatura, poder, personalidad, rareza y facción.
- Confirmar que Deck Builder, colección, fusión, evolución, inventario, packs y reliquias consumen contratos compatibles.
- Crear sinergias de formación, reserva, facción y arquetipo con counterplay.
- Probar mazos de inicio, progresión y endgame con la colección real.

**Salida:** colección legible, estratégica y coherente con el combate.

#### FASE T8 — Capa audiovisual Tier 1

**Objetivo:** convertir cada resultado de combate en una experiencia memorable sin sacrificar rendimiento.

- Cinemáticas diferenciadas para entrada, Campeón, reserva, boss, victoria, derrota y muerte del Campeón.
- VFX por facción, elemento, rareza, keyword, criatura y personalidad cuando los datos existan.
- Impacto de ataque, números de daño, escudos, críticos, estados, muerte y último aliento.
- HUD de turnos, HP segmentado, telemetría comprensible y scoreboard MVP.
- Música de combate por fase y región con transición suave.
- SFX de keywords, rarezas, cartas, reserva, bosses y resultados.
- Fallback para dispositivos con efectos reducidos.
- Precarga controlada, atlas, límites de partículas y pruebas de 60 FPS en móvil.

**Salida:** identidad audiovisual propia y competitiva.

#### FASE T9 — Onboarding, narrativa y retención de sesión

**Objetivo:** que un jugador nuevo comprenda y desee continuar desde los primeros minutos.

- Tutorial basado en una batalla real guiada.
- Explicación progresiva de Campeón, apoyos, reserva, keywords y resultado.
- Briefings narrativos por región y enemigo.
- Misiones y eventos que enseñen mecánicas, no sólo entreguen recompensas.
- Revancha, siguiente nodo, resumen de sesión y objetivos claros.
- Navegación pública de cartas, lore y leaderboard sin confundir contenido público con funciones autenticadas.
- Estados de carga, error, vacío y recuperación con calidad visual consistente.

**Salida:** primer recorrido completo desde visitante hasta jugador activo.

#### FASE T10 — QA integral y launch gate

**Objetivo:** declarar el producto listo sólo después de verificar todo el sistema.

- Build limpio y typecheck sin errores.
- Tests de invariantes ForgeFormation.
- Tests de Battle Run y settlement idempotente.
- Auditoría de RLS, RPCs, triggers y permisos.
- Validación de energía, cooldowns, progresión y economía interna.
- Pruebas de doble click, refresh, abandono, timeout y reconexión.
- Verificación de datos de prueba frente al universo de lanzamiento.
- Pruebas de rendimiento en móvil y escritorio.
- Auditoría de rutas, assets, audio, cinemáticas y accesibilidad.
- Verificación de `dist/`, GitHub `main` y Cloudflare Pages.
- Revisión documental: ninguna tarea completada aparece como pendiente activa sin etiqueta histórica clara.
- `CONTINUITY.md` actualizado con el último checkpoint real.

**Salida:** decisión de lanzamiento basada en evidencia, no en HTTP 200 ni en la existencia de pantallas.

### 8. Orden obligatorio de ejecución

Ningún agente debe saltar directamente a VFX, audio, nuevos bosses o expansión de cartas si T0, T1 y T2 no están validados.

1. Leer este protocolo completo.
2. Leer `CONTINUITY.md` y tomar la entrada más reciente como estado del código.
3. Leer el plan activo sólo como registro de ejecución.
4. Verificar esquema vivo, RPCs, RLS, triggers y datos necesarios.
5. Ejecutar baseline build y comprobaciones del repositorio.
6. Completar T0.
7. Completar T1.
8. Completar T2.
9. Completar T3 como vertical slice.
10. Generalizar a T4, T5 y T6.
11. Completar T7.
12. Ejecutar T8 y T9 en lotes verificables.
13. Completar T10 y declarar launch gate sólo con evidencia.
14. En cada fase: código, datos, seguridad, build, continuidad, plan activo y deploy cuando corresponda.

### 9. Regla de bloques completos y checkpoints

Cada bloque debe partir del estado real más reciente, reutilizar contratos existentes, crear sólo piezas faltantes justificadas, conectar frontend/backend/datos/RLS/errores/estados/verificación y no declarar terminado un componente visual si su flujo funcional está incompleto.

Cada checkpoint debe incluir commit, `CONTINUITY.md`, actualización del documento activo, build, comprobaciones de datos y seguridad, rendimiento y deploy cuando corresponda. Esta directiva se actualiza sólo con estado comprobado, nunca con intención futura.

### 10. Criterios de no-regresión

Nunca romper las reglas inmutables de ForgeFormation, cartas y assets oficiales, fórmulas de poder sin análisis de cascada, RLS, triggers, Auth, ledger, responsive, integridad de recompensas, límites internos, historial documental o cadena de deploy.

Si una mejora requiere cambiar una regla canónica, primero debe existir una decisión de diseño fechada con motivo, impacto y fuentes dependientes. No se cambia una regla por conveniencia de implementación.

### 11. Definición final de terminado

VEXFORGE se considera Tier 1 listo para lanzamiento únicamente cuando T0-T10 tienen estado verificable, el flujo completo de combate funciona en PvE y PvP, las recompensas son persistentes e idempotentes, el contenido ofrece profundidad, la presentación audiovisual es propia y el sistema distingue claramente pruebas internas de jugadores reales.

La existencia de una tabla, RPC, ruta, asset o componente aislado no satisface esta definición. El criterio es producto completo, conectado, verificable y coherente.

### 12. Registro de esta actualización

- Se reconoce oficialmente que el leaderboard y las estadísticas actuales corresponden a cuentas owner/admin/QA en un entorno cerrado.
- Se establece **PRE-LAUNCH INTERNAL QA** como estado real.
- Se crea el plan T0-T10 como hoja de ruta oficial de unificación Tier 1.
- Se establece Combat Content Layer y Battle Run como arquitectura objetivo.
- Se mantienen los textos históricos sin borrarlos, pero quedan subordinados por fecha, continuidad y esta directiva.
- Se excluyen expresamente del alcance de ejecución pagos, monetización, licencias, blockchain, NFTs y enlaces on-chain.

---

# ADDENDUM AUTORITATIVO — VEXFORGE VISUAL EXCELLENCE PROGRAM v1
**Fecha:** 2026-08-09  
**Naturaleza:** directiva permanente de evolución visual, sonora, tutorial, cinemática y de presentación  
**Precedencia:** este addendum desarrolla el Protocolo Maestro; no sustituye reglas de seguridad, economía, RLS, combate autoritativo, T10 ni la fuente de verdad del código y del esquema vivo.

## 1. Propósito y definición de terminado

VEXFORGE debe evolucionar desde una interfaz funcional hacia una experiencia DCCG medieval premium, reconocible y viva. El objetivo no es añadir decoración genérica: cada pantalla, carta, animación, efecto, sonido, voz, tutorial y pieza de lore debe comunicar la identidad propia de VEXFORGE y ayudar al jugador a entender qué ocurre.

El trabajo visual no se considera terminado porque una pantalla "ya funcione". Un elemento sólo puede llamarse **OPERATIVO** cuando cumple su quality gate correspondiente y existe evidencia. Todo elemento puede volver a entrar en revisión si aparecen mejores recursos, nuevas necesidades de contexto, problemas de claridad, inconsistencias de identidad o mejoras de rendimiento. `COMPLETADO` significa "cumple el nivel aprobado actual", nunca "no puede mejorarse".

El alcance cubre:

- entrada al juego, autenticación, onboarding y primer minuto;
- navegación y todos los dominios/rutas que existan en el código real;
- cartas, colección, packs, deck builder, inspectores y vistas de arte;
- batalla ForgeFormation, turnos, unidades, campeones, reliquias, reserva y resultado;
- misiones, raids, jefes, PvP, rankings, temporada y recompensas;
- lore, regiones, modo historia y transiciones narrativas;
- audio ambiental, música, SFX, voces y feedback de interacción;
- responsive móvil/escritorio, accesibilidad, legibilidad y rendimiento.

Quedan fuera de esta directiva salvo aprobación expresa y análisis independiente: cambios de economía, balances, recompensas, blockchain/NFT, pagos, contratos, RPCs, RLS y datos canónicos. Si una mejora visual necesita datos nuevos, primero se debe demostrar que los datos ya existen o documentar un contrato mínimo sin inventar valores.

## 2. Fuentes y orden de decisión

1. Código real de GitHub `main` y esquema vivo de Supabase.
2. Este Protocolo Maestro.
3. Este addendum visual.
4. El bloque operativo canónico VE-UI-TIER1-ANDROID-01 de este protocolo.
5. Documentos oficiales de dominio y continuidad.
6. `vexforge_forge_formation_engine_v1` sólo como historial superseded.
6. El recurso generado o la propuesta estética sólo puede entrar en producción si respeta las fuentes anteriores.

Nunca se usan placeholders, emojis, iconos de sistema, arte de stock sin identidad, sonidos genéricos o texto inventado para ocultar una carencia. Si falta un recurso, el estado es `BLOCKED` o `DRAFT`, con la carencia documentada.

## 3. Unidad universal de trabajo y estados reabribles

Cada mejora se registra como una unidad atómica con un ID estable. Ejemplos de formato: `VE-CARD-<canonical-card-id>`, `VE-ROUTE-<route-key>`, `VE-TUTORIAL-<step>`, `VE-AUDIO-<context>`, `VE-CINE-<scene>` y `VE-ASSET-<asset-key>`.

Cada unidad debe contener:

- fuente canónica y estado baseline;
- objetivo de experiencia y problema que resuelve;
- dependencias de datos, código, Storage, audio o narrativa;
- propuesta de identidad visual y reglas de uso;
- prompts, variantes, negative prompts y procedencia de cada asset generado;
- implementación prevista y superficies afectadas;
- estados vacíos, error, carga, responsive y accesibilidad;
- presupuesto de peso, memoria, tiempo de carga y objetivo de 60 FPS cuando aplique;
- evidencia de verificación y criterio de aceptación;
- nivel actual, deuda restante y próxima fecha/condición de revisión.

Estados válidos:

- `NOT_STARTED`: no iniciado.
- `DRAFT`: propuesta o asset no integrado.
- `IN_PROGRESS`: en ejecución.
- `BLOCKED`: requiere una fuente, sesión, asset, dato o verificación técnica necesaria que no existe o no puede sustituirse con una alternativa compatible. La falta de QA manual del owner no entra en este estado si la unidad ya está integrada y sus gates técnicos pasan.
- `IMPLEMENTED_UNVERIFIED`: integrado pero sin gate completo o sin QA humana posterior; puede continuar la siguiente unidad elegible mientras queda pendiente la validación del owner.
- `OPERATIONAL`: pasa el gate del nivel actual.
- `CANDIDATE_FOR_REVIEW`: operativo, pero con una oportunidad concreta de mejora.
- `REFINED`: supera una revisión posterior documentada.
- `DEFERRED`: aplazado con motivo explícito.

No se permite borrar el historial de una unidad ni convertir `BLOCKED` en `OPERATIONAL` sin evidencia. La ausencia de QA humana no bloquea la implementación ni el avance a la siguiente unidad: sólo impide declarar esa unidad `OPERATIONAL` hasta que el owner aporte la validación correspondiente. Una unidad `OPERATIONAL` o `REFINED` puede reabrirse con `CANDIDATE_FOR_REVIEW` cuando cambie el contexto, aparezca un asset mejor o el criterio de calidad suba.

## 4. Escala universal de calidad

- **Q0 — Contrato:** identidad, fuente canónica, alcance y dependencias definidos.
- **Q1 — Legible:** el jugador entiende la acción, estado y resultado sin explicación externa.
- **Q2 — Coherente:** tipografía, iconografía, color, movimiento, audio y tono pertenecen al mismo mundo.
- **Q3 — Identitario:** la carta, ruta, facción, región o momento tiene rasgos propios; no es una plantilla intercambiable.
- **Q4 — Premium:** timing, composición, capas, sonido, cámara, transiciones, narrativa y microinteracciones están pulidos; no hay placeholders ni arte genérico.
- **Q5 — Tier 1 candidate:** rendimiento, responsive, accesibilidad, consistencia global, claridad y revisión de calidad superan una matriz documentada. Requiere validación interna y posteriormente usuarios reales; no equivale a una garantía comercial.

El plan debe indicar siempre `nivel_actual -> nivel_objetivo`. Una unidad puede ser válida en Q2 y seguir abierta para Q3/Q4/Q5.

## 5. Dossier obligatorio de cada carta

Cada carta canónica debe tener una unidad `VE-CARD` propia. Se reutilizan componentes y motores, pero nunca se confunde reutilización técnica con identidad genérica. El dossier se construye usando únicamente los campos existentes en `cards` y documentos oficiales:

### 5.1 Identidad

- ID canónico, nombre, imagen existente y URL de Storage;
- facción, elemento, tipo de criatura, rareza, poder, personalidad y keywords existentes;
- región, relación de lore y rol de combate cuando consten en fuentes oficiales;
- motivo visual, silueta, material, símbolo, iluminación y paleta derivados de esos datos;
- tono de texto, motto y voz sólo si están respaldados por lore oficial.

### 5.2 Superficies que se deben diseñar y verificar

1. tile/lista y estado bloqueado/desbloqueado;
2. hover, focus, selección, arrastre y confirmación;
3. inspector ampliado y arte a pantalla completa;
4. entrada al tablero e invocación;
5. idle vivo y respuesta a la presencia del jugador;
6. ataque, habilidad, keyword, impacto, daño, curación y muerte;
7. interacción con campeón, reserva, reliquia y terreno;
8. victoria, derrota, retirada y replay cuando corresponda;
9. pack/recompensa, evolución y colección;
10. lore, relaciones y presentación narrativa.

Cada superficie debe declarar si es `APLICA`, `NO_APLICA` o `PENDIENTE_DE_FUENTE`; nunca se inventa una animación sólo para llenar una lista.

### 5.3 Animación y VFX por carta

La implementación debe combinar parámetros comunes del motor con authored data por carta: forma de entrada, ritmo, dirección, cámara, partículas, material, trail, impacto, color, audio motif y respuesta de la UI. El elemento, criatura, poder y personalidad son ejes mínimos de P1. La rareza y facción pueden modularlos, pero no reemplazarlos.

Las animaciones deben tener intención: anticipación, acción, impacto, recuperación y lectura del resultado. El exceso de partículas que reduzca claridad o rendimiento se considera un defecto, no una mejora.

### 5.4 Audio y voz por carta

Cada carta debe tener un perfil de audio propio cuando la superficie lo requiera: motif de invocación, interacción, ataque/habilidad, impacto y salida. Las voces deben existir sólo para líneas narrativas definidas, con personalidad y pronunciación consistentes. Toda música, SFX o voz generada debe guardar prompt/brief, versión, proveedor o método de generación, licencia/permiso de uso, archivo final y fallback accesible. No se copia un mismo sonido como sustituto de identidad salvo que el dossier justifique que es un lenguaje compartido.

### 5.5 Asset pack y prompts

Cada asset generado requiere: prompt principal, negative prompt, relación de aspecto/resolución, variantes consideradas, selección final, retoque aplicado, transparencia cuando aplique, nombre de archivo estable, hash/versionado y ubicación prevista. Los prompts describen el mundo VEXFORGE, la carta y la función del asset; no dicen sólo "fantasy card art". Se evita imitar literalmente artistas, personajes, logos o franquicias existentes.

## 6. Dossier obligatorio de cada ruta o dominio

Primero se audita el inventario real de rutas; no se fija aquí un número supuesto. Cada `VE-ROUTE` debe registrar: objetivo del dominio, entrada y salida, jerarquía, CTA principal, estados de carga/error/vacío, datos que consume, navegación relacionada, fondo/ambiente, audio, motion budget, mobile layout y criterio de comprensión en cinco segundos.

La auditoría agrupa las rutas reales en: entrada/onboarding; home y progresión; cartas/colección/packs/decks; combate; misiones/raids/bosses/PvP; lore/regiones; social/clanes/rankings; economía/cuenta/ajustes; y administración. Cada grupo recibe un lenguaje ambiental propio, pero todos comparten una gramática VEXFORGE.

Una ruta no se considera visualmente terminada si sólo tiene un fondo. Debe tener estructura, profundidad, estados vivos, relación clara entre acciones y resultados, transiciones con propósito y una identidad que no compita con la legibilidad.

## 7. Roadmap por fases

### VE-0 — Baseline visual y auditoría de evidencia
**Objetivo:** inventariar código, rutas, assets, cartas, audio, tutorial, dominios y deuda visual real.  
**Salida:** matriz de cobertura; lista de placeholders/genéricos; mapa de dependencias; baseline de rendimiento; ranking de impacto.  
**Gate:** cada hallazgo tiene fuente, captura/evidencia, ID y estado. No se declara calidad por opinión aislada.

### VE-1 — Biblia visual y lenguaje de movimiento
**Objetivo:** definir identidad medieval propia: materiales, iluminación, marcos, facciones, regiones, estados, iconografía, tipografía, motion grammar, cámara, partículas y reglas de contraste.  
**Salida:** tokens/documentación reutilizable, ejemplos aprobados y reglas de cuándo no usar un efecto.  
**Gate:** una carta, una batalla, una ruta y un tutorial pueden convivir sin parecer productos distintos.

### VE-2 — Pipeline de assets originales
**Objetivo:** crear pipeline reproducible de generación, revisión, recorte, optimización, Storage y versionado para iconos, fondos, marcos, overlays, partículas, ilustraciones de apoyo, UI art, música, SFX y voces.  
**Salida:** catálogo de assets con prompts, procedencia, licencia, dimensiones, formato, peso y consumidores.  
**Gate:** ningún asset integrado queda sin origen, nombre estable o responsable de revisión.

### VE-3 — Motor de identidad audiovisual por carta (P1 + M1 refinado)
**Objetivo:** extender el motor existente para que la presentación dependa de datos canónicos y authored data por carta.  
**Orden:** modelo de identidad; reglas por eje; presets no intercambiables; invocación; idle; ataque/habilidad; impacto/muerte; inspector; audio; pruebas con cartas representativas.  
**Gate:** cada carta soportada tiene dossier; no se inventan campos ni se rompe el contrato de combate; el cliente sólo presenta y el backend sigue siendo autoridad.

### VE-4 — ForgeFormation cinematográfico
**Objetivo:** convertir el combate en una secuencia legible y dramática: intro, formación, turnos, cámara, targeting, reserva, reliquias, keywords, daño, estados, final y scoreboard.  
**Salida:** timeline modular, cancelación segura, reduced motion, eventos tardíos y replay/presentación coherente con Battle Run.  
**Gate:** cada evento autoritativo tiene una representación visual; ningún efecto puede cambiar el resultado real.

### VE-5 — Tutorial vivo y onboarding contextual
**Objetivo:** reemplazar el tutorial intrusivo por aprendizaje dentro de la experiencia real. El jugador ve el dominio que se explica, ejecuta una acción guiada, recibe feedback y entiende por qué importa.  
**Bloques:** bienvenida narrativa; navegación; colección; carta; formación; turno; ataque; keyword; defensa/reserva; recompensa; siguiente objetivo. La secuencia debe usar datos oficiales, cartas del jugador o una fixture explícita y segura, sin disfrazar estados faltantes.  
**Gate:** cada paso tiene objetivo, acción, feedback, salida, recuperación de error, skip/replay, accesibilidad y evidencia; el fondo nunca se oscurece hasta ocultar la interfaz que se está enseñando.

### VE-6 — Rediseño de rutas y dominios
**Objetivo:** trabajar cada `VE-ROUTE` desde el inventario real, priorizando primer minuto, home, cartas, colección, deck builder, combate, misiones, PvP, raids, bosses, packs y lore.  
**Método:** lote pequeño por grupo; una ruta baseline, un lenguaje ambiental, estados completos, responsive, transiciones y revisión cruzada.  
**Gate:** navegación comprensible, sin pantallas huérfanas, sin fondos decorativos que oculten controles, y con un sistema consistente de estados.

### VE-7 — Audio, música y voces identitarias
**Objetivo:** diseñar el paisaje sonoro de VEXFORGE por ruta, facción, región, combate, rareza, evento y carta.  
**Salida:** mapa de cues, mezclas, prioridades, loops, ducking, mute/volumen, subtítulos de voz, fallback y catálogo de procedencia.  
**Gate:** audio no repetitivo sin intención, no impide leer ni jugar, funciona con mute y no usa material sin autorización.

### VE-8 — Lore, modo historia y cinemáticas
**Objetivo:** convertir el lore oficial en escenas, transiciones y momentos jugables que amplíen el contexto sin inventar canon.  
**Salida:** guion visual por escena, storyboard, assets, voz, música, duración, skip/replay y conexión con la pantalla siguiente.  
**Gate:** cada escena tiene función narrativa y no bloquea innecesariamente al jugador.

### VE-9 — Rendimiento, accesibilidad y compatibilidad
**Objetivo:** preservar 60 FPS objetivo en móvil cuando sea viable, controlar memoria, peso de assets, carga progresiva, lazy loading, WebGL/CSS fallback, reduced motion, contraste, foco, teclado, texto y audio.  
**Gate:** matriz por móvil/escritorio y por dispositivo representativo; problemas se corrigen antes de añadir más capas visuales.

### VE-10 — Revisión de calidad y pulido continuo
**Objetivo:** reevaluar cada unidad contra Q0-Q5, detectar incoherencias y subir el siguiente nivel.  
**Salida:** lista de mejoras priorizada por impacto, riesgo y dependencia; comparativa baseline/actual; deuda visual explícita.  
**Gate:** revisión cruzada de cartas, rutas, tutorial, combate y audio; nada se marca como perfecto o definitivo.

### VE-11 — Validación cerrada y preparación de lanzamiento
**Objetivo:** combinar gates técnicos del Protocolo/T10 con validación manual del owner, QA y después jugadores reales. La validación manual es posterior a la implementación y documenta el estado de uso real; no bloquea la ejecución de la siguiente unidad.  
**Regla:** T10 sigue `NO-GO` hasta la sesión autenticada documentada. El trabajo visual y de producto puede avanzar como track controlado, pero no convierte por sí solo el proyecto en lanzamiento público ni permite declarar `OPERATIONAL` una unidad sin la evidencia aplicable.

## 8. Priorización y paquetes para cualquier sesión

Cada sesión debe tomar el primer paquete elegible según: (1) bloqueo crítico, (2) impacto en comprensión y retención, (3) dependencia que desbloquea otras unidades, (4) riesgo técnico, (5) valor visual. Un paquete pequeño debe poder ejecutarse y documentarse sin abarcar el juego entero.

El tamaño recomendado es: una carta representativa; una familia de cartas con el mismo lenguaje; una ruta; un paso de tutorial; una escena; o un conjunto de audio de un contexto. Después de cada paquete se actualiza su unidad y no se declara completada toda la fase por haber completado un ejemplo.

## 9. Evidencia y continuidad

Al cerrar una unidad o paquete, el agente debe registrar: archivos y superficies afectadas, assets y versiones, fuente canónica consultada, estado anterior/nuevo, quality level, verificaciones ejecutadas, limitaciones, bloqueos, deuda y próximo criterio de reentrada. Debe actualizar `CONTINUITY.md` y este plan activo sin reescribir la historia.

No se ejecutan builds o validaciones irrelevantes sólo por rutina; sí se ejecuta la verificación mínima que corresponda al riesgo del paquete. Nunca se inventan resultados. Si la sesión no puede acceder a una fuente, asset externo o verificación técnica necesaria para implementar o comprobar razonablemente el paquete, se marca `BLOCKED` y se explica qué falta. Si lo único pendiente es navegador autenticado, usuario real, dispositivo o QA manual del owner después de que los gates técnicos pasan, se marca `IMPLEMENTED_UNVERIFIED`, se registra la evidencia pendiente y se continúa con la siguiente unidad elegible.

## 10. Estado inicial de este addendum

- T10: `BLOCKED / PRE-LAUNCH INTERNAL QA`; falta sign-off autenticado del owner según la continuidad vigente. Este estado limita el launch gate, pero no detiene la implementación ni la preparación de las siguientes unidades.
- Fase visual histórica B1-B4, C1-C2, D1-D2, G1-G3, H1-H4, I1-I2 y assets listados: conservar como `OPERATIONAL` sólo en el nivel documentado; quedan abiertas a reevaluación Q3-Q5.
- P1: `NOT_STARTED` como identidad audiovisual completa por carta; los efectos actuales por facción/rareza no satisfacen por sí solos los cuatro ejes de identidad.
- Tutorial: existe una base guiada, pero la revolución contextual VE-5/TU.0-TU.1 sigue abierta hasta demostrar aprendizaje dentro de la interfaz real.
- VE-0: `NOT_STARTED`; es el primer paquete visual recomendado, sin repetir la auditoría T0/T10 de backend.
- Las tareas P2-P6 y M2-M5 conservan su estado canónico del plan activo y no se reabren salvo evidencia nueva.

Este addendum queda diseñado para seguir siendo válido cuando el trabajo continúe con límites de uso distintos, otra sesión o un agente diferente. La unidad de continuidad es el estado verificable de cada paquete, no la memoria de una conversación.


---

# REVISIÓN DE SOLIDEZ 2 — IDENTIDAD, AUTORIDAD CREATIVA Y MEJORA CONTINUA
**Fecha:** 2026-08-09  
**Aplicación:** permanente para toda IA o equipo que continúe VEXFORGE

Esta revisión aclara y endurece el programa visual anterior. En caso de contradicción, esta sección prevalece sobre cualquier texto histórico más permisivo.

## R2.1 — Regla absoluta de cero genéricos

En el producto final no se permite ningún emoji, icono genérico, icono del sistema, símbolo Unicode usado como sustituto visual, placeholder, arte de stock sin identidad, sonido de biblioteca sin tratamiento propio, voz genérica, fondo intercambiable ni recurso de plantilla que delate una implementación incompleta. Esto incluye navegación, botones, badges, estados, tutorial, cartas, combate, lore, recompensas, packs, errores, carga y administración.

Todo recurso visual, sonoro o vocal debe ser creado o transformado específicamente para VEXFORGE mediante un brief/prompt contextual y quedar registrado en su ficha de procedencia. Un componente técnico reutilizable sí está permitido; su apariencia no puede convertirse en una identidad genérica compartida cuando el contexto exige diferenciación.

Si el agente encuentra un recurso genérico que todavía no puede sustituir, debe registrarlo como `BLOCKED` o `DRAFT`, conservar su ubicación documentada y crear el siguiente trabajo de sustitución. Nunca debe presentarlo como terminado ni esconderlo detrás de otro placeholder.

## R2.2 — Autoridad creativa acotada por contexto

La IA tiene autoridad para diseñar y generar prompts, variantes y tratamientos de imagen, animación, VFX, audio, música, voz, iconografía, fondos y cinemáticas cuando sean necesarios para cumplir el roadmap. Esa autoridad es creativa, no canónica ni autoritativa sobre el juego.

Antes de crear cualquier recurso, la IA debe reunir el contexto oficial disponible: carta, imagen existente, elemento, criatura, poder, personalidad, facción, rareza, keywords, región, lore, función de gameplay, ruta, momento y reglas de presentación. Debe producir una justificación trazable `dato oficial -> decisión artística -> recurso -> superficie`.

La IA no puede inventar lore, nombres, estadísticas, metadata, habilidades, keywords, resultados de batalla, recompensas, estados, relaciones, diálogos canónicos ni desenlaces narrativos o de gameplay. Si el contexto no permite una decisión segura, el recurso queda `PENDING_SOURCE`/`BLOCKED`; puede proponerse un concepto abstracto sin integrarlo como canon.

La capa visual nunca puede decidir una victoria, derrota, daño, recompensa, settlement, evolución, economía o estado de cuenta. El cliente sólo presenta hechos ya autorizados por los contratos y datos oficiales.

## R2.3 — Pasaporte de identidad por carta

La unidad `VE-CARD` es obligatoria para cada carta canónica, incluso cuando reutilice un motor común. El pasaporte debe enlazar:

1. datos canónicos y fuente consultada;
2. lectura de identidad de la carta;
3. imagen actual y diagnóstico de mejora;
4. prompt, negative prompt, variantes, selección, retoque y versión del nuevo arte;
5. silueta, material, iluminación, paleta, cámara y lenguaje de movimiento;
6. reveal, inspector, entrada, idle, ataque, habilidad, impacto, daño, muerte y resultado aplicables;
7. SFX, música, motif y voz propios cuando la carta tenga voz o sonido;
8. superficies de UI, lore, colección, pack y combate;
9. responsive, reduced motion, accesibilidad y presupuesto de rendimiento;
10. comparación contra su baseline, otras cartas y el estándar Tier 1;
11. deuda y condición exacta para reabrirla.

La imagen de una carta puede mejorarse o regenerarse, pero no se sustituye automáticamente. Cada versión debe preservar la identidad y los datos oficiales, registrar el motivo del cambio, permitir volver a la versión anterior y demostrar que funciona en las superficies reales del juego.

## R2.4 — Voz y audio con identidad propia

Cuando una carta, personaje, región, evento o sistema tenga voz, debe tener un perfil propio: identidad vocal, intención, dicción, emoción, límites de actuación, líneas autorizadas, mezcla, prioridades y referencia de continuidad. No se acepta clonar un único tono para toda la colección.

La voz sólo puede decir texto autorizado por lore o guion oficial. Si no existe una línea aprobada, se deja voz en `PENDING_SOURCE` y se usa, si procede, un motif no verbal propio. Todo audio generado incluye prompt/brief, versión, procedencia, licencia de uso, archivo, consumidor, fallback y controles de mute/volumen.

## R2.5 — Gate de comparación Tier 1 después de completar

`OPERATIONAL`, `REFINED` y `Q5` no son estados terminales. Al iniciar cada nueva sesión, la IA debe:

- leer protocolo, plan activo, continuidad y fuentes oficiales;
- comparar el estado actual contra la matriz Q0-Q5 y referentes Tier 1 sin copiar su identidad;
- identificar explícitamente qué todavía está por debajo del objetivo: imagen, composición, timing, cámara, VFX, audio, voz, tutorial, claridad, consistencia, responsive o rendimiento;
- registrar nuevas brechas como `CANDIDATE_FOR_REVIEW` con prioridad y evidencia;
- mejorar primero la brecha de mayor impacto y menor riesgo, sin reabrir trabajo por opinión vaga;
- conservar el historial de versiones y la evidencia anterior.

El resultado de una sesión nunca puede ser simplemente “apartado visual completado”. Debe decir qué subunidades cumplen qué nivel, qué deuda queda y cuál es el siguiente nivel posible. Si una IA nueva detecta una carencia demostrable, puede reabrir la unidad aunque antes estuviera marcada `COMPLETED`.

## R2.6 — Auditoría de fugas de identidad

Antes de cerrar una fase se ejecuta una matriz de consistencia que comprueba, como mínimo: carta frente a imagen; imagen frente a animación; animación frente a sonido/voz; sonido frente a facción/región; lore frente a cinemática; tutorial frente a interfaz real; UI frente a iconografía; escritorio frente a móvil; y todos los estados de carga/error/victoria/derrota frente a datos reales.

Una fuga es cualquier contradicción, repetición injustificada, recurso genérico, texto inventado, transición sin causa, efecto que oculta información, audio que no corresponde, imagen que no refleja la carta o tratamiento que cambia el significado de un dato oficial. Una sola fuga relevante impide el gate de la unidad afectada.


## ENMIENDA PERMANENTE — REVISIÓN PÚBLICA DE CLOUDFLARE PAGES

**Vigencia:** 2026-08-10 · se incorpora al Protocolo Maestro activo.

- La URL pública oficial de VEXFORGE, https://vexforge-web.pages.dev, puede abrirse y revisarse directamente sin token, API key, integración de Cloudflare ni acceso administrativo.
- La revisión pública incluye comprobaciones HTTP, captura visual, rutas públicas, headers, bundle servido, assets públicos y comparación con el código de main disponible en GitHub.
- El hecho de que Cloudflare Pages compile desde GitHub no demuestra por sí solo que el bundle servido corresponda al commit actual: debe compararse el hash, nombre o contenido de los artefactos cuando sea posible.
- Los tokens, integraciones o accesos administrativos de Cloudflare sólo son necesarios para acciones de administración, configuración, consulta de metadatos no públicos o publicación manual. No deben solicitarse para una revisión pública.
- La revisión pública y la publicación son acciones distintas: una URL pública puede auditarse sin credenciales, pero no se debe declarar que un nuevo commit está publicado sin evidencia del bundle live.
- Esta regla no autoriza deploy, push, cambios de configuración ni cambios en Cloudflare; cualquier publicación sigue requiriendo autorización explícita y el canal oficial disponible.


## ENMIENDA PERMANENTE - CADENA CANÓNICA DE EJECUCIÓN Y DESPLIEGUE (2026-08-11)

Esta enmienda prevalece sobre cualquier instrucción anterior que describa un flujo local, replicado o de publicación manual.

- GitHub es el único código fuente oficial: grandmaster68081-byte/Vexforge-web, rama main. Todo cambio de frontend se realiza directamente en ese código fuente; no se trabaja sobre una copia local, réplica, mockup, preview, checkout paralelo ni otro entorno como fuente de verdad.
- Cloudflare Pages es el frontend publicado y está vinculado a GitHub. Despliega automáticamente los cambios de main. No se hace deploy manual, wrangler deploy, publicación directa ni edición de código en Cloudflare. Para reflejar un cambio: actualizar GitHub, hacer commit y push a main, esperar la propagación automática y revisar la URL pública.
- Supabase es backend, base de datos y Storage: PostgreSQL, RLS, RPCs, Auth, Storage y contratos autoritativos viven en el proyecto oficial rscuzqnfccqvltkdcdny.
- El entorno local o de Replit no es un entorno de trabajo del producto: no crear ni modificar implementaciones paralelas ni usar artefactos locales como fuente de verdad. Las operaciones del agente se limitan a inspeccionar fuentes oficiales y escribir directamente mediante sus canales oficiales.
- Después de un cambio en GitHub se verifica el commit de main, la propagación automática de Cloudflare y el estado vivo de Supabase. Si Cloudflare aún no refleja main, se registra PENDING_SOURCE o BLOCKED por propagación; nunca se inicia un deploy alternativo ni se corrige el frontend fuera de GitHub.
- Cualquier documento que indique deploy manual de Cloudflare, uso de wrangler para publicar, trabajo local como fuente del producto o una réplica como entorno equivalente queda SUPERSEDED por esta enmienda.

---

# ADDENDUM AUTORITATIVO — VEXFORGE GAME-FIRST EXPERIENCE LAYER v1
**Fecha de incorporación:** 2026-08-26  
**Documento fuente:** `vexforge_visual_benchmark_fates_extension_v1`  
**Estado:** OFICIAL — INTEGRADO EN EL PROTOCOLO MAESTRO  
**Naturaleza:** capa de experiencia Tier 1 sobre el plan existente; no sustituye el protocolo, ForgeFormation, la autoridad de Supabase, las reglas de Android, la economía, la seguridad, RLS, RPCs, Storage ni los gates de entrega.

## LEY DIARIA DE CONTEXTO COMPLETO Y CONTINUIDAD

Al comenzar cada día de trabajo y cada nueva sesión operativa, antes de ejecutar cualquier trabajo, la IA debe leer, comprender y analizar el protocolo completo vigente en Supabase. Esta obligación se mantiene aunque `CONTINUITY.md` describa con exactitud la tarea, aunque exista una instrucción aparentemente inequívoca o aunque la IA crea recordar el método de trabajo.

El orden obligatorio de preflight es:

1. Leer el documento completo `vexforge_master_protocol_v2` desde Supabase, sin sustituirlo por un resumen, una memoria, una copia cacheada o una sola sección.
2. Leer la entrada completa más reciente de `CONTINUITY.md` y el resto de la continuidad necesaria para entender el estado y la deuda.
3. Leer el plan oficial aplicable y, cuando el trabajo sea Android, `docs/VE-MOB-0-PORT-INVENTORY.md`.
4. Reconciliar lo leído con GitHub `main`, el esquema vivo de Supabase, RPCs, RLS, triggers, Auth, Storage, assets, contratos, release y deploy que correspondan.
5. Confirmar el método de trabajo, las fuentes de autoridad, la unidad concreta, los límites y los gates antes de escribir, ejecutar SQL, crear assets, modificar código, hacer commit o publicar.

La continuidad nunca concede una excepción a esta ley: indica desde dónde continuar, pero no reemplaza la comprensión del protocolo completo. La finalidad es evitar incompatibilidades de contexto —no colocar una losa de granito sobre un piso de mármol— y preservar decisiones, secuencias, salvaguardas y estándares acumulados.

Si no es posible leer el protocolo completo o reconciliar las fuentes críticas, el trabajo dependiente queda `BLOCKED`; no se adivina, no se ejecuta parcialmente y no se presenta una suposición como autoridad. Cada sesión que ejecute trabajo debe registrar en la continuidad que el preflight fue realizado, qué fuentes fueron reconciliadas y qué unidad/gate se eligió.

## 1. ALCANCE DE LA CAPA DE EXPERIENCIA

La extensión oficial de referente visual y de producto se integra como `TIER 1 EXPERIENCE LAYER`. No crea un plan paralelo. Cada trabajo visual debe vincularse simultáneamente a:

- una fase T0-T10;
- una unidad `VE-MOB-*` cuando afecte Android;
- uno o más criterios existentes de `public.vexforge_visual_tier1_objective`;
- una superficie, asset o componente identificable;
- evidencia reproducible y una condición de reapertura.

La meta es que VEXFORGE funcione y se sienta como un videojuego de cartas premium: mundo, identidad, Campeón, ForgeFormation, Reserva, Reliquias, regiones, progresión, economía justa, autoridad backend, claridad, feedback, motion, audio, rendimiento y accesibilidad.

## 2. LEY GAME FIRST

Las superficies se diseñan como escenas y momentos jugables, no como formularios o paneles administrativos. La carta es un objeto de deseo y conserva el protagonismo; la presentación no debe ocultar datos ni convertir el cliente en autoridad. Cada superficie debe expresar contexto de juego, objeto, acción y feedback, incluidos sus estados de carga, vacío, error, victoria y derrota.

Se prohíben placeholders, emojis, iconos de sistema, arte de stock sin identidad, sonidos genéricos, texto inventado y controles intercambiables cuando falte una fuente oficial. La ausencia de un recurso se registra como `BLOCKED` o `DRAFT`, nunca se oculta con un sustituto genérico.

## 3. LEY DE REFERENTES SIN COPIA

Might & Magic Fates Heroes TCG se usa como benchmark de presentación, jerarquía, claridad, atmósfera, UX móvil, combate, colección y progresión; nunca como plantilla. Se permiten principios UX y patrones conceptuales, pero no se copian identidad visual, arte, iconografía, personajes, textos, assets, composiciones literales, layout ni mecánicas específicas. VEXFORGE debe conservar y superar con identidad propia sus pilares canónicos.

## 4. DESIGN QA Y RÚBRICA

Cada superficie principal pasa, cuando corresponda, por FUNCTIONAL, DATA, VISUAL, MOTION, AUDIO, MOBILE, ACCESSIBILITY, PERFORMANCE, IDENTITY y BENCHMARK. La superficie no se considera `TIER1_READY` hasta completar los pases aplicables y registrar evidencia.

La evaluación visual usa escala 0-5: 0 inexistente, 1 funcional, 2 coherente, 3 identidad propia, 4 premium y 5 Tier 1. El objetivo es al menos 4 en superficies principales y 3.5 en secundarias, sin sacrificar claridad, accesibilidad, rendimiento ni autoridad. El Anti-Mockup Gate rechaza una pantalla que pueda pertenecer a cualquier app, parezca administración, dependa de controles genéricos o no tenga escena, contexto, feedback y personalidad. El Anti-Empty-Screen Gate exige `SCENE + OBJECT + ACTION + FEEDBACK`.

## 5. ORDEN DE IMPLEMENTACIÓN VISUAL

La primera demostración transversal será un vertical slice trazable: HOME → CHAMPION → COLLECTION → CARD DETAIL → DECK/FORGE → FORMATION → BATTLE → RESULT → REWARD → HOME. La refactorización visual es reversible y se realiza por capas: tokens, iconografía, tipografía, fondos, cartas, botones, paneles, motion, audio, composición de escena y reconstrucción por superficie.

La aplicación Android se prioriza desde touch, pantalla pequeña, alcance del pulgar, legibilidad, FPS, memoria, accesibilidad y `reduced-motion`. El espectáculo nunca puede bloquear el input ni ocultar el estado autoritativo.

## 6. SUPABASE, TELEMETRÍA Y NO REGRESIÓN

Esta capa sólo consume datos reales y contratos existentes. No autoriza mocks, datos inventados, lógica local autoritativa, settlements locales ni economía local. El estado local sólo controla presentación y nunca resuelve combate, recompensas, inventario, progreso o autenticación.

La telemetría visual —cuando el contrato canónico la soporte— puede observar entradas/salidas de superficies, inspección de cartas, deck/formation, batalla, resultados, recompensas, tienda y nodos del mundo para medir tiempo, abandono, interacción, errores y rendimiento; no es una fuente de verdad del juego.

Todo cambio conserva la arquitectura oficial: GitHub `main` como fuente de código, Supabase como autoridad de datos/esquema/RPC/RLS/Auth/Storage, releases Android como canal móvil y Cloudflare Pages como deploy web de mantenimiento. Ninguna mejora visual puede degradar economía, seguridad, integridad competitiva, rendimiento, accesibilidad, build, workflow, release o evidencia.

## 7. REGLA DE CIERRE

No declarar Tier 1, `OPERATIONAL` ni una superficie terminada sólo porque compile o funcione. Deben existir evidencia, gates aplicables, estado Q, deuda, condición de reapertura y continuidad actualizada. La QA humana pendiente no detiene la siguiente implementación, pero sí conserva la unidad como `IMPLEMENTED_UNVERIFIED` y evita una declaración operativa prematura. Una superficie `OPERATIONAL`, `REFINED` o `Q5` puede reabrirse cuando cambie el contexto o aparezca una brecha demostrable.

La extensión queda integrada formalmente como directiva permanente. Durante la FASE PORT, la siguiente implementación se selecciona por el orden del inventario Android y el siguiente elemento no completado; cada unidad debe mapearse a los criterios Tier 1/T0-T10 y superar sus gates técnicos aplicables. La QA humana pendiente no impide seleccionar ni ejecutar la siguiente unidad, y cualquier hallazgo posterior puede reabrir la unidad correspondiente sin borrar su historial. Una vez completado el port, vuelve a regir la selección por fase abierta más baja y criterio bloqueante, después del preflight exigido por la Ley Diaria de Contexto Completo.
---
# ENMIENDA PERMANENTE — LEY DE CREACIÓN AUTÓNOMA POR CONTEXTO INCOMPLETO
**Fecha de entrada en vigor:** 2026-08-28  
**Estado:** OFICIAL — INTEGRADA EN EL PROTOCOLO MAESTRO  
**Precedencia:** esta enmienda prevalece sobre cualquier texto histórico o regla anterior que trate la falta de documentación, contexto, teoría, tabla, RPC, ruta, asset, decisión de flujo o conocimiento como un bloqueo automático.

## 1. Propósito de la ley

VEXFORGE no debe detener su evolución por una pieza de información que pueda ser razonablemente deducida, diseñada o creada a partir del análisis completo del producto. Cuando falte una especificación, el agente tiene autorización para inventar y materializar la solución que mejor encaje con el rompecabezas de VEXFORGE, su visión de calidad Tier 1, su arquitectura, su experiencia de jugador y sus reglas de integridad.

“Inventar” en esta ley significa crear una decisión de diseño, flujo, contrato, infraestructura, regla provisional, contenido de soporte, tratamiento visual, asset, componente o implementación que todavía no existía. No significa falsificar una evidencia, fingir que una decisión ya era canónica, fabricar una sesión humana ni ocultar una suposición.

## 2. Análisis integral obligatorio antes de crear

Antes de resolver una ausencia por cuenta propia, el agente debe analizar el proyecto como un sistema completo, no sólo el archivo donde aparezca el hueco. Debe revisar, según corresponda:

- la visión Tier 1 y el estado real de pre-lanzamiento;
- GitHub main, CONTINUITY.md, rutas, componentes, dominios y contratos existentes;
- Supabase vivo: esquema, columnas, RPCs, RLS, triggers, Auth, Storage y datos relevantes;
- ForgeFormation, Battle Run, combate, progresión, economía, recompensas, límites e idempotencia;
- la experiencia web y Android, responsive, accesibilidad, reduced motion, audio, assets y rendimiento;
- el deploy, workflow, releases y gates de verificación;
- las dependencias y efectos en cascada de la decisión que se vaya a crear.

La solución elegida debe acoplarse a lo que ya existe, reutilizarlo primero, evitar sistemas paralelos y mejorar la experiencia sin degradar claridad, seguridad o identidad.

## 3. Libertad de creación autónoma

Si después del análisis falta una pieza necesaria, el agente debe diseñarla y ejecutarla sin pedir aprobación intermedia. Esta autorización incluye, cuando el objetivo y el impacto lo justifiquen:

- alcance de una unidad y criterios de aceptación;
- rutas, pantallas, estados y recorridos de jugador;
- contratos de datos, tablas, columnas, relaciones, RPCs, políticas RLS y triggers;
- lógica de producto y flujo, siempre coherentes con las reglas y la economía de VEXFORGE;
- componentes, servicios, verificaciones, documentación y continuidad;
- assets, iconografía, audio, motion, cinemáticas y tratamientos de identidad;
- decisiones de compatibilidad, fallback, rendimiento, accesibilidad y recuperación.

La solución debe implementarse de extremo a extremo cuando pertenezca al alcance: fuente, datos, seguridad, consumidores, estados, verificación, publicación y continuidad. No se deja una capacidad deliberadamente a medias sólo porque un detalle no estuviera escrito previamente.

## 4. Regla de invención trazable

Toda decisión creada bajo esta ley debe registrar internamente, en la documentación o en la continuidad aplicable:

1. Supuesto derivado: qué se decidió porque faltaba una definición.
2. Contexto analizado: qué fuentes y relaciones del proyecto justifican la decisión.
3. Acoplamiento: qué reglas, contratos, datos, rutas o sistemas existentes reutiliza.
4. Impacto y límites: qué puede afectar y qué protecciones conserva.
5. Reversibilidad: cómo corregirla sin perder historial si aparece mejor información.
6. Verificación: qué build, guardas, consultas, QA o evidencia comprueban que funciona.

La decisión se presenta como DERIVADA, PROPUESTA o IMPLEMENTADA mientras corresponda; nunca se etiqueta como hecho canónico anterior si fue creada durante la sesión.

## 5. Lo que esta libertad sí puede crear y lo que no puede falsear

Se pueden crear soluciones nuevas para materializar capacidades aprobadas, incluso cuando no exista todavía una tabla, RPC, pantalla, regla de flujo o documento de unidad, siempre que sean coherentes, seguras, verificables y reversibles.

No se pueden falsear resultados de batalla, recompensas, balances ya existentes, estadísticas de producción, permisos, identidad de usuarios, sesiones autenticadas, QA humana, evidencia de deploy, datos canónicos ni estado operativo. Si una regla de juego nueva debe ser creada, se implementa como una decisión derivada explícita y se valida contra sus efectos sobre combate, economía, progreso, seguridad y experiencia.

La libertad creativa tampoco autoriza a exponer secretos, saltarse autenticación, desactivar RLS sin reemplazo seguro, romper triggers, duplicar autoridad en el cliente, ejecutar acciones irreversibles sin salvaguardas, usar canales no autorizados o incumplir restricciones superiores de la plataforma y la seguridad.

## 6. Eliminación del bloqueo por falta de contexto

A partir de esta enmienda, no se puede declarar BLOCKED por falta de conocimiento, documentación, teoría, contexto, tabla, RPC, ruta, asset, decisión previa o detalle de implementación cuando el análisis integral permita derivar una alternativa compatible.

Ante una ausencia, el agente debe seguir esta secuencia:

1. consultar las fuentes oficiales disponibles;
2. reconciliar código, datos, contratos, seguridad y visión del producto;
3. diseñar la alternativa que mejor encaje;
4. implementarla con trazabilidad y reversibilidad;
5. verificarla y registrar sus supuestos;
6. continuar con la siguiente parte del alcance sin trasladar decisiones técnicas al owner.

Los estados DRAFT, PENDING_SOURCE o equivalentes pueden describir una hipótesis o una deuda, pero no se usarán como excusa para detener una implementación que pueda resolverse mediante esta ley. Los placeholders, genéricos y datos inventados siguen prohibidos: se debe crear un recurso propio o dejar claramente registrado el supuesto derivado.

## 7. Únicos bloqueos permitidos

El único bloqueo operativo ordinario permitido es una verificación humana que sólo pueda realizar el owner, el operador o una persona directamente en la aplicación, especialmente cuando requiera inicio de sesión real, dispositivo físico, emulador, interacción manual o confirmación de uso que el agente no pueda ejecutar legítimamente.

Esa verificación humana puede impedir declarar OPERATIONAL, PASS, TIER1_READY o cerrar una QA, pero no impide implementar, publicar, documentar como IMPLEMENTED_UNVERIFIED y continuar con la siguiente unidad elegible.

Cualquier restricción de seguridad, legalidad o plataforma que no pueda resolverse automáticamente conserva su prioridad superior; no debe disfrazarse como falta de contexto ni superarse mediante una acción insegura.

## 8. Precedencia y continuidad

Esta ley aplica a toda IA, agente o sesión que continúe VEXFORGE. En caso de conflicto con una regla anterior sobre bloqueos por falta de fuente o información, prevalece esta enmienda, manteniendo intactas la autoridad de Supabase, la integridad del backend, ForgeFormation, la economía, la seguridad, los gates técnicos y la prohibición de falsificar evidencia.

Cada sesión debe registrar que leyó esta enmienda, qué decisión derivada creó, qué fuentes analizó, qué verificaciones ejecutó y qué deuda humana quedó pendiente. El proyecto avanza por decisiones razonadas y comprobables, no por esperas indefinidas de una especificación perfecta.

## 9. Registro de decisión del operador

- Se establece oficialmente la autonomía para crear lo inexistente cuando el análisis integral demuestre que es la mejor pieza para completar VEXFORGE.
- Se elimina el bloqueo por falta de contexto como causa válida de detención.
- Se mantiene la obligación de separar hechos canónicos, decisiones derivadas, evidencia y QA humana.
- La única verificación ordinaria que puede quedar pendiente como bloqueo es la validación humana directa en la aplicación.




---
## 2026-08-30 — VE-MOB-2-AUTH — APK RELEASED / IMPLEMENTED_UNVERIFIED

- Verificación remota: GitHub Actions `Build VEXFORGE Android APK`, run `52`, terminó `success` sobre `main` en el commit `d820f9ea1686804faecb67ec92808381d97d4e9a`.
- Gates técnicos confirmados por el log oficial: `npm run typecheck`, `expo prebuild`, Gradle `assembleRelease` y la guarda de APK standalone pasaron; el log reporta `OK: JS bundle embedded (88M)`.
- Release oficial: [vexforge-android-build-52](https://github.com/grandmaster68081-byte/Vexforge-web/releases/tag/vexforge-android-build-52), asset `app-release.apk`, 91,705,979 bytes; digest GitHub/SHA-256 verificado: `f093a742189db76cf2c20315f7304a5859228bcb239808ebb32b6875c3062abe`.
- Verificación adicional del APK descargado: `assets/index.android.bundle` presente, 3,080,780 bytes. El APK es autónomo respecto a Metro y conserva la corrección de ruta del arte Nexus Access.
- Estado: `IMPLEMENTED_UNVERIFIED`; la instalación, inicio de sesión/registro y recorrido Auth en dispositivo o emulador siguen pendientes de QA manual del operador. No se declara `OPERATIONAL`, `PASS` ni `TIER1_READY`.
- Siguiente acción verificable: ejecutar la matriz manual de AUTH con el APK publicado y continuar con `VE-MOB-13-SOCIAL`, siguiente unidad Android sin entrada de implementación en la continuidad tras WORLD.

---
## 2026-08-30 — VE-MOB-13-SOCIAL — APK RELEASED / IMPLEMENTED_UNVERIFIED

- Implementación Android publicada en main sobre el commit c44302b0bb848c6d7c596b9cffaff1c46d438c8b.
- El workflow Android oficial, run 55, terminó success y publicó el prerelease vexforge-android-build-55; la APK autónoma incluye assets/index.android.bundle.
- Estado: IMPLEMENTED_UNVERIFIED; la instalación y QA del operador en dispositivo o emulador siguen pendientes.

---
## 2026-08-30 — VE-MOB-14-META — APK RELEASED / IMPLEMENTED_UNVERIFIED

- Implementación Android publicada en main sobre el commit b3d82107bc2d53b7879df72567e974ffac898f0e.
- El workflow Android oficial, run 56, terminó success y publicó vexforge-android-build-56; digest SHA-256 de app-release.apk: 5587a4926d0c6010c11192d36b5cf17739ea4267c1e8c1156113d76c3b08013f.
- Estado: IMPLEMENTED_UNVERIFIED; la instalación y QA del operador en dispositivo o emulador siguen pendientes.

---
## 2026-08-31 — PREFLIGHT-DOCUMENTAL — RECONCILED

- La fila activa vexforge_master_protocol_v2 de Supabase se conserva como autoridad normativa; la copia de main se sincroniza con su contenido completo y con las evidencias Android verificadas ya registradas en continuidad.
- La guarda web run 73 falló inicialmente por HTTP 429 transitorio al consultar dos objetos del manifiesto; el reintento oficial (attempt 2) terminó success y verificó 21/21 assets en Storage. No se sustituyó ningún asset.
- Las unidades Android Social y Meta permanecen IMPLEMENTED_UNVERIFIED; no se declara OPERATIONAL, PASS ni TIER1_READY sin QA humana.


---
## ENMIENDA OPERATIVA — VE-MOB-3 HOME / FORJA — ORDEN QA VISUAL-FIRST
**Fecha de incorporación:** 2026-09-02  
**Estado:** OFICIAL — decisión del operador integrada en el protocolo maestro  
**Unidad:** `VE-MOB-3 HOME` / dominio `Forja`

El primer dominio de verificación QA se trabajará sobre la pantalla Forja completa, tomando como referencia las tres capturas entregadas por el operador. La secuencia obligatoria es:

1. **VISUAL primero:** reconstruir la experiencia de la pantalla para que se sienta como el home de un videojuego de cartas y no como un panel administrativo. La escena del Nexus debe tener protagonismo, profundidad, atmósfera y legibilidad; la tipografía, los marcos, los bordes, los paneles, los estados y el motion deben formar un sistema visual VEXFORGE coherente.
2. **FUNCTIONAL después:** cuando el operador entregue las capturas adicionales de comportamiento, levantar la matriz de todos los botones, enlaces, tabs, CTAs y estados visibles del dominio; corregir únicamente las interacciones reales que estén rotas y verificar navegación, sesión, carga, vacío, error y retorno.
3. **No adelantar evidencia:** una mejora visual no demuestra una interacción funcional. Un botón no se considera correcto por verse activo, y una ruta no se considera correcta por existir: el recorrido debe ejecutarse con la sesión y los contratos reales.
4. **Fuentes y límites:** el fondo de Forja consume `CANONICAL_BACKGROUNDS.home` (`lobby/main.jpg`) y los elementos visuales se resuelven desde el registro oficial. No se crean sustitutos genéricos ni lógica autoritativa en el cliente. Supabase, Auth, economía, combate, recompensas, inventario y contratos quedan intactos salvo necesidad Android trazable.
5. **Gate:** la unidad continúa `IMPLEMENTED_UNVERIFIED` hasta tener la evidencia técnica correspondiente, el workflow/release Android correlativo y la QA manual del operador. No se declara `PASS`, `OPERATIONAL` ni `TIER1_READY` por inspección visual o compilación aislada.

Esta orden es un desglose operativo de la Ley Game First y de la rúbrica de Design QA; no crea una fase paralela ni levanta la congelación web.

---
## PLAN OPERATIVO CANÓNICO — VE-UI-TIER1-ANDROID-01
**Fecha de incorporación:** 2026-09-03
**Estado:** IN_PROGRESS — plan visual Android-first integrado en el protocolo maestro
**Unidad raíz:** VE-MOB-3 HOME / FORJA
**Fuente de diseño:** VE-UI-TIER1-01 entregado por el operador, reconciliado contra el protocolo vivo, VE-MOB-0, la continuidad, la matriz visual, el código Android real y la evidencia QA adjunta
**Precedencia:** este bloque gobierna la ejecución visual Android. Conserva las leyes superiores del protocolo y reemplaza cualquier orden histórica que apunte a web, a un plan superseded o a una reconstrucción no vinculada a VE-MOB-*.

### 1. Decisión ejecutiva

VEXFORGE no se va a tratar como una aplicación con decoración medieval. Se va a reconstruir como una experiencia de TCG móvil premium: primero se lee como juego, después como mundo, después como colección y finalmente como sistema.

La transformación se ejecutará por vertical slices pequeños y reversibles. El primer slice es Forja/Home porque es la primera impresión, el punto de retorno y la superficie que conecta identidad, carta, actividad, progresión y entrada a la arena. No se abrirá un rediseño simultáneo de todas las rutas ni se reabrirá código que ya cumple su contrato sólo para cambiar su aspecto.

La regla de oro es:

TCG primero → mundo propio después → acción clara siempre.

Una pantalla sólo supera este plan cuando el jugador puede entender qué es, qué está vivo, qué puede tocar y por qué importa sin leer un panel de administración. La inmersión nunca autoriza a inventar datos, resultados, lore, assets o autoridad de juego.

### 2. Baseline reconciliado y límites

- Android es la única superficie de implementación. La web queda congelada como referencia de lectura.
- VE-MOB-2 a VE-MOB-14 están implementadas pero siguen IMPLEMENTED_UNVERIFIED por QA humana pendiente; no se reabren sin una brecha visual, funcional o de evidencia demostrable.
- VE-MOB-15 ADMIN sigue diferida por el inventario oficial.
- VE-MOB-3 HOME / FORJA tiene una primera capa visual implementada, pero permanece IMPLEMENTED_UNVERIFIED y no alcanza todavía el objetivo de reconstrucción visual completa.
- El Home ya consume la escena oficial lobby/main.jpg mediante mobile/constants/visual.ts, usa tipografías Cinzel/Rajdhani, iconografía VEXFORGE authored, estados explícitos y datos vivos. Estos elementos son baseline reutilizable, no motivo para empezar de cero.
- Supabase, Auth, RLS, RPCs, economía, combate, inventario, recompensas, colección, mazos, progresión y telemetría permanecen autoritativos. El cliente Android sólo presenta y consume sus contratos.
- Ningún color, panel, sombra o gradiente por sí solo cuenta como avance Tier 1. El progreso debe cambiar la lectura, la jerarquía, la interacción o la identidad perceptible.
- El plan histórico vexforge_fase3_polish_battle_v1 y el plan superseded vexforge_forge_formation_engine_v1 se conservan para historial y compatibilidad; no gobiernan la selección del siguiente paquete visual.

### 3. Resultado visual objetivo

Al abrir Forja, el jugador debe percibir en este orden:

1. una escena del universo VEXFORGE, no un fondo detrás de una lista;
2. una acción primaria inequívoca y una actividad viva;
3. una carta o señal coleccionable que invite a inspección;
4. progreso y recursos como parte del taller, no como una tabla;
5. una entrada natural a Batalla, Cartas, Mazo y Perfil;
6. una gramática común que haga que todas las superficies parezcan regiones del mismo juego.

La prueba de cinco segundos es obligatoria: sin leer todo el texto, una persona nueva debe identificar que está ante un TCG, distinguir la acción principal y localizar la carta o evento relevante. Si sólo recuerda que vio paneles, el paquete falla aunque compile.

### 4. VEXFORGE Visual DNA — reglas de sistema

#### 4.1 Jerarquía

- Una pantalla tiene un foco primario, un foco secundario y una capa de contexto. No se permite que cinco CTAs compitan con el mismo peso.
- En Home, la escena y la acción primaria ocupan la primera impresión; estadísticas, actividad y sistemas secundarios se escalonan debajo.
- Los datos de Supabase se muestran como momentos del juego: evento activo, carta destacada, misión próxima, energía, rango y actividad. No se convierten automáticamente en tarjetas idénticas.
- Sobre el primer pliegue móvil se limita la acumulación de superficies elevadas: una escena/hero, una llamada primaria y como máximo dos bloques de soporte visualmente diferenciados.

#### 4.2 Escena y atmósfera

- El arte oficial participa en la composición: define profundidad, recorte, temperatura, contraste y dirección de la mirada.
- Cada escena debe tener fondo, plano atmosférico, plano de lectura y plano interactivo. El contenido no se pega como texto plano encima de la imagen.
- Las superposiciones oscurecen sólo donde hace falta leer. No se tapa todo el arte con una capa uniforme ni se usa un glow para simular ilustración ausente.
- El registro visual móvil es la única puerta para fondos, logos, facciones, cartas y assets de ruta. Si falla un asset oficial, se muestra el estado VEXFORGE explícito de error/carga/vacío; nunca otro asset, emoji o dibujo temporal.

#### 4.3 Materiales y geometría

- El negro profundo, índigo, oro VEX, azul de energía, verde de éxito y rojo de peligro son tokens semánticos existentes; el oro comunica foco, rareza o acción, no decora cada borde.
- Los paneles tienen tres elevaciones: superficie de lectura, superficie elevada y superficie de evento. Cada una tiene contraste, opacidad, borde y sombra propios.
- Las formas angulares, marcos, líneas de energía y separadores sólo se usan cuando explican jerarquía, facción, rareza, estado o navegación. La decoración sin función se elimina en la segunda pasada.
- Los botones deben tener estado normal, pressed, disabled, loading y, cuando aplique, selected/focus. El área táctil mínima objetivo es 44×44 dp aunque el ornamento sea menor.

#### 4.4 Tipografía e iconografía

- Cinzel se reserva para títulos de mundo, nombres heroicos y momentos de alto peso; Rajdhani sostiene lectura, datos, navegación y etiquetas.
- No se usa mayúscula espaciada como textura en párrafos ni texto gris de bajo contraste para información necesaria.
- ForgeIcon/VexIcon y el registro authored son la gramática de símbolos. No se introducen iconos de sistema, emojis ni Unicode como sustitutos diegéticos.
- Cada icono debe comunicar una acción o estado; si sólo rellena espacio, se elimina.

#### 4.5 Cartas

- La carta es un objeto valioso, no una miniatura dentro de una fila administrativa.
- La prioridad visual es arte → nombre → rareza/facción → poder/keywords → acción; el texto auxiliar nunca compite con la ilustración.
- Tile, selección, inspector, entrada al tablero, invocación, ataque, impacto, muerte, recompensa y evolución comparten marco y datos, pero no se fuerzan a tener la misma animación.
- La identidad por carta deriva de datos oficiales y de authored data trazable. Facción o rareza pueden modular una presentación, pero no reemplazan criatura, elemento, poder, personalidad o keyword cuando esos campos existen.
- Una carta sin arte final se marca de forma honesta como carga, vacío o error. No se simula una carta terminada con una forma CSS.

### 5. Motion grammar y respuesta táctil

El movimiento tiene intención y una causa legible:

- Entrada: revela jerarquía y dirección, no hace esperar al jugador.
- Presencia: un loop atmosférico lento sólo comunica vida; nunca roba foco ni se multiplica por lista.
- Decisión: pressed/focus responde inmediatamente y conserva la relación causa → efecto.
- Impacto: ataque, selección, recompensa o cambio de estado tiene un acento breve y contextual.
- Recuperación: la pantalla vuelve a lectura estable sin encadenar efectos.
- Resultado: victoria, derrota, error, vacío y reconexión tienen tratamientos distintos y explícitos.

Presupuesto base: una interacción no bloquea el control, las transiciones de interfaz son cortas, las listas no animan cada fila al mismo tiempo y ningún efecto visual puede cambiar el dato autoritativo. Reduced motion elimina loops, partículas y desplazamientos no esenciales, conserva cambio de estado, foco, texto, contraste y feedback táctil, y no crea una ruta visual rota.

### 6. Roadmap T0–T10 y paquetes ejecutables

Cada paquete tiene unidad VE-MOB-* o VE-VIS-* estable, dependencia explícita, nivel actual → objetivo, gate y condición de reapertura. Se ejecuta sólo si el paquete anterior necesario está reconciliado.

#### T0 — Reconciliación y baseline
**Unidades:** VE-MOB-0, VE-MOB-3-HOME-BASELINE
**Salida:** protocolo, continuidad, inventario, matriz visual, código real, Storage y capturas comparados; lista de brechas con evidencia.
**Gate Q0:** cada elemento visual tiene fuente, rol, consumidor y estado. No se edita producto para resolver una suposición.
**Estado:** VE-MOB-3-HOME-BASELINE IMPLEMENTED_UNVERIFIED → Q1/Q2 confirmado por código; QA visual completa pendiente.

#### T1 — Sistema visual móvil
**Unidad:** VE-VIS-ANDROID-DNA
**Dependencias:** T0, constants/colors.ts, constants/typography.ts, constants/visual.ts, ScreenShell, ForgeButton, ForgeText, ForgeIcon.
**Salida:** tokens, elevaciones, marcos, variantes de panel, botones, card grammar, safe areas y motion tokens documentados sin duplicar componentes existentes.
**Gate Q2:** una ruta de Home, una carta, una arena y un estado pueden convivir sin parecer cuatro productos.
**Reapertura:** sólo si una captura o auditoría muestra divergencia concreta de token, legibilidad o comportamiento.

#### T2 — Escena y composición
**Unidad:** VE-MOB-3-HOME-SCENE
**Dependencias:** T1, asset oficial lobby/main.jpg y manifiesto móvil.
**Salida:** escena por planos, recorte responsive, contraste local, contenido seguro para notch/navigation inset, error de asset y carga sin salto.
**Gate Q1/Q3:** el arte participa en la lectura, la primera acción no se pierde y no aparece fallback silencioso.
**Reapertura:** si cambia el asset canónico, falla la lectura en un viewport objetivo o la escena provoca regresión de rendimiento.

#### T3 — Forja como primer vertical slice
**Unidades:** VE-MOB-3-HOME-HERO, VE-MOB-3-HOME-ACTION, VE-MOB-3-HOME-CARD, VE-MOB-3-HOME-PROGRESS.
**Dependencias:** T2 y contratos ya existentes.
**Salida:** hero con contexto vivo, CTA primaria, entrada secundaria, carta/evento destacado, recursos y progresión ordenados como taller/forja, no como dashboard.
**Gate Q1 → Q4:** cinco segundos, foco único, jerarquía clara, carta reconocible, acción táctil y profundidad consistente; datos siguen siendo los de Supabase.
**Regla:** no añadir una sexta sección sólo para llenar espacio. Reducir ruido antes de añadir adornos.

#### T4 — Estados honestos del Home
**Unidad:** VE-MOB-3-HOME-STATES
**Dependencias:** T3, estados ya existentes de carga/vacío/error, conexión y retry.
**Salida:** loading, empty, error, no-results, offline/reconnect y success con copy, icono authored, layout y motion propios; nunca loader eterno ni estado que parezca dato real.
**Gate Q1/Q2:** cada estado explica qué ocurre y cuál es la siguiente acción; el fallo de un bloque no borra silenciosamente los datos válidos de los demás.
**Reapertura:** cualquier captura que muestre falsa disponibilidad, ausencia de retry o bloqueo de navegación.

#### T5 — Navegación como sistema del juego
**Unidades:** VE-MOB-NAV, VE-MOB-3-HOME-NAV-SAFETY.
**Dependencias:** T1 y T3.
**Salida:** tab bar legible en Android, safe-area correcta, iconos authored, estado activo/inactivo, retorno y deep links existentes sin cambiar rutas ni autoridad.
**Gate Q1/Q2:** el jugador entiende dónde está, adónde puede ir y cómo volver; la navegación no compite con la escena.

#### T6 — Arena y cartas como regiones conectadas
**Unidades:** VE-MOB-7-BATTLE-VIS, VE-MOB-4-COLLECTION-VIS, VE-VIS-3-CARD-INSPECTOR.
**Dependencias:** T1, T4 y contratos/estado ya implementados en cada VE-MOB.
**Salida:** arena con lectura de turno/objetivo/impacto/resultado; colección con densidad de compendio; inspector con carta como objeto; efectos derivados de eventos reales.
**Gate Q3/Q4:** identidad de arena y carta, claridad de resultado, replay/reconnect/reduced motion y cero lógica de combate duplicada.
**Reapertura:** sólo por evidencia funcional/visual nueva, asset canónico mejor o regresión demostrable.

#### T7 — Mazo y Perfil como fantasía de jugador
**Unidades:** VE-MOB-5-DECK-VIS, VE-MOB-9-PROFILE-VIS.
**Dependencias:** T1, T6 y datos reales ya conectados.
**Salida:** Mazo como mesa de construcción y Perfil como identidad/progresión del forjador; los límites, validaciones, logros y energía siguen viniendo del contrato.
**Gate Q3/Q4:** selección, validación, guardado, progreso y navegación son comprensibles sin hacer que la pantalla parezca un formulario.

#### T8 — Superficies secundarias por familias
**Unidades:** VE-MOB-6-TUTORIAL-VIS, VE-MOB-8-REWARDS-VIS, VE-MOB-10-PACKS-VIS, VE-MOB-11-ECONOMY-VIS, VE-MOB-12-WORLD-VIS, VE-MOB-13-SOCIAL-VIS, VE-MOB-14-META-VIS.
**Dependencias:** T1 y el patrón de estados T4.
**Salida:** cada familia recibe ambiente y jerarquía propios, pero conserva la gramática común; no se abren rutas web ni se crean paneles aislados.
**Gate Q2/Q3:** ninguna superficie se describe mejor como dashboard, catálogo o formulario que como taller, mundo, colección, arena o perfil.

#### T9 — Unificación, accesibilidad y rendimiento
**Unidades:** VE-VIS-ANDROID-QA, VE-VIS-6-GAME-LOOP-ANDROID.
**Dependencias:** paquetes visuales cerrados técnicamente.
**Salida:** matriz por viewport y dispositivo, contraste, tamaño táctil, lector de pantalla, reduced motion, memoria, carga de imágenes, estabilidad y telemetría de cinco eventos canónicos.
**Gate Q5 candidato:** 60 FPS objetivo durante scroll/entrada/interacción en dispositivos representativos, sin crash, sin loader eterno, sin regresión de contratos y con evidencia reproducible. Q5 no se declara sólo con typecheck.

#### T10 — Checkpoint, release y QA humana
**Unidades:** VE-MOB-ANDROID-RELEASE, VE-UI-TIER1-REVIEW.
**Dependencias:** T9 y workflow oficial.
**Salida:** commit main, workflow APK oficial, release correlativo, APK autónoma, matriz de capturas y continuidad sincronizada con Supabase.
**Gate:** technical success + evidencia visual + QA humana del operador. Sin la última, el estado es IMPLEMENTED_UNVERIFIED y el launch gate permanece NO-GO.

### 7. Matriz de procedencia visual obligatoria

Antes de cerrar cada paquete, registrar una fila por elemento:

**elemento → función diegética/UI → dato canónico → ruta Storage o CSS permitido → registro/manifiesto → consumidor Android → estado → evidencia.**

- Fondos, logos, facciones, cartas, marcos, ilustraciones, VFX authored y audio de mundo requieren Storage/manifiesto y consumidor real.
- Barras, separadores, scrims, focus rings, estados de progreso y geometría de interfaz pueden ser CSS/React Native si no pretenden ser un objeto del universo.

---

## PATCH OPERATIVO — 2026-09-05 — VE-MOB-3 HOME

- La superficie activa continúa siendo Android `mobile/`; la web permanece
  congelada como referencia de lectura.
- El lote visual actual coloca `ENTRAR A LA ARENA` junto al frente activo,
  devuelve `MI COLECCIÓN` como entrada secundaria real y anima únicamente la
  revelación del progreso XP. `reduced-motion` elimina la transición y deja el
  valor estable.
- No se cambiaron contratos, datos, Auth, RLS, RPCs, Storage, economía,
  combate, assets canónicos ni rutas existentes.
- La implementación queda `IMPLEMENTED_UNVERIFIED`. El workflow Android
  oficial, el release correlativo y la QA humana del APK siguen siendo
  obligatorios antes de declarar `PASS`, `OPERATIONAL` o `TIER1_READY`.
- Commit publicado por GitHub REST: `a7c22190761e57036d47996faecb56d0f9157df7`.
- Workflows en curso al registrar este parche: Android run `33953469478`
  (build 91) y verificación run `33953469496` (run 173).
- El build Android 91 terminó `success` y publicó el release
  `vexforge-android-build-91` con `app-release.apk`. El workflow de
  verificación 173 terminó `cancelled`; esto no equivale a QA humana.
- Evidencia técnica del lote: typecheck móvil, build web de regresión, guardas
  de telemetría/motion/identidad/arte/metadata/assets y export Android pasan.
- Un asset existente se consume; no se duplica. Uno ausente se crea, se revisa, se sube, se registra y se enlaza antes del cierre visual.
- ASSET_REQUIRED, ASSET_IN_PROGRESS y IMPLEMENTED_UNVERIFIED son estados honestos. No se renombran como PASS para ocultar una ausencia.

### 8. Gates de calidad por paquete

- **Q0 Contrato:** unidad Android, fuente, alcance, dependencias y límites definidos.
- **Q1 Legible:** acción, estado, dato y resultado entendibles en cinco segundos y con texto/semántica accesibles.
- **Q2 Coherente:** tokens, tipo, iconos, materiales, sonido, motion, estados y safe areas pertenecen al mismo sistema.
- **Q3 Identitario:** la ruta, carta, facción, arena o perfil tiene rasgos propios derivados de datos oficiales; no es una plantilla intercambiable.
- **Q4 Premium:** composición, timing, capas, interacción, transición, audio cuando exista y reducción de ruido están pulidos; no hay genéricos ni fallbacks silenciosos.
- **Q5 Candidato Tier 1:** matriz de dispositivos/viewports, rendimiento, accesibilidad, estabilidad, consistencia global, release y revisión visual reproducible superados. Requiere después QA humana; no es garantía comercial.

Cada reporte debe escribir nivel actual → objetivo, evidencia, deuda y condición de reapertura. Una unidad puede estar en Q2 y seguir abierta a Q3/Q4/Q5.

### 9. Verificación Android y evidencia mínima

Por cada lote, ejecutar sólo las guardas proporcionales al riesgo, como mínimo:

1. typecheck de mobile;
2. guarda específica de la unidad;
3. manifiesto/asset coverage cuando haya recursos;
4. prueba de estados y reduced motion;
5. revisión de safe areas y tamaños táctiles;
6. build APK oficial cuando el lote toque producto;
7. workflow/release correlativos y bundle standalone;
8. capturas top/intermedio/inferior para Home y estados relevantes;
9. matriz de interacción separada de la matriz visual;
10. actualización de CONTINUITY.md y del plan canónico.

La evidencia debe decir qué se comprobó, qué no se pudo comprobar y qué no se afirma. Compilar, navegar a una ruta o ver un componente aislado no prueba un vertical slice completo.

### 10. Rendimiento, accesibilidad y compatibilidad

- Objetivo operativo: 60 FPS en scroll, entrada de pantalla, selección y efectos esenciales en dispositivos Android representativos; medir antes de aumentar partículas o blur.
- Una sola escena hero se carga y decodifica con prioridad; listas usan lazy loading y no montan imágenes grandes fuera de viewport sin necesidad.
- Evitar loops por fila, sombras excesivas, blur permanente, re-render de todo el feed y múltiples imágenes grandes simultáneas. Preferir capas estáticas y animar sólo el foco.
- Verificar viewport estrecho menor de 360 dp, viewport común de 390–430 dp, tablet si forma parte del workflow, notch, barra de navegación, teclado, orientación soportada y reanudación.
- Contraste legible sobre arte, etiquetas que no dependan sólo del color, orden de lectura, accessibilityRole/Label/Hint, focus/pressed/disabled y targets táctiles adecuados.
- Reduced motion debe conservar comprensión, navegación, feedback y resultado; no se reemplaza por silencio visual ambiguo.
- Un problema de rendimiento o accesibilidad reabre el paquete correspondiente y bloquea añadir VFX nuevos, no bloquea el resto del roadmap Android.

### 11. Checkpoints y protocolo de reentrada

- **ANDROID-A:** DNA y shell visual reconciliados.
- **ANDROID-B:** Forja/Home visual-first con estados.
- **ANDROID-C:** cartas/inspector y colección.
- **ANDROID-D:** arena y resultados.
- **ANDROID-E:** mazo y perfil.
- **ANDROID-F:** familias secundarias.
- **ANDROID-G:** unificación, QA, release y evidencia.

Cada checkpoint es atómico y reversible: cambios Android, verificación, release si aplica, continuidad y sincronización normativa. Nunca borrar historia ni reescribir un estado anterior.

Una unidad OPERATIONAL, REFINED o Q5 puede reabrirse como CANDIDATE_FOR_REVIEW si aparece una regresión, cambia el asset canónico, sube la exigencia Tier 1, falla un dispositivo, el operador aporta una captura contradictoria o el recorrido deja de ser comprensible. Una QA humana pendiente no justifica esperar ni declarar aprobado.

### 12. Orden de la siguiente sesión

1. Leer la fila viva de este protocolo y confirmar que la copia de GitHub coincide salvo el salto de línea final.
2. Leer CONTINUITY.md, VE-MOB-0, matriz visual, plan histórico sólo como contexto y el código real del paquete.
3. Ejecutar T0 sin modificar producto.
4. Continuar por VE-MOB-3-HOME-SCENE, después HERO/ACTION/CARD/PROGRESS y STATES, sin abrir Batalla o superficies secundarias antes de que el Home tenga evidencia visual suficiente.
5. Implementar sólo el paquete elegido, respetando assets y contratos.
6. Ejecutar sus gates y registrar nivel actual → objetivo.
7. Publicar por el workflow Android oficial si hubo código.
8. Actualizar continuidad, este bloque y la evidencia; dejar la QA humana como IMPLEMENTED_UNVERIFIED cuando corresponda.

### 13. Definición de terminado

Este plan no está terminado si sólo cambian colores, radios, botones, sombras o fondos; si el Home sigue siendo un dashboard; si las cartas siguen siendo imágenes planas; si el scroll es estático; si los estados mienten; si la navegación parece ajena al juego; si falta procedencia; o si la primera impresión no cambia de forma notable.

Está listo para revisión Tier 1 cuando Forja, Batalla, Cartas, Mazo y Perfil se sienten como regiones del mismo TCG, cada acción tiene feedback, cada dato sigue siendo verdadero, cada asset diegético tiene procedencia, el rendimiento y la accesibilidad pasan sus matrices y el APK correlativo puede recorrerse con evidencia. Hasta entonces, el estado correcto es el nivel real más alto alcanzado, no una promesa.

Esta enmienda es normativa y operativa para futuras IAs. No crea una nueva superficie de producto, no levanta la congelación web, no altera contratos y no autoriza a inventar evidencia.


---
## ENMIENDA OPERATIVA — REVISIÓN Y ENDURECIMIENTO DEL PLAN TIER 1
**Fecha de incorporación:** 2026-09-03  
**Estado:** OFICIAL — plan revisado y listo para ejecución controlada  
**Ámbito:** `VE-UI-TIER1-ANDROID-01`, T0–T10 y unidades `VE-MOB-*` visuales  
**Naturaleza:** revisión de suficiencia; no crea un plan paralelo ni modifica reglas de juego

### 1. Resultado de la revisión

La auditoría del plan contra el código Android de `main`, `VE-MOB-0`, `VE-MOB-2` a `VE-MOB-14`, el manifiesto de pantallas, el journey oficial, la matriz `public.vexforge_visual_tier1_objective`, el programa Visual Excellence y referentes actuales del género confirma que la dirección es correcta, pero que el plan necesitaba cinco cierres explícitos para garantizar el resultado y no sólo describirlo:

1. un gate bloqueante de vertical slice completo, para impedir que se acumulen pantallas visualmente aisladas;
2. una matriz de aceptación por superficie crítica, con objeto, acción, feedback, salida y autoridad de datos;
3. un contrato inequívoco para la interacción carta: selección → reveal/foco → inspector → estadísticas → retorno;
4. umbrales mínimos de calidad y evidencia que separen “se ve bien”, “funciona” y “Tier 1 candidato”;
5. una cadencia semanal que ejecute trabajo dentro del plan, sin saltarse dependencias ni abrir expansión antes de cerrar el núcleo jugable.

Conclusión: el plan queda aprobado como dirección, pero ninguna fase puede llamarse Tier 1 por completar colores, fondos, componentes o rutas aisladas. La revisión queda incorporada mediante las reglas siguientes.

### 2. Contrato de producto Tier 1 — vertical slice bloqueante

El primer entregable demostrable es un recorrido jugable continuo y medible:

`HOME / FORJA → CAMPEÓN → COLECCIÓN → CARTA → MAZO / FORJA → FORMACIÓN → BATALLA → RESULTADO → RECOMPENSA → HOME`

Este recorrido es un **gate de producto**, no una galería de mockups. T4–T8 pueden trabajar en paquetes pequeños, pero no se autoriza abrir expansión visual de World, Social, Shop, Profile o Meta como prioridad semanal mientras el slice no alcance Q4 en todas sus superficies principales. Las unidades Android ya implementadas pueden seguir `IMPLEMENTED_UNVERIFIED`; eso no sustituye el gate de experiencia.

El slice sólo pasa cuando:

- una persona nueva reconoce un videojuego TCG VEXFORGE antes que una aplicación administrativa;
- existe una acción primaria clara en cada superficie;
- cada acción relevante produce feedback visible y táctil, y audio cuando el sistema lo soporte;
- el resultado de combate, recompensa, inventario y progreso proviene de contratos autoritativos y puede recuperarse sin settlement local;
- el jugador puede volver al Home sin perder contexto ni quedar en una ruta muerta;
- la carta mantiene protagonismo desde la lista hasta el tablero y la recompensa;
- loading, vacío, error, reconnect, reduced-motion y accesibilidad conservan la misma información funcional;
- el recorrido se evidencia en un APK oficial, no sólo en un preview o en un typecheck.

### 3. Matriz mínima de aceptación por superficie

Cada unidad debe completar esta matriz antes de cerrar su gate. La matriz admite `APLICA`, `NO_APLICA` o `PENDIENTE_DE_FUENTE`; no permite omitir una dimensión sin registrarla.

| Superficie | Escena / objeto dominante | Acción principal | Feedback obligatorio | Salida y dato autoritativo |
|---|---|---|---|---|
| Home / Forja | Nexus, Campeón, actividad o carta destacada | entrar a la actividad recomendada o arena | press, transición, estado vivo y retry honesto | ruta existente; estado de jugador/evento desde Supabase |
| Colección | arsenal y cartas como objetos | inspeccionar una carta o filtrar el arsenal | foco de carta, estado de selección y resultado del filtro | cartas, propiedad, cantidad y metadatos reales |
| Carta / Inspector | la carta ampliada y su identidad | explorar detalle o añadirla al flujo permitido | reveal/foco, stats legibles, affordance de retorno | imagen, nombre, rareza, facción, poder, keywords, lore y propiedad sólo si constan |
| Mazo / Forja | mesa de construcción, Campeón y formación | seleccionar, validar y guardar el mazo/elección | aceptación, conflicto, límite, sinergia o error contextual | validación y persistencia de contratos existentes |
| Formación | Vanguardia, Campeón, Centinela y Reserva | confirmar formación e iniciar | slots diferenciados, protección, reserva y confirmación | formación y reglas recibidas/aceptadas por el flujo oficial |
| Batalla | arena ForgeFormation y amenaza | ejecutar la acción disponible | anticipación, impacto, daño, defensa, muerte, turno y reconnect | eventos/resultados autoritativos; nunca decisión visual local |
| Resultado | marcador, Campeón/MVP si corresponde | continuar, reclamar o volver | victoria/derrota, desglose y estado de settlement | resultado y recompensas persistentes e idempotentes |
| Recompensa | cámara de recompensa y carta/objeto obtenido | revelar y continuar | rareza, reveal, audio/VFX y confirmación | reward/claim reales; regreso al Home con progreso actualizado |

La matriz funcional se mantiene separada de la matriz visual: una apariencia activa no prueba que el control funcione, y una ruta existente no prueba que el recorrido sea correcto.

### 4. Contrato obligatorio de carta — selección, reveal, inspector y estadísticas

La interacción de carta que atraviesa Home, Colección, Mazo, Formación, Batalla y Recompensa queda definida así:

1. **Selección:** el toque debe producir respuesta inmediata `pressed/focus/selected`, elevar o separar visualmente la carta y dejar claro cuál fue elegida. El feedback no puede depender sólo del color.
2. **Reveal/foco:** la carta seleccionada entra al foco con una transición breve y cancelable que conserva continuidad espacial con el tile o escena de origen. En reduced-motion se reemplaza por un cambio de foco/escala/transparencia funcional, no por ausencia de respuesta.
3. **Inspector:** el detalle muestra la carta como objeto del juego: arte, nombre, rareza, facción, poder y demás atributos existentes, habilidades/keywords, lore y estado de propiedad cuando estén disponibles en la fuente. Si un atributo no existe, se omite o se marca como pendiente; jamás se inventa.
4. **Estadísticas y contexto:** las estadísticas se presentan con iconografía authored y jerarquía legible, vinculadas al dato canónico. El tratamiento visual puede dramatizar la lectura, pero nunca alterar el valor ni convertir una predicción en un hecho.
5. **Continuación:** desde el inspector se puede volver al origen sin perder filtros/selección cuando el contrato lo permita, o continuar únicamente a una acción real del flujo. No se simula añadir, equipar, fusionar o combatir si la ruta no lo respalda.
6. **Identidad:** rareza, facción, elemento, criatura, poder, personalidad y keywords modulan la presentación sólo cuando existen en la fuente oficial y están trazados en el pasaporte `VE-CARD`.
7. **Rendimiento:** una carta enfocada puede recibir el tratamiento premium; la colección no monta loops, partículas o imágenes grandes innecesarias por cada fila.

Este contrato es requisito de `VE-VIS-3-CARD-INSPECTOR`, `VE-MOB-4-COLLECTION-VIS`, `VE-MOB-5-DECK-VIS`, `VE-MOB-7-BATTLE-VIS` y `VE-MOB-8-REWARDS-VIS`.

### 5. Umbrales de calidad y evidencia

Antes de ampliar el alcance, el vertical slice debe alcanzar:

- **Q0:** fuente, unidad, dependencia, estado y límites trazados;
- **Q1:** comprensión en cinco segundos, acción, estado y siguiente paso claros;
- **Q2:** tokens, iconografía, tipografía, motion, audio, estados y safe areas coherentes;
- **Q3:** identidad propia por escena, carta, facción, región o momento;
- **Q4:** composición, profundidad, timing, foco, transición, feedback y reducción de ruido pulidos;
- **Q5 candidato:** dispositivos representativos, estabilidad, rendimiento, accesibilidad, release y evidencia reproducible.

Para las superficies principales, la rúbrica 0–5 debe registrar como mínimo `4` en composición, identidad, jerarquía, claridad e interacción; ninguna dimensión aplicable puede quedar por debajo de `3`. Q5 candidato no equivale a `OPERATIONAL` ni a lanzamiento: la QA humana del operador y la validación cerrada siguen siendo obligatorias.

El paquete de evidencia mínimo por checkpoint es:

- commit de `main` y workflow/release Android correlativo;
- APK autónoma con bundle embebido y digest verificable;
- capturas o grabación de top/intermedio/inferior de Home y del recorrido del slice;
- matriz de interacción separada de la matriz visual;
- prueba en viewport estrecho y común, además de un dispositivo Android representativo de menor capacidad;
- estado normal, carga, vacío, error/retry, reconnect, reduced-motion y resultado cuando apliquen;
- registro de procedencia de cada asset y de cada dato canónico mostrado;
- evidencia de typecheck, guardas específicas, estabilidad, FPS/memoria cuando se declare Q5;
- limitaciones, deuda, estado real y condición de reapertura.

### 6. Cadencia semanal subordinada al plan

La semana de trabajo se ejecuta dentro de esta secuencia y no como una lista independiente:

- **Semana 0 — Revisión y reconciliación:** T0, baseline real, matriz de brechas y contrato del slice. No se modifica producto para resolver suposiciones.
- **Semana 1 — Lenguaje y entrada:** T1, DNA visual Android, Home/Forja escena, jerarquía, estados y navegación segura.
- **Semana 2 — Objeto carta:** Colección, selección, reveal, inspector, estadísticas, authored identity y retorno.
- **Semana 3 — Preparación:** Mazo, Forja, formación, validaciones, reserva, Campeón y transición a arena.
- **Semana 4 — Momento jugable:** Batalla, timeline visual de eventos autoritativos, targeting, impacto, muerte, reconnect y resultado.
- **Semana 5 — Cierre del loop:** scoreboard, reward reveal, claim/persistencia real, progreso y retorno al Home; medición de primera sesión.
- **Semana 6 — Expansión controlada:** World/PvE/Boss/Raid/PvP y Social/Shop/Profile sólo después del gate del slice; cada familia conserva su matriz propia.
- **Semana 7 — Unificación y launch gate:** T9/T10, accesibilidad, reduced-motion, rendimiento, asset hygiene, benchmark, release y QA humana.

Si una semana deja una unidad en `IMPLEMENTED_UNVERIFIED`, la siguiente puede continuar sólo con la dependencia que esté técnicamente habilitada; no se rebautiza como `OPERATIONAL`, no se oculta la deuda y no se saltan los gates del slice.

### 7. Revisión anti-dashboard y anti-genericidad

Antes de aceptar una superficie principal, el reviewer debe poder responder afirmativamente a `SCENE + OBJECT + ACTION + FEEDBACK + EXIT`. Debe poder nombrar qué hace a esa superficie VEXFORGE sin leer su ruta o su nombre. Cualquier icono, fondo, sonido, panel, estado o transición intercambiable se registra como fuga de identidad y reabre la unidad afectada.

La revisión también comprueba la cadena:

`dato canónico → decisión de diseño → asset/componente → interacción → feedback → evidencia`

El plan no autoriza convertir esta cadena en mocks, inventar estadísticas, copiar referentes, duplicar autoridad de combate o usar una apariencia premium para esconder una capacidad inexistente.

### 8. Decisión de ejecución

Esta enmienda cierra la revisión solicitada del plan. El plan queda **READY_FOR_EXECUTION_AFTER_T0**: primero se ejecuta T0 sin editar producto; luego se implementan los paquetes Android en el orden de la Semana 1 a la Semana 7, manteniendo la cadena oficial GitHub `main` → Supabase → workflow/release → evidencia → continuidad. La siguiente sesión de implementación no debe saltar directamente a un paquete aislado sin registrar este gate y su evidencia.

El estado global sigue siendo `PRE-LAUNCH INTERNAL QA`; no se declara `PASS`, `OPERATIONAL`, `TIER1_READY` ni cierre de QA humana por la incorporación de esta revisión.

---
# ENMIENDA PERMANENTE — RECONCILIACIÓN DEL PLAN TIER 1 ANDROID Y GATES DE PRODUCTO

**Fecha de incorporación:** 2026-09-04
**Estado:** OFICIAL — INTEGRADA EN EL PROTOCOLO MAESTRO
**Precedencia:** esta enmienda prevalece, durante la fase Android-only, sobre los bloques históricos que mezclen web, Cloudflare, src/, dist/, navegadores de escritorio o publicación web con la ejecución del producto móvil. No borra la evidencia histórica: la reclasifica como contexto o como gate posterior.

## 1. Resultado de la revisión

El plan anterior sí tenía los ingredientes para una experiencia Tier 1 —autoridad de Supabase, ForgeFormation, Battle Run, vertical slice, identidad visual, estados, motion, audio, accesibilidad, rendimiento y release—, pero no podía garantizar ese resultado sin esta reconciliación por cuatro razones:

1. Existían dos secuencias T0–T10 con el mismo nombre: una de producto/gameplay y otra visual Android. Sin una relación explícita, una podía darse por terminada sin la otra.
2. El vertical slice Android estaba descrito como objetivo, pero no como gate bloqueante único de experiencia completa con evidencia de APK, datos autoritativos, settlement, recompensa y regreso al Home.
3. La matriz de 45 objetivos mezclaba bloqueantes de APK con bloqueantes de lanzamiento público: pagos, backup/restore, retención, métricas web, navegadores de escritorio, iOS Safari y Cloudflare. Eso podía detener el trabajo Android sin mejorar la APK.
4. Algunos objetivos medían la web —por ejemplo LCP, bundle gzip o 39/39 rutas— y no tenían un umbral equivalente para la APK real.

La revisión histórica de vexforge_forge_formation_engine_v1 confirma que ese documento queda como checkpoint subordinado y contexto de decisiones anteriores. No sustituye este plan Android ni autoriza reabrir la web.

## 2. Dos gates distintos: juego Android y lanzamiento público

Desde esta fecha no se usa un único booleano ambiguo para afirmar que VEXFORGE es Tier 1. Se distinguen estos estados:

### 2.1 ANDROID_GAME_TIER1_CANDIDATE

Es el gate de implementación y experiencia del juego. Sólo puede alcanzarse cuando el APK candidato demuestra, sobre datos y contratos reales:

- el vertical slice completo HOME / FORJA → CAMPEÓN → COLECCIÓN → CARTA / INSPECTOR → MAZO / FORJA → FORMACIÓN → BATALLA → RESULTADO → RECOMPENSA → HOME;
- decisiones jugables observables, Battle Run/ForgeFormation y settlement autoritativo e idempotente;
- identidad visual propia, lectura de juego, estados honestos, feedback, motion/audio contextual y ausencia de genéricos en las superficies críticas;
- accesibilidad, reduced-motion, compatibilidad Android, estabilidad y presupuesto de rendimiento medidos;
- evidencia reproducible del APK, workflow, digest, recorrido, datos, guards y telemetría.

Este estado permite continuar la validación sin fingir que la QA humana ya ocurrió. No equivale a TIER1_READY, PASS ni OPERATIONAL.

### 2.2 TIER1_READY / OPERATIONAL

Requieren además la evidencia real del APK candidato y la QA humana autorizada. La QA humana pendiente no bloquea nuevas implementaciones: conserva las unidades como IMPLEMENTED_UNVERIFIED y bloquea únicamente la promoción del estado.

### 2.3 PUBLIC_LAUNCH_READY

Es un gate posterior y separado. Incluye cumplimiento comercial, pagos, monetización justa, backup/restore, monitorización operativa, rollback, soporte, retención y cualquier requisito de publicación externa. Un fallo en este gate no invalida por sí mismo que la experiencia de juego Android haya alcanzado ANDROID_GAME_TIER1_CANDIDATE.

## 3. Alcance y precedencia Android-only

- El producto activo de esta fase es exclusivamente la APK bajo mobile/, su workflow oficial, sus releases y el backend/Storage/Auth/RPC/RLS de Supabase que el flujo Android necesite.
- La web y Cloudflare quedan congelados como referencia histórica o de lectura. No se exige modificar, desplegar ni medir la web para cerrar un gate Android.
- Desktop Chrome/Firefox/Safari, iOS Safari, LCP web, bundle gzip web y Cloudflare no bloquean ANDROID_GAME_TIER1_CANDIDATE. Si se mantienen en la matriz, pertenecen a PUBLIC_LAUNCH_READY o a mantenimiento web futuro.
- Ningún gate autoriza mocks, placeholders, datos inventados, settlement local, lógica de combate local ni sustitución de la autoridad de Supabase.

## 4. Cómo se conectan los dos T0–T10

Para eliminar la ambigüedad, el plan se lee con dos prefijos conceptuales:

- **F-T0…F-T10 — track funcional:** autoridad y baseline; contratos Battle Run; ForgeFormation; vertical slice; expansión PvE; World Bosses/Raids; PvP; cartas/colección/profundidad; onboarding/live ops; QA, seguridad y release.
- **V-T0…V-T10 — track visual Android:** baseline APK; DNA visual; escena Home/Forja; Hero/Action/Card/Progress; estados honestos; navegación; arena/cartas/inspector; mazo/perfil; superficies secundarias; accesibilidad/rendimiento; release/evidencia.

La relación obligatoria es:

| Track | Unidades Android y evidencia mínima |
|---|---|
| F-T0 + V-T0 | VE-MOB-0, baseline del APK publicado más reciente, manifiesto, esquema, contratos, rutas y matriz de dispositivos |
| F-T1/F-T2 + V-T5/V-T6 | Battle Run, ForgeFormation, Campeón, Reserva, turnos, targeting, resultado y reconnect sobre las unidades de deck/battle/rewards |
| F-T3 + V-T2/V-T3/V-T4 | El vertical slice completo, empezando en VE-MOB-3 HOME y atravesando colección, carta, mazo, formación, batalla, resultado y recompensa |
| F-T4/F-T5/F-T6 + V-T8 | PvE, World, Bosses, Raids, PvP y Social sólo con sus contratos reales y una superficie Android propia; no se consideran completos por existir una ruta |
| F-T7 + V-T3/V-T6/V-T7 | Colección, identidad de carta, sinergias, mazo, Campeón, Reserva y decisiones distinguibles en código y presentación |
| F-T8/F-T9 + V-T1/V-T7/V-T8/V-T9 | Audio, motion, onboarding, narrativa, accesibilidad, reduced-motion, rendimiento, estabilidad y telemetría sin degradar gameplay |
| F-T10 + V-T10 | workflow oficial, APK reproducible, digest, guards, evidencia de recorrido, release, QA humana y promoción de estado |

Ningún track puede cerrar el producto por separado. Un paquete visual sin capacidad jugable sigue incompleto; una capacidad funcional sin escena, feedback, legibilidad y estados sigue por debajo de Tier 1.

## 5. Bloqueantes del gate de juego Android

Para ANDROID_GAME_TIER1_CANDIDATE son bloqueantes, dentro del alcance Android, los objetivos de arte/manifiesto, iconografía authored, estados de carga/vacío/error/retry/reconnect, layout móvil, tokens, audio y combate, motion/feedback, economía legible, primera sesión, telemetría del loop, salud de rutas Android, profundidad de decisión, profundidad/calidad/balance de contenido, temporadas cuando estén en el inventario activo, competencia y reconexión, accesibilidad, dirección de arte, higiene de assets, audio producido para contextos críticos, regresión automatizada, unicidad, compatibilidad de dispositivos Android, acabado, primera impresión, rendimiento, estabilidad, benchmark, integridad competitiva, resiliencia de red, confianza del jugador, reproducibilidad de evidencia y release Android.

La lista operativa de claves que bloquean ese gate es:

asset_manifest_integrity, boss_art, card_art, surface_backgrounds, icon_language, loading_and_empty_states, mobile_layout, ui_identity_tokens, audio_flow, combat_scene_direction, motion_and_feedback, economy_readability, first_session_flow, game_loop_telemetry, route_health_maturity, combat_decision_depth, content_depth, content_quality, gameplay_balance, live_ops_seasons, social_competitive, accessibility_baseline, art_direction_quality, asset_hygiene, audio_authored_production, automated_regression_suite, design_uniqueness, device_compatibility, finish_quality, first_impression, performance_budget, stability_error_budget, benchmark_definition, benchmark_positioning, competitive_integrity, network_resilience, player_trust, evidence_reproducibility, release_readiness.

Los objetivos payments_compliance_reconciliation, monetization_fairness, backup_restore_drill y retention_validation pertenecen al gate PUBLIC_LAUNCH_READY; no bloquean la implementación del juego Android mientras el producto permanezca en QA interna. localization_coverage y prelaunch_presentation son requisitos de lanzamiento o calidad posterior salvo que una unidad Android los active expresamente.

## 6. Correcciones de medición para no evaluar la APK con métricas web

- route_health_maturity: sustituir el objetivo fijo 39/39 por el 100% de las rutas Android activas del inventario VE-MOB-2 a VE-MOB-14, cada una con contenido, carga, vacío, error/retry y salida utilizable.
- device_compatibility: validar perfiles Android representativos de pantalla pequeña, media y menor capacidad; comprobar overflow, touch targets, orientación soportada, feedback, reduced-motion y recuperación.
- performance_budget: usar cold start hasta primera interacción, frame pacing del slice, ausencia de ANR/OOM, memoria de las superficies críticas, peso de assets y estabilidad del APK. El objetivo operativo inicial es P95 de primera interacción ≤ 3 s en el dispositivo de referencia, objetivo de 60 FPS y ≤ 1% de frames con bloqueo > 50 ms durante el slice, sin ANR/OOM; cualquier excepción debe quedar medida y explicada.
- stability_error_budget: sustituir errores de consola web por cero crashes/ANR y cero errores no recuperados en el recorrido Android, con retry/reconnect verificables y sin doble settlement.
- benchmark_definition y benchmark_positioning: comparar juegos móviles de cartas/estrategia y alternativas de la misma experiencia táctil, no páginas web; la matriz debe evaluar identidad, claridad, profundidad, feedback, onboarding y rendimiento Android.
- first_session_flow, art_direction_quality, finish_quality y first_impression: la evidencia debe provenir de la APK y de las superficies reales, no sólo del código ni de una maqueta.

## 7. Gate bloqueante del vertical slice Android

El slice es el gate de producto que une los tracks. No pasa por tener las pantallas individualmente hechas. Debe demostrar, con una cuenta de prueba normal y datos oficiales:

1. entrada al Home/Forja y lectura del siguiente objetivo;
2. selección de Campeón y carta desde Colección/Inspector;
3. construcción o elección de Mazo/Forja y validación de límites/sinergia;
4. Formación con Vanguardia, Campeón, Centinela y Reserva cuando el contrato aplique;
5. batalla real con decisiones, turnos y feedback de cada evento autoritativo;
6. resultado de servidor, settlement idempotente y recuperación ante refresh, timeout o reconnect;
7. recompensa real, claim persistente y retorno al Home con progreso/economía actualizados.

El gate falla si hay una ruta muerta, un botón sin feedback, un estado ambiguo, una recompensa fabricada en cliente, una acción no respaldada por contrato, un arte genérico, un loader eterno, una pérdida de selección, una duplicación de settlement o una pantalla que parezca un dashboard intercambiable. El recorrido debe emitirse mediante los cinco eventos canónicos cuando corresponda y conservar trazabilidad de datos.

En visual, Home, Colección/Inspector, Mazo/Forja/Formación, Batalla y Resultado/Recompensa deben alcanzar al menos Q4 en composición, identidad, jerarquía, claridad e interacción; ninguna dimensión aplicable puede quedar por debajo de 3. Las superficies secundarias deben alcanzar al menos Q3 antes de ampliar el alcance. Q5 exige además evidencia de dispositivo, accesibilidad, reduced-motion, rendimiento, estabilidad y consistencia.

## 8. Evidencia y estados de promoción

Cada checkpoint del gate Android debe incluir: commit de main, run del workflow oficial, release y digest del APK, bundle JS embebido, captura/grabación de todas las etapas del slice, matriz de controles, datos y RPCs consultados, estados normal/carga/vacío/error/retry/reconnect, reduced-motion, guardas, telemetría, dispositivos probados, mediciones de FPS/memoria/arranque y deuda explícita.

- IMPLEMENTED_UNVERIFIED: implementación y verificaciones técnicas disponibles; QA humana pendiente.
- ANDROID_GAME_TIER1_CANDIDATE: bloqueantes Android y vertical slice demostrados, pero aún no se promociona a TIER1_READY sin QA humana.
- TIER1_READY: evidencia Android completa más QA humana autorizada, sin gates críticos omitidos.
- OPERATIONAL: además, release/operación pública aprobados según el gate aplicable.

La ausencia temporal de QA humana nunca autoriza a fabricar evidencia ni detiene la ejecución de unidades independientes. Sí impide declarar cualquiera de los estados promocionados.

## 9. Decisión oficial

El plan queda corregido como READY_FOR_EXECUTION_AFTER_T0. La siguiente ejecución debe comenzar por el T0 de reconciliación Android y producir la matriz de evidencia del APK actual antes de ampliar escenas o volumen de assets. Después se ejecutan los tracks F y V en paralelo sólo donde sus dependencias estén habilitadas, convergiendo siempre en el gate del vertical slice. El APK publicado más reciente se usa como baseline de medición, no como prueba de Tier 1.

Se mantiene el estado global PRE-LAUNCH INTERNAL QA. Esta enmienda no declara PASS, TIER1_READY ni OPERATIONAL.

---
# ENMIENDA PERMANENTE — COMPATIBILIDAD GOOGLE PLAY Y ACTUALIZACIONES POR SECCIÓN

**Fecha de incorporación:** 2026-09-04  
**Estado:** OFICIAL — INTEGRADA EN EL PROTOCOLO MAESTRO  
**Precedencia:** esta enmienda prevalece sobre cualquier flujo que trate un APK standalone como artefacto de producción, use firma debug para Play, cambie el package ID, distribuya parches no verificables o descargue código remoto fuera del protocolo de actualizaciones.

## 1. Objetivo de distribución

El destino final de VEXFORGE Android es Google Play. El APK standalone deja de ser el formato de producción: se conserva únicamente como artefacto de QA interna, instalación directa y diagnóstico.

El artefacto de publicación para Google Play será un Android App Bundle (`.aab`) firmado con una clave de subida válida y entregado a Play App Signing. Google Play genera los APK optimizados por dispositivo y gestiona su distribución diferencial. El workflow del proyecto debe producir y verificar el AAB; nunca debe presentar el APK debug como release de tienda.

La política vigente de Google Play consultada el 2026-09-04 exige para nuevas aplicaciones y actualizaciones un target API 35 o superior desde el 31 de agosto de 2026. Este umbral se debe volver a consultar en cada preparación de lanzamiento porque la política puede subir anualmente.

Fuentes de referencia que deben revisarse antes de un release:

- https://developer.android.com/google/play/requirements/target-sdk
- https://developer.android.com/guide/app-bundle
- https://support.google.com/googleplay/android-developer/answer/9842756?hl=en
- https://docs.expo.dev/technical-specs/expo-updates-1

## 2. Diagnóstico actual y brechas de Play

La configuración reconciliada de main demuestra estas brechas, que no deben ocultarse:

- El workflow actual ejecuta `assembleRelease`, publica un `.apk` y documenta que la plantilla usa debug keystore para mantenerlo instalable por sideload.
- No se genera `.aab`.
- `mobile/app.json` conserva el package estable `com.vexforge.android`, lo cual debe preservarse.
- `mobile/app.json` usa `versionCode: 3`; el número de build del workflow no puede sustituirlo automáticamente sin una política de versionado monotónica y verificable.
- `expo-updates` está instalado y configurado para `runtimeVersion: 1.0.0`, canal `production`, comprobación `ON_LOAD` y fallback embebido; cualquier cambio a ese contrato requiere una nueva validación nativa.
- El plugin `withEmbeddedJsBundle` y el fallback standalone deben conservarse sólo si las pruebas demuestran que no interfieren con Expo Updates.
- No existe todavía evidencia de clave de subida, Play App Signing, target API mínimo validado, bundletool, track interno ni rollback OTA.

Por tanto, el APK publicado más reciente no es `PLAY_COMPATIBLE_CANDIDATE`; es `QA_APK_BASELINE`.

## 3. Dos canales de entrega, sin confundirlos

Cada sección de trabajo debe clasificarse antes de implementarse como `OTA_UPDATE` o `NATIVE_PLAY_RELEASE`.

### 3.1 `OTA_UPDATE` — actualización por sección sin APK completo

Se permite cuando la sección cambia únicamente JavaScript/TypeScript, navegación, estilos, copy, lógica de presentación o assets compatibles con el runtime nativo instalado. La aplicación consulta un manifiesto OTA por HTTPS, valida la compatibilidad y descarga sólo el bundle/assets que no tenga en caché. El usuario no debe descargar manualmente un archivo de parche.

La unidad descargable es un release OTA firmado/identificado por hash, no un APK parcial. La sección se publica con canal, runtime, versión mínima, rollout, fecha, changelog, assets, migraciones y rollback. El cliente aplica la actualización de forma segura y vuelve a la versión anterior si el arranque o la validación fallan.

OTA no puede:

- cambiar permisos Android, package ID, SDK, manifest, Gradle o configuración nativa;
- agregar/quitar módulos nativos o cambiar la interfaz JS-nativa;
- cambiar Expo/React Native o cualquier dependencia que requiera recompilación;
- introducir un esquema de datos incompatible sin migración autoritativa;
- resolver combate, economía, recompensas, settlement o autenticación fuera de Supabase;
- descargar y ejecutar código desde una URL arbitraria o fuera del manifiesto oficial.

### 3.2 `NATIVE_PLAY_RELEASE` — actualización que requiere AAB

Cualquier cambio nativo, de permisos, SDK, plugin, dependencia nativa, app config, runtime compatible, firma, assets nativos o comportamiento que no sea compatible con el runtime instalado exige un nuevo AAB con `versionCode` mayor. El APK de QA puede generarse además, pero nunca reemplaza al AAB de Play.

Google Play puede entregar al usuario sólo los módulos/diferencias necesarios, pero el proyecto debe subir un AAB completo. No se debe prometer al usuario un “APK parcial” ni construir un parche binario propio.

## 4. Contrato de runtime y versionado

- `com.vexforge.android` es inmutable después del primer registro en Play.
- `versionCode` es entero, monotónico y único para cada AAB. No se reutiliza, no se reduce y no depende sólo de un número de workflow si puede colisionar.
- `version` es la versión visible para el jugador y se actualiza según la política de release.
- `runtimeVersion` identifica la compatibilidad entre un binario nativo y sus actualizaciones OTA. Todo cambio de interfaz nativa obliga a crear un runtime nuevo y publicar AAB antes de enviar OTA.
- Cada OTA declara explícitamente el runtime compatible, la versión mínima de aplicación, el canal, el hash del bundle/manifiesto y la estrategia de rollback.
- La app debe arrancar con el bundle embebido conocido si no puede validar o descargar una OTA. Nunca debe quedar en loader eterno ni ejecutar una actualización parcialmente descargada.
- Las migraciones de datos se hacen antes de liberar una OTA/AAB incompatible y deben ser reversibles o tener reparación documentada.

## 5. Firma, secretos y Play App Signing

Google Play App Signing es el modelo oficial recomendado. La clave de firma de aplicación queda protegida por Google; el workflow usa una clave de subida separada y protegida.

- La clave de subida, contraseña, alias, service account de Play y cualquier token son secretos de GitHub/Replit/Google, nunca contenido de Supabase, documentación, APK, logs o continuidad.
- Ningún agente debe pedir al usuario que pegue una clave privada en chat.
- El workflow de producción falla si intenta firmar el AAB con debug keystore, clave efímera o credencial no verificable.
- Antes de la primera subida se registra el package ID, huella de certificado, propietario de Play App Signing, procedimiento de recuperación y responsable de la cuenta.
- El artefacto de QA puede usar una firma separada para sideload, pero se etiqueta como QA y nunca se sube al track de producción.

## 6. Sistema de trabajo por secciones

Cada sección completada genera un registro de release con esta información mínima:

```text
SECTION_ID:
SECTION_SCOPE:
DELIVERY_TYPE: OTA_UPDATE | NATIVE_PLAY_RELEASE
RUNTIME_VERSION:
APP_VERSION:
VERSION_CODE:
CHANNEL: development | internal | closed | production
SOURCE_COMMIT:
SUPABASE_SCHEMA_OR_RPC_IMPACT:
ASSET_MANIFEST:
BUNDLE_OR_AAB_DIGEST:
MINIMUM_APP_VERSION:
ROLLOUT:
ROLLBACK_TARGET:
VALIDATION:
KNOWN_LIMITATIONS:
STATUS:
```

Secuencia obligatoria por sección:

1. reconciliar protocolo, continuidad, main, Supabase y el runtime Android actual;
2. clasificar la sección como OTA o AAB antes de editar;
3. implementar la sección completa sin autoridad local ni mocks;
4. ejecutar typecheck, guards, validaciones de contratos, seguridad y build que correspondan;
5. publicar el artefacto de sección: manifiesto OTA o AAB/QA APK;
6. validar instalación, arranque, rollback y recorrido afectado;
7. registrar digest, evidencia, límites y estado en continuidad;
8. dejar el canal anterior disponible hasta confirmar recuperación.

El usuario recibirá una actualización OTA sólo cuando la sección sea OTA-compatible. Si la sección requiere código nativo, recibirá una actualización a través del track de Play; durante QA interna podrá descargarse el APK de esa compilación, pero no se presentará como actualización parcial.

## 7. Autoridad de Supabase para el sistema de releases

Supabase es la autoridad de metadatos de releases, canales, compatibilidad, hashes, estado, rollback y evidencia; no es un almacén de claves privadas ni sustituye a Google Play.

El sistema que se implemente debe mantener un registro autoritativo de, como mínimo:

- release y sección;
- tipo OTA/AAB;
- runtime y versión mínima;
- canal y rollout;
- bundle/manifiesto/AAB digest;
- estado `DRAFT`, `VALIDATED`, `PUBLISHED`, `ROLLED_BACK` o `BLOCKED`;
- release anterior de rollback;
- checks ejecutados y evidencia;
- fecha, commit y responsable técnico.

La entrega OTA debe usar HTTPS y un endpoint/manifiesto compatible con el protocolo Expo Updates. Storage puede alojar bundles/assets públicos versionados; la publicación debe estar gobernada por el registro y no por URLs mutables improvisadas. RLS, Auth y permisos deben impedir que un cliente modifique el release publicado o el canal de producción.

La telemetría de actualización debe distinguir consulta, descarga, instalación, arranque exitoso, rollback, error de compatibilidad y abandono. Nunca debe incluir secretos.

## 8. Gates de compatibilidad

### `PLAY_COMPATIBLE_CANDIDATE`

Requiere todos estos puntos:

- AAB generado y verificable;
- package `com.vexforge.android` sin cambios;
- `versionCode` mayor que el último AAB aceptado;
- target API mínimo vigente de Google Play, actualmente 35 o superior;
- AAB firmado con upload key válida, no debug key;
- Play App Signing preparado o activo;
- manifest, permisos, icono, splash, política de privacidad, Data Safety, clasificación de contenido y acceso de revisión documentados;
- instalación/validación en track interno o cerrado;
- workflow reproducible, digest, logs y rollback documentados;
- no hay crash, ANR, loader eterno ni regresión crítica en el vertical slice Android.

### `SECTION_UPDATE_READY`

Requiere además:

- clasificación OTA/AAB explícita;
- runtime compatible;
- manifiesto y hashes verificables;
- fallback embebido funcional;
- descarga reanudable y rollback;
- prueba de una OTA compatible y rechazo seguro de una OTA incompatible;
- evidencia de que la sección no altera autoridad de Supabase ni datos del jugador.

### `PLAY_STORE_READY`

No se declara hasta completar los gates anteriores, la revisión de políticas vigente, la QA humana autorizada, el recorrido de primera sesión, estabilidad, accesibilidad, rendimiento, privacidad, contenido y el track de publicación elegido.

## 9. Regla de no regresión y precedencia

La APK completa sigue siendo necesaria para cada cambio nativo y para el primer binario de un runtime. La OTA sólo reduce descargas cuando el cambio es compatible; no elimina los builds nativos ni permite saltarse Play.

No se permite:

- publicar un APK debug como producción;
- guardar signing keys o credenciales en Supabase;
- usar `versionCode` repetido o decreciente;
- enviar OTA a un runtime incompatible;
- mutar el canal de producción desde el cliente;
- declarar Play compatible por tener un APK instalable;
- ejecutar comandos de publicación no registrados ni usar un servicio paralelo como fuente de verdad;
- declarar `PLAY_STORE_READY`, `TIER1_READY` u `OPERATIONAL` sin evidencia real y QA humana.

La fase Android-only permanece activa. La web congelada no se modifica para resolver Play ni OTA Android. La siguiente ejecución elegible es el T0 de release Android: auditoría de target API, versionado, firma, AAB, runtime y contrato de releases antes de tocar una feature.

## 10. NORMA PERMANENTE — ENTREGA POR SECCIÓN Y COMPATIBILIDAD PLAY

**Entrada en vigor:** 2026-09-04  
**Estado:** OBLIGATORIA para toda ejecución Android futura.

1. Antes de editar una sección, la IA debe asignar exactamente un `DELIVERY_TYPE`: `OTA_UPDATE` o `NATIVE_PLAY_RELEASE`, registrar el `SECTION_ID`, el `RUNTIME_VERSION`, el `APP_VERSION`, el `VERSION_CODE` y el canal previsto.
2. `OTA_UPDATE` sólo puede usarse para JavaScript/TypeScript, navegación, estilos, copy y assets compatibles con el runtime nativo ya instalado. La entrega debe pasar por un manifiesto HTTPS compatible con Expo Updates, con hash, fallback embebido, rollback y rechazo seguro de runtime incompatible.
3. `NATIVE_PLAY_RELEASE` es obligatorio para permisos, SDK, plugins, dependencias nativas, app config, runtime, firma, assets nativos o cualquier cambio que requiera recompilación. La salida oficial es un AAB firmado para Google Play con `versionCode` monotónico; el APK asociado es únicamente QA/sideload.
4. Nunca se construyen, publican ni prometen APK parciales. Google Play recibe AAB completo y decide la optimización diferencial; una OTA reduce la descarga sólo cuando el cambio es compatible con el runtime.
5. Cada sección completada debe registrarse en `public.vexforge_android_release_registry` con digest SHA-256, commit, canal, rollout, estado, validaciones, limitaciones y objetivo de rollback. El cliente sólo puede leer registros publicados; no puede cambiar releases ni canales.
6. Una sección no puede declararse `SECTION_UPDATE_READY` si no existe evidencia de compatibilidad, manifiesto/hash, fallback, rollback y prueba de rechazo de incompatibles. Una sección no puede declararse `PLAY_COMPATIBLE_CANDIDATE` si el AAB no está firmado con upload key válida y validado en un track interno o cerrado.
7. Si el endpoint Expo Updates, la firma Play o el track de validación no están disponibles, la IA debe registrar el bloqueo exacto y mantener la sección en `BLOCKED` o `DRAFT`; está prohibido activar una configuración falsa, descargar código desde una URL arbitraria o simular una publicación.
8. La autoridad de las reglas es este protocolo activo en Supabase. GitHub `main`, los workflows, los manifiestos y los releases son evidencia operativa y deben mantenerse sincronizados mediante APIs HTTPS oficiales.

## 11. IMPLEMENTACIÓN DEL CICLO AUTOMÁTICO — OTA Y BASE ANDROID

**Entrada en vigor:** 2026-09-04  
**Estado:** IMPLEMENTED — BASE OTA PUBLICADA Y VALIDADA.

- La Edge Function pública `vexforge-updates` responde al protocolo Expo Updates, filtra por plataforma Android, `runtimeVersion`, canal y releases `PUBLISHED`, y sólo acepta manifiestos alojados en el bucket oficial `vexforge-updates`.
- La APK base oficial usa `expo-updates`, `runtimeVersion: 1.0.0`, comprobación `ON_LOAD`, fallback embebido inmediato y canal `production`.
- La base Android quedó publicada como release `vexforge-android-build-78`, construida desde el commit `6de1af807c4a1546cc3d0f0b4dd5afe256d22d0b`, con `app_version: 1.0.0`, `versionCode: 3` y artefacto `app-release.apk`.
- La descarga directa validada de la base es `https://github.com/grandmaster68081-byte/Vexforge-web/releases/download/vexforge-android-build-78/app-release.apk`. El archivo mide `95296812` bytes y su SHA-256 es `a386f0793928f17e3d9aee7ccbfce7a2d26c6001afa77d3d7c08d39e0947ac65`.
- La APK contiene `assets/index.android.bundle` de `3176784` bytes, por lo que es standalone y no depende de Metro. Esta APK es la base oficial QA/sideload para recibir las futuras OTA del runtime `1.0.0`; no es una declaración de `PLAY_STORE_READY`.
- El registro canónico de esta base está en `public.vexforge_android_release_registry` con `SECTION_ID=VE-MOB-BASE-OTA`, `DELIVERY_TYPE=NATIVE_PLAY_RELEASE`, `status=PUBLISHED`, `channel=production`, rollout `100%`, validaciones de descarga/bundle y limitaciones de APK QA/sideload.
- La APK 72 queda fuera del ciclo porque no contenía `expo-updates`; no se debe publicar una OTA dirigida a la APK 72.
- Para cada sección futura, la IA debe asignar primero `DELIVERY_TYPE`: `OTA_UPDATE` para JavaScript/TypeScript, navegación, estilos, copy y assets compatibles con el runtime `1.0.0`; `NATIVE_PLAY_RELEASE` para permisos, SDK, plugins, dependencias nativas, app config, runtime, firma o cualquier cambio que requiera recompilación.
- Una sección compatible debe seguir `commit en main → dispatch por sección → workflow OTA → manifiesto HTTPS firmado/hash → registro PUBLISHED en Supabase → rollout/rollback`. No se debe construir ni descargar otra APK completa para una sección compatible.
- Si el cambio es nativo, el flujo correcto es el workflow AAB firmado con `versionCode` monotónico; el APK asociado sólo sirve para QA/sideload. Nunca se publican APK parciales ni se simula una OTA si faltan manifiesto, hash, fallback, rollback o rechazo seguro de runtime incompatible.
- La orden operativa de una sección compatible es `node mobile/scripts/dispatch-section-release.mjs --section-id ... --delivery-type OTA_UPDATE ...`; para impacto nativo se debe usar `NATIVE_PLAY_RELEASE`.
- El flujo normal queda: commit en `main` → clasificación de sección → workflow correcto → digest y validaciones → publicación y registro en Supabase → URL del manifiesto/artefacto en el resumen del workflow.



---
# ENMIENDA PERMANENTE — UMBRAL DE CALIDAD VISUAL DEL HOME / FORJA

**Fecha de incorporación:** 2026-09-04  
**Estado:** OFICIAL — BLOQUEANTE PARA `VE-MOB-3-HOME-SCENE`  
**Referencia:** `HOME_GAME_SCENE_QUALITY_V1`  
**Precedencia:** esta enmienda concreta los criterios visuales de `VE-UI-TIER1-ANDROID-01`, V-T1, V-T2 y `VE-MOB-3-HOME-SCENE`. No cambia la autoridad funcional, no reabre la web congelada y no autoriza a copiar assets o propiedad intelectual de un referente externo.

## 1. Motivo y lectura de la referencia

El owner aportó una captura de un Home de videojuego como referencia de calidad visual. La captura debe evaluarse por la calidad de la escena que contiene, no por el marco de la fotografía, el espacio alrededor del teléfono ni por la orientación aparente de la captura. El estándar que debe conservarse en la APK es el siguiente:

- se reconoce primero un **mundo de juego** y no un dashboard administrativo;
- existe un foco protagonista —campeón, héroe, Nexus, carta o actividad viva— con una composición intencional;
- el fondo tiene ambiente, escala y capas suficientes para dar sensación de lugar, no sólo un color o una imagen plana detrás de paneles;
- navegación, recursos y acciones están integrados en una lectura de HUD coherente con el juego;
- la paleta, la luz, los marcos, la iconografía y la tipografía pertenecen al mismo universo visual;
- la pantalla comunica una actividad jugable y una próxima acción sin necesitar explicación externa;
- la versión real añade vida a la composición mediante idle del protagonista, ambiente, transiciones, respuesta táctil y actualización honesta de estados. La captura es estática, pero el estándar no lo es.

La referencia no exige reproducir el mismo género, ilustración, layout exacto o cantidad de elementos. Exige alcanzar una **densidad de intención visual semejante**: escena authored, foco, atmósfera, HUD, acción y movimiento trabajando como una sola experiencia.

## 2. Corrección del plan

El plan anterior tenía los conceptos necesarios —DNA visual, escena Home, identidad, profundidad, motion, estados y anti-dashboard—, pero no convertía la referencia en un gate suficientemente observable. Desde esta enmienda, `VE-MOB-3-HOME-SCENE` no se puede cerrar por:

- cambiar colores, radios, sombras, fondos o tipografía sin cambiar la lectura de la escena;
- montar tarjetas, botones o iconos genéricos sobre una imagen de fondo;
- presentar una captura estática o un mockup sin demostrar el comportamiento en la APK;
- declarar motion porque existe una transición de navegación, sin idle, ambiente y feedback de interacción;
- usar datos ficticios, arte placeholder o una acción que no tenga contrato real;
- extender el mismo tratamiento de Home a todas las pantallas sin una dirección propia por superficie.

La nueva regla de ejecución es: **T0 de reconciliación → DNA visual Android → Home/Forja como vertical slice visual → evidencia en movimiento → sólo entonces expansión a Cartas, Mazo, Batalla y superficies secundarias**. El Home sigue siendo el primer juez de calidad del producto.

## 3. Contrato visual obligatorio del Home

Para entrar en `Q4`, el Home debe demostrar todos estos componentes, con datos y rutas reales cuando correspondan:

| Dimensión | Mínimo exigible |
|---|---|
| Escena | fondo authored con profundidad perceptible, punto de entrada claro y composición que sobreviva a estados de carga, vacío y error |
| Foco | protagonista u objeto dominante con silueta, escala, iluminación y contraste suficientes para atraer la mirada sin tapar la acción |
| Atmósfera | relación coherente entre fondo, medio, foreground, color, luz y espacio; no una colección de paneles flotantes sin mundo |
| HUD | recursos, navegación y estado del jugador agrupados con jerarquía consistente, iconografía legible y superficies que parezcan parte del juego |
| Acción | una acción primaria reconocible en cinco segundos y acciones secundarias subordinadas; cada una debe llevar a una ruta existente |
| Movimiento | idle o respiración del foco, al menos un loop ambiental sutil y transiciones de entrada/foco/salida; reduced-motion conserva feedback funcional sin animación excesiva |
| Interacción | pressed, focus, selected, loading, retry y confirmación visibles; tocar no puede producir silencio visual |
| Identidad | recursos visuales propios de VEXFORGE: tratamiento de cartas, marcos, iconos, lettering, color y lenguaje de escena con procedencia registrada |
| Veracidad | progreso, recursos, actividad y CTA vienen de contratos autorizados; los estados vacíos y no disponibles no se disfrazan de contenido vivo |
| Rendimiento | la escena conserva estabilidad, touch targets y lectura en los dispositivos definidos; no se compra espectacularidad con loader eterno, ANR, OOM o caída de frames no medida |

La composición puede variar entre Home, Forja, Nexus o actividad destacada, pero no puede convertirse en un dashboard intercambiable. Debe existir una razón visual para que el jugador quiera permanecer en la escena y continuar.

## 4. Rúbrica de aceptación `HOME_GAME_SCENE_QUALITY_V1`

La revisión de `VE-MOB-3-HOME-SCENE` registra una puntuación de 0 a 5 para cada dimensión aplicable:

1. escena y atmósfera;
2. foco protagonista y lectura de profundidad;
3. identidad VEXFORGE y coherencia de assets;
4. jerarquía de HUD y acción primaria;
5. movimiento, liveness y transición;
6. feedback táctil y claridad de estados;
7. legibilidad en el dispositivo real;
8. cohesión y acabado de producción.

El Home sólo alcanza `Q4` si obtiene `4` o más en cada dimensión aplicable y ninguna queda por debajo de `3`. Una imagen atractiva sin movimiento, una escena con movimiento pero sin acción real, o un HUD funcional sin identidad visual no pasan el gate. `Q5` añade evidencia de rendimiento, accesibilidad, reduced-motion, estabilidad, procedencia de assets y QA humana según las reglas generales.

## 5. Evidencia mínima para cerrar el Home

Cada intento de cierre debe conservar en la evidencia del release:

- un vídeo de 10–15 segundos en la APK instalada mostrando entrada, estado normal, idle/ambiente y una interacción real con su transición;
- capturas de la misma escena en el viewport Android pequeño y en el dispositivo de referencia, sin usar un mockup como sustituto del APK;
- una toma del estado de carga y del estado vacío/error/retry cuando la superficie los soporte;
- la rúbrica `HOME_GAME_SCENE_QUALITY_V1` con puntuación, observaciones y deuda explícita;
- procedencia de los assets principales y relación entre cada dato mostrado y su contrato autoritativo;
- evidencia de FPS/frame pacing, memoria, arranque y ausencia de ANR/OOM cuando se declare Q4 o superior;
- verificación de que el Home puede regresar al flujo oficial y no es una pantalla de demostración aislada.

Si falta movimiento, interacción, procedencia, ruta real o evidencia en APK, el estado correcto es `IMPLEMENTED_UNVERIFIED` y la unidad se reabre; no se promociona a `Q4`, `ANDROID_GAME_TIER1_CANDIDATE` ni `TIER1_READY`.

## 6. Decisión normativa

La referencia aportada sí representa el nivel visual que el plan debe perseguir: **una pantalla que se siente como un juego vivo, con escena, protagonista, atmósfera, HUD y acción integrada**. Esta enmienda convierte esa opinión visual en una obligación de diseño y validación para el Home. No garantiza el resultado por sí sola: el resultado sólo existe cuando la APK implementada supera la rúbrica, el recorrido real, el rendimiento y la evidencia exigida.




---

## ADDENDUM OFICIAL — VEXFORGE TIER-1 FUNCTIONALITY + EXPERIENCE PACKAGE 2026

**Estado:** INTEGRADO COMO CAPA ADITIVA — no reemplaza el Protocolo Maestro, los contratos de Supabase, el inventario Android ni los planes históricos.
**Fuente:** paquete aportado por el operador `VEXFORGE_TCG_TIER1_2026_REPLIT_DIRECTIVE_ENHANCED`.
**Archivo fuente SHA-256:** c386172478f9e2c271c3967df68574e47974f74f60b8dc3f6e24434723ca2875.
**Documento oficial enlazado:** `vexforge_tier1_replit_directive_enhanced_2026`.
**Superficie:** Android `mobile/` durante la Ley de Transición; la web continúa congelada.

### 1. Propósito y límite

Esta capa fusiona la transformación visual Tier 1 con una pista funcional verificable: boot, autenticación, navegación, interacción, datos, integración de dominios, motion, rendimiento, regresión y handoff humano. Su regla de cierre es `EXPERIENCE → FUNCTION → VERIFICATION`.

El paquete guía el método de ejecución y la evidencia; no inventa tablas, columnas, RPCs, reglas de combate, economía, recompensas, permisos, assets canónicos ni resultados de QA. Supabase, Auth, RLS, RPCs, Storage, el inventario `VE-MOB-*`, el código real de `main` y los releases siguen siendo la autoridad de producto y datos.

### 2. Precedencia para futuras IA

1. Fila activa `vexforge_master_protocol_v2` en Supabase y su copia sincronizada en `main`.
2. Contratos vivos de Supabase: Auth, RLS, RPCs, Storage, datos y reglas autoritativas.
3. Inventario Android `docs/VE-MOB-0-PORT-INVENTORY.md` y código/release real de `main`.
4. Continuidad más reciente y evidencia de workflows/releases.
5. Este addendum y sus documentos fuente bajo `docs/VE-TIER1-REPLIT-DIRECTIVE-2026/`.
6. Capturas, tablero y referencias visuales del ZIP: contexto de diseño únicamente; nunca evidencia de runtime ni assets oficiales.

Si hay conflicto, se conserva la fuente de precedencia superior, se documenta la discrepancia y no se modifica una regla autoritativa por inferencia visual.

### 3. Orden integrado de ejecución

**Preflight:** leer el protocolo completo desde Supabase, continuidad, inventario, plan aplicable, código real, esquema/RPC/RLS/Auth/Storage y release. Confirmar unidad, límites, método HTTPS y gates antes de editar.

**Gates funcionales y de calidad:**

- Gate 0 — Boot Integrity: cold start, router, assets y estados recuperables.
- Gate 1 — Auth Integrity: login, registro si existe en contrato, restauración, expiración, logout, rutas protegidas y recuperación.
- Gate 2 — Navigation Integrity: rutas reales, deep links, back behavior, retorno y estado seleccionado.
- Gate 3 — Core Interaction Integrity: CTAs, filtros, búsqueda, selección, tutorial y acciones seguras.
- Gate 4 — Data Integrity: loading, vacío, error, retry, stale state, identidad del usuario y confirmación de mutaciones.
- Gate 5 — Domain Integration: FOJA → ARENA → ARCHIVO → FORJA → BATALLA → PERFIL y sistemas satélite con datos canónicos.
- Gate 6 — Visual Architecture: identidad VEXFORGE, escena, jerarquía y assets con procedencia.
- Gate 7 — Motion/Game Feel: feedback, transiciones, haptics/audio soportados y reduced-motion.
- Gate 8 — Performance: arranque, touch targets, scroll, memoria, FPS/jank, coste de assets y tamaño del APK.
- Gate 9 — Regression: matriz completa después de cambios compartidos y guardas específicas por unidad.
- Gate 10 — Human Validation Packet: pasos reproducibles, evidencia del operador y límites no verificables por la IA.

La falta de QA humana no bloquea la continuidad: deja la unidad en `IMPLEMENTED_UNVERIFIED`. Nunca se convierte una captura, compilación o preview en QA de dispositivo.

### 4. Fases Tier 1 enlazadas al inventario Android

- Iteración 0 — reconocimiento y mapa de riesgos.
- Iteración 1 — shell compartido, tokens y lenguaje de interacción.
- Iteración 2 — FOJA / Living Hub.
- Iteración 3 — ARENA / entrada competitiva.
- Iteración 4 — ARCHIVO / cartas.
- Iteración 5 — FORJA / mazo.
- Iteración 6 — LEGADO / perfil.
- Iteración 7 — pulido de sistema: estados compartidos, skeleton, empty/error narrativos, navegación, optimización.
- Iteración 8 — QA real Android.

La selección de cada siguiente unidad continúa gobernada por el inventario `VE-MOB-*` y por el siguiente criterio no completado; el addendum no autoriza saltar fases ni reabrir unidades sin evidencia nueva.

### 5. Scorecard y regresión

Se puntúan únicamente resultados con evidencia, de 0 a 5, en funcionalidad, navegación, identidad visual, motion, colección, deckbuilding, entrada a batalla, perfil e integridad. El orden mínimo es `FUNCTION ≥ 3 → INTEGRATION ≥ 3 → VISUAL ≥ 3 → MOTION ≥ 3 → polish`; no se persigue una puntuación estética alta mientras una función núcleo sea frágil.

La matriz de regresión cubre Boot, Auth, Route, Data, Interaction, Visual, Motion y Return para FOJA, ARENA, CARTAS, FORJA/MAZO, PERFIL y sistemas secundarios. Un cambio compartido exige repetir Home, Collection, Deck, Battle, Profile y entrada/salida de Auth.

### 6. Reparación autónoma y límites

La IA puede ejecutar el ciclo `INSPECT → PLAN → IMPLEMENT → RUN → TEST → OBSERVE → DIAGNOSE → REPAIR → RETEST → REGRESSION CHECK → CHECKPOINT` con la corrección mínima y reversible. Debe detenerse y dejar handoff para cambios de balances, propiedad, recompensas, transferencias, migraciones destructivas, ampliación de Auth, debilitamiento de RLS, rotación de credenciales o cambios públicos de contrato.

Todo secreto permanece en Replit Secrets. Nunca se escribe una contraseña, PAT, service-role key, token o credencial en código, documentación, capturas, logs, URLs, commits o Storage.

### 7. Uso de subagentes

Cuando existan pistas independientes, la sesión debe usar uno o dos subagentes en paralelo para auditorías separadas (autoridad/compatibilidad y ejecución/QA). El agente principal conserva la integración, verifica los resultados y debe esperar o cancelar todos los trabajos antes de cerrar. Los subagentes no pueden elevar estados, declarar QA humana, modificar contratos autoritativos ni publicar por su cuenta.

### 8. Cierre obligatorio y handoff

Cada unidad registra: alcance, archivos/superficies, fuente canónica, estado anterior/nuevo, gate, scorecard, guardas, workflow, commit, release, assets y limitaciones. El handoff humano debe enumerar dispositivo, sesión, pasos, resultado esperado y cualquier revisión visual subjetiva o acción externa que la IA no pueda probar.
