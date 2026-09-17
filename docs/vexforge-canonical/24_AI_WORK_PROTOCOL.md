# 24 — AI WORK PROTOCOL

## Antes de modificar

1. Leer `VEXFORGE_CONTEXT.md`.
2. Leer `docs/vexforge-canonical/00_START_HERE.md`.
3. Leer `16_IMPLEMENTATION_STATUS.md`.
4. Leer `17_CURRENT_BLOCK.md`.
5. Leer `19_BLOCKERS.md`.
6. Leer `20_KNOWN_UNKNOWNS.md`.
7. Leer `21_CONTRADICTIONS.md`.
8. Inspeccionar el código actual relevante.
9. Consultar Supabase live si la afirmación depende del backend.
10. Planificar y obtener autorización del bloque antes de implementar.

## Prohibiciones

No inventar. No duplicar lógica autoritativa. No tomar documentos viejos como autoridad actual. No reactivar web. No afirmar una feature completa solo por documentación. No afirmar APK correcto sin build/release evidence. No afirmar backend sin evidencia live/código. No revelar secretos.

## Después de cada bloque

Actualizar current block, implementation status, decisions, blockers, unknowns, contradictions y continuity changelog. Si afecta Android, registrar source commit, workflow run, release, APK hash y QA física. No compilar ni publicar automáticamente.

## Si el trabajo afecta la migración Unity

- No crear el proyecto Unity desde una inferencia breve.
- Exigir un único paquete operativo de Foundation.
- Mantener `mobile/**` intacto como rollback.
- No mover autoridad backend ni crear Firebase/PlayFab/Photon u otra base de datos.
- No declarar Unity activo hasta que compile, tenga APK, instalación, Auth/sesión/datos reales, QA y rollback.
- Replit prepara archivos, scripts y análisis; Unity Editor/CI Unity procesa y construye el player.
- No avanzar de etapa porque compile: cada etapa requiere gates funcionales, visuales, de backend y evidencia del usuario.
