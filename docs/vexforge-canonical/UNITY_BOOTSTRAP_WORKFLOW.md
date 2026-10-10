# VEXFORGE — flujo experimental de Unity Bootstrap Android

## Propósito y estado

Este documento describe el método separado que se está probando para llevar
gradualmente todo el juego Unity oficial a una APK completa en un proyecto
hermano. La meta final es que el APK contenga el videojuego completo tal como lo
define el código oficial, no solo una demo ni una base vacía. El proyecto
experimental no sustituye ni modifica el original, y este documento no autoriza
una compilación por sí solo.

El repositorio oficial es `grandmaster68081-byte/Vexforge-web`, rama `main`.
El proyecto de referencia sigue en `unity/`; el proyecto experimental está en
`unity-bootstrap/`.

## Separación obligatoria

| Proyecto | Uso | Identificador Android |
| --- | --- | --- |
| `unity/` | Juego oficial existente; conservarlo intacto durante este método. | `com.vexforge.android` |
| `unity-bootstrap/` | Proyecto experimental acumulativo; se amplía por etapas hasta contener el juego completo. | `com.vexforge.bootstrap` |

- La versión de Unity del bootstrap debe coincidir con
  `unity/ProjectSettings/ProjectVersion.txt`. Actualmente es `6000.3.0f1`.
- `Packages/manifest.json` y `Packages/packages-lock.json` parten de la
  configuración del proyecto oficial. Mantenerlos alineados cuando se cambien
  dependencias.
- Mantener la orientación portrait, resolución de referencia 1080×1920, Android
  min SDK 26, target SDK 35 y los demás ajustes de jugador del original. Las
  diferencias de identidad intencionales son nombre de producto, application ID,
  `metroPackageName` y version code; el ID bootstrap no debe reutilizarse para
  instalar/actualizar el juego oficial. El script de build vuelve a fijar
  Gradle, IL2CPP y ARM64.
- El bootstrap no debe referenciar archivos mediante rutas dentro de `unity/`,
  usar enlaces a sus assets ni compilar el árbol original.
- El builder no crea escenas predeterminadas ni contenido de relleno. Para una
  APK de migración se requiere una escena real del juego oficial, copiada con su
  `.meta`/GUID y su cierre de dependencias a `unity-bootstrap/`. La ausencia de
  escena detiene el build antes de compilar.
- La comprobación automatizada solo verifica que exista el archivo de escena
  configurado; no puede certificar su procedencia oficial ni que el cierre de
  dependencias esté completo. Revisar el origen y el diff contra `unity/` es
  obligatorio antes de aceptar o compilar una porción.
- La APK #2 descrita abajo fue una prueba técnica histórica del workflow; su
  escena predeterminada generada no cuenta como contenido migrado ni como primer
  hito del videojuego.

## Incorporación gradual de contenido

La migración es acumulativa: cada etapa agrega una parte del juego oficial y
conserva todas las partes incorporadas en etapas anteriores. Cada APK debe ser
una compilación completa del estado acumulado, no una APK parcial ni un shard.

Secuencia para cada ampliación autorizada:

1. Revisar la última APK completa y su informe; comprobar que el SHA-256 del APK
   descargado coincide con el informe, y registrar el run, commit, tamaño,
   application ID y estado real de la caché. No llamar “reutilizada” a una caché
   hasta que un run posterior muestre un hit de restauración.
2. Inspeccionar el código y las dependencias oficiales en `unity/`; elegir una
   pieza pequeña, coherente y con un cierre de compilación comprobable.
3. Copiar solo su código, escenas, assets, configuraciones y dependencias
   oficiales necesarias a `unity-bootstrap/`. Conservar los `.meta` y GUID.
   No inventar gameplay, datos, escenas de relleno ni sustitutos aleatorios.
4. Mantener la pieza y todas las anteriores. No copiar el proyecto entero ni
   reemplazar `unity-bootstrap/` por `unity/`; mantener independientes sus
   rutas, identidad y settings de instalación.
5. Revisar dependencias del bootstrap, actualizar manifest y lockfile juntos
   cuando sea necesario, y comprobar que `unity/`, el portal, backend y
   Supabase no cambiaron.
