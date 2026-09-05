# VEXFORGE — ARQUITECTURA OBJETIVO DE EXPERIENCIA

## Estado observado
Las capturas actuales muestran cinco destinos persistentes en la navegación inferior:
- FOJA
- BATALLA
- CARTAS
- MAZO
- PERFIL

Las capturas también muestran sistemas secundarios: Mundo navegable, Red de Forjadores, Economía, Forja y recursos, Misiones y recompensas, Logros y Sistemas, además de autenticación.

## Nueva lectura de los cinco dominios

### 1) FOJA → HUB / BASE VIVA
Pregunta que debe contestar: "¿Dónde estoy dentro de VEXFORGE y qué puedo hacer ahora?"
Debe mostrar el estado del jugador y el mundo, con hotspots reales hacia las actividades.

### 2) BATALLA → ARENA
Pregunta: "¿Qué voy a disputar ahora?"
Debe priorizar modos, matchmaking, temporada/rango, actividad y acceso al combate.

### 3) CARTAS → ARCHIVO DE VEX / COLECCIÓN
Pregunta: "¿Qué poseo, qué me falta y qué quiero descubrir?"
Debe priorizar cartas y su identidad visual.

### 4) MAZO → LA FORJA
Pregunta: "¿Cómo construyo la herramienta con la que voy a combatir?"
Deckbuilding, validación, sinergia, prueba y guardado deben sentirse como una preparación estratégica.

### 5) PERFIL → LEGADO DEL FORJADOR
Pregunta: "¿Quién soy dentro de este mundo?"
Identidad, rango, estadísticas, progreso, logros, títulos, colección y presencia social.

## Sistemas secundarios como capas, no como islas

- Mundo: se conecta con FOJA y con actividad/progresión.
- Red de Forjadores: se conecta con PERFIL y FOJA; puede mostrar retos, amigos, clanes, actividad y ranking.
- Economía: se conecta con FOJA, FORJA, CARTAS y PROGRESIÓN; no debe parecer una banca administrativa.
- Misiones/Recompensas: se conectan al Journal/actividad de FOJA y al loop.
- Logros: se conecta a PERFIL/Legado y progresión.
- Sistemas/Ajustes/Cuenta: permanecen secundarios y utilitarios.

## Principio de navegación

El jugador no debería preguntarse "¿en qué módulo estoy?".
Debería pensar "¿en qué parte del juego estoy?".

## Loop de alto nivel

ENTRAR A VEXFORGE
→ VER FOJA VIVA
→ DESCUBRIR UNA ACTIVIDAD
→ ELEGIR CARTAS / FORJAR MAZO
→ ENTRAR A ARENA
→ JUGAR
→ GANAR/PERDER/PROGRESAR
→ RECIBIR RECOMPENSA/ACTUALIZAR COLECCIÓN
→ VOLVER A FOJA
→ REPETIR

Toda decisión de arquitectura debe fortalecer este loop.
