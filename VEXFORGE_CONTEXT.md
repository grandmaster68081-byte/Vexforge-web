# VEXFORGE — CONTEXTO ACTUAL

## Dirección canónica

**Unity bajo `unity/**` es el único runtime activo del videojuego Android.**
Expo / React Native (`mobile/**`) se retiró en el hito 10 el 2026-10-05
(`77d31b5d`) por instrucción explícita del usuario mientras las gates de
paridad seguían abiertas. El inventario y el manifiesto de assets son snapshots
históricos, no runtime ni fuente ejecutable. La retirada no cierra las gates.
No se incorpora un segundo runtime dentro de Unity.

La autoridad para continuar es, en este orden:

1. Supabase live para contratos, datos, permisos y autoridad backend.
2. Código actual de `main` para comportamiento implementado.
3. Este archivo y `docs/vexforge-canonical/` para dirección operativa.
4. `docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json` para el
   inventario y las decisiones por capacidad.
5. Los documentos e inventarios históricos Expo/Unity sirven como evidencia
   limitada al estado previo a la retirada, no como código fuente activo.

## Límites de alcance

- Trabajar en `unity/**` como único runtime. Usar los inventarios históricos
  para consultar el comportamiento previo; `mobile/**` ya no existe.
- No portar Expo Router, React Native, Metro, Skia ni gameplay JavaScript a
  Unity. Traducir solo comportamientos necesarios a C# y sistemas nativos.
- Supabase conserva autoridad sobre autenticación, ownership, combate,
  settlement, recompensas y economía. La presentación móvil no calcula esos
  resultados.
- No cambiar contratos live de Supabase para facilitar la migración. Mantener
  `src/**` y `public/**` como portal congelado y no alterar `faucet/**`.
- No restaurar `mobile/**` ni presentar su retirada como aprobación de paridad,
  seguridad o runtime; esas gates siguen abiertas hasta tener evidencia.
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
- El inventario previo a la retirada separa capacidades implementadas en
  Unity de las que aún requieren verificación; su código Expo ya no está en el
  repositorio.
- El workflow Android que construía Expo fue retirado. Aún no hay un workflow
  dedicado a Unity; el usuario dejó esa configuración para una etapa posterior.
- No afirmar build Android, APK/AAB ni QA física sin evidencia nueva.

## Flujo

Trabajar sobre `main`. Antes de cada hito, hacer `git fetch --prune origin`,
confirmar rama `main`, árbol limpio y `HEAD == origin/main`; después de cerrar
un hito, hacer commit y push antes del siguiente. No resetear, rebasar, mezclar,
cherry-pick ni hacer force-push. No generar APK/AAB ni iniciar builds Android
durante esta migración salvo autorización explícita de ese gate.
