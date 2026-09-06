# VEXFORGE — MASTER DIRECTIVE
## VE-UX-ARCH-T1-2026 — RECONSTRUCCIÓN DE ARQUITECTURA DE EXPERIENCIA TCG

> **DOCUMENTO OPERATIVO PARA REPLIT / AGENTE DE IMPLEMENTACIÓN**

> **TIER-1 FUNCTIONALITY EXTENSION:** Read `00_TIER1_FUNCTIONALITY_MASTER_ADDENDUM.md` together with this directive. The visual reconstruction and the functional repair/QA work are one coordinated workstream.
>
> Este documento es una directiva complementaria al protocolo principal de VEXFORGE. No lo sustituye. Debe ejecutarse después de cargar/leer el protocolo principal, la continuidad del proyecto, la documentación disponible y el repositorio real.

---

# 0. OBJETIVO EJECUTIVO

No se solicita un "rediseño cosmético" de VEXFORGE.

No se solicita simplemente mejorar colores, tarjetas, sombras, tipografías o botones.

No se solicita hacer que un dashboard se vea más bonito.

Se solicita una **reconstrucción profesional de la arquitectura de experiencia del cliente mobile**, llevando VEXFORGE desde una presentación principalmente administrativa hacia una **experiencia de TCG/CCG de primer nivel**, con identidad propia, game feel, motion, profundidad, navegación contextual y una relación clara entre mundo, colección, deckbuilding, competición, progresión e identidad del jugador.

El objetivo de calidad es aspirar al nivel de referencia de los TCG/CCG mobile de mayor calidad del mercado 2026. Utilizar como benchmark de principios, entre otros:

- Shadowverse: Worlds Beyond
- Pokémon TCG Pocket
- Hearthstone
- Magic: The Gathering Arena
- Yu-Gi-Oh! MASTER DUEL
- MARVEL SNAP

**No copiar ningún juego.**

**No copiar assets, personajes, ilustraciones, logos, textos, layouts protegidos o identidad de marca.**

Extraer patrones de UX, jerarquía, navegación, motion, composición, feedback, colección, deckbuilding, competición y progresión; después crear una solución original de VEXFORGE.

---

# 1. CONTEXTO REAL DEL PROYECTO

El proyecto tiene una base funcional que debe preservarse.

VEXFORGE es un TCG/NFT collectible game de fantasía medieval oscura con economía y progresión propia. La aplicación Android es el producto activo.

Stack móvil conocido del proyecto:

- Expo 54
- React Native 0.81
- TypeScript
- expo-router
- Android como superficie activa

El repositorio/arquitectura y backend actuales deben considerarse fuentes canónicas.

**No asumir que una idea de UX autoriza a reescribir backend, auth, RLS, RPC, datos o lógica de combate.**

Antes de modificar algo, inspeccionar el estado actual real.

---

# 2. DIAGNÓSTICO DEL ESTADO ACTUAL

Las capturas de QA incluidas en este ZIP deben tratarse como evidencia del estado visual actual.

Se observa una aplicación funcional pero con una percepción predominantemente administrativa:

- abundancia de paneles/card containers repetidos;
- filtros/chips/pestañas dominando la jerarquía;
- numerosos bloques de información y estados;
- fondos temáticos usados como decoración, sin gobernar la interacción;
- navegación que funciona como navegación de aplicación;
- poca sensación de espacio físico dentro del mundo;
- poca relación entre las acciones y una escena persistente;
- algunos paneles muestran detalles técnicos que son útiles en QA pero no son lenguaje final de jugador;
- colección, economía, misiones, perfil y arena se perciben como módulos separados, más que como partes de un mismo juego.

**Diagnóstico central:**

> VEXFORGE tiene piezas de juego, pero la capa de experiencia todavía comunica "aplicación que administra un juego" en lugar de "juego que contiene estos sistemas".

El trabajo consiste en invertir esa percepción.

