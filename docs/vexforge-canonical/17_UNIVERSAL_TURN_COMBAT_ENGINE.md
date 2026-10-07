# 17 — MOTOR UNIVERSAL DE COMBATE POR TURNOS

**Estado: PARCIAL (auditoría 2026-10-07).** El repositorio contiene el núcleo V7 aditivo, entrenamiento espejo sin recompensas, salas PvP y adaptadores de servidor para misiones/jefes; las pruebas PostgreSQL locales y las verificaciones estáticas pasan. Unity incluye puntos de inicio para misión/jefe y presentación de resultados por modo, pero no se ha compilado. La auditoría de solo lectura confirmó que Supabase live sigue en V6 y aún no contiene las tablas ni funciones V7, por lo que las nuevas rutas fallan explícitamente hasta que el servidor se actualice con aprobación.

## Objetivo

Crear un único motor autoritativo para todos los combates de Vexforge: PvP, PvE, jefes, misiones y, cuando exista el modo, incursiones. La profundidad viene de decisiones visibles dentro del tablero —posición, objetivo, coste, respuesta y consecuencia—, no de comprometer órdenes ocultas para adivinar simultáneamente qué hará el rival.

## Por qué el combate actual se reproduce automáticamente

La ruta Unity `VexforgeTier1BattleGate.BeginBattleAsync` llama una vez a `ResolveBattleAsync`. El RPC `vexforge_battle_resolve` devuelve la partida ya resuelta y Unity reproduce `result.events`. `BattleResult` contiene ganador, turnos, unidades finales y eventos, pero no una sesión viva ni un contrato para enviar la siguiente acción. La migración `0047_ve_pvp_4_formation_slots_in_engine.sql` documenta que sólo expuso las posiciones Champion/Vanguard/Sentinel/Reserve; no cambió las reglas. Por eso el tablero actual presenta el resultado de un simulador automático, no decisiones tomadas durante el combate.

La práctica PvE local identificada en `mobile/lib/aiBattle.ts` está clasificada como simulación, no como settlement autoritativo. El core V7 ofrece entrenamiento PvE espejo y PvP en rutas separadas. Una migración aditiva añade perfiles de misión/jefe y conecta el cierre al settlement existente; Unity ahora ofrece entrada a esos perfiles y comprueba las respuestas del servidor, pero falta compilación y validación de extremo a extremo.

## Principios no negociables

1. **Un solo núcleo de reglas.** El mismo validador de acciones, intérprete de efectos, resolución de daño, estados, prioridades, eventos y condición de fin sirve a cada modo.
2. **Acciones secuenciales y abiertas.** El servidor acepta una acción a la vez del jugador con prioridad. No hay planes simultáneos sellados ni una fase de “adivina el movimiento”. Una acción jugada y sus efectos se vuelven visibles antes de decidir la respuesta.
3. **El tablero importa.** Champion ocupa el Altar central; Vanguard, Sentinel y Reserve parten de las posiciones ForgeFormation V6. Cada carta activa ocupa una posición definida y sus contribuciones y efectos sobre el Champion se muestran explícitamente. Mover, desplegar, proteger, atacar o sacrificar una carta cambia el estado y tiene un coste/consecuencia comprobable.
4. **El Champion es el eje.** Su estadística efectiva es una composición reproducible de sus valores base, los vectores de modificación de las cartas activas y los efectos temporales autorizados por el ruleset. El motor devuelve el desglose de cada contribución; el cliente no calcula el resultado.
5. **Misma mecánica, controladores distintos.** En PvP un humano selecciona una acción legal. En PvE una política/IA selecciona de las mismas acciones legales. La IA no aplica daño ni modifica estado por una ruta alternativa.
6. **Servidor autoritativo y reproducible.** Unity presenta el estado, solicita acciones y reproduce eventos. Supabase valida cada acción, serializa las transiciones y conserva el log; el cliente nunca decide ganador, daño, recompensas ni settlement.
7. **Versionado y compatibilidad.** El ruleset queda fijado al crear el combate. V6 y sus resultados históricos no se reescriben; V7 se incorpora mediante una ruta nueva y aditiva, con corte sólo después de pruebas y migración aprobada.

## Contrato conceptual del combate

