/**
 * VE-DOC-4-COLUMN-COMMENTS — cobertura documental de columnas del runtime de cliente.
 *
 * El alcance lo declara el propio repositorio: toda tabla leida desde `src/`
 * mediante `from("<tabla>")`. Falla si alguna de esas columnas carece de
 * `comment on column`, leyendo el catalogo vivo con el rol anon.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const tables = new Set();
for (const file of walk("src")) {
  if (!/\.(ts|tsx)$/.test(file)) continue;
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/from\("([a-z0-9_]+)"/g)) tables.add(match[1]);
}

if (tables.size === 0) {
  console.error("verify:column-docs — no se detecto ninguna tabla consumida en src/");
  process.exit(1);
}

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/vexforge_column_doc_coverage`, {
  method: "POST",
  headers: { apikey: ANON_KEY, "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ _tables: [...tables].sort() }),
});

if (!res.ok) {
  console.error(`verify:column-docs — la sonda respondio ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const rows = await res.json();
const row = Array.isArray(rows) ? rows[0] : rows;
if (!row) {
  console.error("verify:column-docs — la sonda no devolvio filas");
  process.exit(1);
}

const { total_columns: total, undocumented, missing } = row;
if (undocumented > 0) {
  console.error(`verify:column-docs — ${undocumented} columna(s) sin descripcion de ${total}:`);
  for (const ref of missing ?? []) console.error(`  - public.${ref}`);
  console.error("Anade `comment on column public.<tabla>.<columna> is '...'` en una migracion.");
  process.exit(1);
}

console.log(
  `verify:column-docs — OK: ${total}/${total} columnas documentadas en ${tables.size} tabla(s) de runtime de cliente.`,
);
