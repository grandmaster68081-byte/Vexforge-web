#!/usr/bin/env node
// VE-PVP-4-LEGACY-START-RETIRED — guard: the web client must resolve PvP only
// through vexforge_battle_resolve, never through the service_role-only legacy RPC,
// and must never invent opponent stats.
import { readFileSync } from 'node:fs';

const repo = readFileSync('src/domains/pvp/repository.ts', 'utf8');
const hook = readFileSync('src/domains/pvp/usePvp.ts', 'utf8');

const checks = [
  ['no legacy start_pvp_match call', !/rpc\(\s*["'`]start_pvp_match/.test(repo)],
  ['no legacy startBattle export', !/export async function startBattle\b/.test(repo)],
  ['roster uses get_pvp_opponents', repo.includes('get_pvp_opponents')],
  ['no synthetic opponent level', !/level:\s*1/.test(repo)],
  ['authoritative resolve present', repo.includes('vexforge_battle_resolve')],
  ['hook calls startRealBattle', hook.includes('startRealBattle(')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`);
  if (!ok) failed++;
}
if (failed) { console.error(`verify-pvp-authority: ${failed} check(s) failed`); process.exit(1); }
console.log(`verify-pvp-authority: ${checks.length}/${checks.length} OK`);
