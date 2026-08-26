# VEXFORGE — PROTOCOLO ACTIVO V2

> La versión canónica viva de este protocolo se mantiene en Supabase como `vexforge_master_protocol_v2`; este archivo debe permanecer sincronizado tras cada cambio permanente.

> Esta es la referencia operativa activa. El material histórico de planes y gates anteriores no debe usarse para decidir el trabajo actual.
> El historial de Git se conserva para auditoría, pero los archivos históricos retirados no son instrucciones vigentes.

VEXFORGE — PROTOCOLO UNIVERSAL DE INICIO, CONTINUIDAD Y EJECUCIÓN

PROYECTO
- Proyecto: VEXFORGE
- Repositorio oficial: https://github.com/grandmaster68081-byte/Vexforge-web.git
- Supabase oficial: https://rscuzqnfccqvltkdcdny.supabase.co
- Producto oficial ACTIVO: aplicación Android (`mobile/`, Expo 54 / React Native 0.81, expo-router).
- Canal de entrega oficial de la app: GitHub Releases del repo (`vexforge-android-build-N` → `app-release.apk`), generado por `.github/workflows/vexforge-android-apk.yml` al hacer push a `main` con cambios en `mobile/**`.
- Deploy web: https://vexforge-web.pages.dev (referencia viva y espejo de mantenimiento; ya no es el producto prioritario).
- Fuentes canónicas principales:
  - vexforge_master_protocol_v2
  - vexforge_forge_formation_engine_v1
  - documentos oficiales de la unidad activa
  - CONTINUITY.md
  - código real, Supabase vivo, release APK vigente y deploy actualizado

0. LEY DE TRANSICIÓN: ENTORNO ACTIVO = APLICACIÓN ANDROID

Decisión del operador (2026-08-25): el producto VEXFORGE migra de la web a la
aplicación Android. Esta ley gobierna todo el trabajo desde su registro.

1. Entorno activo: el código de producto vive en `mobile/` del repositorio
   oficial (Expo 54 / React Native 0.81, expo-router, TypeScript). Toda unidad
   nueva de producto se implementa ahí.
2. La web (`src/`) queda en mantenimiento: es la fuente de verdad de la
   funcionalidad, flujos, textos, diseño y datos ya construidos. No se abren
   unidades nuevas exclusivas de web salvo corrección crítica.
3. Orden de trabajo obligatorio:
   a. FASE PORT (prioritaria): vaciar todo lo construido en la web hacia la
      app — superficies, flujos, datos reales de Supabase, assets del
      manifiesto oficial, audio, motion y estados (carga/vacío/error) —,
      pulirla y compilarla a APK. Cada superficie o flujo portado es una
      unidad `VE-MOB-*` con criterios de aceptación y evidencia propios. El
      inventario oficial del port es `docs/VE-MOB-0-PORT-INVENTORY.md`.
   b. FASE CONTINUIDAD: completado el port, continuar el plan del protocolo
      (fases Tier 1 y criterios de `public.vexforge_visual_tier1_objective`)
      reinterpretado sobre la app.
4. Unidades web pendientes (p. ej. `VE-VIS-6-GAME-LOOP-TELEMETRY`) se
   reevalúan: si el criterio aplica al producto, se implementa en la app; la
   instrumentación web existente se conserva mientras la web siga publicada.
5. Backend único: la app consume el mismo Supabase oficial, las mismas RPCs,
   RLS y datos autoritativos. Prohibido duplicar o reimplementar lógica
   autoritativa en el cliente móvil; la app es capa de presentación y
   consumo, igual que la web.
6. Ciclo de entrega de la app: push a `main` con cambios en `mobile/**`
   dispara el workflow `vexforge-android-apk.yml`, que compila
   `assembleRelease`, verifica que el APK contiene `assets/index.android.bundle`
   y publica el release `vexforge-android-build-N` con `app-release.apk`.
   El operador descarga e instala ese APK para ver los cambios. No existe
   ningún otro canal de entrega autorizado (ni EAS, ni builds manuales, ni
   Metro en producción).
