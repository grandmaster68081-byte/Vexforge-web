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

Unity Android bajo `unity/**` es el único runtime activo. Expo / React Native
en `mobile/**` se conserva solo como referencia de comportamiento hasta superar
las gates de paridad y eliminación; no es un segundo runtime ni puede borrarse
antes de esas gates. Supabase conserva autoridad de datos y reglas. El portal
web sigue congelado y `faucet/**` es un producto separado.

El inventario machine-readable está en
[`27_UNITY_EXPO_MIGRATION_INVENTORY.json`](27_UNITY_EXPO_MIGRATION_INVENTORY.json);
las condiciones de validación y retirada están en
[`28_UNITY_EXPO_MIGRATION_GATES.md`](28_UNITY_EXPO_MIGRATION_GATES.md).
