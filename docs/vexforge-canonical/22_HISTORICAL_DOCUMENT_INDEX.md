# 22 — HISTORICAL DOCUMENT INDEX

La documentación anterior no se copia ni se elimina. Este índice la clasifica como evidencia histórica o fuente a reconciliar.

| Zona | Conteo aproximado | Estado | Reemplazo/uso |
|---|---:|---|---|
| `backend/architecture/**` | 2 | HISTORICAL / SOURCE TO RECONCILE | `04`, `06`, `07` |
| `backend/blockers/**` | 1 | HISTORICAL INPUT | `19` |
| `backend/decisions/**` | 1 | HISTORICAL INPUT | `18`, `21` |
| `backend/handoff/**` | 2 | HISTORICAL INPUT | `05`, `23`, `25` |
| `backend/pending/**` | 4 | HISTORICAL / PENDING INPUT | `17`, `19`, `20` |
| `backend/reports/**` | 6 | HISTORICAL REPORTS | `22`, `23` |
| `docs/**` | 160 archivos | HISTORICAL/CURRENT MIX | canonical layer enlaza sin duplicar |
| `VEXFORGE_PROTOCOL_V2.md` | 1 | HISTORICAL/OPERATIONAL INPUT | protocolo live manda donde aplique |
| `CONTINUITY.md` | 1 | HISTORICAL CONTINUITY | conserva historial; nueva entrada es `VEXFORGE_CONTEXT.md` |

Para el índice exhaustivo de rutas, usar `find docs -type f`. Cada documento antiguo debe conservar su path y no debe tratarse como autoridad actual si contradice código, Supabase live o esta capa.
