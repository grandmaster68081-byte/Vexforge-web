# 05 — ANDROID RUNTIME AND BUILD

## Estado canónico

Unity bajo `unity/**` es el único proyecto Android de VEXFORGE. El Bootstrap
completo fue promovido a esta ruta el 11 de octubre de 2026. El workflow manual
`.github/workflows/vexforge-unity-android-github.yml` usa el builder promovido.
`verify.yml` verifica código web y no compila Android.

## Cadena canónica

La cadena manual apunta a `unity/`. La promoción no ejecutó una compilación ni
generó un APK/AAB; los APKs Bootstrap históricos no verifican el nuevo estado
oficial.

La raíz Unity es `unity/`; nunca `/` ni `mobile/`. La versión se obtiene de
`unity/ProjectSettings/ProjectVersion.txt`; en el árbol actual es `6000.3.0f1`.
Los paquetes se leen de `unity/Packages/manifest.json` y
`unity/Packages/packages-lock.json`.

## Control de ejecución

- El workflow Unity solo puede iniciarse manualmente.
- Solo queda el workflow manual Android del proyecto oficial; ya no hay modos
  `shard`, `normal` o `final` en el pipeline actual.
- No se inicia un build sin autorización explícita y vigente del propietario.
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

El workflow actual se adaptó al proyecto Unity promovido. No se despachó después
de la promoción, no creó un APK/release y no modificó Supabase live.
