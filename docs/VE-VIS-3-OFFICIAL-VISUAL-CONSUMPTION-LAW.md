# VE-VIS-3 — Ley de consumo visual oficial

## Propósito

Esta unidad convierte la regla **Cero Genéricos** del Protocolo Maestro en un
gate operativo para todo el plan de trabajo. VEXFORGE puede seguir avanzando
cuando falta arte, pero ninguna superficie puede cerrar usando un sustituto que
pretenda representar el arte oficial.

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

## Flujo obligatorio por elemento

### A. El asset ya existe

1. Encontrar su ruta en el manifiesto y comprobar que el objeto existe en
   Storage.
2. Confirmar su rol semántico y la superficie que lo consume.
3. Enlazarlo mediante el registro visual; no pegar una ruta paralela en una
   pantalla.
4. Ejecutar la guarda de manifiesto y documentar el consumidor.

### B. El asset no existe

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
| `VISUAL_COVERED` | Todos los elementos de la unidad cumplen la ley |
| `IMPLEMENTED_UNVERIFIED` | La implementación y el release existen, pero falta QA humana |

El cierre requiere:

- cero consumidores visuales fuera del manifiesto;
- cero filas del manifiesto sin objeto real en Storage;
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
