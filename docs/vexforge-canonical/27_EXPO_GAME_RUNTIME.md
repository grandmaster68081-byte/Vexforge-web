> STATUS: HISTORICAL SNAPSHOT — EXPO SOURCE WAS REMOVED IN HITO 10 ON 2026-10-05.
> DO NOT USE AS ACTIVE RUNTIME OR ARCHITECTURAL SOURCE. Open Unity gates remain
> listed in `28_UNITY_EXPO_MIGRATION_GATES.md`.

# 27 — EXPO / REACT NATIVE LEGACY RECORD

## Estado

Este documento describe el árbol `mobile/**` inspeccionado antes de Hito 10.
Ese árbol, sus dependencias y su workflow Expo fueron retirados en el commit
`77d31b5d` por instrucción explícita del usuario. Este documento no contiene
código ejecutable ni prueba paridad de Unity.

La implementación histórica Expo sigue siendo una referencia útil para contratos de
Supabase, estados de sesión y nombres de RPC, pero no es el runtime principal
durante la reactivación Unity.

## Invariantes

- Supabase mantiene autoridad sobre autenticación, catálogo, ownership,
  progreso, wallet, estadísticas, eventos, settlement y recompensas.
- Unity y Expo no inventan cartas, balances, rewards, nombres o resultados.
- No se cambia Supabase ni se actualiza Expo dentro de la reactivación Unity
  salvo una integración documentada y estrictamente necesaria.
- No se ejecutan builds Android de ningún runtime en esta etapa.