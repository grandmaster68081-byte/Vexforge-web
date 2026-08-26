============================================================
VEXFORGE — EXTENSIÓN OFICIAL DEL PROTOCOLO
REFERENTE VISUAL Y DE PRODUCTO: MIGHT & MAGIC FATES TCG
============================================================

FECHA DE INCORPORACIÓN:
2026-08-26

ESTADO:
PROPUESTA DE INVESTIGACIÓN → LISTA PARA INTEGRACIÓN EN EL PROTOCOLO MAESTRO

============================================================
0. PROPÓSITO DE ESTA EXTENSIÓN
============================================================

Esta extensión NO reemplaza, reduce, contradice ni invalida:

- VEXFORGE_PROTOCOL_V2.md
- CONTINUITY.md
- VEXFORGE Master Protocol
- Plan Tier 1 T0-T10
- Fases VE-MOB-*
- ForgeFormation
- criterios Tier 1 existentes
- autoridad de Supabase
- reglas de Android
- reglas de GitHub Releases
- arquitectura backend única

Esta extensión añade una segunda dimensión obligatoria al plan existente:

DIMENSIÓN A
=
FUNCIONALIDAD + SISTEMAS + AUTORIDAD + QA + SEGURIDAD

DIMENSIÓN B
=
IDENTIDAD DE VIDEOJUEGO + DIRECCIÓN DE ARTE + UX DE JUEGO
+ ATMÓSFERA + MOTION + AUDIO + PRESENTACIÓN + POLISH

OBJETIVO:

VEXFORGE no debe limitarse a funcionar.

VEXFORGE debe parecer, sentirse y comportarse como un
videojuego de cartas premium de nivel Tier 1.

La referencia externa principal para esta transformación será:

MIGHT & MAGIC FATES HEROES TCG

Pero la implementación final:

- no debe copiar arte;
- no debe copiar interfaces;
- no debe copiar iconografía;
- no debe copiar layout literalmente;
- no debe copiar personajes;
- no debe copiar textos;
- no debe copiar assets;
- no debe copiar identidad de marca;
- no debe copiar mecánicas salvo que una decisión canónica
  de VEXFORGE las apruebe independientemente.

El benchmark se utiliza para estudiar:

- densidad de fantasía;
- presentación;
- jerarquía visual;
- composición;
- claridad;
- integración entre mundo y UI;
- tratamiento móvil;
- sensación de videojuego;
- feedback;
- presentación del combate;
- presentación de cartas;
- presentación de colección;
- navegación;
- progresión;
- primera impresión.

============================================================
1. CONCLUSIÓN CENTRAL DE LA INVESTIGACIÓN
============================================================

El problema actual que se debe resolver en VEXFORGE no es
principalmente "falta de componentes".

El problema es de PRODUCT EXPERIENCE.

Una superficie puede estar técnicamente completa y seguir
pareciendo:

- dashboard;
- panel administrativo;
- aplicación empresarial;
- gestor de datos;
- maqueta;
- catálogo con botones;
- colección de imágenes;
- aplicación genérica.

La nueva regla de diseño es:

NO DISEÑAR PANTALLAS.
DISEÑAR ESCENAS DEL UNIVERSO VEXFORGE.

Cada superficie móvil debe responder:

1. ¿Dónde está el jugador?
2. ¿Qué está viendo?
3. ¿Qué parte del mundo representa esta pantalla?
4. ¿Cuál es la acción principal?
5. ¿Cuál es la recompensa visual de interactuar?
6. ¿Qué elemento debe captar primero el ojo?
7. ¿Qué elemento debe captar segundo?
8. ¿Qué movimiento comunica que el mundo está vivo?
9. ¿Qué sonido confirma la interacción?
10. ¿Qué arte propio diferencia esta superficie de cualquier
    aplicación genérica?

Si no existe una respuesta clara a estas preguntas,
la superficie no está finalizada.

============================================================
2. PRINCIPIO "GAME FIRST"
============================================================

Nueva regla global:

VEXFORGE debe diseñarse primero como VIDEOJUEGO y después como
aplicación.

La navegación, los botones, las tarjetas, los contadores,
los estados y los paneles deben parecer elementos de un mundo
jugable.

Nunca debe utilizarse:

- UI administrativa como identidad;
- cards HTML genéricas;
- tablas como estructura visual dominante;
- botones sin personalidad;
- paneles blancos/negros genéricos;
- iconos sustituidos por Unicode;
- emojis como iconografía principal;
- placeholders visibles;
- fondos genéricos;
- fotografías stock;
- imágenes sin procedencia;
- animaciones que no correspondan a una acción;
- estados sin contexto narrativo.

============================================================
3. REFERENCIA DE PRODUCTO: QUÉ DEBEMOS APRENDER
============================================================

El referente demuestra varios principios que deben traducirse a
VEXFORGE.

------------------------------------------------------------
3.1 HOME / HUB
------------------------------------------------------------

La pantalla principal de referencia se apoya en:

- fondo de fantasía a gran escala;
- sensación de escenario;
- recursos integrados en la parte superior;
- botón principal de juego;
- accesos secundarios integrados en el mismo universo;
- composición espacial;
- jerarquía clara;
- puntos de interés visual;
- lectura inmediata de "esto es un juego".

VEXFORGE debe adoptar el PRINCIPIO:

HOME = HUB DEL MUNDO

No:

HOME = DASHBOARD

La Home VEXFORGE debe convertirse en una escena.

Ejemplos conceptuales:

- Fortaleza / ciudad de VEXFORGE;
- Forge central;
- horizonte de región;
- portal de regiones;
- Campeón presente;
- estandartes de facción;
- brasas;
- humo;
- niebla;
- partículas ambientales;
- elementos arquitectónicos;
- fondos distintos según contexto.

Debe existir una capa visual:

BACKGROUND
→ MIDGROUND
→ PLAYER FOCUS
→ NAVIGATION
→ PRIMARY ACTION
→ STATUS / RESOURCES

No colocar todos los elementos en una superficie plana.

------------------------------------------------------------
3.2 COLECCIÓN
------------------------------------------------------------

