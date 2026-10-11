# VEXFORGE — CONTEXTO ACTUAL

## Dirección canónica

**`unity/**` es el único proyecto Unity Android oficial del videojuego.** El
Bootstrap acumulativo completo fue promovido a esta ruta el 11 de octubre de
2026. El antiguo proyecto oficial separado fue retirado de la rama actual; los
documentos de migración que aún usan `unity-bootstrap/` son registros históricos,
no rutas activas. El portal sigue en `src/**` y `public/**`.

La autoridad para continuar es, en este orden:

1. Supabase live para contratos, datos, permisos y autoridad backend.
2. Código actual de `main` para comportamiento implementado.
3. Este archivo, `replit.md` y `docs/vexforge-canonical/` para dirección
   operativa.
4. El workflow manual de GitHub Actions para compilaciones Unity autorizadas.

## Límites de alcance

- Unity es el runtime del juego; no añadir un runtime cliente paralelo.
- `unity/**` es la única ruta de proyecto Unity activa. No recrear una copia
  separada `unity-bootstrap/**`.
- Supabase conserva autoridad sobre autenticación, ownership, combate,
  settlement, recompensas y economía. La presentación móvil no calcula esos
  resultados.
- La promoción no cambió Supabase live ni `src/**`/`public/**`. No cambiar
  contratos ni datos live de Supabase sin autorización específica.
- No se encontraron assets, paquetes ni IDs importados de Epic/Fab. La ruta
  Epic/Fab queda retirada; no adquirir ni importar esos recursos en este
  trabajo. La rareza de cartas `epic` pertenece al juego y se conserva.

## Estado observado

- Unity declara el editor `6000.3.0f1`, el nombre de producto `VEXFORGE` y el
  identificador Android `com.vexforge.android`.
- La promoción usó el proyecto que antes estaba en `unity-bootstrap/` y el
  builder Android que había producido APKs históricos. No se ejecutó una nueva
  compilación durante esta sustitución; no afirmar que la versión promovida ya
  compila ni que fue verificada en dispositivo.
- `SecureSessionStore` implementa Android Keystore + AES/GCM en código; todavía
  requiere validación en el Editor/dispositivo antes de declarar la sesión
  verificada.
- El workflow manual vigente es
  `.github/workflows/vexforge-unity-android-github.yml`. Usa la entrada de
  compilación promovida y mantiene la activación de Unity en GitHub Actions.
- El código Unity contiene autenticación, estado, repositorios y presentación,
  pero requiere verificación actual en el Editor y dispositivo.
- Supabase live conserva autoridad sobre Auth, datos y reglas del servidor. No se
  hicieron cambios en Supabase como parte de la promoción.
- No afirmar build Android, APK/AAB ni QA física sin evidencia posterior a la
  promoción.

## Flujo

Trabajar sobre `main`. Antes de cada hito, hacer `git fetch --prune origin`,
confirmar rama `main`, árbol limpio y `HEAD == origin/main`; después de cerrar
un hito, hacer commit y push antes del siguiente. No resetear, rebasar, mezclar,
cherry-pick ni hacer force-push. No iniciar builds Android sin autorización
explícita y vigente. No usar conectores. Supabase no se modifica como parte del
flujo de compilación de Unity.