---

# 3. PRINCIPIO ARQUITECTÓNICO PRINCIPAL

## CAMBIO DE PARADIGMA

### Arquitectura actual percibida

FOJA → pantalla
BATALLA → pantalla
CARTAS → pantalla
MAZO → pantalla
PERFIL → pantalla

con sistemas secundarios alrededor.

### Arquitectura objetivo

VEXFORGE → un mundo/juego coherente → cinco grandes espacios de experiencia.

1. FOJA = HUB VIVO / BASE DEL JUGADOR
2. BATALLA = ARENA / COMPETICIÓN
3. CARTAS = ARCHIVO / COLECCIÓN
4. MAZO = LA FORJA / PREPARACIÓN ESTRATÉGICA
5. PERFIL = LEGADO DEL FORJADOR / IDENTIDAD

Los sistemas secundarios no desaparecen.

Se convierten en **sistemas contextuales** que alimentan esos cinco espacios.

---

# 4. LAS CINCO ÁREAS PRINCIPALES

## 4.1 FOJA — HUB VIVO

FOJA es el primer espacio que el jugador debe sentir como "su lugar" en VEXFORGE.

No debe parecer una pantalla de administración.

Debe responder visualmente:

- ¿Dónde estoy?
- ¿Qué está pasando ahora?
- ¿Qué puedo hacer?
- ¿Qué progreso tengo?
- ¿Qué actividad tiene sentido hacer a continuación?

### Referencia principal
Shadowverse: Worlds Beyond.

### Principios a extraer

- escenario + personaje/entidad + actividad + progreso + navegación;
- sensación de mundo;
- contenido destacado dentro de la escena;
- actividad persistente;
- presencia de personaje/entidad;
- movimiento ambiental;
- hotspots que llevan a actividades reales.

### Aplicación VEXFORGE

FOJA debe convertirse en un **Living Game Home**.

Debe existir una escena vertical con:

- background;
- midground;
- foreground;
- personaje/entidad central;
- puntos de interés;
- actividad contextual;
- navegación integrada;
- HUD mínimo;
- motion ambiental;
- parallax si la performance lo permite;
- microinteracciones.

La referencia entregada por el usuario (`reference_web/00_user_home_reference.png`) debe utilizarse para entender la sensación de un Home vivo, NO para copiar su identidad.

---

## 4.2 BATALLA — ARENA

Actualmente la pantalla expone elementos como ForgeFormation, motor de combate, carga de configuración, búsqueda de oponentes y estados de espera. Esto es útil desde ingeniería/QA, pero no representa una experiencia final de TCG premium.

### Objetivo

Convertir BATALLA en la **entrada física/conceptual a la competición**.

### Referencias

- Hearthstone para la idea de convertir el combate en un espacio reconocible del juego.
- MTG Arena para actividad/eventos/competición.
- Yu-Gi-Oh! MASTER DUEL para la separación clara de Duel/Deck/Solo y el tono competitivo.

### Debe comunicar

- competición;
- modo seleccionado;
- rango/temporada;
- actividad reciente;
- matchmaking;
- entrada a partida;
- estado del jugador.

### Regla

El usuario NO debe ver detalles internos del motor como parte de la presentación primaria.

La tecnología debe seguir funcionando; simplemente deja de ser el centro visual de la experiencia.

---

## 4.3 CARTAS — ARCHIVO DE VEX / COLECCIÓN

La colección actual tiene una base funcional valiosa:

- búsqueda;
- filtros;
- rarezas;
- facciones;
- orden;
- detalle;
- estadísticas;
- lore;
- propiedad/cantidad;
- estados de vacío/carga/error.

No perder nada de ello.

### Problema actual

La percepción dominante es "base de datos de cartas".

### Objetivo

Convertirla en una **colección que el jugador quiera mirar**.

### Referencia principal
Pokémon TCG Pocket.

