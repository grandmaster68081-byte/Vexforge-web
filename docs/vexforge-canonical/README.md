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

## Runtime decision

Expo / React Native es el runtime Android activo. React Native es la capa de
aplicación/UI; Reanimated + Worklets + Gesture Handler cubren movimiento e
interacción; Skia queda reservada para una futura capa de rendering 2D/2.5D.
Supabase conserva toda autoridad de datos y reglas. Unity es
`RETIRED / HISTORICAL` y no forma parte del runtime ni del build activo.
