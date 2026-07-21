# VEXFORGE — Plan Maestro de Trabajo
> Ultima actualizacion: Chat 66 — 2026-07-20

## PROTOCOLO DE SESION
1. docs/MASTER_WORK_PLAN.md  2. vexforge_project_decisions (ultimas 10)  3. vexforge_project_memory

---

## ESTADO CHAT 66 — FIX CRÍTICO

### Bloque completado:
| Bloque | Descripcion |
|--------|-------------|
| F.1.b-RPC | vexforge_battle_resolve SQL materializado en DB (FIX: existía en decisiones pero no en schema) |
| Sync | Memoria sincronizada, CONTINUITY.md actualizado |

---

## TODOS LOS BLOQUES

| Epic | Bloques | Estado |
|------|---------|--------|
| A    | A.1→A.5 | ✅ completa |
| B    | B.1→B.7 | ✅ completa |
| C    | C.1→C.6 | ✅ completa |
| D    | D.1→D.5 | ✅ completa |
| E    | E.1→E.3 | ✅ completa |
| F    | F.1→F.6 | ✅ completa (RPC materializado chat66) |
| G    | G.1→G.4 | 🔵 PRÓXIMA — Polish + Deploy Prep |

---

## RUTAS LIVE: 28 — ARCHIVOS CANÓNICOS: 168 — REVISIÓN: 76 — CHAT: 66

## PRÓXIMA ÉPICA: G — Polish + Deploy Prep

### Plan Épica G (a ejecutar en esta sesión):
| Bloque | Descripcion | Prioridad |
|--------|-------------|-----------|
| G.1 | QA Épica F: verificar BattleCinematicScreen, PvpRoute, usePvp — revisar y completar si hay huecos | ALTA |
| G.2 | SEO + PWA: meta tags en index.html, manifest.json completo, robots.txt, og:image | MEDIA |
| G.3 | Cloudflare deploy config: wrangler.toml completo, _headers, _redirects para SPA routing | ALTA |
| G.4 | Performance + UX: lazy loading rutas, Error boundaries, loading states consistentes | MEDIA |

---

## RPC VEXFORGE_BATTLE_RESOLVE — VERIFICADO EN DB

```
FUNCTION: vexforge_battle_resolve(p_challenger_id uuid, p_opponent_id uuid, p_idempotency_key text)
RETURNS: jsonb (RealBattleResult)
ESTADO: ✅ EXISTS en information_schema.routines
GRANT: authenticated + anon
```

---

## BLOQUEADORES (solo LOW)
- 18 vistas sin SECURITY DEFINER/INVOKER — LOW — non-blocking
- safe_wallet_transaction: NO EXISTE — workaround: UPDATE player_wallet directo (ya implementado en RPC)

## REGLAS CANONICAS
- Codigo → PATCH/POST vexforge_frontend_source_files
- Decision → INSERT vexforge_project_decisions ON CONFLICT
- Audit → INSERT vexforge_project_audit
- Memory → PATCH vexforge_project_memory WHERE memory_key = 'project_memory'

## NOTAS CLAVE
- Keywords en cards: synergy_json.keywords[] (NO card_tags)
- RPCs usan players.id NO auth.uid()
- tsconfig.app.json strict:false — deliberado
- vexforge_battle_resolve: keywords mapeados — Guard→guard, Drain→lifesteal, Surge→rush, Veil→shield