### Principios a extraer

- la carta es el objeto protagonista;
- colección como actividad;
- portfolios/binders/exposición;
- búsqueda y filtros accesibles;
- descubrimiento;
- relación colección ↔ decks.

### Aplicación VEXFORGE

La pantalla debe sentirse como un **archivo de artefactos de VEXFORGE**.

No hacer una copia de Pokémon ni de su estilo pastel.

La dirección artística permanece:

- medieval dark fantasy;
- acero oscuro;
- rojo profundo;
- oro envejecido;
- azul arcano;
- obsidiana;
- verde sombra;
- cuero;
- plata;
- violeta.

Las cartas deben dominar la atención visual.

---

## 4.4 MAZO — LA FORJA

El constructor actual ya tiene información útil y selección de cartas.

La transformación debe ser conceptual:

> "Estoy construyendo mi deck" → "Estoy forjando el instrumento con el que voy a combatir".

### Referencias

- Shadowverse: Worlds Beyond
- MTG Arena
- Hearthstone Deck Builder
- Yu-Gi-Oh! MASTER DUEL

### Principios a extraer

- deck como objeto central;
- colección y deckbuilding integrados;
- búsqueda/filtros eficientes;
- validación inmediata;
- curva/composición/métricas útiles;
- guardar/editar/clonar/probar con baja fricción;
- transición natural a batalla.

### Identidad VEXFORGE

Aquí existe una oportunidad única.

Usar el concepto de **Forja** como lenguaje visual.

El deck puede representarse como:

- núcleo;
- estructura;
- piezas;
- runas;
- energía;
- afinidades;
- composición.

Los efectos visuales deben reforzar la estrategia, no ser decoración arbitraria.

---

## 4.5 PERFIL — LEGADO DEL FORJADOR

El perfil actual ya contiene identidad, rango, nivel, recursos y estadísticas.

### Problema

Se percibe como ficha de usuario.

### Objetivo

Convertirlo en la **historia del jugador dentro del universo**.

### Referencias

- Hearthstone Profile / Journal
- Shadowverse Profile / identidad / progreso

### Debe comunicar

- quién es el jugador;
- qué ha conseguido;
- qué rango tiene;
- qué ha coleccionado;
- qué ha forjado;
- qué ha ganado;
- cuáles son sus logros;
- qué posición ocupa;
- qué representa frente a otros Forjadores.

### Nombre conceptual

EL FORJADOR / LEGADO.

La Red de Forjadores puede conectarse aquí sin convertirse en una red social aislada.

---

# 5. SISTEMAS SECUNDARIOS: REUBICACIÓN CONTEXTUAL

No crear un sexto o séptimo nivel de navegación solo para "meter" sistemas existentes.

Reubicar conceptualmente:

### Mundo navegable

→ alimentación de FOJA, progresión, eventos, historia.

### Red de Forjadores

→ PERFIL + FOJA + actividad social.

### Economía

→ FOJA + FORJA + COLECCIÓN + progresión.

### Misiones / recompensas

→ actividad contextual + progresión + journal/centro de actividad.

### Logros

→ PERFIL / LEGADO.

### Packs / Shop

→ FOJA / COLECCIÓN / FORJA según el contexto real.

### Sistemas / Cuenta / Ajustes

→ utilitario, secundario, no protagonista.

La arquitectura objetivo debe evitar que el jugador tenga que entrar a "Sistemas" para sentir que está jugando.

---

# 6. GAME LOOP OBJETIVO

El nuevo diseño debe reforzar este loop:

ENTRAR
↓
FOJA VIVA
↓
DESCUBRIR ACTIVIDAD
↓
PREPARAR / COLECCIONAR / FORJAR
↓
ENTRAR A ARENA
↓
COMBATIR
↓
RESULTADO
↓
RECOMPENSA / PROGRESIÓN / NUEVA CARTA / CAMBIO DE ESTADO
↓
VOLVER A FOJA
↓
VOLVER A DESCUBRIR