7. Verificación de build Android (sustituye al `build-manifest.json` web como
   evidencia de publicación de la app): run del workflow en success, release
   publicado con tag correlativo, APK con bundle JS embebido y firma v2. El
   commit del run debe corresponder al commit auditado de `main`.
8. QA de unidades móviles: el recorrido sobre el APK del release que
   corresponde al commit queda a cargo del operador, en dispositivo físico o
   emulador. La IA no bloquea la entrega por falta de esa sesión: tras el
   workflow exitoso entrega el enlace del APK y registra la unidad como
   `IMPLEMENTED_UNVERIFIED` hasta que el operador aporte su resultado. Nunca
   se declara `OPERATIONAL` sólo por compilar.
9. Regla de no regresión web: la transición no debe romper el build web
   (`npm run verify:build`) ni las guardas (`npm run verify:all`); ambos
   siguen siendo gates de todo push a `main`.

1. ACCESO SEGURO OBLIGATORIO

Antes de leer, modificar o ejecutar trabajo externo:

1. Usa directamente los secretos seguros ya proporcionados:
   - GITHUB_PAT
   - SUPABASE_PAT
2. No propongas conectores si los secretos directos están disponibles.
3. Nunca muestres, imprimas, pegues, guardes, registres ni incluyas credenciales en:
   - chat
   - comandos visibles
   - URLs
   - logs
   - archivos
   - commits
   - capturas
   - respuestas
4. Usa GITHUB_PAT para leer, comparar y operar sobre el repositorio oficial cuando sea necesario.
5. Usa SUPABASE_PAT para consultar Supabase Management API y las fuentes canónicas vivas.
6. La disponibilidad de un secreto no demuestra que el acceso esté validado. Comprueba cada transporte con su autenticación nativa:
   - GitHub API: HTTPS con el esquema de autorización documentado por la API.
   - Git smart HTTP (`clone`, `fetch`, `push`, `ls-remote`): HTTPS con Basic y usuario `x-access-token`; nunca incrustes el PAT en una URL.
   - Supabase Management API: HTTPS con el esquema de autorización documentado por Supabase.
7. Si un acceso falla, no clasifiques primero la credencial como inválida. Antes diagnostica, sin exponer secretos:
   - confirma que el secreto existe en el entorno seguro;
   - confirma endpoint, HTTPS, host, repositorio, branch y esquema de autorización;
   - reintenta una vez con el transporte nativo correcto;
   - separa error de transporte, formato, alcance, expiración, revocación y permisos.
8. GitHub es una dependencia de autoridad, no una tarea opcional. No elijas unidad, audites el código ni implementes cambios basados en otra copia mientras el acceso a `main` no esté validado. Si el segundo intento nativo falla, marca `BLOCKED`, registra la causa técnica general y detén el trabajo dependiente del código.
9. Si falta una credencial, sesión o dependencia esencial, marca `BLOCKED` y no continúes con trabajo dependiente de ella. Sólo puedes hacer trabajo independiente expresamente permitido por la fuente canónica.
10. Una prueba autenticada debe buscar primero la sesión normal de la cuenta QA canónica designada en las fuentes vivas. Si esa cuenta existe, no declares `BLOCKED` por ausencia de QA sin comprobarla; si no hay sesión utilizable, bloquea sólo la prueba autenticada, no el trabajo seguro restante.
11. Nunca uses service_role ni privilegios administrativos para suplantar jugadores, fabricar QA o falsear resultados.

2. ORDEN DE AUTORIDAD

Determina la verdad en este orden:

1. Código real del repositorio oficial en main.
2. Esquema, tablas, datos, RPCs, RLS, triggers y Storage vivos de Supabase.
3. vexforge_master_protocol_v2.
4. vexforge_forge_formation_engine_v1.
5. Documentos oficiales de la unidad activa.
6. CONTINUITY.md.
7. Historiales y conversaciones anteriores, sólo como referencia.

