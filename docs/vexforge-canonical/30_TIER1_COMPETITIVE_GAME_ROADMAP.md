# 30 — VEXFORGE: ROADMAP REALISTA HACIA UN TCG COMPETITIVO

- **Tipo:** plan estratégico y de ejecución; no es una declaración de trabajo terminado ni autorización para cambiar producción.
- **Última revisión:** 2026-09-30.
- **Base inspeccionada:** `grandmaster68081-byte/Vexforge-web`, rama `main`, SHA `02e4cec401230184f7a0de07a12cbc369dd5674a` antes de este commit documental.
- **Decisión del propietario:** Expo / React Native en `mobile/**` es el único runtime activo para el videojuego. Unity y las demás implementaciones quedan como legado para trabajo nuevo. Se conservan; este plan no borra, migra ni modifica esos árboles.
- **Supabase:** continúa siendo la autoridad de backend, datos, reglas, ownership, economía y settlement. En esta revisión sólo se hicieron lecturas; no hubo escrituras, migraciones ni cambios de configuración.

## 1. Conclusión sin promesas falsas

El documento adjunto v4 es útil como contrato de calidad: rechaza las pantallas disfrazadas de gameplay, prioriza combate real, exige autoridad del servidor y pide pruebas con evidencia. **Por sí solo no permite prometer un TCG capaz de competir con los mejores del mundo.** No define las reglas completas, el diseño que diferencia el juego, el alcance inicial de contenido, la autoridad exacta de cada acción de combate, los umbrales de balance basados en jugadores ni el proceso de operación después del lanzamiento.

Sí existe una ruta razonable para construir y validar un juego competitivo por etapas. Expo puede sostener un TCG móvil de cartas con una presentación 2.5D estilizada, interacción táctil y animación basada en estado. Eso no demuestra por adelantado rendimiento, calidad visual, profundidad o aceptación del público: primero hay que probar el combate vertical en los dispositivos objetivo. Una app compilable, una puntuación interna o una escena atractiva tampoco demuestran que el juego sea divertido, equilibrado o comercialmente competitivo.

La meta debe tratarse como una hipótesis que se gana con reglas coherentes, un bucle divertido, contenido suficiente, integridad competitiva, pruebas con jugadores externos y operación continua. No hay una fecha responsable que prometer sin conocer equipo, presupuesto de arte/audio, dispositivos, capacidad de QA y alcance de contenido. La IA puede acelerar análisis, código, documentación y verificaciones; no puede sustituir decisiones de diseño del propietario, pruebas humanas ni aceptación del mercado.

## 2. Resolución de autoridad y límites

1. La instrucción explícita del propietario del 2026-09-30 resuelve el conflicto del `main` anterior: **Expo es el único runtime activo para el juego**. Las afirmaciones previas de Unity activo quedan como registros históricos hasta una reconciliación posterior.
2. `mobile/**` es el punto de partida. Antes de afirmar que es ejecutable en el estado actual, hay que verificar su paquete, configuración Expo, scripts, dependencias, rutas y pipeline del `main` vigente.
3. `unity/**`, el portal web y otros clientes/caminos históricos son legado o están fuera del alcance del runtime del juego. Se preservan sin cambios; no se apagan sitios publicados ni se eliminan archivos como parte de este plan.
4. El documento v4 se conserva como requisito de calidad, pero no como autoridad para contradecir el runtime elegido, la implementación en `main` o los contratos vivos de Supabase.
5. No se inventan cartas, reglas, lore, RPCs, tablas, recompensas, odds, tarifas o valores. Una carencia en el contrato se registra como bloqueo; no se simula como una operación real.
6. No se cambia Supabase durante esta planificación. Un futuro cambio de producción requiere auditoría de definición, grants, RLS, dependencias e idempotencia, además de autorización y plan de reversión.

## 3. Base observada

### Repositorio y runtime

- En el SHA base indicado existen código Expo bajo `mobile/**`, código Unity bajo `unity/**` y documentación canónica que todavía declaraba Unity activo. La directiva nueva elige Expo, pero no convierte el contenido Expo en una build verificada.
- El árbol observado contiene el workflow manual `.github/workflows/vexforge-unity-android-github.yml`; **no se verificó un workflow Expo/Android activo** en ese snapshot. El workflow Unity no debe despacharse para el runtime elegido.
- Esta unidad no ejecutó instalación de dependencias, typecheck, Expo Doctor, build, APK, CI ni QA física. El estado real de compilación Expo queda `NO_VERIFICADO`.

