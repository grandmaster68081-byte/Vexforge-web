# VEXFORGE — LOVABLE MASTER DIRECTIVE
## VE-UX/CX-TIER1-2026 • Reconstrucción de la experiencia visual y arquitectura de juego

**Propósito**
Este documento se entrega junto al protocolo maestro de VEXFORGE. NO sustituye el protocolo maestro, la documentación canónica, el repositorio, Supabase ni las reglas de continuidad. Su misión es dirigir a Lovable en la transformación de la experiencia visual de VEXFORGE desde una aplicación que hoy puede percibirse como panel administrativo hacia una experiencia de juego TCG/CCG premium, viva, inmersiva y preparada para competir visualmente con referentes Tier 1.

---

## 0. REGLA SUPERIOR

No hacer un "redesign" superficial.

No hacer un reskin.

No poner imágenes bonitas detrás de los mismos paneles.

No convertir una aplicación CRUD en un juego mediante gradientes, sombras y tarjetas.

La tarea es **reconstruir la arquitectura de experiencia** para que el usuario perciba un videojuego TCG y no un sistema administrativo.

La meta visual es el nivel de pulido, claridad, jerarquía, motion, feedback, profundidad y fantasía digital que un jugador moderno espera de un producto TCG/CCG de primer nivel en 2026.

**Principio rector:**

> VEXFORGE no necesita cinco pantallas más bonitas. Necesita cinco espacios del mismo videojuego, cada uno con una función jugable distinta y una identidad visual propia, pero todos pertenecientes al mismo mundo.

---

## 1. QUÉ DEBE HACER LOVABLE

Lovable debe actuar simultáneamente como:

- Product Designer.
- UX Architect.
- Game UI/UX Designer.
- Art Direction assistant.
- Motion/UI interaction designer.
- Front-end architect.
- Prototype engineer.

