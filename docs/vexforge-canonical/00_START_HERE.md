# 00 — START HERE

## Runtime vigente

Directiva explícita del propietario, 2026-09-30: Expo / React Native bajo `mobile/**` es el único runtime activo del juego. Unity y otras implementaciones son legado para trabajo nuevo. Preservar todos los archivos; no ejecutar builds de Unity ni reactivar otro runtime. La web pública existente queda intacta.

Los documentos que aún describen Unity como activo son registros de una decisión anterior. Si `main` o el propietario cambian de nuevo, inspeccionar evidencia y registrar una nueva decisión; no resolverlo por inferencia.

## Orden de lectura de una IA nueva

1. `VEXFORGE_CONTEXT.md` — directiva vigente y autoridad.
2. `docs/vexforge-canonical/30_TIER1_COMPETITIVE_GAME_ROADMAP.md` — alcance, conclusión realista, gates y continuidad.
3. `16_IMPLEMENTATION_STATUS.md` — advertencia de snapshot histórico y estados que falta revalidar.
4. `17_CURRENT_BLOCK.md` — unidad activa; no confundir un plan con implementación.
5. `19_BLOCKERS.md`, `20_KNOWN_UNKNOWNS.md` y `21_CONTRADICTIONS.md`.
6. El documento de dominio relevante; `27_EXPO_GAME_RUNTIME.md` y otros documentos antiguos son referencia histórica hasta reconciliarlos con el código actual.
7. Inspeccionar los archivos Expo relevantes en el `main` vigente.
8. Consultar Supabase live de forma de sólo lectura para contratos implicados; leer definiciones, RLS, policies, grants y ownership antes de cambiar integración.

## Autoridad

Supabase live es la autoridad para backend/datos/reglas/resultados. El código actual de `main` es la evidencia de implementación. La directiva explícita más reciente del propietario fija Expo como runtime activo. Los documentos históricos ayudan a recuperar contexto, pero no reemplazan una verificación actual.

## No asumir

- Que Expo compila o funciona porque existe `mobile/**` o un README.
- Que una RPC es segura o está operativa porque su nombre aparece en el catálogo.
- Que una migración antigua coincide con el estado live.
- Que una simulación local es PvP real o settlement competitivo.
- Que una build CI prueba legibilidad, rendimiento, instalación o estabilidad física.
- Que la puntuación Tier 1 interna prueba competitividad frente al mercado.
- Que un documento que dice Unity activo sigue vigente después de la directiva de 2026-09-30.

## Límites de ejecución

- La unidad de esta planificación no instaló, compiló, desplegó ni modificó Supabase.
- El workflow visible de Unity no se despacha para este runtime.
- No tocar economía, auth, RLS, datos, fees, rewards ni contratos sin auditoría y autorización específica.
- No marcar una feature como completa por componentes, pantallas, imágenes o documentación; adjuntar comportamiento, prueba, resultado y bloqueo.

Al cerrar cada incremento funcional, actualizar `16_IMPLEMENTATION_STATUS.md`, `17_CURRENT_BLOCK.md`, `18_DECISIONS.md`, `19_BLOCKERS.md`, `20_KNOWN_UNKNOWNS.md`, `21_CONTRADICTIONS.md` y `25_CONTINUITY_CHANGELOG.md` según corresponda. Persistir cambios coherentes en `main`; verificar el SHA real antes de continuar una sesión nueva.