### Supabase, sólo lectura — snapshot del 2026-09-30

- La Management API reportó el proyecto `rscuzqnfccqvltkdcdny` como `ACTIVE_HEALTHY`.
- La vista live `vexforge_tier1_score` reportó `weighted_score = 38.30`, `lowest_dimension_score = 0`, `dimensions_below_minimum = 10` y `tier1_ready = false`.
- El mínimo de cada dimensión observado es 85. Valores actuales observados: dirección de arte 70; audio 45; backup/restore 20; profundidad de combate 30; vida de interfaz 80; localización 0; cumplimiento de pagos 40; material prelaunch 15; regresión 10; madurez de rutas 55.
- Estado de fases live observado: 1 Arte/manifiesto `DONE` (4/4); 2 Identidad/layout `IN_PROGRESS` (3/4, 1 bloqueo); 3 Vida de interfaz `DONE` (3/3); 4 Bucle/primera sesión `IN_PROGRESS` (0/5, 4 bloqueos); 5 Profundidad competitiva/live-ops `IN_PROGRESS` (0/6, 6 bloqueos); 6 Acabado Tier 1 `IN_PROGRESS` (0/13, 9 bloqueos); 7 Benchmark/release readiness `NOT_STARTED` (0/10, 7 bloqueos).
- Se observaron tablas/columnas y nombres de rutinas de batalla y juego, entre ellas `battle_runs`, `battle_events`, `pvp_matches`, `player_deck`, `cards`, `mission_runs`, `start_battle_run`, `resolve_battle_run`, `resolve_pvp_match`, `save_deck` y `validate_deck`. **La existencia de objetos no verifica su lógica, autorización, grants, RLS, flujo cliente ni corrección competitiva.** Esta unidad no leyó sus cuerpos ni probó una partida autenticada.
- Estos datos son una fotografía de la consulta y no deben copiarse como estado eterno. La siguiente sesión debe volver a consultar `main` y Supabase antes de ejecutar trabajo dependiente de ellos.

La puntuación de Supabase es un control interno útil, no una certificación externa de calidad ni prueba de que el juego sea competitivo. No crear otro marcador paralelo ni cambiar los estados live para hacerlos coincidir con el plan.

## 4. Secuencia de trabajo y puertas de salida

Las fases son gates, no fechas. La presentación 2.5D mínima se construye dentro del combate vertical; no se pospone hasta que todas las pantallas parezcan terminadas. Tienda, marketplace, clanes y raids no deben retrasar la prueba del bucle central salvo que el diseño aprobado dependa de ellos.

### G0 — Reconciliar runtime, reglas y contratos

- Inspeccionar el `main` más reciente: estructura y scripts Expo reales, versión/configuración, dependencias, permisos Android, tests, CI/build existente y diferencia frente al historial.
- Reconciliar los documentos de entrada para que no vuelvan a enviar a una IA a Unity. Dejar los registros antiguos identificados como históricos, no borrarlos.
- Fijar una fuente canónica aprobada por el propietario para reglas: fases y prioridad del turno, selección y objetivos, costes/recursos, daño/mitigación, estados, victoria/derrota, azar, formato del mazo y modos. Separar reglas confirmadas, reglas aún por decidir y valores que pertenecen al servidor.
- Auditar sólo los contratos Supabase que el runtime consume: definición y firma exacta, ownership/autenticación, RLS, grants efectivos, event log, idempotencia, límites, retries, desconexión/reconexión y settlement. Relacionar cada llamada con un consumidor Expo y evidencia.
- Determinar un único camino oficial de validación/build Expo. No activar un workflow Unity ni crear pipelines paralelos.

**Salida:** ninguna contradicción sobre el runtime activo; reglas y contratos base trazables; bloqueos concretos anotados; pipeline Expo identificado o declarado como ausente. No hay build de lanzamiento en G0.

### G1 — Demostrar el bucle central con un vertical slice