Si hay contradicciones:

- Registra la diferencia.
- Usa la fuente de mayor autoridad.
- No trabajes con recuerdos, capturas antiguas ni suposiciones.
- No confundas un plan con una implementación real.

3. LECTURA Y ANÁLISIS INICIAL

Antes de modificar o ejecutar cualquier cosa:

- Lee completos el Protocolo Maestro, el plan activo, los documentos de la unidad y CONTINUITY.md.
- Revisa la estructura real del repositorio, package.json, rutas, componentes, servicios, assets, audio, Storage y configuración de despliegue.
- Revisa el entorno móvil: `mobile/package.json`, `mobile/app/` (rutas expo-router), `mobile/components/`, `mobile/lib/`, el workflow `vexforge-android-apk.yml` y el último release `vexforge-android-build-N` publicado.
- Comprueba el estado actual de main, Supabase, el último release APK y Cloudflare Pages.
- Compara el código del repositorio con el bundle publicado.
- Ejecuta el build automático desde la raíz del repositorio (`npm run verify:build`).
- La única salida de producción válida es `dist/` generado desde el `package.json` y
  `vite.config.ts` de la raíz; no se aceptan copias anidadas, bundles históricos ni
  artefactos precompilados como sustitutos del build actual.
- Comprueba qué está implementado, qué está pendiente y qué está realmente operativo.
- No repitas trabajo ya realizado.
- Si no se indica una unidad, elige la prioridad oficial más pequeña, reversible y verificable.

4. CLASIFICACIÓN DE LA SESIÓN

Clasifica cada sesión como:

DOCUMENTACIÓN, AUDITORÍA, IMPLEMENTACIÓN, QA, REFINAMIENTO, BLOQUEO o INVESTIGACIÓN.

Usa una verificación proporcional al riesgo. Nunca declares PASS, GO u
OPERATIONAL sin evidencia real. `IMPLEMENTED_UNVERIFIED` es el cierre válido
de implementación y entrega cuando la QA funcional queda pendiente del
operador.

5. UNIDAD DE TRABAJO

Toda sesión debe tener una unidad identificable, por ejemplo:

VE-CARD, VE-ROUTE, VE-TUTORIAL, VE-CINE, VE-AUDIO, VE-ASSET, VE-SYSTEM, VE-LORE, VE-UI o una unidad oficial equivalente.

Registra:

- ID y tipo de unidad.
- Fuente canónica.
- Estado inicial y estado actual.
- Nivel Q actual y objetivo.
- Problema y objetivo de experiencia.
- Archivos, datos, RPCs y assets afectados.
- Procedencia, licencia y versiones.
- Responsive, accesibilidad, focus, reduced motion y rendimiento.
- Criterios de aceptación y evidencia.
- Deuda, bloqueos y condición de reapertura.
- Siguiente acción verificable.

Estados permitidos:

NOT_STARTED, DRAFT, IN_PROGRESS, BLOCKED, PENDING_SOURCE, IMPLEMENTED_UNVERIFIED, OPERATIONAL, CANDIDATE_FOR_REVIEW, REFINED y DEFERRED.

No existen los estados PERFECTO, FINAL o NO_MEJORABLE.

`PENDING_SOURCE` sólo puede aparecer durante una investigación intermedia. No es un
estado de cierre: antes de terminar la sesión debe resolverse, convertirse en
`OPERATIONAL`, `CANDIDATE_FOR_REVIEW`, `REFINED`, `DEFERRED` o `BLOCKED` con una
causa real y verificable.

6. REGLA DE CERO GENÉRICOS

VEXFORGE no debe usar como identidad final:

