# 05 — ANDROID RUNTIME AND BUILD

## Estado canónico

Unity bajo `unity/**` es el único runtime Android activo de VEXFORGE. Expo /
React Native bajo `mobile/**` fue retirado en Hito 10; los snapshots restantes
son evidencia histórica y no compilan un runtime.

No hay workflow de compilación Android configurado actualmente. El único
workflow con nombre Unity fue inspeccionado, resultó ser una compilación Expo y
se retiró en Hito 10. El usuario dejó la configuración de un workflow dedicado
a Unity para una etapa posterior. `verify.yml` es un CI de verificación de
código, no un pipeline de compilación Android.

## Cadena canónica

No existe actualmente una cadena de build Unity operativa. La futura
configuración debe apuntar a `unity/` y verificarse por separado; esta
migración no crea ni ejecuta ese workflow.

La raíz Unity es `unity/`; nunca `/` ni `mobile/`. La versión se obtiene de
`unity/ProjectSettings/ProjectVersion.txt`; en el árbol actual es `6000.3.0f1`.
Los paquetes se leen de `unity/Packages/manifest.json` y
`unity/Packages/packages-lock.json`.

## Control de ejecución

- No hay workflow Android activo.
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

La workflow Expo anterior se retiró de `main` sin lanzar compilación, crear
APK, publicar release, modificar Supabase ni activar Unity Cloud Build. La
configuración futura del workflow Unity sigue pendiente.