La referencia utiliza una colección visualmente rica,
con cards como protagonistas y controles integrados en el
lenguaje del juego.

VEXFORGE debe llevar COLLECTION a:

CARD LIBRARY / ARMORY

La colección debe tener:

- arte grande;
- rareza visible;
- facción visible;
- región;
- especialización;
- estado de propiedad;
- cantidad;
- estadísticas;
- habilidades;
- lore;
- keywords;
- sistemas;
- supply;
- visual de rareza;
- tratamiento premium;
- filtros;
- búsqueda;
- ordenamiento;
- transición entre vista general y detalle.

Nueva regla:

La carta es el objeto de deseo.

La UI nunca debe dominar el protagonismo de la carta.

La presentación debe comunicar:

"quiero tocar esta carta"

en lugar de:

"quiero abrir este formulario".

------------------------------------------------------------
3.3 CARD INSPECTOR
------------------------------------------------------------

El detalle de carta debe transformarse en una experiencia.

No basta:

nombre
stats
texto
imagen

Debe existir:

- entrada de carta;
- escala;
- animación;
- profundidad;
- iluminación;
- marco de rareza;
- aura según rareza;
- arte en primer plano;
- metadata contextual;
- lore;
- habilidades;
- identidad de facción;
- información de colección;
- estado de propiedad;
- cantidad;
- procedencia cuando corresponda.

Las cartas Mythic deberán tener una presentación
significativamente superior.

============================================================
4. REFERENCIA DE BATTLE UI
============================================================

El combate es el área donde VEXFORGE debe absorber
la mayor cantidad de aprendizaje visual.

La referencia demuestra una idea crítica:

EL TABLERO ES UN LUGAR.

No es solamente:

background-image
+
cards
+
buttons

Debe sentirse como un escenario.

ForgeFormation debe convertirse en:

FORGEFORMATION ARENA

con:

- terreno;
- profundidad;
- iluminación;
- separación espacial;
- capas;
- efectos ambientales;
- presencia física del Campeón;
- Vanguardia;
- Centinela;
- reserva;
- indicadores;
- elementos de amenaza;
- estados;
- movimiento;
- respuesta audiovisual.

============================================================
5. FORGEFORMATION VISUAL — SIN MODIFICAR LAS REGLAS
============================================================

Las reglas canónicas permanecen intactas:

- hasta 30 cartas;
- Campeón;
- dos cartas de apoyo;
- Vanguardia;
- Campeón;
- Centinela;
- reserva;
- protección;
- muerte del Campeón = victoria/derrota;
- Champion Deck Bonus;
- reemplazo mediante reserva;
- autoridad Supabase;
- Battle Run;
- settlement;
- persistencia;
- idempotencia.

La nueva extensión únicamente cambia la
PRESENTACIÓN Y EXPERIENCIA.

------------------------------------------------------------
5.1 CAPAS VISUALES DE COMBATE
------------------------------------------------------------

BACKDROP
↓
REGIÓN / TERRENO
↓
AMBIENTE
↓
EJÉRCITOS
↓
FORMACIÓN
↓
CAMPEÓN
↓
CARTAS
↓
HUD
↓
FEEDBACK
↓
CINEMÁTICA

El terreno debe poder variar por:

- región;
- misión;
- boss;
- raid;
- PvP;
- evento;
- estado especial.

------------------------------------------------------------
5.2 CAMPEÓN
------------------------------------------------------------

El Campeón debe ser visualmente importante.

Debe poder comunicar:

- facción;
- personalidad;
- estado;
- vida;
- protección;
- daño;
- condición;
- habilidades;
- evolución;
- progresión.

Cuando el Campeón:

- recibe daño;
- obtiene protección;
- usa habilidad;
- sube de nivel;
- queda vulnerable;
- muere;

debe existir feedback visible y auditivo.

------------------------------------------------------------
5.3 FORMACIÓN
------------------------------------------------------------

Las posiciones Vanguardia y Centinela deben ser visualmente
reconocibles.

No mediante cajas genéricas.

Debe existir:

- posición física;
- profundidad;
- iluminación;
- orientación;
- silueta;
- efectos de selección;
- highlight;
- conexión con el Campeón;
- feedback al romperse la protección.

------------------------------------------------------------
5.4 RESERVA
------------------------------------------------------------

La reserva no debe parecer una lista.

Debe sentirse como:

"fuerzas esperando entrar en combate".

Puede utilizar:

- rack;
- estantería;
- soporte;
- sigilos;
- cartas parcialmente visibles;
- movimiento;
- luz;
- indicadores de disponibilidad.

La reserva debe tener una identidad visual propia.

============================================================
6. ANIMACIÓN — NUEVA REGLA
============================================================

No añadir animación porque "se vea bonita".

Cada animación debe expresar una acción.

CATEGORÍAS:

A. PRESENCE MOTION
Mantiene vivo el mundo.

Ejemplos:

- humo;
- brasas;
- niebla;
- polvo;
- luz ambiental;
- estandartes;
- partículas;
- movimiento ambiental.

B. INTERACTION MOTION

Ejemplos:

- selección;
- hover/touch;
- drag;
- confirmación;
- equipamiento;
- apertura;
- cierre.

C. COMBAT MOTION

Ejemplos:

- invocación;
- ataque;
- impacto;
- bloqueo;
- escudo;
- daño;
- crítico;
- muerte;
- curación;
- control.

D. REWARD MOTION

Ejemplos:

- loot;
- card reveal;
- chest opening;
- rarity reveal;
- progression;
- level up.

E. NAVIGATION MOTION

Ejemplos:

- transición entre regiones;
- entrada a forge;
- entrada a collection;
- entrada a battle;
- regreso desde battle.

Nueva regla:

REDUCED MOTION debe conservar la información funcional
aunque reduzca el espectáculo.

============================================================
7. AUDIO — SEGUNDO LENGUAJE DE LA INTERFAZ
============================================================

El referente demuestra que la sensación de videojuego no depende
solamente de imágenes.

VEXFORGE debe tratar:

MUSIC
+
SFX
+
UI FEEDBACK
+
COMBAT
+
REGION AMBIENCE

como un sistema.

Debe existir:

- sonido de selección;
- sonido de navegación;
- sonido de carta;
- sonido de rareza;
- sonido de recompensa;
- sonido de Forge;
- sonido de apertura de pack;
- sonido de ataque;
- sonido de daño;
- sonido de escudo;
- sonido de muerte;
- sonido de victoria;
- sonido de derrota;
- sonido de error;
- ambiente regional.

Nunca utilizar sonidos genéricos como identidad final.

============================================================
8. ICONOGRAFÍA
============================================================

Crear un lenguaje iconográfico VEXFORGE propio.

Debe cubrir:

- Poder;
- Afinidad;
- Prestigio;
- Carga;
- Vida;
- Escudo;
- Energía;
- Reserva;
- Reliquia;
- Facción;
- Región;
- Rareza;
- Quest;
- Forge;
- PvE;
- PvP;
- Boss;
- Raid;
- Ranking;
- Clan;
- Mercado;
- Recompensa.

Cada icono debe tener:

- forma;
- peso;
- silueta;
- lenguaje;
- uso;
- estado activo;
- estado disabled;
- estado destacado.

PROHIBIDO:

- Material Icons como identidad principal;
- Feather;
- emojis;
- Unicode;
- iconos sin contexto.

Se pueden utilizar librerías internamente cuando sea necesario
para componentes secundarios, pero nunca deben formar la firma
visual final.

============================================================
9. TIPOGRAFÍA
============================================================

Crear una jerarquía tipográfica VEXFORGE.

Debe diferenciar:

- nombre del juego;
- región;
- Campeón;
- carta;
- rareza;
- estadísticas;
- habilidades;
- lore;
- recursos;
- CTA;
- navegación;
- mensajes del sistema.

No usar una tipografía por pantalla.

La identidad debe permanecer coherente.

Definir:

- display;
- title;
- heading;
- body;
- label;
- stat;
- number;
- caption.

============================================================
10. PALETA Y MATERIALIDAD
============================================================

La referencia utiliza fantasía integrada a materiales y
atmósferas.

VEXFORGE debe reforzar:

- obsidiana;
- acero;
- hierro;
- oro envejecido;
- rojo profundo;
- azul arcano;
- violetas;
- verdes de sombra;
- marrones cuero.

Pero el color no debe ser únicamente decorativo.

Cada color puede tener función:

- Warrior → rojo / hierro;
- Mage → arcano / violeta / azul;
- Paladin → oro / marfil / azul luminoso;
- Rogue → sombra / verde oscuro / plata.

Definir materiales:

- metal;
- piedra;
- cuero;
- cristal;
- runa;
- madera;
- obsidiana;
- pergamino;
- magia.

============================================================
11. FONDOS — CAMBIO DE PRIORIDAD
============================================================

Los fondos dejan de ser secundarios.

Cada superficie importante debe contar con un entorno propio.

REQUERIDOS:

HOME
COLLECTION
CARD DETAIL
DECK BUILDER
BATTLE
TUTORIAL
REWARDS
PROFILE
SHOP
PACK OPENING
WORLD
BOSS
RAID
SOCIAL
CLAN
RANKING
SETTINGS

No todos necesitan un fondo completamente nuevo,
pero ningún fondo debe sentirse arbitrario.

Debe existir:

- composición;
- iluminación;
- profundidad;
- foco;
- atmósfera;
- relación con la función.

============================================================
12. BACKGROUNDS POR REGIÓN
============================================================

Nueva estructura artística:

REGION = VISUAL PACKAGE

Cada región debe poder definir:

- background;
- ambient FX;
- music;
- ambient audio;
- color temperature;
- particle profile;
- UI accent;
- loading screen;
- battle arena;
- boss arena.

Esto prepara VEXFORGE para contenido futuro sin crear una
interfaz completamente nueva cada vez.

============================================================
13. HOME VEXFORGE — NUEVA ARQUITECTURA DE EXPERIENCIA
============================================================

HOME debe dejar de ser un agregador de botones.

Debe tener:

1. escena;
2. jugador;
3. progreso;
4. acción principal;
5. mundo;
6. actividad;
7. colección;
8. recompensa;
9. navegación.

La acción primaria debe ser obvia.

El usuario debe poder responder inmediatamente:

¿qué hago ahora?

La Home debe mostrar:

- progreso;
- misión activa;
- recompensa disponible;
- actividad reciente;
- estado del Campeón;
- evento destacado;
- acceso a Battle;
- acceso a Forge;
- actividad mundial.

No sobrecargar.

La regla será:

MENOS ELEMENTOS
+
MÁS IMPORTANCIA VISUAL.

============================================================
14. NAVIGATION MODEL
============================================================

Inspiración:

No utilizar una barra inferior genérica como única
representación de producto.

La navegación puede ser persistente, pero debe estar integrada
visualmente en el mundo.

Definir:

HOME
CARDS
FORGE
WORLD
SOCIAL
PROFILE

Como grandes dominios.

Los accesos secundarios pueden abrirse desde el dominio
correspondiente.

No crear 15 iconos sin jerarquía.

============================================================
15. COLLECTION / ARMORY
============================================================

Debe incluir:

- búsqueda;
- rareza;
- facción;
- región;
- especialización;
- owned;
- missing;
- cantidad;
- poder;
- afinidad;
- prestigio;
- carga;
- tipos;
- keywords;
- orden;
- favoritos;
- detalle.

Agregar progresivamente:

- progreso por rareza;
- progreso por facción;
- progreso por región;
- progreso del set;
- progreso de colección.

El objetivo es transformar:

"base de datos de cartas"

en:

"arsenal del jugador".

============================================================
16. DECK BUILDER
============================================================

El Deck Builder debe ser una forja.

La composición visual debe comunicar:

- construcción;
- elección;
- poder;
- sinergia;
- preparación.

Debe mostrar:

- Campeón;
- composición;
- formación;
- reserva;
- cartas;
- curva;
- estadísticas;
- sinergias;
- compatibilidad;
- advertencias;
- validación.

Debe existir feedback inmediato.

Ejemplos:

- deck válido;
- deck incompleto;
- carga excedida;
- conflicto;
- sinergia;
- carta recomendada;
- posible counter.

