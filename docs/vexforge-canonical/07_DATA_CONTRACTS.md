# 07 — DATA CONTRACTS

Fuente primaria del consumer: `mobile/lib/supabase.ts`. Los nombres siguientes son los observados en código; los campos completos deben leerse desde sus tipos o desde Supabase live, no inventarse aquí.

| Caller | Input | Operación | Lecturas/escrituras | Auth | Status |
|---|---|---|---|---|---|
| Auth screen | email/password/provider | auth sign-in, sign-up, refresh, reset | session storage y Auth | usuario/anon según operación | IMPLEMENTED_UNVERIFIED |
| Home | session opcional | home identity/stats/missions/activity/rank | perfiles, progreso, misiones, ranking | session según loader | IMPLEMENTED_UNVERIFIED |
| Collection | session | catalog + player collection | cards/player_cards/catalog views | authenticated | IMPLEMENTED_UNVERIFIED |
| Deck/Forja | card ids | `validateDeck`, `saveDeck` | player_deck, deck validation RPC | authenticated | IMPLEMENTED_UNVERIFIED |
| Battle | player/opponent ids | find opponents/start battle | pvp/battle/combat objects | authenticated | PARTIAL |
| Missions | mission/player context | load, execute, claim | mission runs, rewards, energy | authenticated | IMPLEMENTED_UNVERIFIED |
| World | raid/season context | join/contribute/claim | raid, boss, season objects | authenticated | IMPLEMENTED_UNVERIFIED |
| Economy | wallet/deposit/withdrawal fields | load/submit/request | wallet, ledger, treasury/deposit objects | authenticated/admin split | EVIDENCE_REQUIRED |
| Social | friend/challenge/clan ids | send/accept/decline/create/join/leave | friendships, direct challenges, clans | authenticated | IMPLEMENTED_UNVERIFIED |
| Telemetry | event key + payload | `insertTelemetryEvent` | telemetry table/RPC | authenticated | PARTIALLY_VERIFIED |

## Reglas

- El servidor/Supabase conserva settlement, economía, permisos y reglas autoritativas.
- El cliente no debe fabricar resultados, balances, rewards o cartas.
- Errores y estados `NO REPORTADO`, retry, loading y offline deben conservarse como señales explícitas.
- La existencia del caller no prueba la existencia o disponibilidad live de la RPC; requiere consulta Supabase y/o ejecución QA.