Nunca diseñar una pantalla sin preguntarse:

> ¿Qué comportamiento del jugador mejora esta pantalla y cómo devuelve al loop?

---

# 7. DIRECCIÓN ARTÍSTICA VEXFORGE

## Identidad

- medieval fantasy dark;
- premium;
- cinematográfica;
- sofisticada;
- alta fidelidad;
- sin estética infantil;
- sin apariencia cartoon;
- sin elementos modernos innecesarios;
- sensación de videojuego premium.

## Materiales

- metal;
- piedra;
- madera vieja;
- cuero;
- pergamino cuando tenga sentido;
- cristal/runa;
- energía arcana;
- brasas;
- polvo;
- niebla;
- oro envejecido.

## Principio

La UI debe parecer que pertenece a ese mundo.

No colocar una tarjeta redondeada moderna encima de una ilustración y llamarlo inmersivo.

Los componentes deben obedecer un sistema de materiales:

- paneles como placas/artefactos cuando sea apropiado;
- bordes inspirados en marcos/herrajes;
- iluminación contextual;
- estados de selección con energía/ornamentos discretos;
- iconografía coherente.

No abusar de oro.

El oro es acento, no relleno universal.

---

# 8. MOBILE Y ORIENTACIÓN

El producto es vertical.

No adaptar una UI horizontal simplemente escalándola.

Diseñar específicamente para una relación vertical de espacio.

El scroll debe servir para:

- explorar;
- revelar;
- crear profundidad;
- distribuir jerarquía;
- controlar densidad.

El contenido no debe parecer una página web larga.

El scroll debe sentirse como una cámara móvil dentro de un espacio.

---

# 9. MOTION / GAME FEEL

Esta sección es crítica.

No aceptar una app visualmente estática con "animación" de ejemplo.

## Motion debe estar en cuatro niveles

### Nivel 1 — Ambient

- niebla;
- partículas;
- iluminación;
- humo;
- energía;
- objetos que se mueven ligeramente.

### Nivel 2 — Character/Entity

- breathing/idle;
- ropa/cabello/ornamentos;
- mirada o microgestos si el asset lo permite;
- VFX vinculados.

### Nivel 3 — Interaction

- press;
- selection;
- glow;
- scale;
- transition;
- card response;
- hotspot feedback.

### Nivel 4 — Navigation / Scene Transition

- entrada a arena;
- entrada a colección;
- abrir forja;
- retorno a FOJA;
- cambios de cámara/escena;
- transición de contexto.

### Regla

No todo tiene que moverse.

**La pantalla debe respirar, no vibrar.**

---

# 10. PARALLAX Y CAPAS

Para escenas como FOJA, analizar cada imagen/asset como posibilidad de división en profundidad.

Ejemplo conceptual:

1. cielo/atmósfera;
2. fondo remoto;
3. mundo lejano;
4. arquitectura;
5. personaje/objeto principal;
6. foreground;
7. VFX;
8. UI interactiva.

No convertir cada objeto en una capa independiente si eso perjudica performance.

Priorizar las capas que producen mayor ganancia perceptual.

---

# 11. MICROINTERACCIONES

Cada acción importante debe recibir una respuesta.

Ejemplos:

TOUCH
→ highlight
→ press response
→ micro scale
→ glow/particle
→ transición

Si el jugador toca una carta:

→ la carta debe responder como objeto.

Si toca una zona de FOJA:

→ el espacio debe reconocer la interacción.

Si entra a BATALLA:

→ debe existir una transición de preparación.

Si vuelve de batalla:

→ FOJA debe poder reflejar el nuevo estado si el backend ya lo conoce.

---

# 12. ESTADOS DE UX

Eliminar la sensación de "pantalla técnica" incluso en estados vacíos, pero sin ocultar información útil.

