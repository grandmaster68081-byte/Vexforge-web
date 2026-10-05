# 03 — CANONICAL HIERARCHY

1. **Supabase LIVE**: tablas, datos vivos, RLS, policies, RPCs, functions, triggers, storage, auth, permisos y contratos backend.
2. **Código actual de `main`**: entry points, rutas, componentes, cliente ejecutado, consumers, assets, build y comportamiento implementado.
3. **`VEXFORGE_CONTEXT.md`**: punto de entrada persistente.
4. **`docs/vexforge-canonical/**`**: mapa y reconciliación detallados.
5. **`docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json`**:
   decisiones por capacidad y rutas inspeccionadas para la migración.
6. **Documentación histórica**: evidencia contextual; no autoridad si contradice evidencia actual.

## Resolución de la discrepancia web/Android

- SOURCE A: `README.md` original llama a la web “Official Web Frontend”.
- SOURCE B: decisión activa y `unity/**` declaran Android como producto activo.
- CURRENT EVIDENCE: Unity project settings, bootstrap scene, Presentation
  Foundation and current Unity runtime.
- STATUS: `RESUELTO` para orientación futura: Android activo; la afirmación web queda histórica/frozen.

No se eliminan fuentes antiguas: se clasifican y se enlazan.

## Runtime actual

- Código `main` actual: autoridad para describir la implementación Unity
  existente.
- Decisión de producto/runtime: Unity es el runtime Android activo y `unity/**`
  es la fuente canónica.
- Expo / React Native en `mobile/**` se retiró por instrucción explícita del
  usuario el 2026-10-05 mientras las gates seguían abiertas. La excepción está
  registrada en `28_UNITY_EXPO_MIGRATION_GATES.md`; no implica que las gates
  estén superadas.