- Emojis o símbolos Unicode como sustitutos visuales.
- Iconos genéricos o del sistema.
- Placeholders, arte de stock o fondos intercambiables.
- Sonidos, voces o animaciones genéricas.
- Efectos sin relación con el contexto.
- Componentes que parezcan plantillas incompletas.
- Recursos que no pertenezcan al lenguaje propio de VEXFORGE.

Si falta un recurso propio:

- No lo sustituyas silenciosamente.
- Marca PENDING_SOURCE, DRAFT o BLOCKED.
- Registra el recurso faltante, su fuente esperada, brief o prompt, dependencia y siguiente paso.

Nunca conviertas una propuesta creativa en canon.

7. CARTAS, ASSETS Y AUDIO

Cada carta o asset importante debe conservar:

- Identidad canónica y fuente.
- Diagnóstico del recurso actual.
- Prompt y negative prompt, si fue generado.
- Variantes consideradas y versión seleccionada.
- Procedencia, licencia, hash y consumidores.
- Nombre estable, formato, dimensiones y peso.
- Responsive, accesibilidad, reduced motion y rendimiento.
- Deuda restante y condición de reapertura.

No sustituyas imágenes automáticamente sin diagnóstico. Conserva versiones anteriores y posibilidad de volver atrás.

Revisa cada carta en las superficies donde se use:

lista, colección, inspector, detalle, selección, reveal, pack, invocación, idle, ataque, habilidad, daño, muerte, victoria, derrota, lore, recompensas y móvil.

Cada voz o sonido necesita:

- Identidad.
- Procedencia, versión y licencia.
- Consumidores y mezcla.
- Prioridad, subtítulos y controles.
- Fallback y soporte de reduced motion/accesibilidad.

No inventes líneas de voz sin texto autorizado.

Los assets oficiales deben obtenerse del manifiesto y Storage de Supabase. No inventes recursos cuando la fuente canónica exista.

8. TUTORIAL, UI Y CINEMÁTICAS

El tutorial debe usar la interfaz y el flujo real del juego. Cada paso debe registrar:

- Objetivo.
- Precondición.
- Acción concreta.
- Interfaz visible.
- Feedback.
- Error y recuperación.
- Skip y replay.
- Accesibilidad.
- Reduced motion.
- Salida o condición de finalización.

La IA puede controlar presentación, cámara, efectos, audio, timeline, transiciones y replay, pero no puede alterar resultados autoritativos.

Cada cinemática debe registrar:

- Fuente y evento.
- Entrada y datos recibidos.
- Resultado presentado.
- Duración, skip y replay.
- Refresh, timeout y reconexión.
- Assets y audio utilizados.
- Accesibilidad, reduced motion y rendimiento.

9. NIVELES DE CALIDAD

- Q0: fuentes y contrato verificados.
- Q1: legible y comprensible.
- Q2: coherente con VEXFORGE.
- Q3: identidad propia y diferenciación contextual.
- Q4: pulido premium.
- Q5: calidad Tier 1 documentada, responsive, accesible y eficiente.

En cada sesión registra nivel actual, objetivo, evidencia, impacto, riesgo, prioridad y brecha de mayor valor.

10. CICLO UNIVERSAL

BASELINE → CONTEXT MAP → CREATE → INTEGRATE → VERIFY →
COMPARE → REGISTER DEBT → REOPEN WHEN JUSTIFIED → REFINE → REPEAT

Trabaja en lotes pequeños, independientes y verificables.

Antes de escalar, valida un vertical slice completo:

INICIO → HOME → CARTAS → DETALLE → SELECCIÓN → TUTORIAL →
FORMACIÓN → INVOCACIÓN → ATAQUE → RESULTADO → RECOMPENSA

11. AUDITORÍA VISUAL Y FUNCIONAL

Comprueba que no existan fugas entre:

- Imagen, animación, audio, voz, personalidad y lore.
- Tutorial e interfaz real.
- Interfaz y datos reales.
- Escritorio, tablet y móvil.
- Estados visuales y estados reales.
- Efectos y claridad.
- Recursos generados y procedencia.
- Recompensas y datos oficiales.
- UI y resultados autoritativos.
- Código de main, build local y bundle de Cloudflare.