Crear lenguaje visual coherente para:

- loading;
- empty;
- error;
- locked;
- available;
- active;
- completed;
- new;
- reward ready;
- searching;
- matchmaking found.

Un estado vacío en un juego puede contar algo.

Ejemplo conceptual:

No:
"Sin datos"

Sí:
"La arena está tranquila. Encuentra un rival para comenzar."

Siempre que corresponda y sin inventar gameplay que el sistema no soporte.

---

# 13. REGLA DE DATOS Y BACKEND

CRÍTICO:

No inventar datos para hacer una pantalla más espectacular.

Usar la fuente canónica real.

Si un dato existe:
→ utilizarlo.

Si una ruta existe:
→ utilizarla.

Si un componente existe y es reutilizable:
→ evaluar reutilización.

Si no existe:
→ no inventar una integración ficticia sin marcarla.

No alterar sin necesidad:

- Supabase;
- auth;
- RLS;
- RPC;
- player data;
- combat logic;
- collection source;
- rewards;
- economy;
- storage.

La re-arquitectura es principalmente una transformación de experiencia y presentación, apoyada por los datos reales existentes.

---

# 14. PERFORMANCE ANDROID

El objetivo de calidad visual NO justifica romper el rendimiento.

Target: Android.

Antes de añadir motion complejo, inspeccionar:

- render path;
- listas;
- imágenes;
- memoización;
- animaciones;
- sombras;
- blur;
- partículas;
- overlays;
- memoria;
- navegación.

Evitar:

- decenas de animaciones simultáneas innecesarias;
- blur pesado donde no aporta;
- imágenes enormes sin necesidad;
- montajes de componentes costosos;
- re-render global al tocar un elemento local.

Preferir:

- assets optimizados;
- lazy loading;
- caché;
- animación localizada;
- transform/opacity cuando sea apropiado;
- reutilización;
- composición por capas eficiente.

### Nota especial

El dispositivo objetivo puede ser modesto. El diseño debe ser premium visualmente pero inclusivo en performance.

---

# 15. SISTEMA DE DISEÑO GLOBAL

No crear cada pantalla desde cero con estilos ad hoc.

Crear o consolidar un design system de VEXFORGE.

Debe incluir al menos:

- typography tokens;
- spacing tokens;
- radii;
- border treatment;
- surface materials;
- icon rules;
- status colors;
- shadow/elevation rules;
- motion timing;
- interaction states;
- card treatments;
- navigation treatment;
- modal/overlay patterns.

Debe existir coherencia entre FOJA, BATALLA, CARTAS, MAZO y PERFIL.

Pero no deben ser idénticas.

**Misma familia, cinco experiencias distintas.**

---

# 16. NAVEGACIÓN

La navegación inferior puede permanecer si es útil para el producto, pero debe tratarse como un sistema de acceso al juego y no como un navbar genérico.

Evaluar visualmente:

- tamaño;
- jerarquía;
- selected state;
- iconografía;
- relación con el fondo;
- comportamiento durante transición;
- cuándo mostrar/ocultar.

El Home debe seguir siendo reconocible sin depender de una barra inferior enorme.

---

# 17. FOJA — ESPECIFICACIÓN DETALLADA

## Estado idle

Debe existir actividad ambiental.

## Estado exploración

El usuario hace scroll y descubre una composición progresiva.

## Estado interacción

Los hotspots reaccionan y abren funciones reales.

## Elemento central

Investigar primero si un héroe/carta/entidad existente puede actuar como identidad central.

No crear un avatar genérico sin necesidad.

## Escena

Debe ser propia de VEXFORGE.

Conceptos visuales posibles (no obligatorios):

- bastión;
- forja;
- santuario;
- ruinas;
- cámara de artefactos;
- arena vista en distancia;
- portal arcano;
- caminos hacia otras actividades;
- zonas de influencia de facciones.

Elegir en función del lore y assets existentes.