6. Revisar el diff, hacer commit/push a `main` y despachar un solo build manual
   del APK completo que contiene todo el estado acumulado, no un shard ni una
   APK parcial.
7. Verificar resultado, informe y artefacto; comparar el SHA-256 del APK
   descargado con el informe, y registrar si la caché anterior se restauró y si
   la nueva caché se guardó. No continuar tras ningún fallo.
8. Solo después de validar el hito elegir la siguiente pieza oficial y repetir
   hasta cubrir el juego completo.

Mantener la identidad `com.vexforge.bootstrap` para que la APK experimental no
reemplace ni actualice por accidente la app oficial. La identidad diferente no
es permiso para cambiar reglas, contenido o comportamiento del juego. No afirmar
paridad completa hasta comparar el contenido acumulado con todo el alcance de
`unity/` y cerrar las pruebas correspondientes.

Una compilación Android correcta no demuestra que el APK se haya instalado o
probado en un dispositivo. No marcarlo como probado en dispositivo sin esa
prueba independiente.

El primer intento autorizado falló durante `BuildAndroid`, antes de verificar o
subir un APK, y no guardó caché. Se comprobó que a la fase del Editor le faltaba
el directorio aislado de licencia usado por la activación; el workflow ya lo
propaga y conserva el diagnóstico del Editor.

El run #2 (`37904329210`, commit
`301979e500697c8b087b2fc384095bbcfd8003e1`) terminó correctamente el
2026-10-09. Su informe declara Unity `6000.3.0f1`, Android,
`com.vexforge.bootstrap`, IL2CPP/ARM64, APK de 26,293,265 bytes y SHA-256
`c2163741bb6bd547e1a8b960acf4929dacfa922593bd88f1a29e08c2403697e8`; se
descargó el artefacto y el hash calculado coincidió. El artefacto se subió
correctamente. Ese run guardó la primera caché de `unity-bootstrap/Library`,
pero no tuvo una caché previa exitosa que pudiera reutilizar. Aún no hay un run
posterior que pruebe la restauración de esa caché.

El APK #2 fue generado antes de migrar contenido del juego: el builder creó una
escena de Unity con objetos predeterminados porque faltaba la escena del
bootstrap. Por lo tanto acredita el funcionamiento técnico de esa compilación,
pero no acredita una porción del juego oficial ni el método incremental de
contenido. No repetir esa salida como hito de migración.

## Workflow y ejecución

El workflow experimental es
`.github/workflows/vexforge-unity-bootstrap-android.yml`.

- Único disparador: `workflow_dispatch` (manual). No añadir `push`,
  `pull_request`, `schedule` ni disparadores automáticos.
- El job está limitado a `main`.
- El checkout incluye `unity-bootstrap/` y `unity/ProjectSettings` solo para
  comparar la versión. No incluye `unity/Assets`; el workflow verifica que no
  exista en el área de trabajo del build.
- Antes de instalar el Editor, verifica que ambos proyectos indiquen la misma
  versión.
- Instala el Editor fijado y módulos Android; no restaura ni guarda una
  instalación de Unity o Unity Hub.
- La fase del Editor reutiliza el `HOME` y el `UNITY_COMMON_DIR` aislados de la
  activación de licencia. Si Unity falla, el run imprime las últimas 200 líneas
  del log con stack traces completos; revisar ese diagnóstico antes de proponer
  otra corrección.
- El punto de entrada es
  `Vexforge.Bootstrap.Editor.VexforgeBootstrapBuild.BuildAndroid`.
  Construye `unity-bootstrap/Builds/Vexforge-bootstrap.apk` como Android,
  Gradle, IL2CPP y ARM64 con el identificador separado.
- La validación exige que el APK exista y supere 1 MB; registra su SHA-256 y
  datos del build.
- El artefacto de GitHub Actions se llama
  `VEXFORGE-Unity-Bootstrap-APK-<número de ejecución>`, incluye el APK y el
  informe, y se conserva durante 7 días. No se crea un GitHub Release ni se
  publica el APK en una tienda.

## Autorización de la migración incremental

La regla general es obtener autorización explícita antes de cada compilación
Android. Para esta migración concreta, el usuario autorizó continuar sin pedir
una orden nueva por cada etapa, condicionada a que cada APK acumulada anterior
termine correctamente, se valide y se suba. El run #2 cumplió como prueba
técnica inicial; la siguiente etapa debe migrar contenido oficial real y
comprobar la restauración de la caché guardada.