Una contradicción, recurso genérico, texto inventado, efecto confuso, asset sin procedencia o interfaz que no representa el estado real impide cerrar la unidad.

12. SEGURIDAD DEL JUEGO Y QA

La capa visual puede controlar:

- Presentación.
- Cámara.
- Timeline.
- Audio.
- Partículas.
- Transiciones.
- Replay.
- Feedback.

No puede controlar por sí sola:

- Victoria o derrota.
- Daño o settlement.
- Recompensas, economía o energía.
- Evolución.
- Estado de cuenta.
- RLS, RPCs o datos autoritativos.

Una respuesta HTTP 200 no demuestra que una función autenticada funciona.

Si no existe una sesión normal autorizada del jugador o owner:

- Marca la prueba como BLOCKED.
- No uses service_role para sustituirla.
- No fabriques battle runs, settlements, recompensas ni resultados.
- No declares PASS ni GO.
- Registra la ruta, caso, evidencia faltante y condición para reabrir.

### Entrega posterior al deploy y QA a cargo del operador

Después de publicar una unidad en `main`, la IA debe esperar el workflow
oficial correspondiente, comprobar que el artefacto público coincide con el
commit y entregar al operador la ruta de descarga. La IA no crea ni recupera
sesiones QA, no recorre el APK y no bloquea la entrega por falta de esa
verificación.

1. Para unidades Android, confirma `success` en
   `vexforge-android-apk.yml`, el release correlativo
   `vexforge-android-build-N`, `app-release.apk`, el bundle JS embebido y la
   firma v2.
2. Registra en `CONTINUITY.md` el commit, run, release, enlace de descarga,
   verificaciones ejecutadas, estado `IMPLEMENTED_UNVERIFIED`, deuda y
   condición de reapertura.
3. El operador realiza la QA funcional sobre el APK entregado. Puede informar
   una aprobación o un hallazgo; sus hallazgos reabren la unidad y se registran
   en continuidad.
4. `OPERATIONAL`, `PASS` y `GO` siguen reservados para evidencia funcional
   real aportada por el operador. La ausencia de esa evidencia ya no bloquea
   el cierre de implementación ni la entrega del APK.

La QA del operador no autoriza fabricar sesiones, resultados de combate,
settlements, recompensas, economía o estados de cuenta. Nunca se usa
`service_role` para sustituirla.

13. COMPROBACIÓN DE GITHUB, RELEASES APK Y CLOUDFLARE

Cuando sea relevante:

- Comprueba acceso al repositorio oficial mediante GITHUB_PAT.
- Verifica branch, commit, estado limpio y diferencias reales.
- Ejecuta build y comprobaciones proporcionales (`npm run typecheck` en raíz y en `mobile/` cuando la unidad toque la app).
- Para unidades de app: comprueba que el push a `main` disparó el workflow `vexforge-android-apk.yml`, que el run terminó en success sobre el commit auditado, que el release `vexforge-android-build-N` publicó `app-release.apk` y que la guarda del workflow confirmó el bundle JS embebido. El cierre de una unidad de app exige esa cadena; un run fallido o ausente deja la unidad `IMPLEMENTED_UNVERIFIED`.
- Nunca compiles ni publiques APKs por canales manuales o paralelos (EAS Build, Gradle local con publicación, releases creados a mano): el único canal autorizado es el workflow oficial sobre `main`.
- Compara los assets y bundles locales con los servidos por Cloudflare Pages.
- Comprueba HTTP 200 en las rutas relevantes.
- Verifica que el deploy público corresponde al commit que se está auditando.
- No confundas un deploy anterior con el estado actual de main.
- El build automático de Pages debe generar desde la raíz el `dist/` del commit de
  `main`; la aplicación expone `dist/build-manifest.json` con el commit fuente.