## Información visible

Priorizar:

- actividad actual;
- progresión;
- recompensa disponible;
- temporada;
- carta/objeto destacado;
- acceso a actividad principal;
- estado del jugador.

No mostrar todo al mismo tiempo.

---

# 18. BATALLA — ESPECIFICACIÓN DETALLADA

La entrada debe ser aspiracional y competitiva.

### Home de Arena

Puede incluir:

- modo activo;
- rango;
- temporada;
- CTA principal;
- estado de búsqueda;
- recientes;
- eventos;
- modos adicionales.

### Matchmaking

Estados mínimos:

- idle;
- searching;
- opponent found;
- preparing;
- transitioning;
- error/no opponent.

Cada estado debe tener respuesta visual clara.

### No mostrar

- logs técnicos;
- flags internos;
- texto RPC;
- detalles de implementación;
- datos de debugging.

Salvo herramientas de desarrollo separadas.

---

# 19. CARTAS — ESPECIFICACIÓN DETALLADA

## Principio

La carta gana.

No permitir que los filtros ganen la pantalla.

## Vista de colección

Prioridad visual:

1. cartas;
2. navegación de colección;
3. contexto/progreso;
4. filtros/búsqueda;
5. metadatos.

## Inspector

Debe sentirse como inspeccionar un artefacto.

Puede incluir:

- arte;
- nombre;
- rareza;
- facción;
- poder;
- afinidad;
- prestigio;
- carga;
- habilidades;
- lore;
- supply/cantidad si aplica;
- acciones permitidas.

Usar datos reales.

---

# 20. MAZO — ESPECIFICACIÓN DETALLADA

## Centro

Deck actual.

## Lados/contexto

Colección y cartas disponibles.

## Información

- tamaño;
- curva/estadísticas relevantes;
- composición;
- facción;
- especialización;
- legalidad/validación real.

## Acciones rápidas

- guardar;
- editar;
- duplicar;
- eliminar;
- probar;
- entrar a batalla.

No inventar acciones no soportadas.

---

# 21. PERFIL — ESPECIFICACIÓN DETALLADA

## Primera impresión

"Este es mi personaje/identidad dentro de VEXFORGE."

No:
"Esta es mi ficha de usuario."

## Elementos posibles si existen en datos

- avatar/entidad;
- nombre;
- título;
- rango;
- nivel;
- estadísticas;
- victorias;
- colección;
- decks;
- logros;
- recompensas;
- reputación;
- actividad;
- social.

La pantalla debe priorizar narrativa visual y no solo numeración.

---

# 22. REFERENCIAS Y BENCHMARK

Leer `02_BENCHMARK_2026.md` y `04_REFERENCE_INDEX.md` antes de diseñar.

Las referencias deben utilizarse así:

### Shadowverse: Worlds Beyond
Estudiar:
- Home vivo;
- personaje/entidad;
- progreso;
- banners;
- Park/hub social;
- sensación de mundo.

### Pokémon TCG Pocket
Estudiar:
- Collection;
- card-first hierarchy;
- portfolio/display;
- discovery;
- colección/deck relationship.

### Hearthstone
Estudiar:
- main menu como hub;
- arena/modes;
- collection;
- deck builder;
- journal;
- profile;
- quests/rewards.

### MTG Arena
Estudiar:
- activity hub;
- events;
- play CTA;
- mastery;
- quests;
- deck ecosystem.

### MASTER DUEL
Estudiar:
- DUEL/DECK/SOLO;
- competitive framing;
- deck presentation;
- animation/transition philosophy.

### MARVEL SNAP
Estudiar:
- speed;
- low friction;
- deck preview;
- quick decision loops;
- clarity for new players.

---

# 23. REGLA DE INNOVACIÓN

La salida NO debe ser:

Shadowverse + Hearthstone + Pokémon + MTG + Master Duel pegados.

Debe ser:

**VEXFORGE reinterpretando lo que esos productos hacen bien.**

Buscar una metáfora visual única para VEXFORGE.

Conceptos que deben informar la solución:

- FORJA;
- VEX;
- cartas como artefactos;
- facciones;
- arena;
- legado;
- energía arcana;
- colección;
- dominio;
- progresión;
- mundo.

No es necesario utilizar todos literalmente.

Elegir una dirección que un diseñador senior/creative director pudiera defender como identidad de producto.

---

# 24. PROCESO OBLIGATORIO DE EJECUCIÓN

## FASE A — AUDITORÍA

Antes de modificar el Home o cualquier dominio:

1. inspeccionar router;
2. identificar exactamente las cinco rutas/pantallas;
3. inspeccionar componentes;
4. inspeccionar assets;
5. inspeccionar fuentes de datos;
6. inspeccionar navegación;
7. inspeccionar sistemas de animación;
8. revisar las capturas incluidas;
9. revisar la documentación del proyecto;
10. mapear qué es real y qué es mock/QA.

## FASE B — RE-ARQUITECTURA

Crear un documento interno de decisión:

- qué permanece;
- qué se reinterpreta;
- qué componentes se reutilizan;
- qué nuevas abstracciones se necesitan;
- qué assets faltan;
- qué motion es viable;
- qué cambios son de alto riesgo.

## FASE C — DESIGN SYSTEM

Consolidar los fundamentos visuales.

## FASE D — FOJA

Implementar primero el nuevo lenguaje de Home.

Razón: FOJA será la referencia de tono para los demás dominios.

## FASE E — BATALLA

Implementar Arena con el mismo lenguaje pero personalidad competitiva.

## FASE F — CARTAS

Implementar Collection/Archive.

## FASE G — MAZO

Implementar Forge.

## FASE H — PERFIL

Implementar Legacy.

## FASE I — TRANSICIONES

Conectar las cinco experiencias.

## FASE J — PERFORMANCE + QA

Validar en Android real.

---

# 25. DESARROLLO POR INTERACCIONES CON LA IA

No forzar todo en una sola respuesta de agente.

Utilizar etapas.

### INTERACCIÓN 1

Auditoría + mapa + propuesta arquitectónica.

No hacer una reescritura ciega.

### INTERACCIÓN 2

Implementar shell/design system + FOJA.

### INTERACCIÓN 3

BATALLA + CARTAS o el orden que el agente justifique después de la auditoría.

### INTERACCIÓN 4

MAZO + PERFIL + transiciones.

### INTERACCIÓN 5

Motion polish + performance + QA.

Si el contexto disponible permite agrupar más, hacerlo solamente si no reduce calidad.

---

# 26. CRITERIO DE PRIORIDAD

Cuando haya que elegir entre:

A) agregar otra función visual;
B) mejorar la percepción, claridad y respuesta de una función existente;

priorizar B.

Cuando haya que elegir entre:

A) una animación espectacular pero pesada;
B) una animación menos vistosa pero fluida;

priorizar B.

Cuando haya que elegir entre:

A) copiar un patrón visual del benchmark;
B) crear una interpretación propia;

priorizar B.

Cuando haya conflicto entre estética y lógica del producto:

la arquitectura real y la integridad del producto tienen prioridad.

---

# 27. REGLA DE NO-MOCK

No usar fake data para simular que la nueva arquitectura funciona.

No crear:

- jugadores falsos;
- estadísticas ficticias;
- decks falsos;
- cartas inexistentes;
- ranking artificial;
- economía falsa;
- eventos inventados.

Para la presentación visual se pueden utilizar estados placeholder únicamente durante el desarrollo, pero deben identificarse y no deben quedar como producto final.

---

# 28. REGLA DE NO-ROTURA

No romper:

- authentication;
- Supabase;
- RLS;
- RPCs;
- collection logic;
- deck data;
- combat logic;
- rewards;
- economy;
- player records;
- storage;
- routes existentes.