Una sesión conserva como mínimo: `ruleset_version`, perfil del encuentro, fase/round/turno, actor activo y prioridad, zonas de cartas, tablero y ocupantes, estado del Champion, recursos, estados/efectos, stack de respuestas, secuencia del event log, estado de la sesión y claves de idempotencia. El servidor deriva la identidad del actor de la sesión autenticada; no confía en un `player_id` declarado por el cliente.

El servidor ofrece operaciones equivalentes a:

- crear o reanudar una sesión;
- leer una proyección del estado visible para cada jugador;
- obtener las acciones legales para ese jugador y esa secuencia;
- enviar una acción con `expected_event_seq` e idempotency key.

La acción recibida se valida contra el estado bloqueado y la secuencia vigente. Si es ilegal o está obsoleta, se rechaza sin efectos parciales. Una repetición idempotente devuelve el resultado anterior, no vuelve a ejecutar el efecto.

### Acciones de tablero

El catálogo V1 debe permitir, según cartas y perfil: jugar/desplegar una carta desde una zona permitida a una posición legal; mover o reemplazar una unidad; declarar un ataque contra un objetivo legal; activar una habilidad; responder en una ventana abierta; pasar prioridad o terminar turno. Sólo se ofrecen acciones legales. Las cartas en mano pueden seguir siendo información privada; nunca se oculta ni se precompromete una acción ya elegida.

Cada carta debe usar una definición de efecto versionada y un conjunto cerrado de tipos de efecto; nunca se ejecuta código arbitrario almacenado en datos. Costes, robo, recursos, límites por turno, valores y efectos deben ser parámetros auditables del ruleset/catálogo, no coeficientes duplicados en Unity.

### Fases propuestas

1. **Inicio:** aplicar efectos de inicio y actualizar recursos/robo conforme al ruleset.
2. **Acción principal:** el jugador activo despliega, posiciona, mueve o activa cartas y declara ataques permitidos.
3. **Ventana de respuesta:** cada evento que admita respuesta abre prioridad explícita y visible; las respuestas legales se apilan y resuelven en orden determinista. Debe haber límites contra ciclos.
4. **Clash y resolución:** resolver objetivos, protección de Vanguard/Sentinel, daño, efectos y bajas en un orden definido por el ruleset y reflejado evento por evento.
5. **Cierre:** expirar efectos temporales, comprobar la condición de la ronda y pasar el turno o concluir.

Los números de recursos, costes, tamaño de mazo, cadencia de robo, fórmulas de balance y catálogo completo de habilidades se fijan desde los contratos reales de cartas y los perfiles actuales; no se inventan ni se copian a Unity como constantes. Deben validarse antes de activar V1.

## Campeón, altar y contribución de cartas

El Altar identifica al Champion y hace legible el objetivo estratégico. Vanguard proporciona la protección/intercepción de primera línea; Sentinel representa soporte/defensa; Reserve no contribuye hasta que su regla la active o entre al tablero. Las posiciones no son etiquetas cosméticas: restringen los objetivos y definen las condiciones para atacar al Champion.

En cada cambio de formación, el servidor recalcula la composición del Champion y emite un desglose auditable por carta, posición, estadística y efecto. La regla matemática exacta se fija en `ruleset_version` y metadatos de carta; no se deduce sólo de nombres de keywords. Si una carta se mueve, cae o cambia de estado, sus contribuciones se retiran o recalculan en el mismo paso transaccional. El cliente sólo muestra el desglose confirmado por el servidor.

Al llegar el Champion a cero, la ronda termina. El perfil del encuentro determina cuántas rondas componen el combate y el objetivo necesario para ganarlo; no cambia la lógica de acciones, efectos o daño. Los desempates y límites deben estar definidos y producir un evento explícito.

## PvP, PvE y perfiles de encuentro

El perfil puede definir controladores, formación inicial, escenario, modificadores autorizados, objetivo/rondas y política de settlement. No contiene un segundo motor de daño.

- **PvP:** dos humanos envían acciones autorizadas por turno.
- **PvE/misiones:** el humano y el controlador IA envían acciones al mismo endpoint; la IA elige entre `legal_actions` usando sólo su observación permitida.
- **Jefes/incursiones:** composición del enemigo, objetivos o múltiples participantes pueden variar por perfil; las mismas transiciones y efectos resuelven el combate.