La interfaz no debe convertirse en un panel estadístico.

Las métricas deben estar subordinadas a la fantasía.

============================================================
17. PACKS / REWARDS
============================================================

La apertura de una recompensa debe ser una escena.

No:

BUTTON
→ MODAL
→ LISTA

Sí:

REVEAL
→ FOCO
→ CARD
→ RARITY
→ FX
→ AUDIO
→ RESULTADO
→ COLLECTION UPDATE

Para rarezas superiores:

- cámara;
- luz;
- partículas;
- sonido;
- transición;
- reveal;
- celebración.

Nunca utilizar motion exagerado que perjudique rendimiento.

============================================================
18. SHOP
============================================================

La tienda no debe parecer ecommerce convencional.

Debe parecer:

MERCADO / BÓVEDA / FORGE / CARAVANA

según la identidad elegida.

Debe diferenciar:

- oferta;
- recurso;
- pack;
- bundle;
- cosmetic;
- reward.

La monetización de VEXFORGE debe someterse a:

- claridad;
- auditabilidad;
- justicia competitiva;
- protección del jugador;
- cumplimiento;
- ausencia de manipulación visual.

No importar automáticamente los problemas de monetización
observados en productos benchmark.

============================================================
19. WORLD
============================================================

WORLD debe convertirse en:

MAPA / MUNDO JUGABLE

No:

GRID DE CARDS

Debe permitir:

- regiones;
- nodos;
- misiones;
- bosses;
- raids;
- eventos;
- temporadas;
- lore;
- caminos;
- desbloqueos;
- recompensas.

La navegación debe producir sensación de viaje.

============================================================
20. BOSS / RAID
============================================================

Boss y Raid deben ser superficies de alta intensidad visual.

Requerimientos:

- identidad del boss;
- ambiente propio;
- HP;
- fases;
- amenazas;
- contribución;
- ranking;
- recompensas;
- tiempo;
- estado;
- actividad.

El boss debe sentirse PRESENTE.

No debe parecer:

"BOSS CARD + HP NUMBER".

============================================================
21. TUTORIAL / ONBOARDING
============================================================

El usuario debe entender el juego dentro del mundo.

Tutorial:

START
→ HOME
→ FORGE
→ FORMATION
→ BATTLE
→ RESULT
→ REWARD
→ RETURN

Preferir:

tutorial mediante acción real

sobre:

tutorial mediante grandes bloques de texto.

Cada enseñanza debe ocurrir cuando la acción se necesita.

============================================================
22. FIRST SESSION
============================================================

Objetivo obligatorio:

PRIMER COMBATE Y PRIMERA FORJA < 3 MINUTOS

El flujo debe ser:

0:00
IDENTIDAD

→
0:20
HOME

→
0:40
PRIMERA CARTA / CAMPEÓN

→
1:00
FORMACIÓN

→
1:30
BATALLA

→
2:30
RESULTADO

→
<3:00
RECOMPENSA / FORJA

Debe medirse.

No declararlo por intuición.

============================================================
23. PROFILE
============================================================

Profile debe parecer:

PLAYER HALL / CHAMPION HALL

No:

ACCOUNT SETTINGS PAGE

Mostrar:

- Campeón;
- progreso;
- logros;
- colecciones;
- historial;
- ranking;
- actividad;
- insignias;
- temporada.

Los settings deben ser secundarios.

============================================================
24. SOCIAL
============================================================

Social debe parecer una comunidad del mundo VEXFORGE.

Áreas:

- amigos;
- clanes;
- actividad;
- rankings;
- rivales;
- invitaciones;
- PvP.

Evitar convertirse en "chat app skin".

El componente social debe servir al juego.

============================================================
25. MICROINTERACCIONES
============================================================

Toda acción relevante debe tener respuesta.

Ejemplos:

TOQUE
→ feedback

SELECCIÓN
→ focus

CARTA
→ elevación

ATAQUE
→ anticipación

IMPACTO
→ hit feedback

RECOMPENSA
→ celebración

ERROR
→ feedback contextual

CARGANDO
→ identidad

VACÍO
→ contexto + acción

No se aceptan:

blank screens;
spinners genéricos;
mensajes desnudos;
toasts administrativos.

============================================================
26. ESTADOS VACÍOS
============================================================

Cada empty state necesita:

- arte;
- explicación;
- contexto;
- siguiente acción.

Ejemplo conceptual:

NO CARDS

No:
"No hay resultados."

Sí:

bóveda visual vacía
+
mensaje contextual
+
acción:
"Explorar cartas"

============================================================
27. LOADING
============================================================

Loading debe pertenecer al universo.

Crear:

- loading general;
- battle loading;
- world loading;
- collection loading;
- reward loading.

No utilizar exclusivamente:

"Loading..."

============================================================
28. ERROR STATES
============================================================

Los errores también pertenecen al videojuego.

Pero no deben ocultar información técnica.

Cada error debe poder expresar:

- qué ocurrió;
- si hubo persistencia;
- si el jugador puede reintentar;
- si el resultado ya está asentado;
- qué acción puede realizar.

Para Battle Run:

NETWORK ERROR
↓
RECONNECT
↓
RESUME / RECOVER / FINAL RESULT

Nunca:

ERROR
+
RESET

sin conocer el estado autoritativo.

============================================================
29. ACCESSIBILITY
============================================================

La estética no puede destruir accesibilidad.

Mantener:

- contraste;
- tamaños táctiles;
- lectura;
- reduced motion;
- navegación clara;
- feedback no dependiente solo del color;
- estados distinguibles;
- lenguaje comprensible.

Cada espectacularidad debe tener una versión funcional.

============================================================
30. PERFORMANCE MOBILE
============================================================

El benchmark visual NO justifica sobrecargar Android.

Definir presupuesto:

- 60 FPS objetivo;
- límites de partículas;
- límites de layers;
- atlas;
- precarga;
- lazy loading;
- compresión;
- cache;
- imágenes adaptadas;
- animaciones eficientes;
- memoria controlada.

No cargar todo el universo de VEXFORGE al iniciar.

============================================================
31. LOW-END ANDROID
============================================================