Antes de modificar una pieza compartida:

1. encontrar sus consumidores;
2. evaluar impacto;
3. modificar de forma incremental;
4. comprobar que no se rompen dominios vecinos.

---

# 29. OBSERVABILIDAD DE CAMBIOS

Después de cada etapa importante:

- explicar qué archivos se modificaron;
- explicar qué rutas se tocaron;
- explicar qué lógica se reutilizó;
- explicar qué assets se añadieron;
- explicar qué riesgos quedan;
- indicar cómo validar.

No reportar "terminado" si solamente se ve bien en un render aislado.

---

# 30. DEFINITION OF DONE

El trabajo se considera exitoso cuando:

### Arquitectura

- las cinco áreas se perciben como espacios de un mismo juego;
- los sistemas secundarios están contextualizados;
- el loop es claro.

### Visual

- VEXFORGE tiene una identidad reconocible;
- no parece una plantilla de app;
- no parece una copia de ningún benchmark.

### FOJA

- es un hub vivo;
- tiene profundidad;
- tiene actividad;
- tiene navegación integrada;
- invita a jugar.

### BATALLA

- se siente como una Arena;
- los estados de matchmaking tienen presencia;
- la implementación técnica queda detrás de la UX.

### CARTAS

- la carta es protagonista;
- la colección se siente valiosa;
- el inspector es inmersivo.

### MAZO

- construir un deck se siente como forjar;
- las decisiones estratégicas tienen feedback.

### PERFIL

- el jugador ve su legado;
- la progresión es narrativa/visual y no solamente numérica.

### Motion

- la pantalla vive;
- las interacciones responden;
- las transiciones tienen propósito.

### Performance

- scroll fluido;
- sin jank evidente;
- sin cargas exageradas;
- sin aumento injustificado del APK;
- viable en Android real.

### Integridad

- no se han inventado rutas/datos;
- no se ha destruido lógica existente;
- backend/auth/RLS/RPC siguen íntegros.

---

# 31. PRIMERA ORDEN A EJECUTAR

**NO IMPLEMENTES TODAVÍA EL REDISEÑO COMPLETO.**

Primero realiza una auditoría profunda del repositorio y de las cinco superficies actuales.

Usa las capturas proporcionadas en este ZIP para contrastar el estado visual real.

Después devuelve un diagnóstico con:

1. mapa de las cinco pantallas;
2. rutas reales;
3. componentes reutilizables;
4. datos reales disponibles;
5. assets reutilizables;
6. sistemas secundarios;
7. riesgos técnicos;
8. propuesta de arquitectura visual;
9. propuesta de motion;
10. propuesta de navigation flow;
11. propuesta de implementación incremental.

Después de presentar esa propuesta, comienza a implementar la reconstrucción en el orden que tenga más sentido técnico.

**No quiero un mockup aislado.**

**Quiero una reconstrucción real del producto existente.**

**No quiero cinco pantallas bonitas desconectadas.**

**Quiero cinco espacios de un mismo videojuego.**

**No quiero una app administrativa con skin medieval.**

**Quiero que, al entrar, el usuario sienta: "he entrado en VEXFORGE".**

---

# 32. FRASE FINAL DE DIRECCIÓN CREATIVA

La referencia de esta misión puede resumirse así:

> **No estamos maquillando el panel. Estamos construyendo el juego que el panel todavía no sabe representar.**

El objetivo final es que VEXFORGE pueda competir visual y experiencialmente con los TCG/CCG mobile de referencia del mercado, pero con una identidad que solo pueda pertenecer a VEXFORGE.

**Interpretar. Diseñar. Integrar. Animar. Optimizar. Validar.**

No copiar.

No improvisar.

No inventar datos.

No romper.

No conformarse con "se ve mejor".

**Construir una experiencia de TCG premium.**