Construir un combate que se juegue de principio a fin, no una secuencia de pantallas: entrar al encuentro, leer mano/campo/recursos, seleccionar y jugar carta, elegir objetivo cuando corresponda, resolver efecto, avanzar fase/turno, terminar en victoria/derrota, recibir únicamente el resultado autorizado y recuperarse de una interrupción. El prototipo visual debe reaccionar a eventos reales del estado: carta, objetivo, ataque, defensa, daño, efecto, turno y resultado.

La práctica local o contra IA, si existe, debe identificarse como práctica y nunca presentarse como PvP ni producir settlement competitivo. Si el backend sólo acepta un resultado final enviado por cliente y no puede validar acciones competitivas, eso es un **bloqueo de PvP autoritativo**; no se oculta con un resultado local.

**Salida:** recorrido repetible en Expo con casos válidos e inválidos, error/loading/retry/reconnect, estado persistente acorde al contrato y evidencia de que una acción rechazada no altera progreso/economía. Si falta contrato de acción autoritativo, detener PvP de producción y proponer el cambio como decisión aparte.

### G2 — Integridad competitiva y red

Verificar matchmaking/entrada, validación server-side de cada acción relevante, orden de eventos, temporizadores/desconexiones, concurrencia, deduplicación, reconexión/reanudación, replay, abandono, rate limits y prevención de manipulación del cliente. Separar partidas casuales, práctica y clasificatorias sin cambiar MMR/rewards por una conveniencia del cliente.

**Salida:** pruebas autenticadas de flujo completo y de fallos/reintentos; cada resultado tiene procedencia y no puede duplicarse o alterarse desde cliente. Ninguna función se da por segura sólo por ser `SECURITY DEFINER`; revisar cuerpo, ACL y `search_path`.

### G3 — Cartas, colección, mazos y balance

Consumir sólo catálogo, metadatos, imágenes y reglas canónicas verificadas. Confirmar validación de mazo y formación con el servidor; estados de loading/offline/empty/error no se disfrazan de colección vacía o éxito. Acordar primero alcance de la colección inicial. Probar arquetipos con jugadores y simulaciones reproducibles; las tres familias viables que aparecen como piso en el criterio live no bastan por sí solas para declarar un metajuego balanceado.

**Salida:** reglas de legalidad trazables, mazos guardados/validados con autoridad correcta, cobertura automatizada de efectos críticos y resultados de balance con muestra, método y limitaciones documentados.

### G4 — Producción 2.5D, legibilidad y firma visual

En Expo usar sólo tecnologías compatibles con la versión real del proyecto y probarlas en Android antes de adoptarlas. Diseñar profundidad por capas, elementos independientes, input táctil, transiciones y cámara cuando el plano lo necesite. La animación/VFX/audio responde a eventos de combate reales y respeta cancelación, interrupciones y reduced motion; una imagen con zoom o partículas decorativas no cuenta como gameplay ni cinematografía. Optimizar memoria/decodificación/listas y probar al menos los rangos de dispositivo que el propietario defina.

**Salida:** el combate es legible y consistente en dispositivos objetivo, con presupuesto de rendimiento medido; arte, audio y derechos de uso identificados. Si Expo no sostiene el nivel 2.5D deseado, presentar evidencia y opciones al propietario; no cambiar de motor unilateralmente.

### G5 — Primera sesión, tutorial, PVE y adquisición

Completar una primera sesión instruccional con interacciones reales; conectar Nexus/navegación, colección, mazo y combate sólo donde los contratos existen. Añadir misiones/bosses/raids cuando reglas, acciones y reward settlement estén comprobados. Un pack sólo cuenta como adquisición si la apertura, cartas obtenidas, ownership y confirmación se corresponden con la operación server-side.

**Salida:** nuevo jugador puede aprender la interacción esencial sin slideshow ni bloqueos artificiales; cada recompensa/acquisición se puede rastrear y recuperar tras fallo de red.

### G6 — Economía, social y live-ops con límites

Priorizar sólo los sistemas necesarios para el MVP y la retención aprobada. Auditar fees, compras, retiros, marketplace, rewards, propiedad, moderación, privacidad y cumplimiento por jurisdicción antes de conectarlos al loop competitivo. Ningún precio, odds, balance o permiso se modifica como ajuste visual. Diseñar versionado de reglas/contenido, temporadas, rollback y respuesta a incidentes antes de prometer servicio continuo.

