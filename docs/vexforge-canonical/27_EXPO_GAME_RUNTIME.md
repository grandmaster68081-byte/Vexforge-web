# 27 — EXPO / REACT NATIVE LEGACY RECORD

## Estado

`mobile/**` permanece intacto como legado histórico y material de respaldo. No
se eliminan sus pantallas, componentes, dependencias, workflows ni contratos.
Unity no depende de Expo para ejecutar gameplay.

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