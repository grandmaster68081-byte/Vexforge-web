# 00 — START HERE

## Dirección vigente

**Trabajo visual de juego: Unity 6.3.0f1 + URP 17.3.0.** Esta es la ruta recomendada por el análisis más reciente del código, pipeline Android, soporte móvil actual de Unreal y el límite de seis horas. Expo queda como legado/historial; no migrar el runtime a Unreal. Fab se usa sólo para assets gratuitos compatibles/licenciados que se integren en Unity.

## Orden de lectura

1. `VEXFORGE_CONTEXT.md` — ruta y límites actuales.
2. `docs/vexforge-canonical/31_VISUAL_PRODUCTION_ROADMAP.md` — ruta visual, texto para intro de sesión, gates, licencias y build-budget.
3. `docs/vexforge-canonical/17_CURRENT_BLOCK.md` — bloque activo y evidencia.
4. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md`, `18_DECISIONS.md`, `19_BLOCKERS.md`, `20_KNOWN_UNKNOWNS.md`, `21_CONTRADICTIONS.md`.
5. Inventario existente: `docs/ART_DIRECTION.md`, `docs/ART_GENERATION_BIBLE.md`, `docs/VE-1-VISUAL-BIBLE.md`, `docs/vexforge-tier1/03_BATTLEFIELD_VISUAL_SYSTEM_V15.md`, `04_CINEMATOGRAPHY_VFX_AUDIO_V15.md`, `12_ASSET_PIPELINE_V15.md`, `16_VISUAL_CLOSURE_V15.md`, `VISUAL_QA_MATRIX.md`, `ART_ASSET_MANIFEST.json`.
6. Lee sólo el código Unity correspondiente al gate visual activo. La ruta inicia en `VexforgeBattlefieldStage`, `BattlePresentationDirector`, `VexforgeTier1VisualFoundation`, `VexforgeCardArtResolver` y el validador.
7. Antes de agregar shader/asset, lee el workflow y el gate de variantes; no compiles la ruta unbounded.

## Reglas de trabajo

- El propietario define y valida lógica, estadísticas y balance. Este bloque sólo mejora cómo se ve y se siente el contenido existente.
- No rediseñar reglas, eventos, API, Supabase ni mecánicas. Consumir eventos actuales y documentar dependencias ausentes.
- No hacer engine migration. Unity existe y tiene pipeline; la ruta Unreal no cumple mejor los límites Android/CI.
- Todo recurso debe tener procedencia/licencia. `Fab` no significa que todo sea gratis o se pueda usar fuera de Unreal; revisar cada listing. No copiar arte oficial de cartas al cliente.
- No introducir assets, shaders ni plugins que eleven las variantes sin gate. No ejecutar `normal/final` hasta que el build de producción tenga hard cap.
- Cambios coherentes a `main`, evidencia verificable y nada funcional sólo en local.