La documentación debe traducirse a una experiencia **clicable y viva**, no a mockups estáticos. La documentación actual de Lovable enfatiza precisamente prototipar comportamiento, estados, errores, permisos y flujos, no solo layout; también permite trabajar con React/Tailwind, temas, GitHub y Supabase. Usar esa capacidad de forma deliberada. [Fuente oficial Lovable](https://lovable.dev/designers) [Supabase](https://lovable.dev/supabase-integration)

---

## 2. ALCANCE

Reconstruir conceptualmente y visualmente los cinco dominios principales de VEXFORGE:

1. **FOJA** — HUB / mundo vivo.
2. **BATALLA** — ARENA / competición.
3. **CARTAS** — ARCHIVO / colección.
4. **MAZO** — FORJA / construcción estratégica.
5. **PERFIL** — LEGADO DEL FORJADOR / identidad y progresión.

Los sistemas secundarios —economía, recompensas, misiones, mundo, social, logros, eventos, etc.— no deben desaparecer. Deben convertirse en **sistemas que alimentan los cinco espacios**, en lugar de aparecer como una colección de módulos administrativos independientes.

---

## 3. BENCHMARK 2026

Usar como referencias de producto y experiencia:

### Shadowverse: Worlds Beyond
**Aprendizaje:** Home como lugar/hub, personaje, actividad, progresión, deckbuilding, colección y socialización dentro de una misma experiencia.

### Pokémon TCG Pocket
**Aprendizaje:** colección como objeto de deseo; cartas protagonistas; descubrimiento; presentación de posesión; vínculo entre colección y deck.

### Hearthstone
**Aprendizaje:** espacios físicos y teatrales; campo de batalla con personalidad; feedback audiovisual; identidad del jugador; Journal/Profile/Rewards integrados al loop.

### MTG Arena
**Aprendizaje:** home como centro operativo del juego; relación entre jugar, eventos, colección, deckbuilding y competición; densidad informativa controlada.

### Yu-Gi-Oh! MASTER DUEL
**Aprendizaje:** sensación de producto TCG serio; Duel, Deck, Solo y competición claramente diferenciados; UI orientada a acciones del jugador.

### MARVEL SNAP
**Aprendizaje:** claridad de loop, ritmo, presentación de cartas/ubicaciones y navegación orientada a partidas rápidas; reducir fricción entre entrar, elegir deck y jugar.

La investigación de 2026 sigue situando a Pokémon TCG Pocket, Yu-Gi-Oh! Master Duel, Shadowverse: Worlds Beyond, Marvel Snap, Hearthstone y MTG Arena entre las referencias destacadas del panorama mobile/CCG. [Benchmark 2026](https://www.pockettactics.com/best-mobile-card-games)

**Regla:** estudiar principios, no copiar interfaces, arte, personajes, iconografía, textos ni layouts.

---

## 4. REFERENCIA VISUAL DEL USUARIO

En `reference_visuals/user_home/00_USER_HOME_REFERENCE.png` existe una captura aportada por el propietario de VEXFORGE.

Esta imagen NO es una plantilla para copiar.

Debe utilizarse para entender el concepto:

**"home vivo" = escena + navegación + actividad + profundidad + personaje + interacción.**

La referencia muestra una composición en la que los elementos del Home parecen pertenecer al mundo del juego y no ser controles administrativos superpuestos.

VEXFORGE debe traducir esa idea a una experiencia **vertical**, con scroll, capas y descubrimiento.

---

## 5. DIAGNÓSTICO DEL ESTADO ACTUAL

El material visual de `reference_visuals/current_compact/` representa el estado actual observado en las capturas QA.

El problema central detectado es de **arquitectura perceptual**:

- predominio de paneles/cards/listados;
- navegación que parece navegación de aplicación;
- demasiada información expuesta simultáneamente;
- poca jerarquía audiovisual;
- poca profundidad ambiental;
- escasa teatralidad;
- poca sensación de lugar;
- acciones separadas del mundo ficticio;
- colecciones y sistemas tratados como bases de datos;
- funciones del juego percibidas como módulos administrativos.

No se debe "ocultar" este problema con una capa artística. La solución es cambiar la forma en que cada dominio se cuenta visualmente.

---

## 6. NUEVA ARQUITECTURA DE EXPERIENCIA

### 6.1 FOJA — HUB VIVO

Concepto: **el lugar al que vuelves**.

Debe sentirse como una base, santuario, enclave, fortaleza, cámara de forja u otra metáfora propia de VEXFORGE. Lovable debe estudiar el lore/datos actuales antes de decidir la metáfora final.

Requisitos:
- escena vertical;
- scroll con propósito;
- profundidad/parallax cuando sea viable;
- ambiente animado;
- personaje o entidad central si existe un asset canónico apropiado;
- hotspots integrados al mundo;
- acceso orgánico a actividades;
- recursos visibles pero secundarios;
- estado del jugador integrado;
- entradas a los otros cuatro dominios sin sensación de dashboard.

El usuario debe poder volver a FOJA después de una partida y sentir que regresa a su espacio.

### 6.2 BATALLA — ARENA

Concepto: **aquí se prueba lo forjado**.

No mostrar una lista de sistemas técnicos. Mostrar una arena con modos y actividad.

Requisitos:
- entrada rápida a partida;
- deck seleccionado visible de forma clara;
- matchmaking/actividad;
- temporada/rango;
- modos;
- retos/eventos;
- estado de cola;
- feedback de acción;
- transición teatral hacia la partida.

La pantalla de batalla en sí debe inspirarse en la idea de "campo/mesa/arena" de los grandes TCG digitales: una escena donde ocurre algo, no un panel.

### 6.3 CARTAS — ARCHIVO

Concepto: **mis cartas son objetos que poseo, descubro y estudio**.

Requisitos:
- carta como protagonista;
- browsing fluido;
- inspección profunda;
- rareza como lenguaje visual;
- identidad de facción;
- progreso de colección;
- estados: poseída, no poseída, nueva, mejorada, favorita, etc. solo si existen o tienen sentido con los datos reales;
- búsqueda y filtros sin dominar la pantalla;
- detalle de carta con composición premium;
- relación clara con deckbuilding.

No convertir el catálogo en una tabla con skins.

### 6.4 MAZO — LA FORJA

Concepto: **aquí construyo mi arma estratégica**.

Requisitos:
- mazo como protagonista;
- construcción y edición fluidas;
- lectura de composición;
- sinergias/curva/estadísticas cuando existan;
- colección disponible como materia prima;
- validación del mazo;
- nombrado y guardado;
- relación explícita con BATALLA;
- feedback visual al agregar/quitar cartas.

La estética debe explotar la idea canónica de "forja" sin inventar mecánicas inexistentes.

### 6.5 PERFIL — LEGADO DEL FORJADOR

Concepto: **esto es lo que he conseguido y quién soy en VEXFORGE**.

Requisitos:
- identidad;
- rango/progresión;
- estadísticas;
- logros;
- títulos/insignias si existen;
- decks;
- colección resumida;
- actividad/historial;
- eventos o temporadas;
- reputación/prestigio si la arquitectura actual los soporta.

No tratarlo como configuración de cuenta.

---

## 7. PRINCIPIO DE “JUEGO, NO APLICACIÓN”

En cada pantalla evaluar:

**Pregunta incorrecta:**
"¿Qué botones necesitamos?"

**Pregunta correcta:**
"¿Qué quiere hacer el jugador aquí y qué espacio del mundo representa esa acción?"

Ejemplos:

- Colección → Archivo/galería.
- Deckbuilding → Forja.
- Matchmaking → Entrada a Arena.
- Perfil → Legado.
- Eventos → actividad visible dentro del mundo.
- Recompensas → descubrimientos/progresión.
- Misiones → objetivos que empujan el loop.

---

## 8. MOTION SYSTEM

El objetivo no es meter animaciones por todas partes.

Crear un **sistema de movimiento coherente**.

### Nivel 1 — micro motion
- press feedback;
- scale sutil;
- glow;
- icon transitions;
- state change.

### Nivel 2 — ambient motion
- fog;
- particles;
- light flicker;
- cloth/vegetation motion si asset lo permite;
- idle character motion;
- magical energy;
- subtle camera movement.

### Nivel 3 — navigation motion
- transitions between domains;
- contextual reveal;
- scene-to-panel transitions;
- card detail transitions;
- deck changes;
- match launch.

### Nivel 4 — celebration motion
- unlock;
- reward reveal;
- victory;
- promotion;
- rare card reveal.

Motion debe comunicar jerarquía y estado, no decoración.

---

## 9. DISEÑO VERTICAL

VEXFORGE es mobile/vertical.

No adaptar un layout horizontal.

Diseñar desde el principio para:

- thumb reach;
- safe areas;
- scroll natural;
- lectura con una mano;
- CTA principal al alcance;
- visual focal central;
- cards y arte legibles;
- animaciones eficientes.

Cuando se use scroll, debe sentirse como **exploración** y no como una página web larga.

---

## 10. SISTEMA VISUAL GLOBAL

Dirección:

- fantasía medieval oscura;
- premium;
- cinematográfica;
- alto detalle;
- materiales físicos reconocibles;
- steel dark;
- deep red;
- aged gold;
- arcane blue;
- obsidian black;
- shadow green;
- leather brown;
- silver;
- violet.

No cartoon.
No SaaS.
No glassmorphism por defecto.
No dashboard genérico.
No UI de e-commerce.
No copiar un anime TCG si no corresponde al canon de VEXFORGE.

---

## 11. DESIGN SYSTEM

Lovable debe crear/reforzar un sistema de diseño reutilizable para que los cinco dominios se sientan parte del mismo juego.

Definir:
- tokens;
- tipografía;
- escalas;
- espaciado;
- botones;
- tarjetas;
- chips;
- badges;
- tooltips/inspectors;
- tab bars/navigation;
- modal/drawer;
- overlays;
- rarity treatment;
- states;
- loading;
- empty/error;
- motion tokens;
- responsive/mobile rules.

No se permite que cada pantalla invente su propio lenguaje.

---

## 12. DATOS Y BACKEND

VEXFORGE tiene backend Supabase y datos existentes.

Lovable debe respetar la fuente canónica del proyecto.

**NO:**
- crear datos ficticios como sustituto de datos reales;
- duplicar tablas sin necesidad;
- cambiar reglas RLS solo por UI;
- inventar rutas;
- inventar recursos;
- inventar estadísticas;
- romper contratos existentes.

**SÍ:**
- inspeccionar la estructura existente;
- utilizar consultas reales;
- mantener separación entre UI y datos;
- mostrar estados reales;
- respetar autenticación;
- respetar permisos.

Lovable tiene integración nativa con Supabase para UI, Postgres, auth, storage, realtime y edge functions. Esa capacidad debe usarse solo cuando sea compatible con la arquitectura canónica, nunca para reemplazarla arbitrariamente. [Documentación oficial](https://lovable.dev/supabase-integration)

---

## 13. UX STATES

Cada dominio debe diseñarse al menos para:

- loading;
- populated;
- empty;
- error;
- no results;
- locked/gated cuando corresponda;
- selected;
- pressed;
- unavailable;
- offline/temporary failure si el producto lo necesita.

No presentar solo el "happy path".

---

## 14. PERFORMANCE

La calidad visual no debe destruir la performance.

Prioridades:
- imágenes optimizadas;
- lazy loading;
- assets reutilizables;
- capas limitadas;
- motion selectivo;
- evitar efectos pesados innecesarios;
- minimizar re-render;
- controlar listas grandes;
- mantener scroll suave;
- no bloquear interacción por cargas.

Cuando una solución "Tier 1" sea demasiado costosa para el entorno actual, buscar una aproximación perceptual equivalente de menor coste.

---

## 15. IA + ITERACIÓN

No intentar terminar todo de una vez.

### ITERACIÓN A — AUDIT & CONCEPT

Inspeccionar:
- proyecto;
- rutas;
- cinco dominios;
- componentes;
- datos;
- assets;
- restricciones.

Entregar propuesta visual/arquitectónica antes de una reescritura masiva.

### ITERACIÓN B — FOJA

Construir el patrón "living hub" y el design system que lo soporta.

### ITERACIÓN C — BATALLA + CARTAS

Construir Arena y Archivo manteniendo el lenguaje común.

### ITERACIÓN D — FORJA + LEGADO

Construir Deck/Forge y Profile/Legacy.

### ITERACIÓN E — MOTION + POLISH

Parallax, microinteracciones, transiciones, VFX UI, jerarquía y refinamiento.

### ITERACIÓN F — QA

Estados, navegación, performance, responsividad y regresión.

Cada iteración debe partir del código real resultante de la anterior.

---

## 16. CRITERIO DE “TIER 1”

La pantalla no pasa porque sea bonita.

Pasa cuando:

1. La jerarquía es inmediata.
2. El usuario entiende qué puede hacer sin leer un manual.
3. El mundo ficticio está presente en la navegación.
4. La interacción tiene feedback.
5. El motion refuerza el estado.
6. El arte no compite contra la información.
7. La información no destruye la fantasía.
8. La pantalla tiene un foco claro.
9. El producto parece un juego premium, no un panel.
10. Los cinco dominios parecen diferentes entre sí, pero pertenecen al mismo universo.
11. Se siente "digital first" y no como un TCG físico copiado a una app.
12. El usuario quiere tocar elementos aunque no sean necesarios para completar una tarea.
13. Volver al Home tiene significado.
14. Los sistemas secundarios alimentan el loop.
15. La experiencia mantiene rendimiento y claridad.

---

## 17. LO QUE NO SE DEBE HACER

No construir:

- dashboard premium;
- admin panel con fantasy skin;
- sidebar gigante como estructura principal;
- grids sin jerarquía;
- botones con iconos aleatorios;
- exceso de glassmorphism;
- neumorphism;
- "AI startup" style;
- estética casino;
- pantallas repletas de estadísticas;
- motion gratuito;
- popups para todo;
- elementos decorativos sin función;
- interfaces copiadas de otros juegos.

---

## 18. REGLA DE CREATIVIDAD

Cuando la documentación no defina una solución visual concreta, Lovable debe razonar sobre ella.

Elegir la solución que:

- encaje con el lore real;
- reutilice assets reales;
- mejore la comprensión;
- aumente la sensación de juego;
- reduzca fricción;
- sea escalable;
- sea técnicamente viable;
- sea claramente propia de VEXFORGE.

No llenar vacíos con clichés sin analizarlos.

---

## 19. ENTREGABLES

Lovable debe producir, progresivamente:

1. mapa de experiencia de los cinco dominios;
2. arquitectura de navegación;
3. design system;
4. concepto visual de cada dominio;
5. componentes reutilizables;
6. motion behavior;
7. estados UX;
8. pantallas funcionales conectadas a datos reales cuando corresponda;
9. criterios QA;
10. resumen de cambios y riesgos.

---

## 20. PRIMER PROMPT DE EJECUCIÓN

Después de leer el protocolo maestro, leer este ZIP y comprender el proyecto, NO comiences todavía a reemplazar todas las pantallas.

Primero:

**AUDITA → MAPEA → PROPÓN → VALIDAMOS LA DIRECCIÓN → IMPLEMENTA POR DOMINIOS.**

Primera respuesta requerida:

1. Diagnóstico de por qué la arquitectura actual parece administrativa.
2. Mapa de los cinco dominios y su nueva metáfora jugable.
3. Qué elementos actuales se reutilizan.
4. Qué elementos deben eliminarse/reducirse.
5. Propuesta de design system global.
6. Propuesta de motion system.
7. Propuesta de FOJA como primera implementación.
8. Dependencias y riesgos técnicos.
9. Plan por iteraciones.

No reemplaces sistemas de backend por tu cuenta.
No inventes rutas.
No borres funcionalidad existente sin evidencia.
No reduzcas VEXFORGE a una colección de mockups.

**La meta es construir la experiencia de un TCG premium de 2026, con identidad propia de VEXFORGE.**