El objetivo Tier 1 debe existir también para dispositivos
inferiores.

Definir perfiles:

QUALITY HIGH
QUALITY MEDIUM
QUALITY LOW

Reducir:

- partículas;
- resolución;
- sombras;
- efectos;
- post-processing.

Sin destruir:

- legibilidad;
- jerarquía;
- identidad;
- gameplay.

============================================================
32. SISTEMA DE ASSETS
============================================================

Crear un Asset Manifest visualmente gobernado.

Cada asset:

ID
TYPE
SCREEN
SOURCE
VERSION
STATE
RARITY
FACTION
REGION
LICENSE
QUALITY
MOBILE_READY

Estados:

CANON
APPROVED
DRAFT
PENDING_SOURCE
BLOCKED
DEPRECATED

Nunca convertir un placeholder en CANON silenciosamente.

============================================================
33. DIRECCIÓN ARTÍSTICA
============================================================

Crear Art Direction Bible VEXFORGE.

Debe definir:

- composición;
- iluminación;
- perspectiva;
- arquitectura;
- personajes;
- criaturas;
- cartas;
- materiales;
- fondos;
- VFX;
- UI;
- iconografía;
- tipografía;
- rareza;
- facciones;
- regiones;
- cinematografía.

Cada nueva pantalla debe ser evaluada contra este documento.

============================================================
34. FIRMA DE VEXFORGE
============================================================

El referente externo debe inspirar el nivel.

Pero VEXFORGE necesita firmas propias.

Propuestas de firma a desarrollar:

1. FORGE
La idea de forjar el poder debe aparecer repetidamente.

2. FORMATION
El combate se expresa mediante geometría de formación.

3. CHAMPION
El Campeón debe funcionar como identidad central.

4. RELICS
Las reliquias deben ser visualmente reconocibles.

5. FACTIONS
Cada facción debe cambiar energía y tratamiento visual.

6. RESERVE
La reserva debe ser una firma mecánica y visual.

7. REGIONS
Cada región debe tener identidad.

8. RARITY
Las rarezas superiores deben sentirse importantes.

9. ARCANE POWER
Debe existir un lenguaje recurrente de energía mágica.

============================================================
35. CINEMATIC UI
============================================================

No convertir VEXFORGE en una interfaz plana.

Usar principios cinematográficos:

- foco;
- profundidad;
- escala;
- entrada;
- salida;
- transición;
- anticipación;
- impacto;
- pausa;
- resolución.

Cada pantalla importante debe tener:

ENTRADA
ESTADO
ACCIÓN
RESPUESTA
SALIDA

============================================================
36. VISUAL HIERARCHY
============================================================

Toda pantalla debe tener:

FOCUS 1
FOCUS 2
FOCUS 3

Nunca permitir que:

- 15 botones;
- 8 badges;
- 6 cards;
- 10 contadores;

compitan simultáneamente.

La regla:

UNA ACCIÓN PRINCIPAL
DOS O TRES ACCIONES SECUNDARIAS
RESTO CONTEXTUAL

============================================================
37. COMPARACIÓN CON FATES
============================================================

La evaluación no será:

"¿VEXFORGE se parece?"

Será:

¿VEXFORGE alcanza o supera el estándar de:

- arte;
- composición;
- integración del mundo;
- claridad;
- densidad visual;
- interacción;
- feedback;
- navegación;
- combate;
- colección;
- primera impresión;
- mobile UX?

Y después:

¿VEXFORGE añade una identidad propia?

============================================================
38. MATRIZ DE BENCHMARK
============================================================

Crear una matriz de comparación Tier 1 con:

REFERENTE PRINCIPAL
Might & Magic Fates

COMPETIDORES DIRECTOS
mínimo 5

ALTERNATIVAS INDIRECTAS
mínimo 2

DIMENSIONES:

- first impression;
- home;
- collection;
- deck building;
- battle;
- card presentation;
- progression;
- rewards;
- world;
- PvE;
- PvP;
- social;
- audio;
- VFX;
- motion;
- onboarding;
- performance;
- accessibility;
- monetization;
- retention;
- content depth;
- differentiation.

Cada dimensión:

VEXFORGE SCORE
BENCHMARK SCORE
GAP
TARGET
EVIDENCE

============================================================
39. NUEVO CRITERIO DE COMPLECIÓN VISUAL
============================================================

Una superficie no se considera Tier 1 simplemente por:

- funcionar;
- compilar;
- consultar Supabase;
- tener datos reales;
- tener navegación.

Debe además cumplir:

FUNCTIONAL
+
VISUAL
+
INTERACTION
+
AUDIO
+
MOTION
+
IDENTITY
+
PERFORMANCE
+
ACCESSIBILITY

============================================================
40. MAPEO A VE-MOB
============================================================

VE-MOB-2-AUTH

Transformar login/registro en una puerta al universo.

VE-MOB-3-HOME

Prioridad máxima de transformación visual.

Objetivo:
HUB DEL MUNDO.

VE-MOB-4-COLLECTION

Transformar en ARMORY / CARD LIBRARY.

VE-MOB-5-DECK

Transformar en FORGE / DECK CHAMBER.

VE-MOB-6-TUTORIAL

Convertir en onboarding jugable.

VE-MOB-7-BATTLE

Máxima prioridad visual.

Transformar en FORGEFORMATION ARENA.

VE-MOB-8-REWARDS

Transformar en reward chamber / loot flow.

VE-MOB-9-PROFILE

Transformar en Champion Hall.

VE-MOB-10-PACKS-SHOP

Transformar en market / forge economy.

VE-MOB-11-ECONOMY

Mantener rigor financiero y darle presentación de mundo.

VE-MOB-12-WORLD

Transformar en mundo navegable.

VE-MOB-13-SOCIAL

Transformar en comunidad del mundo.

VE-MOB-14-META

Mantener settings funcionales, pero sin permitir que
dominen visualmente la identidad del producto.

VE-MOB-15-ADMIN

No forzar dentro del lenguaje de jugador.
Mantener separado si continúa fuera del Android player client.

============================================================
41. MAPEO A T0-T10
============================================================

T0
RECONCILIACIÓN VISUAL Y OPERATIVA