**Salida:** contratos conciliados, controles de abuso y soporte operativos, y ninguna ventaja competitiva no declarada comprable. Los sistemas que no superan su auditoría permanecen fuera del MVP.

### G7 — Pruebas, release y prueba externa de competitividad

Aprobar primero matriz de pruebas: unitarias de reglas/serialización, contratos, regresión de pantallas, E2E de combate, permisos, dispositivos de gama baja/media/alta, red lenta/offline y recuperación. Pasar typecheck/lint/auditorías ya existentes, Expo Doctor, build Android reproducible y recorrido físico instalado. Reportar commit → pipeline → artefacto/SHA → dispositivo → resultado; no convertir un build de CI en QA física.

Después ejecutar playtests con participantes externos al equipo, registrar diversión/claridad, duración, abandono, errores, rendimiento y diversidad de mazos con método y tamaño de muestra acordados. Comparar con referentes del género en onboarding, legibilidad, profundidad, justicia y ritmo; “Tier 1” sólo se comunica como resultado cuando existe esa evidencia y operación sostenida.

**Salida:** todos los gates críticos internos cumplen los umbrales aprobados, las diez dimensiones live llegan al mínimo acordado (hoy observado: 85) sin críticos abiertos, pruebas en dispositivos pasan y existe evidencia externa reproducible. Aprobar ese marcador no equivale por sí solo a competir mundialmente.

## 5. Definition of Done por sistema

Cada informe de combate, cartas, packs, misiones u otro sistema incluye: rutas/archivos; estado (`PLANNED`, `PARTIAL`, `VERIFIED` o `BLOCKED`); conducta observada en runtime; contrato de backend y autoridad; pruebas ejecutadas y resultado; evidencia reproducible; riesgos y bloqueo restante. No se asciende a `VERIFIED` por presencia de un prefab, imagen, pantalla, RPC o documento.

No se atribuye al cliente cálculo competitivo, inventario, propiedad, azar de adquisición, MMR, settlement ni reward. Los fallos de red y las respuestas parciales son estados de producto, no éxitos silenciosos.

## 6. Continuidad para futuras IA

Al iniciar una sesión:

1. Leer este documento, `VEXFORGE_CONTEXT.md`, `00_START_HERE.md`, estado/bloque/bloqueos/contradicciones y sólo los documentos de dominio implicados.
2. Consultar el `main` actual y comparar SHA antes de continuar; no trabajar desde capturas o clones desactualizados.
3. Tratar Expo como único runtime activo por decisión del propietario. No dispatch de Unity, no reactivar otro cliente y no borrar legado.
4. Releer Supabase live para el dominio que se tocará; esta planificación sólo inspeccionó metadatos y nombres/firma de objetos, no permisos ni semántica completa.
5. No repetir tareas con estado `MET/DONE` sin evidencia nueva que demuestre regresión. Si cambia el runtime, anotar exactamente qué gate requiere revalidación.
6. Persistir cada incremento coherente directamente en `main`, junto con su verificación y esta continuidad. No dejar trabajo funcional únicamente en el workspace de Replit.
7. En producción, no cambiar Supabase, iniciar build, publicar artefacto o activar compras sin la autorización específica correspondiente.

## 7. Lo que falta decidir con el propietario antes del MVP

- Regla completa de combate y qué hace distintivo a VEXFORGE frente a otros TCG.
- Modo principal de lanzamiento (PvP competitivo, PvE o ambos) y qué parte del producto es realmente indispensable para la primera versión.
- Público/territorios, política de monetización y límites de juego justo.
- Alcance del primer set de cartas y recursos disponibles para arte, audio y pruebas externas.
- Dispositivos Android objetivo, presupuesto de rendimiento y criterios de accesibilidad/localización.
- Tamaño/método de playtest y thresholds de lanzamiento; los valores aún no ratificados se marcan `PROPUESTA`, nunca como regla canónica.

La siguiente unidad de trabajo es **G0: reconciliación Expo + reglas + auditoría de contratos de combate**, no la creación de nuevas pantallas ni una build de Unity.
