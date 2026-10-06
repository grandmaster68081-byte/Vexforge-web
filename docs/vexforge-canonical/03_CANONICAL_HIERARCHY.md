# 03 — CANONICAL HIERARCHY

1. **Supabase LIVE**: tablas, datos vivos, RLS, policies, RPCs, functions, triggers, storage, auth, permisos y contratos backend.
2. **Código actual de `main`**: entry points, rutas, componentes, cliente ejecutado, consumers, assets, build y comportamiento implementado.
3. **`VEXFORGE_CONTEXT.md`**: punto de entrada persistente.
4. **`docs/vexforge-canonical/**`**: mapa y reconciliación detallados.
5. **`docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md`**:
   estado observado de la implementación Unity.
6. **Documentación histórica**: evidencia contextual; no autoridad si contradice evidencia actual.

## Resolución de la discrepancia web/Android

- SOURCE A: `README.md` original llama a la web “Official Web Frontend”.
- SOURCE B: decisión activa y `unity/**` declaran Android como producto activo.
- CURRENT EVIDENCE: Unity project settings, bootstrap scene, Presentation
  Foundation and current Unity runtime.
- STATUS: `RESUELTO` para orientación futura: Android activo; la afirmación web queda histórica/frozen.

La documentación histórica no prevalece sobre el código actual ni las
instrucciones del propietario.

## Runtime actual

- Código `main` actual: autoridad para describir la implementación Unity
  existente.
- Decisión de producto/runtime: Unity es el runtime Android activo y `unity/**`
  es la fuente canónica.
- El workflow Unity es manual, usa 12 shards con un máximo de 35.000 variantes
  por shard y todavía no se ha ejecutado.
