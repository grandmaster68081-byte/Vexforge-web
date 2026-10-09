# VEXFORGE — CONTEXTO ACTUAL

## Dirección canónica

**Unity bajo `unity/**` sigue siendo el runtime Android oficial del videojuego.**
Existe además `unity-bootstrap/**`, un proyecto experimental, mínimo y aislado
que se ampliará en incrementos acumulativos hasta incluir el juego completo
según el código oficial. Cada APK compila el estado completo acumulado. No es
permiso para modificar `unity/**`, que sigue siendo la fuente de referencia, ni
para reemplazar el juego oficial. El portal oficial está en `src/**` y `public/**`.
Mantener esos árboles y `unity/**` sin cambios durante tareas de limpieza o
trabajo en el bootstrap.

La autoridad para continuar es, en este orden:

1. Supabase live para contratos, datos, permisos y autoridad backend.
2. Código actual de `main` para comportamiento implementado.
3. Este archivo, `replit.md` y `docs/vexforge-canonical/` para dirección
   operativa.
4. El workflow manual de GitHub Actions para compilaciones Unity autorizadas.

## Límites de alcance

- Unity es el runtime del juego; no añadir un runtime cliente paralelo.
- `unity-bootstrap/**` es la única excepción de build experimental: empieza
  vacío y solo se amplía con copias parciales, acumulativas y autorizadas del
  código oficial hasta completar el juego. No sustituye el juego oficial.
- Supabase conserva autoridad sobre autenticación, ownership, combate,
  settlement, recompensas y economía. La presentación móvil no calcula esos
  resultados.
- No cambiar contratos ni datos live de Supabase. Mantener `src/**` y
  `public/**` sin cambios durante las tareas de limpieza.
- No se encontraron assets, paquetes ni IDs importados de Epic/Fab. La ruta
  Epic/Fab queda retirada; no adquirir ni importar esos recursos en este
  trabajo. La rareza de cartas `epic` pertenece al juego y se conserva.

## Estado observado

- Unity declara el editor `6000.3.0f1` y el identificador Android
  `com.vexforge.android`; la Foundation ya contiene autenticación, estado,
  repositorio REST/RPC y presentación, pero sigue sin verificación en el Editor
  y dispositivo.
- `SecureSessionStore` implementa Android Keystore + AES/GCM en código; todavía
  requiere validación en el Editor/dispositivo antes de declarar la sesión
  verificada.
- El workflow manual de Unity está restaurado en
  `.github/workflows/vexforge-unity-android-github.yml`; no se ha ejecutado.
- El workflow experimental
  `.github/workflows/vexforge-unity-bootstrap-android.yml` construye solo
  `unity-bootstrap/**`, manualmente en `main`, con ID Android
  `com.vexforge.bootstrap`. Su guía operativa está en
  `docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md`.
- La caché permitida para ese método es únicamente
  `unity-bootstrap/Library/`, guardada tras validar el APK. No cachear la
  instalación de Unity, Unity Hub, licencias, credenciales ni `unity/Library/`.
- El primer intento autorizado del bootstrap falló durante `BuildAndroid`: no
  produjo APK ni guardó caché. Se corrigió la propagación del directorio de
  licencia al Editor y se añadió salida del log de Unity; no afirmar que el
  método funciona hasta que un run posterior verifique y suba el APK.
- El modo `shard` divide el inventario en 12 y limita cada shard a 35.000
  variantes. Los modos `normal` y `final` no aplican ese límite.
- No afirmar build Android, APK/AAB ni QA física sin evidencia nueva.

## Flujo

Trabajar sobre `main`. Antes de cada hito, hacer `git fetch --prune origin`,
confirmar rama `main`, árbol limpio y `HEAD == origin/main`; después de cerrar
un hito, hacer commit y push antes del siguiente. No resetear, rebasar, mezclar,
cherry-pick ni hacer force-push. No iniciar builds Android sin autorización
explícita para esa ejecución. La autorización de un build del bootstrap no
autoriza el workflow del juego oficial, ni al revés. No usar conectores. El flujo
del bootstrap no modifica ni consulta Supabase.