Añadir:

- inventario visual;
- inventario de assets;
- estado de cada superficie;
- gap visual;
- evidencia;
- benchmark state.

T1
BATTLE RUN

Añadir:

- estados visuales de Battle Run;
- recuperación visual;
- reconnect;
- resultado;
- settlement;
- timeout;
- idempotencia visible.

T2
FORGEFORMATION

MÁXIMA PRIORIDAD.

Añadir:

- arena;
- Campeón;
- formación;
- reserva;
- VFX;
- motion;
- audio;
- damage feedback;
- shield feedback;
- death feedback;
- turn HUD;
- camera direction.

T3
VERTICAL SLICE PVE

El slice debe incluir:

HOME
→ WORLD
→ MISSION
→ BRIEFING
→ FORMATION
→ BATTLE
→ RESULT
→ REWARD
→ PROGRESSION

con calidad visual consistente.

T4
PVE COMPLETO

Añadir:

- escenarios;
- regiones;
- nodos;
- misiones;
- bosses;
- eventos;
- recompensas;
- narrativa visual.

T5
WORLD BOSS / RAID

Crear identidad artística y ambiental específica.

T6
PVP

Crear:

- arena competitiva;
- identidad de rival;
- matchup presentation;
- victory;
- defeat;
- leaderboard.

T7
CARDS / COLLECTION / DEPTH

Aplicar el nuevo estándar de:

- card art;
- collection;
- card inspector;
- deck builder;
- rarity;
- factions;
- synergies.

T8
AUDIOVISUAL TIER 1

Se convierte en una fase central:

- music;
- SFX;
- VFX;
- camera;
- motion;
- environments;
- reward reveals;
- faction identity;
- rarity identity;
- boss identity.

T9
ONBOARDING

Aplicar:

tutorial mediante gameplay;
narrativa integrada;
first-session;
reward teaching;
world introduction.

T10
LAUNCH GATE

Añadir:

VISUAL QA
MOTION QA
AUDIO QA
ASSET QA
DEVICE QA
FRAME RATE QA
FIRST IMPRESSION QA
BENCHMARK QA

============================================================
42. MAPEO A CRITERIOS TIER 1
============================================================

art_direction_quality

DEBE medir:

- composición;
- jerarquía;
- iluminación;
- materiales;
- dirección artística;
- consistencia;
- calidad de assets.

design_uniqueness

DEBE demostrar:

- firma de VEXFORGE;
- forja;
- formación;
- Campeón;
- facciones;
- relics;
- reserva;
- regiones.

first_impression

DEBE medir:

- 5 segundos;
- 15 segundos;
- 30 segundos;
- primera acción;
- deseo de continuar.

finish_quality

DEBE verificar:

- zero visible placeholders;
- zero generic icons;
- zero dead routes;
- zero unfinished states;
- zero unexplained controls.

first_session_flow

DEBE medir:

primer combate < 3 min.

content_quality

DEBE medir:

- variedad;
- profundidad;
- counterplay;
- identidad;
- propósito.

benchmark_definition

DEBE incorporar:

Might & Magic Fates
+
4 competidores directos adicionales
+
2 alternativas indirectas.

benchmark_positioning

Debe responder:

¿Por qué VEXFORGE existe si el jugador ya puede jugar otros
TCG?

competitive_integrity

No aceptar:

pay-to-win;
result manipulation;
client authority;
unclear settlement.

evidence_reproducibility

Cada score visual debe tener:

- screenshot;
- device;
- build;
- surface;
- fecha;
- reviewer;
- evidencia.

============================================================
43. NUEVO SISTEMA DE DESIGN QA
============================================================

Crear una revisión por superficie:

PASS A — FUNCTIONAL

PASS B — DATA

PASS C — VISUAL

PASS D — MOTION

PASS E — AUDIO

PASS F — MOBILE

PASS G — ACCESSIBILITY

PASS H — PERFORMANCE

PASS I — IDENTITY

PASS J — BENCHMARK

Solo después:

SURFACE = TIER1_READY

============================================================
44. RUBRICA VISUAL
============================================================

Cada superficie será evaluada 0-5:

0 = inexistente
1 = funcional
2 = coherente
3 = identidad propia
4 = premium
5 = Tier 1

DIMENSIONES:

- composition;
- art;
- hierarchy;
- identity;
- interaction;
- motion;
- audio;
- atmosphere;
- clarity;
- polish.

Target:

>= 4 en superficies principales

y

>= 3.5 en superficies secundarias

antes de declarar finalización global.

============================================================
45. SUPERFICIES PRINCIPALES
============================================================

Las siguientes requieren revisión Tier 1 obligatoria:

HOME
COLLECTION
CARD DETAIL
DECK FORGE
TUTORIAL
BATTLE
RESULT
REWARDS
WORLD
BOSS
RAID
SHOP
PROFILE

Ninguna puede seguir pareciendo una plantilla.

============================================================
46. ORDEN DE IMPLEMENTACIÓN VISUAL
============================================================

PRIORIDAD 1

HOME
BATTLE
COLLECTION
CARD DETAIL

PRIORIDAD 2

DECK FORGE
REWARDS
WORLD

PRIORIDAD 3

BOSS
RAID
PROFILE
SHOP

PRIORIDAD 4

SOCIAL
META
SECONDARY STATES

============================================================
47. VERTICAL SLICE VISUAL PRIORITARIO
============================================================

Crear primero un vertical slice de máxima calidad:

HOME
↓
CHAMPION
↓
COLLECTION
↓
CARD DETAIL
↓
DECK/FORGE
↓
FORMATION
↓
BATTLE
↓
RESULT
↓
REWARD
↓
HOME

El objetivo es comprobar la identidad transversal.

No crear diez pantallas mediocres antes de demostrar
que una experiencia completa funciona.

============================================================
48. DEFINICIÓN DE ÉXITO DEL VERTICAL SLICE
============================================================

Un reviewer debe poder abrir la aplicación y decir:

"Esto es un videojuego."

antes de decir:

"Esto es una aplicación."

Debe ser posible identificar VEXFORGE sin mostrar el nombre.

Debe reconocerse por:

- color;
- composición;
- iconografía;
- carta;
- Campeón;
- Forge;
- motion;
- audio;
- efectos.

============================================================
49. REGLA CONTRA LA COPIA
============================================================

Cada elemento tomado del benchmark debe clasificarse como:

A. PRINCIPIO UX

Ejemplo:
"usar una escena completa como home".

PERMITIDO.

B. PATRÓN DE JUEGO

Ejemplo:
"hero como foco del combate".

PERMITIDO como referencia conceptual.

C. IDENTIDAD VISUAL

Ejemplo:
forma concreta del logo, iconos o marco de Fates.

NO COPIAR.

D. ASSET

NO COPIAR.

E. COMPOSICIÓN LITERAL

NO COPIAR.

F. MECÁNICA ESPECÍFICA

Solo incorporar mediante diseño canónico separado de VEXFORGE.

============================================================
50. NUEVA LEY DE REFERENTES
============================================================

REFERENT = ESTÁNDAR

REFERENT ≠ PLANTILLA

VEXFORGE debe superar el referente donde:

- profundidad;
- identidad;
- narrativa;
- PvE;
- ForgeFormation;
- mundo;
- progresión;
- economía justa;
- autoridad backend;
- transparencia;
- evidencia QA.

============================================================
51. ANTI-MOCKUP GATE
============================================================

Antes de aprobar una pantalla preguntar:

1. ¿Podría pertenecer a cualquier app?
2. ¿Podría cambiarse la imagen sin afectar su identidad?
3. ¿Parece una pantalla de administración?
4. ¿Los controles parecen botones estándar?
5. ¿Hay suficiente profundidad visual?
6. ¿Hay una composición?
7. ¿Existe una escena?
8. ¿Existe contexto de juego?
9. ¿Existe feedback?
10. ¿Existe personalidad?

Si la mayoría de respuestas son negativas:

NO APROBAR.

============================================================
52. ANTI-EMPTY-SCREEN GATE
============================================================

Una pantalla no puede depender únicamente de:

- cards;
- listas;
- botones;
- estadísticas.

Debe existir:

SCENE
+
OBJECT
+
ACTION
+
FEEDBACK

============================================================
53. MOBILE-FIRST GAME PRESENTATION
============================================================

La aplicación Android debe diseñarse desde:

TOUCH
PORTRAIT/LANDSCAPE SEGÚN SUPERFICIE
SMALL SCREEN
THUMB REACH
READABILITY
FPS
MEMORY

Los elementos críticos deben estar:

- visibles;
- accesibles;
- separados;
- táctiles;
- jerarquizados.

El espectáculo nunca debe bloquear el input.

============================================================
54. NUEVA ARQUITECTURA DE DESIGN SYSTEM
============================================================

Crear:

VEXFORGE_GAME_UI_SYSTEM

con:

TOKENS
- color;
- spacing;
- typography;
- elevation;
- materials;
- radius;
- glow;
- motion;
- duration.

COMPONENTS
- GameButton;
- GamePanel;
- GameCard;
- GameBadge;
- Stat;
- RarityFrame;
- FactionBadge;
- HeroHeader;
- RewardReveal;
- BattleHUD;
- FormationSlot;
- ReserveRack;
- RegionNode;
- QuestCard.

SCENE COMPONENTS
- WorldBackdrop;
- AmbientLayer;
- HeroScene;
- ForgeScene;
- BattleArena;
- RewardChamber.

============================================================
55. REFACTORIZACIÓN VISUAL POR CAPAS
============================================================

No reescribir toda la aplicación de una vez.

Orden:

1. DESIGN TOKENS
2. ICONOGRAPHY
3. TYPOGRAPHY
4. BACKGROUND SYSTEM
5. CARD SYSTEM
6. BUTTON SYSTEM
7. PANELS
8. MOTION
9. AUDIO
10. SCENE COMPOSITION
11. SCREEN-BY-SCREEN REBUILD

Esto permite iteraciones reversibles.

============================================================
56. SUPABASE — SIN DUPLICAR AUTORIDAD
============================================================

Esta extensión visual no autoriza:

- mocks;
- datos inventados;
- lógica local autoritativa;
- settlement local;
- economía local.

Los sistemas visuales deben consumir datos reales.

La presentación puede tener estado local,
pero nunca convertirse en autoridad del juego.

============================================================
57. TELEMETRÍA VISUAL
============================================================

Registrar eventos cuando sea útil:

screen_enter
screen_exit
card_inspect
deck_open
formation_open
battle_start
battle_action
battle_result
reward_open
reward_claim
shop_open
world_node_open
boss_open

Para medir:

- tiempo;
- abandono;
- interacción;
- primera acción;
- conversión interna;
- errores;
- rendimiento.

============================================================
58. OBSERVACIÓN SOBRE EL REFERENTE
============================================================

Might & Magic Fates debe tratarse simultáneamente como:

BENCHMARK DE PRESENTACIÓN

y

CASO DE ESTUDIO DE LO QUE NO DEBEMOS REPETIR.

La investigación actual muestra que el producto puede conseguir:

- buena sensación visual;
- arte atractivo;
- UX móvil intuitiva;
- combate claro;
- identidad de fantasía;

pero también presenta críticas de usuarios relacionadas con:

- repetición;
- contenido limitado;
- problemas técnicos;
- progresión;
- monetización;
- sensación de producto incompleto.

Por tanto:

VEXFORGE debe tomar:

PRESENTATION
+
ACCESSIBILITY
+
GAME FEEL
+
VISUAL INTEGRATION

pero evitar:

CONTENT SHALLOWNESS
+
TECHNICAL INSTABILITY
+
MONETIZATION DISTRUST
+
INCOMPLETE SURFACES

============================================================
59. NUEVA VISIÓN TIER 1
============================================================

La definición ampliada de Tier 1 para VEXFORGE será:

TIER 1
=
SISTEMAS CORRECTOS
+
DATOS REALES
+
COMBATE AUTORITATIVO
+
CONTENIDO PROFUNDO
+
IDENTIDAD PROPIA
+
DIRECCIÓN ARTÍSTICA PREMIUM
+
UX DE VIDEOJUEGO
+
MOTION
+
AUDIO
+
ATMÓSFERA
+
PERFORMANCE
+
ACCESSIBILITY
+
COMPETITIVE INTEGRITY
+
EVIDENCE