- Compara `build-manifest.json`, el `index.html` y los hashes de los assets públicos
  con el commit auditado. Un bundle público anterior demuestra una discrepancia en la
  cadena fuente/build y debe corregirse en GitHub en la misma sesión; no se atribuye
  automáticamente a Cloudflare ni se deja como `PENDING_SOURCE`.
- El push a main, la propagación automática de Cloudflare y la verificación pública son
  pasos obligatorios al cierre de cada unidad de trabajo completada. Si la evidencia
  pública no coincide, la unidad no está cerrada y se corrige la causa fuente/build.
- Esta obligación de publicación automática no requiere autorización adicional del usuario: forma parte del cierre normal de toda unidad completada.
- La única publicación prohibida es la manual o paralela (por ejemplo, Wrangler, una réplica o un canal distinto del vínculo oficial entre main y Cloudflare Pages).

14. LEY DE EJECUCIÓN AUTÓNOMA CONTEXTUAL

Cuando el acceso seguro, el contexto canónico y el objetivo general de la sesión
están establecidos, la IA entra en ejecución autónoma de trabajo. No debe detenerse
para pedir la selección de la siguiente unidad, autorización de rutina, recomendaciones
intermedias ni confirmaciones que no cambien el riesgo o el alcance. Al cerrar una
unidad, elige y comienza automáticamente la siguiente unidad elegible, reversible y
verificable, manteniendo el ciclo del protocolo hasta agotar el trabajo seguro disponible.

La autonomía se aplica también cuando falta un recurso no autoritativo. La ausencia de
un icono, imagen, sonido, animación u otro elemento visual no es motivo para detener
la sesión. En ese caso, la IA debe:

1. Comprender primero el producto, el deploy visible, la superficie donde se usará, el
   lenguaje visual existente, el contexto de la unidad y las fuentes canónicas.
2. Determinar si el recurso ya existe en el código, el manifiesto, Storage, los documentos
   oficiales o el bundle público, sin suponer ni reutilizar un recurso genérico.
3. Si no existe, redactar el brief creativo, prompt y negative prompt adecuados al contexto,
   generar un candidato propio compatible y conservar su procedencia, versión, hash,
   dimensiones, consumidores y condiciones de uso.
4. Integrarlo en la superficie correcta sin alterar metadata canónica, nombres, lore,
   estadísticas, fórmulas, balances, resultados autoritativos, economía, seguridad o
   historial. Si la fuente oficial aún no lo canoniza, marcarlo como DRAFT o
   PENDING_SOURCE y continuar con el trabajo seguro de presentación, documentación y
   verificación; nunca convertir la propuesta en canon silenciosamente.
5. Verificar el encaje en escritorio, tablet y móvil, accesibilidad, foco, reduced motion,
   rendimiento y coherencia con las demás superficies antes de cerrar la unidad.

Un bloqueo de una unidad no detiene el trabajo completo: se registra con evidencia real,
se preserva la posibilidad de reapertura y se encadena la siguiente unidad segura. Esta
ley no autoriza exponer secretos, fabricar sesiones o resultados autenticados, suplantar
jugadores, falsear QA, destruir historial, saltarse RLS/RPCs, modificar datos
autoritativos sin fuente, ni realizar una publicación o acción irreversible fuera del
flujo autorizado por este protocolo.

15. CIERRE OBLIGATORIO

Al terminar una sesión:

- Describe exactamente lo modificado.
- Registra estado inicial, estado nuevo y nivel Q.
- Registra comandos o verificaciones realizadas y su evidencia.
- Registra bloqueos, deuda restante y riesgos.
- Define condición de reapertura y siguiente paso.
- Actualiza CONTINUITY.md.
- Actualiza el plan activo si cambió el estado real.
- Actualiza el Protocolo Maestro sólo si cambió una regla permanente.
- Ejecuta la verificación proporcional al riesgo.
- Crea un commit descriptivo sólo si hubo cambios reales.
- Publica en main al cerrar cada unidad completada, siguiendo el flujo de verificación descrito aquí.
- Deja que el deploy automático se ejecute y comprueba que el manifiesto público y los
  assets reflejan el commit auditado; no existe un paso de deploy manual.
