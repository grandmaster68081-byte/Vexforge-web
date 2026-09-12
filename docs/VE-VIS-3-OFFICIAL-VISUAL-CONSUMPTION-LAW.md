# VE-VIS-3 — Ley de consumo visual oficial

## Propósito

Esta unidad convierte la regla **Cero Genéricos** y la identidad compartida del
Protocolo Maestro en un gate operativo para todo el plan de trabajo. VEXFORGE
puede seguir avanzando cuando falta arte, y una superficie puede elegir entre
assets registrados o arte nuevo generado para su composición. Lo obligatorio es
la procedencia del elemento seleccionado y la ausencia de sustitutos que
pretendan representar el arte oficial; no es obligatorio consumir todo archivo
disponible en Storage.

La ley se aplica a:

- web y Android;
- pantallas nuevas y pantallas reabiertas;
- fondos, cartas, facciones, criaturas, objetos, decoraciones y escenarios;
- iconos de acción y navegación;
- efectos, motion, audio y estados de carga/vacío/error cuando formen parte de
  la identidad de la superficie.

## Fuente de autoridad

1. El recurso canónico vive en el bucket público `vexforge-assets` de Supabase.
2. Su inscripción semántica vive en
   `public.vexforge_official_asset_manifest`.
3. El consumidor debe usar el registro visual oficial del cliente:
   `src/lib/assetManifest.ts`, `mobile/constants/visual.ts` o el equivalente
   aprobado para el nuevo cliente.
4. El protocolo maestro activo en `vexforge_official_documents` conserva la
   obligación normativa.

Una URL o archivo no registrado no se considera asset oficial sólo porque
exista físicamente.

## Regla de selección y prioridad

La identidad compartida de VEXFORGE es obligatoria en todas las superficies:
lenguaje de escena, cartas, rarezas, facciones, emblemas, recursos, motion,
estados y navegación deben pertenecer al mismo juego. El consumo de un archivo
concreto es una decisión de composición:

1. Si hay una carta real con imagen y datos canónicos adecuados al momento, es
   la primera opción. Puede reaparecer como carta destacada, entrada de dominio,
   recompensa, contexto de misión, señal del mundo o elemento de navegación
   diegética, sin duplicar ni inventar sus datos.
2. Si existe otro asset registrado que resuelve mejor el rol elegido, se usa a
   través del registro visual oficial.
3. Si el rol necesita una pieza que no existe o no encaja, la IA puede generarla
   siguiendo el DNA visual de VEXFORGE y acoplarla a la composición como una
   pieza nueva. Debe registrar procedencia, rol, consumidor y estado antes del
   cierre.

Los archivos registrados pero todavía no seleccionados son `AVAILABLE_UNASSIGNED`:
se conservan, pueden inspirar o compararse y no se convierten en una obligación
de uso ni en fallback automático.

## Flujo obligatorio por elemento

### A. El asset seleccionado ya existe

1. Encontrar la ruta del asset seleccionado en el manifiesto y comprobar que el objeto existe en
   Storage.
2. Confirmar su rol semántico y la superficie que lo consume.
3. Enlazarlo mediante el registro visual; no pegar una ruta paralela en una
   pantalla.
4. Ejecutar la guarda de manifiesto y documentar el consumidor.

### B. El elemento seleccionado no existe

1. Registrar el elemento como `ASSET_REQUIRED`, con nombre semántico, función,
   superficie, tamaño y estado.
2. Producirlo o generarlo de forma autónoma usando la identidad VEXFORGE y los
   criterios Tier 1. La producción de arte es una pista paralela del mismo
   plan, no permiso para usar un placeholder.
3. Subirlo al bucket oficial `vexforge-assets`.
4. Inscribirlo en `vexforge_official_asset_manifest` con procedencia, rol y
   consumidor.
5. Añadirlo al registro visual del cliente.
6. Consumirlo en la pantalla y comprobar que la ruta real resuelve.

La lógica independiente puede seguir implementándose mientras la pista de arte
avanza. La unidad no se marca completa ni se publica como visualmente cubierta
hasta completar los seis pasos.

### C. El asset existe, pero no fue seleccionado

No se fuerza ningún consumo. El archivo permanece disponible en Storage y en el
manifiesto, con estado `AVAILABLE_UNASSIGNED`, hasta que una decisión de
composición le asigne una superficie y un rol. No se elimina, no se convierte en
fallback y no bloquea por sí solo una unidad.

## Prohibiciones

No se permite usar como representación final de un elemento del mundo:

- una forma CSS o un dibujo temporal que simule el objeto;
- un emoji, carácter Unicode o icono de un set genérico;
- una imagen stock, una URL de demostración o un placeholder visible;
- una copia local no registrada del arte oficial;
- un fallback silencioso hacia otro asset;
- un archivo nuevo en Storage que nunca se inscribió en el manifiesto.

La geometría CSS de paneles, separadores, barras, máscaras y feedback de
interfaz no es arte diegético y puede mantenerse como parte del sistema de UI.

## Estados y gates

Cada unidad mantiene la cobertura visual por elemento:

| Estado | Significado |
| --- | --- |
| `ASSET_REQUIRED` | El elemento está identificado y todavía no existe el recurso |
| `ASSET_IN_PROGRESS` | El recurso está en producción o pendiente de inscripción |
| `ASSET_LINKED` | Existe en Storage, está inscrito y tiene consumidor |
| `AVAILABLE_UNASSIGNED` | Existe y está registrado, pero ninguna composición lo ha seleccionado todavía |
| `VISUAL_COVERED` | Todos los elementos de la unidad cumplen la ley |
| `IMPLEMENTED_UNVERIFIED` | La implementación y el release existen, pero falta QA humana |

El cierre requiere:

- cero consumidores visuales fuera del manifiesto;
- cero assets seleccionados sin objeto real en Storage;
- cero sustitutos genéricos;
- guarda de assets/manifiesto en verde;
- continuidad actualizada con la matriz de cobertura y la evidencia.

La QA humana posterior no se inventa y no bloquea la siguiente unidad elegible,
pero tampoco convierte una unidad no cubierta en `VISUAL_COVERED`,
`OPERATIONAL` o `PASS`.

## Relación con otras leyes

- La **Ley de Transición Android** define dónde se ejecuta primero el plan.
- La **Regla de Continuidad sin Bloqueo por QA Humana** permite continuar cuando
  falta la comprobación del operador.
- La **Directiva de Análisis Integral y Ejecución Autónoma** permite crear el
  arte faltante sin esperar una aprobación técnica intermedia.
- Esta ley define el límite: avanzar sí; sustituir el arte oficial o cerrar sin
  cobertura, no.
