## 2026-08-19 — VE-18-AUTHED-RPC-SESSION-GUARD-EXTENSION — OPERATIONAL

- Tipo de sesión: Auditoría estática de llamadas autenticadas + corrección mínima. Sin cambios de esquema, RLS, RPCs, economía autoritativa, Storage ni arte.
- Motivo: ejecutar la siguiente acción verificable de VE-17 (extender la guarda de sesión al resto de consumidores de RPC autenticado).
- Verificación previa: GitHub `main = 69c5849c588431aa74744dda3d97f547021d20fe` idéntico al `sourceCommit` de `/build-manifest.json`; HTTP 200 en `/`, `/leaderboard`, `/season-rankings`, `/raids`, `/world-bosses` y `/achievements`.
- Auditoría: cuatro consumidores de RPC `vexforge_get_my_*`. `ShopRoute.tsx:101` sólo se dispara dentro de la rama con sesión viva (correcto) y `season/repository.ts:134` ya quedó guardado en VE-17. Dos quedaban sin comprobación previa de sesión: `economy/repository.ts:71` (`vexforge_get_my_economy_stats`) y `deposit/repository.ts:61` (`vexforge_get_my_deposits`), ambos capaces de producir 401 anónimo si un consumidor futuro los invoca sin sesión.
- Decisión canónica reafirmada: ninguna lectura autenticada se dispara sin sesión viva; la comprobación vive en el repositorio de dominio, no sólo en la ruta.
- Cambios: `src/domains/economy/repository.ts` (devuelve `blocked_auth` sin sesión, alineado con `getLedgerEntries`) y `src/domains/deposit/repository.ts` (devuelve lista vacía sin sesión, coherente con su contrato actual).
- Evidencia: `npm run typecheck` verde y `npm run build` verde en el checkout limpio.
- Estado: NOT_STARTED → OPERATIONAL. Nivel Q: Q3.
- Deuda restante: QA autenticada continúa `BLOCKED` sin sesión normal autorizada; `.github/workflows/verify.yml` pendiente de `GITHUB_PAT` con scope `workflow`; higiene documental de tablas `vexforge_*`; artes duplicados del bucket pendientes de autorización de listado.
- Condición de reapertura: nuevo repositorio de dominio que llame a un RPC autenticado sin comprobar sesión, o divergencia entre `main` y `build-manifest.json` público.
- Siguiente acción verificable: valorar un verificador estático (`verify:auth-guard`) que falle el build si un `supabase.rpc("vexforge_get_my_*")` aparece sin `getSession` previo en su mismo módulo.

---

