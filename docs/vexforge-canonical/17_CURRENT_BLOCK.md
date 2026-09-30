# 17 — CURRENT BLOCK

## Bloque activo

`VISUAL_PRODUCTION_WITHIN_ANDROID_AND_FREE_CI_BUDGET`

## Decisión técnica vigente

La petición más reciente delegó seleccionar la mejor ruta visual 2026. La recomendación documentada es continuar con el cliente Unity Android existente (`6000.3.0f1` + URP `17.3.0`), usar Fab sólo para contenido gratuito/licenciado compatible, y no migrar a Unreal. Esta decisión sustituye para el alcance visual la directiva Expo-only anterior; `mobile/**` queda intacto como legado.

## Estado observado

| Área | Estado | Evidencia / límite |
|---|---|---|
| Unity Android + URP | EXISTE_EN_MAIN | Unity 6000.3.0f1, URP 17.3.0 |
| Eventos/presentación de batalla | PARCIAL_IMPLEMENTADO | Hay entradas/impactos/defensa/boss/victoria; revisar visual en runtime instalado |
| Apariencia de arena | REQUIERE_PRODUCCIÓN | `VexforgeBattlefieldStage` construye suelo/elementos con primitivas y tiene fallbacks |
| Art bibles/manifiestos/QA | EXISTEN | Inventariar y reutilizar; no declarar su contenido validado sólo por existir |
| Licencia/arte de carta oficial | GATE_PROTEGIDO | Resolver/manifiesto conservan ownership; no copiar ilustración oficial al cliente |
| Shader variants | BLOCKER_DE_BUILD | Workflow declara ~287k inventario; cap 35k es por shard; `normal/final` están unbounded |
| GitHub Actions | PUBLICO / 360 MIN | Runner estándar gratis por repo público; job máximo 6 h; no hubo build en esta actualización |
| Epic Unreal para Android | NO_RECOMENDADO | UE 5.8 mobile docs: Nanite/Lumen GI no disponibles en tablas mobile; renderer desktop Android Vulkan experimental |
| Supabase | SIN_CAMBIOS | No se escribieron reglas, datos, auth, policies ni score |

## Secuencia activa

Completar `docs/vexforge-canonical/31_VISUAL_PRODUCTION_ROADMAP.md` en orden:

1. V0: inventario visual + preflight shader/budget; no generar 287k variantes.
2. V1: consolidar una firma visual desde las biblias ya existentes.
3. V2: terminar una arena insignia con assets intencionales.
4. V3: completar animaciones/VFX ligados a eventos existentes.
5. V4: aplicar kits visuales a las rutas de juego ya implementadas.
6. V5: calibrar Mobile/Balanced/Cinematic y verificar build/runtime físico.

**No producir un pack grande de assets antes de que `normal/final` fallen rápido ante una expansión de variantes y el build Android final pase con margen.** No se ha iniciado implementación visual en este commit documental.
