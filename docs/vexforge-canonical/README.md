# VEXFORGE — Canonical continuity

Esta carpeta es la memoria técnica estructurada del proyecto. No duplica los 160 documentos históricos: resume estado, enlaza evidencia, registra decisiones, conserva contradicciones y separa `ACTIVE`, `HISTORICAL`, `UNKNOWN` y `EVIDENCE_REQUIRED`.

## Entrada

- [`VEXFORGE_CONTEXT.md`](../../VEXFORGE_CONTEXT.md)
- [`00_START_HERE.md`](00_START_HERE.md)

## Principios

1. Supabase live es autoridad del backend vivo.
2. `main` es evidencia de lo implementado.
3. Esta carpeta es el punto persistente de orientación.
4. La documentación histórica se conserva y no sobrescribe la capa canónica.
5. Todo estado sin evidencia conserva una etiqueta explícita.
6. No contiene secretos ni credenciales.

## Datos legibles por máquina

Los registros de `data/` son resúmenes derivados de evidencia observada. No sustituyen consultas live ni el código.

## Runtime migration decision

La decisión nueva es Unity 6.3 LTS + URP + C# como runtime final del cliente Android. El cliente Expo/React Native actual no se elimina: permanece legado durante una migración reversible y solo deja de ser activo después de superar Foundation y sus gates de APK, instalación, backend y rollback.