============================================================
60. ORDEN DE EJECUCIÓN DEFINITIVO
============================================================

FASE A
RECONCILE

→ main
→ Supabase
→ CONTINUITY
→ Android
→ assets
→ current surfaces

FASE B
BENCHMARK

→ Fates
→ 5 direct competitors
→ 2 indirect competitors

FASE C
DESIGN BIBLE

→ palette
→ typography
→ iconography
→ materials
→ scenes
→ motion
→ audio

FASE D
VERTICAL SLICE

→ Home
→ Collection
→ Card
→ Forge
→ Formation
→ Battle
→ Result
→ Reward

FASE E
MOBILE SYSTEM

→ performance
→ touch
→ responsive
→ reduced motion
→ loading
→ error
→ accessibility

FASE F
EXPANSION

→ World
→ PvE
→ Boss
→ Raid
→ PvP
→ Social
→ Shop
→ Profile

FASE G
POLISH

→ art
→ animation
→ sound
→ VFX
→ transitions
→ micro-interactions

FASE H
BENCHMARK QA

→ compare
→ score
→ identify gaps
→ improve
→ repeat

FASE I
LAUNCH GATE

→ functional
→ security
→ data
→ QA
→ performance
→ visual
→ device
→ evidence

============================================================
61. CRITERIO FINAL DE APROBACIÓN
============================================================

NO DECLARAR TIER 1 SI:

- funciona pero parece dashboard;
- tiene arte pero no tiene identidad;
- tiene identidad pero no tiene feedback;
- tiene motion pero afecta rendimiento;
- tiene fondos pero parecen decorativos;
- tiene cartas pero parecen imágenes;
- tiene battle pero parece UI;
- tiene contenido pero no tiene profundidad;
- compila pero falla en dispositivo;
- funciona offline visualmente pero no representa el
  estado autoritativo;
- existe una pantalla sin tratamiento de loading/error/empty;
- existe placeholder visible;
- existe iconografía genérica;
- existe ruta muerta;
- existe acción sin feedback.

============================================================
62. DEFINICIÓN DE LA EXPERIENCIA OBJETIVO
============================================================

Cuando el jugador abra VEXFORGE:

NO DEBE SENTIR:

"Estoy entrando a una aplicación."

DEBE SENTIR:

"Estoy entrando a un mundo."

Cuando abra COLLECTION:

NO:

"Voy a consultar mis registros."

SÍ:

"Voy a revisar mi arsenal."

Cuando abra DECK:

NO:

"Voy a editar una lista."

SÍ:

"Voy a forjar mi formación."

Cuando abra BATTLE:

NO:

"Voy a ejecutar una función."

SÍ:

"Estoy entrando al campo de batalla."

Cuando reciba una recompensa:

NO:

"Se actualizó mi inventario."

SÍ:

"Acabo de conseguir algo."

============================================================
63. RESULTADO ESPERADO
============================================================

Al completar esta extensión junto al protocolo existente,
VEXFORGE deberá alcanzar una evolución cualitativa:

ANTES

MAQUETA
→ UI
→ DATOS
→ FUNCIONALIDAD

OBJETIVO

MUNDO
→ IDENTIDAD
→ JUGADOR
→ CAMPEÓN
→ FORJA
→ FORMACIÓN
→ BATALLA
→ PROGRESIÓN
→ COLECCIÓN
→ REGIONES
→ ECONOMÍA
→ COMPETENCIA

Todo lo anterior seguirá soportado por:

Supabase como única autoridad.

============================================================
64. INTEGRACIÓN CON EL PROTOCOLO MAESTRO
============================================================

Esta extensión debe considerarse una:

TIER 1 EXPERIENCE LAYER

sobre el plan T0-T10 existente.

NO crear un plan paralelo.

Cada tarea deberá vincularse a:

- T0-T10;
- VE-MOB-*;
- Tier 1 criterion;
- surface;
- asset;
- evidence.

Ejemplo:

VE-MOB-7-BATTLE
+
T2
+
T8
+
art_direction_quality
+
design_uniqueness
+
finish_quality
+
performance_budget
+
stability_error_budget

Esto evita que la transformación visual se convierta en
una colección de tareas aisladas.

============================================================
65. REGLA DE CIERRE
============================================================

El objetivo no es construir una copia de Might & Magic Fates.

El objetivo es que el benchmark obligue a VEXFORGE a alcanzar
un nivel de PRESENTACIÓN DE VIDEOJUEGO comparable o superior,
mientras conserva:

- su propia identidad;
- ForgeFormation;
- Campeón;
- Reserva;
- Reliquias;
- facciones;
- regiones;
- economía;
- narrativa;
- progresión;
- arquitectura;
- Supabase;
- autoridad;
- integridad competitiva.

RESULTADO FINAL:

VEXFORGE debe ser reconocible como VEXFORGE
en menos de una captura.

Debe sentirse como un videojuego antes de sentirse como una app.

Debe tener una primera impresión premium.

Debe tener un mundo.

Debe tener personalidad.

Debe tener vida.

Debe tener profundidad.

Y cada elemento visual debe tener una razón dentro del juego.

============================================================
66. STATUS DE ESTA EXTENSIÓN
============================================================

INVESTIGATION COMPLETE

VISUAL BENCHMARK IDENTIFIED

PRODUCT PRINCIPLES EXTRACTED

RISKS IDENTIFIED

MOBILE UX REQUIREMENTS IDENTIFIED

ANDROID PRIORITIES IDENTIFIED

T0-T10 MAPPING DEFINED

VE-MOB MAPPING DEFINED

TIER 1 CRITERIA MAPPING DEFINED

IMPLEMENTATION:
PENDING PROTOCOL INTEGRATION

NO CODE
NO SUPABASE
NO GITHUB
NO RELEASE
NO WORKFLOW
NO CONTINUITY CHANGE

hasta que esta extensión sea integrada formalmente
y una nueva fase de implementación sea autorizada.
============================================================