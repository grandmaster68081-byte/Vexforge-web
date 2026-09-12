/**
 * VE-DOC-5-SUPPORT-COLUMN-COMMENTS — cobertura documental de columnas de tablas
 * de soporte interno `vexforge_*`.
 *
 * El alcance lo declara el repositorio: toda tabla `vexforge_*` para la que
 * exista al menos un `comment on column` en `supabase/migrations/`. Falla si
 * alguna columna de esas tablas carece de descripcion en el catalogo vivo.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";

const dir = "supabase/migrations";
const tables = new Set();
for (const file of readdirSync(dir)) {
  if (!file.endsWith(".sql")) continue;
  const sql = readFileSync(join(dir, file), "utf8");
  for (const m of sql.matchAll(/comment\s+on\s+column\s+public\.(vexforge_[a-z0-9_]+)\./gi)) {
    tables.add(m[1].toLowerCase());
  }
}

if (tables.size === 0) {
  console.error("verify:support-column-docs — no se detecto ninguna tabla vexforge_* documentada");
  process.exit(1);
}

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/vexforge_column_doc_coverage`, {
  method: "POST",
  headers: { apikey: ANON_KEY, "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ _tables: [...tables].sort() }),
});

if (!res.ok) {
  console.error(`verify:support-column-docs — la sonda respondio ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const rows = await res.json();
const row = Array.isArray(rows) ? rows[0] : rows;
if (!row) {
  console.error("verify:support-column-docs — la sonda no devolvio filas");
  process.exit(1);
}

const { total_columns: total, undocumented, missing } = row;
if (undocumented > 0) {
  console.error(`verify:support-column-docs — ${undocumented} columna(s) sin descripcion de ${total}:`);
  for (const ref of missing ?? []) console.error(`  - public.${ref}`);
  console.error("Anade `comment on column public.<tabla>.<columna> is '...'` en una migracion.");
  process.exit(1);
}

console.log(
  `verify:support-column-docs — OK: ${total}/${total} columnas documentadas en ${tables.size} tabla(s) de soporte interno.`,
);
