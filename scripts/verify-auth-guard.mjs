/**
 * VE-19-AUTH-GUARD-STATIC-VERIFIER — guarda estática de lecturas autenticadas.
 *
 * Ley canónica: ninguna lectura autenticada (`supabase.rpc("vexforge_get_my_*")`)
 * puede dispararse sin sesión viva. Este verificador falla si un módulo invoca
 * un RPC `vexforge_get_my_*` sin que exista, en ese mismo módulo, una
 * comprobación previa de sesión (`supabase.auth.getSession()` o `getUser()`).
 *
 * No sustituye a la revisión humana: detecta la ausencia de la comprobación,
 * no su correcta colocación lógica.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const RPC = /supabase\s*\.\s*rpc\(\s*["'`](vexforge_get_my_[a-z0-9_]+)["'`]/g;
const GUARD = /supabase\s*\.\s*auth\s*\.\s*(getSession|getUser)\s*\(/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const offenders = [];
let calls = 0;
let modules = 0;

for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  const found = [...src.matchAll(RPC)];
  if (found.length === 0) continue;
  modules += 1;
  calls += found.length;
  if (!GUARD.test(src)) {
    offenders.push({ file, rpcs: [...new Set(found.map((m) => m[1]))] });
  }
}

if (offenders.length > 0) {
  console.error("verify:auth-guard FALLÓ — RPC autenticado sin comprobación de sesión:");
  for (const o of offenders) console.error(`  - ${o.file}: ${o.rpcs.join(", ")}`);
  process.exit(1);
}

console.log(`verify:auth-guard OK — ${calls} llamada(s) autenticada(s) en ${modules} módulo(s), todas con comprobación de sesión en su módulo.`);
