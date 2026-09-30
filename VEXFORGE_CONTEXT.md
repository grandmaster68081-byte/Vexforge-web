# VEXFORGE — CONTEXTO ACTUAL

## Dirección canónica

**Expo / React Native bajo `mobile/**` es el único runtime activo del
videojuego.** Unity (`unity/**`) queda como legado preservado y de solo lectura
para trabajo nuevo. No crear otro runtime junto a Expo.

La autoridad para continuar es, en este orden:

1. `mobile/docs/ACTIVE_EXPO_GAME_SCOPE.md`
2. `mobile/docs/VEXFORGE_EXPO_REPLIT_CONTINUATION_ORDER_V5.md`
3. `mobile/docs/REAL_EXPO_REPOSITORY_STATE.md`
4. `mobile/docs/SESSION_CHECKPOINT.md`

Los documentos de `docs/vexforge-canonical/` que describen Unity como activo
son históricos y están supersedidos por esta dirección y los documentos de
`mobile/docs/`. El historial se conserva; no es autorización para reactivar
Unity.

## Límites de alcance

- Trabajar en `mobile/**` y sus consumidores actuales de Supabase, contratos y
  assets oficiales/proporcionados de VEXFORGE.
- Supabase conserva autoridad sobre autenticación, ownership, combate,
  settlement, recompensas y economía. La presentación móvil no calcula esos
  resultados.
- No cambiar el portal (`src/**`, `public/**`), Unity legado ni contratos live
  de Supabase como parte del trabajo del runtime Expo.
- `faucet/**`, sus assets Kivora y las migraciones `*kivora*` son un producto y
  un historial separados; preservarlos y no mezclarlos con VEXFORGE.
- No se encontraron assets, paquetes ni IDs importados de Epic/Fab. La ruta
  Epic/Fab queda retirada; no adquirir ni importar esos recursos en este
  trabajo. La rareza de cartas `epic` pertenece al juego y se conserva.

## Estado observado

- El paquete móvil declara Expo SDK `54.0.37`, React Native `0.81.5` y versión
  `1.10.0`.
- La base existente incluye navegación Expo y sistemas de presentación de
  batalla; el checkpoint identifica las brechas de runtime/QA que siguen
  abiertas.
- No afirmar que la app tiene build Android, APK/AAB o QA física verificada sin
  evidencia nueva.

## Flujo

Trabajar sobre la rama oficial `main`, comprobar su estado antes de continuar y
persistir hitos completos en `origin/main`. Usar las verificaciones móviles
documentadas en `replit.md`; no iniciar builds EAS/Android ni despliegues sin
la autorización explícita del gate.