Una vez cumplida esa condición, continuar de forma secuencial: elegir e integrar
una pieza, revisar el diff, hacer commit/push a `main`, despachar manualmente un
solo build completo, verificar APK e informe, y avanzar únicamente después de
un run correcto. No lanzar builds en paralelo ni automatizar el disparador.
Esta autorización termina al completar la migración o si un build falla, falta el
APK/artefacto, aparece un riesgo no resuelto o la siguiente pieza requiere una
decisión de alcance. En esos casos, detenerse e informar; no reintentar un build
fallido sin nueva autorización.

La autorización es solo para el workflow experimental del bootstrap. No autoriza
el workflow oficial del juego, cambios live de Supabase, Unity Cloud Build,
publicaciones/releases ni pruebas en dispositivos.

## Caché

La caché de este método es exclusivamente `unity-bootstrap/Library/`.

- Restaurar antes de abrir el proyecto en el Editor.
- La clave separa sistema operativo, arquitectura, versión de Unity,
  dependencias/configuración y ejecución. Su forma es
  `vexforge-bootstrap-library-<OS>-<ARCH>-<UNITY_VERSION>-<hash(manifest, lock, ProjectSettings)>-<run_id>-<attempt>`;
  el prefijo hasta `<UNITY_VERSION>-` permite recuperar una caché compatible
  anterior del mismo bootstrap.
- Guardar una nueva caché solo después de validar la APK acumulada completa.
- El run #2 guardó la primera caché exitosa. En la siguiente ejecución registrar
  el resultado del paso de restauración; no afirmar reutilización si fue miss.
- No cachear `unity/Library/`, la instalación del Editor, el estado de Unity
  Hub, directorios `HOME`, licencias, tokens, credenciales ni otros directorios
  del runner.
- Las políticas de cuota, caducidad y expulsión de GitHub pueden eliminar una
  caché; una ejecución posterior podría tener que importarla de nuevo.
- Mantener el workflow manual y restringido a `main`. No abrir la caché a builds
  de ramas o pull requests no confiables; la caché del proyecto puede contener
  datos importados de assets que se agreguen en etapas posteriores.

## Credenciales, conectores y servicios

- No usar conectores ni solicitar que se conecten integraciones.
- Los PAT se solicitan y usan mediante Replit Secrets; nunca se escriben en
  archivos, comandos visibles, artefactos, logs o mensajes. `GITHUB_PAT` es
  para operaciones autorizadas con el repositorio. `SUPABASE_PAT` no es
  necesario para este build y no debe usarse para modificar Supabase.
- La activación de Unity usa los GitHub Actions Secrets que referencia el
  workflow: `UNITY_LICENSE` si está configurado; si no, `UNITY_EMAIL` y
  `UNITY_PASSWORD`. No imprimir ni cachear sus valores. No solicitar claves de
  Unity Cloud Build para este método.
- El bootstrap no se conecta a Supabase. No cambiar esquema, datos, auth,
  políticas, funciones ni configuración en vivo.
- Unity Cloud Build / Build Automation no forma parte de este flujo.

## Estados que se pueden afirmar

Registrar solo lo que el run demuestra:

1. **Workflow reconocido**: GitHub muestra el workflow manual.
2. **Build iniciado**: existe un run en la revisión esperada.
3. **APK verificado**: el run terminó correctamente; tamaño y SHA-256 del APK
   descargado coinciden con el informe.
4. **Artefacto subido**: el APK y el informe aparecen en los artefactos del run.
5. **Fuente oficial migrada**: la APK acumulada se construyó desde una escena y
   una porción de código/assets oficiales identificadas; una escena predeterminada
   vacía no cuenta.
6. **Caché reutilizada/guardada**: informar por separado el resultado de
   restauración y el resultado de `actions/cache/save`.
7. **Probado en dispositivo**: solo después de instalar y ejecutar el APK en un
   dispositivo o emulador Android.

El workflow de referencia para el juego oficial está documentado en
[`UNITY_BUILD_OPERATIONS.md`](UNITY_BUILD_OPERATIONS.md). No confundir sus
ejecuciones con las del bootstrap.
