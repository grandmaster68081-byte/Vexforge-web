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
- El primer estado es deliberadamente mínimo: el script crea una escena nueva
  con los objetos predeterminados de Unity si todavía no existe. No copia
  escenas, gameplay, arte ni datos del juego oficial.

## Incorporación gradual de contenido

La migración es acumulativa: cada etapa agrega una parte del juego oficial y
conserva todas las partes incorporadas en etapas anteriores. Cada APK debe ser
una compilación completa del estado acumulado, no una APK parcial ni un shard.

Cuando se autorice ampliar el proyecto:

1. Inspeccionar el código y dependencias actuales en `unity/`; elegir una pieza
   pequeña, coherente y necesaria para acercar el bootstrap al juego completo.
2. Copiar al bootstrap solo los scripts, assets, escenas, configuraciones y
   dependencias que esa pieza requiera. Conservar los `.meta` y GUID asociados.
3. Integrar la pieza sin eliminar lo ya incorporado. No copiar el proyecto
   completo ni reemplazar la carpeta `unity-bootstrap/` por `unity/`.
4. Actualizar dependencias del bootstrap únicamente cuando la pieza las
   necesite; revisar el manifest y lockfile juntos.
5. Comprobar que `unity/`, el portal, el backend y Supabase no cambiaron.
6. Compilar una APK completa del estado acumulado mediante su workflow manual,
   validar el resultado y registrar los paths fuente/destino, dependencias,
   revisión, run, artefacto, estado de caché y pruebas pendientes.
7. Solo después de revisar ese resultado, seleccionar la siguiente pieza. Repetir
   hasta cubrir código, escenas, assets y sistemas necesarios para el juego
   completo.

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
propaga y conserva el diagnóstico del Editor. No afirmar que el método funciona
hasta que un run posterior valide y suba el APK.

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

Antes de cada nueva compilación, obtener autorización explícita para esa
ejecución. La autorización para el primer build no es permiso permanente y no
autoriza el workflow del juego oficial. Si falla un build, inspeccionar el run
y corregir el problema; no volver a despacharlo ni ejecutar el workflow oficial
sin autorización.

## Caché

La caché de este método es exclusivamente `unity-bootstrap/Library/`.

- Restaurar antes de abrir el proyecto en el Editor.
- La clave separa sistema operativo, arquitectura, versión de Unity,
  dependencias/configuración y ejecución. Su forma es
  `vexforge-bootstrap-library-<OS>-<ARCH>-<UNITY_VERSION>-<hash(manifest, lock, ProjectSettings)>-<run_id>-<attempt>`;
  el prefijo hasta `<UNITY_VERSION>-` permite recuperar una caché compatible
  anterior del mismo bootstrap.
- Guardar una nueva caché solo después de que el APK pase su validación.
- El primer build normalmente no tendrá una caché previa: la prepara para una
  ejecución futura autorizada.
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
3. **APK verificado**: el run terminó correctamente y pasó existencia, tamaño y
   SHA-256.
4. **Artefacto subido**: el APK y el informe aparecen en los artefactos del run.
5. **Caché guardada**: el paso de `actions/cache/save` terminó correctamente.
6. **Probado en dispositivo**: solo después de instalar y ejecutar el APK en un
   dispositivo o emulador Android.

El workflow de referencia para el juego oficial está documentado en
[`UNITY_BUILD_OPERATIONS.md`](UNITY_BUILD_OPERATIONS.md). No confundir sus
ejecuciones con las del bootstrap.