- Después de esa propagación, entrega al operador el enlace del artefacto
  público correspondiente al commit auditado y registra la unidad como
  `IMPLEMENTED_UNVERIFIED` hasta recibir su QA funcional. La ausencia de esa
  sesión no bloquea la entrega ni exige que la IA fabrique o recupere una
  sesión; los hallazgos del operador reabren la unidad.
- No borres historial.
- No declares verificado lo que no fue comprobado.

16. REGLA FINAL

No inventes nada fuera de las fuentes oficiales.
No reinicies trabajo terminado.
No confundas operativo con perfecto.
No confundas una mejora visual con lógica del juego.
No confundas una prueba anónima con una autenticada.
No expongas secretos.
No trabajes fuera del contexto oficial.
No propongas conectores cuando ya existan credenciales seguras autorizadas.

Empieza siempre leyendo, analizando y reconciliando todas las fuentes; después elige una unidad concreta y continúa hasta completar, bloquear justificadamente o dejar registrada la siguiente acción verificable.

Tu primer paso es pedirme las credenciales de Supabase PAT y GitHub pat , una vez conectado a todo el entorno de trabajo empezarás a ejecutar las órdenes del protocolo dentro de Supabase

Está prohibido trabajar en cualquier entorno local oh fuera de los entornos de trabajo q indico yo , todo cambio debería quedar actualizado en la raíz del proyecto y en la continuidad

No te detengas para mostrarme ninguna auditoría, solo déjalo como fuente de información para ti , tu apenas analices todo empieza con el trabajo, sin detenerte hasta terminar , después al final actualizas lo q hiciste en el deploy siguiendo el flujo q tenemos y actualiza la continuidad
## 25. OBJETIVO FINAL: JUEGO TIER 1 DEL GENERO (VE-VIS-2)

La fuente autoritativa del objetivo final NO es este documento: son dos tablas del
proyecto Supabase, de lectura publica, que toda IA debe consultar antes de elegir trabajo.

- `public.vexforge_tier1_phases` — hoja de ruta en 6 fases (arte y manifiesto, identidad y
  layout, vida de la interfaz, bucle medido y primera sesion, profundidad competitiva y
  live-ops, acabado Tier 1). Se ejecutan en orden ascendente.
- `public.vexforge_visual_tier1_objective` — criterios medibles. Cada fila declara
  `criterion_key`, `area`, `objective`, `measure_source`, `target_value`, `current_value`,
  `status`, `blocking`, `phase` y `owning_unit`.

Leyes:

1. La siguiente unidad de trabajo se elige por la fase abierta mas baja y, dentro de ella,
   por el criterio con `blocking = true` que no este en `MET`.
2. Ningun criterio pasa a `MET` sin evidencia reproducible: guarda encadenada en
   `verify:all` o recorrido de navegador sobre el deploy vivo.
3. Los cambios de estado del plan se hacen por migracion SQL, nunca a mano.
4. Tier 1 solo puede declararse cuando ningun criterio con `blocking = true` esta fuera de
   `MET`; la decision se registra en `public.vexforge_project_decisions`.

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

No declarar Tier 1, `OPERATIONAL` ni una superficie terminada sólo porque compile o funcione. Deben existir evidencia, gates aplicables, estado Q, deuda, condición de reapertura y continuidad actualizada. Una superficie `OPERATIONAL`, `REFINED` o `Q5` puede reabrirse cuando cambie el contexto o aparezca una brecha demostrable.

La extensión queda integrada formalmente como directiva permanente. La siguiente implementación se seleccionará mediante la regla ya vigente de fase abierta más baja y criterio bloqueante, después del preflight exigido por la Ley Diaria de Contexto Completo.
