# VEXFORGE — Atlas de assets y selección visual

**Estado:** vigente para la segunda fase del Home  
**Regla:** el Home es la referencia maestra del lenguaje visual TCG de VEXFORGE.

## 1. Dos disposiciones, sin sustituciones silenciosas

### Canon activo

Estos assets ya tienen un consumidor real en Android o forman parte del registro visual compartido. Se mantienen disponibles y no se reemplazan automáticamente; su presencia no obliga a usarlos en cada nueva composición:

| Asset | Superficie | Rol |
|---|---|---|
| `mobile/assets/images/vexforge-home-hero.png` | Home | Ancla de escena |
| `mobile/assets/images/vexforge-hero-sentinel.png` | Home | Personaje/elemento de primer plano |
| `mobile/assets/images/vexforge-feature-card.png` | Home | Carta destacada |
| `mobile/assets/images/auth-reference-scene.png` | Auth | Escena de acceso |
| `mobile/assets/images/battle-reference-scene.png` | Batalla | Escena de combate |
| `mobile/assets/images/collection-archive-scene.jpg` | Colección | Escena oficial de archivo |
| `mobile/assets/images/decks-reference-scene.png` | Mazo | Escena de formación |
| `mobile/assets/images/profile-reference-scene.png` | Perfil | Escena de identidad |
| `OFFICIAL_ASSETS.logo` | Compartido | Marca oficial |
| `OFFICIAL_ASSETS.faction*` | Compartido | Símbolos de facción |
| `OFFICIAL_ASSETS.tutorialHero` | Tutorial | Escena del tutorial |

El canon activo puede recibir fondos, marcos, capas o assets complementarios, pero cualquier sustitución requiere una decisión explícita y una nueva comprobación visual.

### Referencia seleccionable

Estos assets quedan disponibles para selección, comparación, inspiración o referencia de composición. No son obligatorios y no pueden convertirse en fallback automático:

| Asset | Uso permitido |
|---|---|
| `mobile/assets/images/home-reference-scene.png` | Referencia de composición del Home |
| `mobile/assets/images/vexforge-auth-nexus-final.png` | Referencia opcional para futuras composiciones de Auth/Nexus |
| `mobile/assets/images/icon.jpg` | Referencia de estilo heredado; no arte diegético obligatorio |

Un asset de esta lista conserva el estado `AVAILABLE_UNASSIGNED` hasta que una
composición lo seleccione. Sólo pasa a producción después de una decisión
explícita, validación de procedencia y registro en el consumidor real. La
disponibilidad en Storage no equivale a una obligación de consumo.

## 2. Prioridad de selección para nuevas composiciones

La identidad compartida es obligatoria; la elección de archivo es contextual:

1. usar primero una carta real cuando su imagen y datos canónicos expresen el
   momento del juego;
2. elegir un asset oficial registrado cuando resuelva el rol visual;
3. generar una pieza nueva cuando falte o no encaje la pieza necesaria.

Las cartas pueden reutilizarse en distintas composiciones —destacada, dominio,
misión, recompensa, evento o señal del mundo— porque son el núcleo vivo del TCG.
Se reutilizan sus datos reales y no se inventa una variante que contradiga la
fuente canónica.

## 3. Regla de generación para nuevas pantallas

Cada nueva imagen debe derivarse del Home maestro, no de una plantilla genérica. La continuidad visual debe conservar:

- iluminación violeta/ámbar y contraste de escena;
- profundidad por capas: fondo, plano medio, objeto focal y señal HUD;
- geometrías de umbral, sigilos, trazas y marcos propios del Nexus;
- tratamiento de cartas, rarezas, emblemas, poder y recursos;
- escala y dirección de luz coherentes con los assets activos;
- composición de videojuego TCG, no bloques de dashboard;
- motion y estados de interacción que respeten reduced-motion.

La selección de una referencia no obliga a copiarla. Sirve para mantener proporción, atmósfera o lenguaje de forma mientras el arte final se genera de acuerdo con VEXFORGE.

## 4. Cierre de un asset nuevo

Antes de usar un asset nuevo en una pantalla:

1. definir su rol semántico y superficie;
2. comprobar si ya existe un asset oficial que deba conservarse;
3. generar o seleccionar el arte siguiendo el Home maestro;
4. subirlo al Storage oficial cuando corresponda;
5. registrarlo en el manifiesto oficial;
6. conectarlo al consumidor Android real;
7. conservar estado explícito de error si no carga;
8. ejecutar la guarda visual y documentar la decisión en `CONTINUITY.md`.

La biblioteca seleccionable ayuda a crear continuidad; no autoriza a sustituir el canon activo ni a presentar una referencia como arte oficial.