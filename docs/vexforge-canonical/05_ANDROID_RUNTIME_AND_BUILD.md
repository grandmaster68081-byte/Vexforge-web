# 05 — ANDROID RUNTIME AND BUILD

## Estado canónico

Unity bajo `unity/**` es el runtime Android de VEXFORGE.
`.github/workflows/vexforge-unity-android-github.yml` está restaurado como
workflow manual (`workflow_dispatch`). `verify.yml` verifica código y no compila
Android.

## Cadena canónica

La cadena manual de build Unity apunta a `unity/`. Su restauración no la ejecuta.
No se ha iniciado una compilación ni se ha generado un APK/AAB.

La raíz Unity es `unity/`; nunca `/` ni `mobile/`. La versión se obtiene de
`unity/ProjectSettings/ProjectVersion.txt`; en el árbol actual es `6000.3.0f1`.
Los paquetes se leen de `unity/Packages/manifest.json` y
`unity/Packages/packages-lock.json`.

## Control de ejecución

- El workflow Unity solo puede iniciarse manualmente.
- El modo `shard` usa 12 particiones y un máximo de 35.000 variantes por shard.
- Los modos `normal` y `final` son sin filtro y no tienen límite de variantes.
- No se inicia un build sin autorización explícita del propietario.
- No se declara `EDITOR_VERIFIED`, `BUILD_VERIFIED` o `DEVICE_VERIFIED` sin
  evidencia real correspondiente.

## Frontera de secretos

Las credenciales de control usadas por Replit no se copian al repositorio ni se
reenvían automáticamente a GitHub Actions. El workflow usa únicamente los
secretos de GitHub necesarios para activar Unity (`UNITY_LICENSE` o la ruta
Personal con `UNITY_EMAIL` y `UNITY_PASSWORD`). Ningún token, licencia o clave
privada pertenece a este documento, a un commit, a un artifact o a un log.

## Backend

Supabase live, referencia `rscuzqnfccqvltkdcdny`, es la autoridad para datos,
auth, RLS, policies, RPCs, economía, progreso, recompensas y settlement. La
migración del runtime no sustituye Supabase ni crea una autoridad local.

## Estado actual

El workflow manual Unity se restauró desde el historial del repositorio. No se
despachó, no creó APK ni release y no modificó Supabase live.
