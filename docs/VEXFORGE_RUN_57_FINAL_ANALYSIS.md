# VEXFORGE — análisis del run final 57

Fecha del análisis: 2026-09-28
Repositorio: grandmaster68081-byte/Vexforge-web
Workflow: .github/workflows/vexforge-unity-android-github.yml

## Estado observado

- El run 57 (ID 36374943964) terminó como "cancelled", no como un fallo de compilación reportado por Unity.
- Comenzó a las 03:45:11 UTC y terminó a las 09:45:45 UTC; alcanzó prácticamente el límite de seis horas.
- La restauración del checkpoint terminó correctamente: descarga en 45 s y materialización en 40 s.
- La operación canónica de Unity permaneció ejecutándose 21.098 s (5 h 51 min) y fue cancelada.
- Al cancelarse esa operación, no se ejecutaron la verificación del APK, la validación de reutilización, la creación de checkpoint ni la publicación del release.

Referencia: https://github.com/grandmaster68081-byte/Vexforge-web/actions/runs/36374943964

## Comparación con el shard anterior

El run 56 (ID `36357166233`) completó correctamente en modo `shard` para el
rango 9166–10000. Su operación canónica tardó 15.022 s (4 h 10 min) y registró
`ShaderCache` de 7.747.006.008 bytes y `PlayerDataCache` de 472.814.214 bytes.
Subió el checkpoint de artefacto `10950033326` con un tamaño comprimido de
2.521.775.127 bytes y pasó la validación de reutilización.

Referencia: https://github.com/grandmaster68081-byte/Vexforge-web/actions/runs/36357166233

El run 57 consumió explícitamente ese run y ese artefacto. El log confirma la
descarga, la comprobación SHA-256 de los archivos del manifiesto y la
materialización del checkpoint. No fue un fallo de descarga/restauración: la
operación completa de Unity continuó 21.098 s y se canceló cerca del límite de
seis horas, antes de verificar/subir un APK válido. Los artefactos de checkpoint
se conservaban 7 días; los de estos runs ya expiraron y no aparecen en la lista
actual de artefactos.

## Diagnóstico técnico

1. El workflow actual acepta un solo par checkpoint_run_id + checkpoint_artifact_id. El run final, por tanto, solo puede descargar un checkpoint; no puede unir automáticamente checkpoints de shards que se ejecutaron de forma independiente.
2. El checkpoint actual contiene Library/ShaderCache y Library/PlayerDataCache. No conserva de forma explícita otros caches de Unity que pueden afectar el tiempo del build Android, como Library/Artifacts, Library/Bee o Library/Il2cppBuildCache cuando existen.
3. El build final llama a VexforgeGitHubBuild.BuildAndroid con el filtro de shaders deshabilitado. Los shards sirven como calentamiento de caché, pero no sustituyen la compilación completa ni convierten el APK final en una unión de APKs.
4. La restauración sí funcionó mecánicamente; el problema es que el contenido restaurado no redujo suficientemente el trabajo de la operación final.

## Patch preparado pero no aplicado

Se preparó un cambio para el workflow canónico que:

- añade la entrada independent_checkpoint_sources con pares run_id:artifact_id;
- descarga y valida cada checkpoint con GITHUB_TOKEN;
- verifica el workflow_run, el nombre del artefacto, unity_tree_sha y cache-manifest.sha256;
- une los ShaderCache y manifiestos de shards independientes;
- conserva el PlayerDataCache del checkpoint base validado, evitando mezclarlo a ciegas;
- incluye en futuros checkpoints Library/Artifacts, Library/Bee e Library/Il2cppBuildCache solo cuando existan;
- mantiene un único workflow canónico y no inicia ninguna compilación automáticamente.

GitHub rechazó dos veces la escritura de .github/workflows/vexforge-unity-android-github.yml con HTTP 403, incluso después de reautorizar la conexión. El patch no está aplicado y no se creó ningún commit de workflow.

## Credenciales

La consulta de secretos del repositorio mostró estos nombres: UNITY_ALF, UNITY_EMAIL, UNITY_PASSWORD y VEXFORGE_SUPABASE_SERVICE_ROLE_KEY. GITHUB_PAT no apareció en esa lista. No se leyó ni se expuso ningún valor secreto.

Para el workflow, la PAT no es necesaria para operaciones dentro del mismo repositorio: el workflow ya utiliza GITHUB_TOKEN con permisos de Actions y contents. La PAT sería necesaria solo para una operación que requiera permisos externos o una escritura desde una identidad distinta.

## Siguiente bloqueo

La conexión de GitHub permite leer el repositorio y los runs, pero no escribir el archivo dentro de .github/workflows/. El patch necesita aplicarse con una identidad que tenga permiso de administración de workflows; después debe revisarse en main antes de lanzar cualquier run.