Una prueba de paridad debe demostrar que, con el mismo estado inicial, ruleset, semilla y secuencia de acciones, el resultado y el event log son iguales independientemente de que el controlador de un lado sea humano o IA. Recompensas, rango, economía y settlement siguen siendo políticas separadas que consumen el resultado autoritativo.

## Eventos, replay y seguridad

El event log es append-only y secuencial; cada evento lleva `event_seq`, `round`, `turn`, actor, tipo, fuente/objetivo, cantidad y payload tipado. Debe registrar despliegue, movimiento, cambio de estadísticas, ventana de respuesta, resolución de efectos, daño, escudo/estado, baja, entrada de reserva, Champion expuesto/derrotado, fin de ronda y fin de combate. Los replays se reconstruyen de esos eventos sin reejecutar una simulación distinta.

Las proyecciones por jugador nunca revelan mano, mazo u otra información privada del oponente. Las acciones y sus resultados en tablero sí son públicos. Cada transición se serializa por sesión, verifica prioridad, turnos, propiedad, coste, legalidad e idempotencia y rechaza secuencias repetidas o manipuladas.

## Criterios de aceptación V1

- Ningún jugador debe comprometer en secreto una acción simultánea; cada jugada ocurre y se ve antes de elegir una respuesta.
- Cada acción legal cambia como máximo una vez el estado y añade eventos con secuencia continua; replay produce el mismo hash de estado final.
- Una acción ilegal, ajena, sin coste o con secuencia obsoleta no produce cambio de estado, efectos ni recompensas.
- El desglose de estadísticas del Champion coincide exactamente con base + contribuciones activas + efectos temporales del ruleset.
- Protección, movimiento, caída y reemplazo alteran de forma verificable los objetivos legales y el Champion.
- La muerte del Champion termina la ronda; la política de perfil decide si termina el combate.
- PvP y PvE producen el mismo resultado con la misma secuencia de acciones y el mismo ruleset.
- La IA no puede emitir una acción que el validador no ofrezca como legal.
- Unity no resuelve combate competitivo localmente; sólo presenta estado confirmado y envía intenciones.

## Implementación por hitos

1. Congelar los contratos de estado/acción/evento, los fixtures de reglas V6 y el catálogo de efectos.
2. **Fuente implementada; activación live pendiente.** Almacenamiento y RPC transaccionales V7 son aditivos y mantienen V6 intacto. La migración y las pruebas se ejecutan sólo en una base PostgreSQL temporal durante esta etapa.
3. **Vertical espejo implementada en fuente.** Unity solicita el estado y las acciones legales al servidor, envía intents con secuencia/idempotencia y muestra replay de snapshots; no calcula daño ni otorga recompensas. Requiere aplicar la migración en un entorno aprobado y compilar/verificar Unity antes de considerarla lista para usuarios.
4. **Núcleo y ruta Unity PvP implementados en fuente; activación live pendiente.** Las salas sin recompensas se descubren sólo mediante RPC autenticado; el servidor asigna la formación del segundo jugador, limita el estado a participantes y reutiliza el mismo `submit_action`. Las pruebas locales cubren turnos alternos, repetición idempotente, replay y cierre sin settlement. Unity tiene verificación estática, pero no se compiló.
5. **Adaptadores de misión/jefe implementados en fuente; activación live y validación Unity pendientes.** La migración selecciona cartas oficiales activas según región y dificultad/nivel, reutiliza el settlement de misiones existente y registra el daño confirmado en el contrato existente de jefes. No crea cartas ni cambia los contratos de settlement. Unity expone botones de inicio en la lista desplazable de misiones y en las fichas de jefes, conserva claves separadas por encuentro y muestra resultados específicos. La auditoría live encontró 127 cartas activas, 20 reglas de sinergia, 49 misiones activas (24 `production_ready`), 15 jefes activos y 5 regiones; estos conteos no acreditan un roster de jefe diseñado canónicamente.

**Límites de esta entrega parcial:** no activa reglas nuevas ni cambia datos/RPC/RLS live; no crea build de Unity ni declara completo el motor universal. El entrenamiento V7 usa la formación propia como espejo y no entrega recompensas. Los adaptadores y puntos de entrada de misión/jefe están en fuente, pero requieren compilación/QA y aprobación antes de activarse en Supabase live.
