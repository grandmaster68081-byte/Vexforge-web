# VEXFORGE — CONTEXTO ACTUAL

## Dirección canónica

**Unity bajo `unity/**` es el único runtime activo del videojuego Android.**
Expo / React Native (`mobile/**`) es una referencia de comportamiento heredada
durante la migración y solo se elimina después de superar las gates de paridad.
No se incorpora un segundo runtime dentro de Unity.

La autoridad para continuar es, en este orden:

1. Supabase live para contratos, datos, permisos y autoridad backend.
2. Código actual de `main` para comportamiento implementado.
3. Este archivo y `docs/vexforge-canonical/` para dirección operativa.
4. `docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json` para el
   inventario y las decisiones por capacidad.
5. Los documentos Expo/Unity históricos sirven como evidencia, no sustituyen
   esta dirección.

## Límites de alcance

- Trabajar en `unity/**` como destino; consultar `mobile/**` como fuente de
  comportamiento mientras se completa la paridad.
- No portar Expo Router, React Native, Metro, Skia ni gameplay JavaScript a
  Unity. Traducir solo comportamientos necesarios a C# y sistemas nativos.
- Supabase conserva autoridad sobre autenticación, ownership, combate,
  settlement, recompensas y economía. La presentación móvil no calcula esos
  resultados.
- No cambiar contratos live de Supabase para facilitar la migración. Mantener
  `src/**` y `public/**` como portal congelado y no alterar `faucet/**`.
- No borrar `mobile/**` hasta que todos los gates de paridad, verificación y
  seguridad de eliminación pasen.
- `faucet/**`, sus assets Kivora y las migraciones `*kivora*` son un producto y
  un historial separados; preservarlos y no mezclarlos con VEXFORGE.
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
- Expo contiene comportamiento de referencia adicional; el inventario separa
  lo ya implementado en Unity de lo que aún debe portarse o verificarse.
- No afirmar build Android, APK/AAB ni QA física sin evidencia nueva.

## Flujo

Trabajar sobre `main`. Antes de cada hito, hacer `git fetch --prune origin`,
confirmar rama `main`, árbol limpio y `HEAD == origin/main`; después de cerrar
un hito, hacer commit y push antes del siguiente. No resetear, rebasar, mezclar,
cherry-pick ni hacer force-push. No generar APK/AAB ni iniciar builds Android
durante esta migración salvo autorización explícita de ese gate.
