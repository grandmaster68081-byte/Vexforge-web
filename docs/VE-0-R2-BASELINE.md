# VE-0-R2 — Baseline visual y matriz de cobertura

**Fecha:** 2026-08-09
**Unidad:** `VE-0-R2`
**Tipo:** auditoría estática del producto real
**Fuente canónica:** `vexforge_master_protocol_v2` v2.3-tier1-continuous-identity, `vexforge_forge_formation_engine_v1` v1.2-universal-re-evaluable-roadmap, `CONTINUITY.md` y el checkout de `main`
**Estado:** `CANDIDATE_FOR_REVIEW`
**Nivel actual:** `Q0` — contrato, fuentes y código real verificados
**Nivel objetivo:** `Q3` — identidad propia y diferenciación contextual, con gates de responsive, accesibilidad y rendimiento

## Alcance auditado

La auditoría se realizó sobre el checkout oficial de `main`, sin modificar lógica de juego, economía, contratos de combate, RPCs, RLS, datos canónicos ni despliegue.

- **39** archivos de rutas en `src/routes/`.
- Componentes compartidos, onboarding, tutorial, estados de carga/error/vacío y superficies de combate.
- Referencias de Storage, `image_url`, audio, partículas e iconografía.
- Uso de emojis, iconos genéricos, placeholders y soporte explícito de reduced motion.
- Cobertura estática de estados por ruta: carga, error, vacío, autenticación e iconografía.

## Matriz de cobertura estática

La siguiente tabla registra conteos de referencias por archivo de ruta. Los conteos indican presencia de señales en código, no una aprobación funcional o visual.

| Cobertura | Resultado |
|---|---:|
| Rutas auditadas | 39 |
| Rutas con referencias de carga | 39 |
| Rutas con referencias de error | 38 |
| Rutas con referencias de vacío o ausencia | 31 |
| Rutas con referencias de auth/sesión/bloqueo | 32 |
| Rutas con `ForgeIcon` directo | 7 |
| Archivos fuente con `ForgeIcon` | 11 |
| Archivos fuente con emoji o pictograma Unicode | 66 |
| Ocurrencias emoji/pictograma Unicode | 397 |
| Ocurrencias de placeholder/demo/TODO/mock | 47 |
| Archivos con soporte explícito de reduced motion | 1 |
| Referencias a `image_url`, fondos o Storage | 99 |

## Fugas de identidad detectadas

### Gate bloqueante: cero genéricos

La política R2-B no se cumple todavía. Se encontraron emojis o pictogramas Unicode en superficies que el protocolo declara no genéricas:

- `src/shared/components/EmptyState.tsx` — defaults y ejemplos de estados vacíos.
- `src/shared/components/ErrorState.tsx` — error y bloqueo de autenticación.
- `src/shared/components/TutorialOverlay.tsx` — pasos de onboarding y CTAs.
- `src/shared/components/OnboardingModal.tsx` y `StarterDeckReveal.tsx` — primera experiencia.
- `src/shared/components/ContextualHints.tsx`, `SeasonRewardsPanel.tsx`, `NotificationBell.tsx` y `MatchHistoryPanel.tsx`.
- `src/components/battle/BattleCard.tsx` — HP, ataque, defensa, velocidad y muerte.
- `src/components/battle/BattleResultScreen.tsx` — victoria, derrota, racha y separadores.
- `src/components/battle/ForgeFormationBoard.tsx` — partículas, rareza y logs de combate.
- `src/components/battle/KeywordTooltip.tsx` — iconografía de keywords.

Los placeholders de inputs de usuario no se consideran por sí mismos una fuga visual; quedan registrados para revisar lenguaje, accesibilidad y consistencia en `VE-6`. Los placeholders de demo o contenido no autorizado sí bloquean una unidad.

### Cobertura de iconografía propia

`ForgeIcon` ya existe y cubre navegación y varios estados funcionales, pero su adopción no es transversal. La métrica de archivos con `ForgeIcon` no equivale a cobertura de todos los iconos visibles: varias rutas siguen usando símbolos inline o mapas de emojis.

### Responsive, accesibilidad y movimiento

El soporte explícito de `prefers-reduced-motion` se detectó únicamente en `ForgeFormationBoard.tsx`. Esto no demuestra que el resto de rutas carezca de accesibilidad, pero sí deja sin evidencia estática una política global para tutorial, resultados, packs, onboarding y estados animados.

## Estado por objetivo

| Objetivo | Estado | Evidencia |
|---|---|---|
| Inventario real de rutas | `VERIFIED_STATIC` | 39 archivos en `src/routes/` |
| Inventario de estados | `VERIFIED_STATIC` | señales de carga/error/vacío/auth por ruta |
| Inventario de assets y consumidores | `VERIFIED_STATIC` | 99 referencias a imagen/fondo/Storage |
| Auditoría de cero genéricos | `BLOCKED` | 397 ocurrencias en 66 archivos |
| Auditoría de reduced motion | `BLOCKED` | soporte explícito localizado en 1 archivo |
| Auditoría visual en navegador | `PENDING_SOURCE` | este entorno no dispone de una sesión frontend oficial reutilizable |
| QA autenticada del owner | `BLOCKED` | requiere sesión normal autorizada del owner; no se sustituye con `service_role` |

## Lectura de calidad

- **Q0:** alcanzado para fuentes, contrato y baseline estático.
- **Q1:** no se declara globalmente; requiere comprobar legibilidad y comportamiento de las superficies reales.
- **Q2:** parcialmente documentado por la base visual histórica, pero la auditoría R2 mantiene abiertas fugas genéricas.
- **Q3:** no alcanzado; la repetición de pictogramas y la cobertura incompleta de movimiento impiden declarar identidad propia consistente.
- **Q4/Q5:** fuera del alcance de esta unidad.

## Deuda priorizada

1. **Alta — `VE-1/VE-6`:** definir un mapa de iconos SVG VEXFORGE y sustituir primero los estados compartidos, tutorial, onboarding y resultado.
2. **Alta — `VE-5`:** convertir los iconos de tutorial en `ForgeIconName` o componentes contextualizados sin ocultar la interfaz real.
3. **Alta — `VE-4`:** reemplazar los símbolos de combate por iconos/overlays propios sin alterar la lectura de stats, keywords o resultados.
4. **Media — `VE-9`:** centralizar reduced motion y documentar fallback para transiciones, partículas, cinemáticas y audio.
5. **Media — `VE-2/VE-3`:** seleccionar tres cartas canónicas contrastantes y abrir pasaportes `VE-CARD` sólo después de fijar el lenguaje visual común.
6. **Media — `VE-6`:** revisar los 39 dominios con una matriz de estados ejecutados, no sólo referencias estáticas.

## Condición de reapertura

Reabrir `VE-0-R2` como `CANDIDATE_FOR_REVIEW` cuando se haya integrado el primer lote de iconografía propia y exista evidencia de navegador para una ruta de entrada, una ruta de cartas, un estado de error, un estado vacío y una superficie de combate. Comparar de nuevo contra Q0-Q5 y registrar la deuda restante; no cerrar la unidad con una afirmación global de “visual completado”.

## Siguiente unidad recomendada

`VE-1-ICON-LANGUAGE-PILOT`: mapa y componentes propios para estados compartidos, tutorial y resultado de batalla. Debe conservar los contratos existentes y dejar preparado el piloto `VE-CARD` sin inventar datos canónicos.