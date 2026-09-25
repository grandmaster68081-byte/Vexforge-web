# 05 — ANDROID RUNTIME AND BUILD

## Estado canónico

Unity bajo `unity/**` es el único runtime Android activo de VEXFORGE. Expo /
React Native bajo `mobile/**` se conserva como legado, respaldo y referencia
histórica; no recibe trabajo nuevo ni compila el producto activo.

La compilación Android canónica es manual y vive únicamente en:

`.github/workflows/vexforge-unity-android-github.yml`

No se crean workflows alternos para GameCI, CLI directo, fallback, pruebas de
shaders, builds Expo o variantes Android paralelas. `verify.yml` es un CI de
verificación de código, no un pipeline de compilación Android.

## Cadena canónica

```text
workflow_dispatch
→ GitHub Actions
→ Unity Editor leído desde ProjectVersion.txt
→ Unity Personal / Android Build Support
→ VexforgeGitHubBuild.BuildAndroid
→ BuildPipeline
→ Gradle
→ IL2CPP
→ ARM64
→ APK
```

La raíz Unity es `unity/`; nunca `/` ni `mobile/`. La versión se obtiene de
`unity/ProjectSettings/ProjectVersion.txt`; en el árbol actual es `6000.3.0f1`.
Los paquetes se leen de `unity/Packages/manifest.json` y
`unity/Packages/packages-lock.json`.

## Control de ejecución

- El workflow canónico se activa solo con `workflow_dispatch`.
- Los modos permitidos viven dentro de ese workflow: `normal`, `diagnostic`,
  `baseline`, `inventory`, `shard` y `final`.
- Los shards, checkpoints, límites de variantes y diagnóstico son modos del
  mismo workflow, no workflows separados.
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

La configuración canónica quedó establecida en `main` sin lanzar compilación,
crear APK, publicar release, modificar Supabase ni usar Unity Cloud Build.
