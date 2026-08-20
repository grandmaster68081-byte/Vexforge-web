/**
 * VE-DOC-3-DOC-COVERAGE-PROBE — verificacion de cobertura documental.
 *
 * Falla si existe una tabla publica sin `comment on table`, leyendo el dato
 * vivo a traves de la sonda publica `public.vexforge_doc_coverage()` con el
 * rol anon (sin privilegios administrativos).
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/vexforge_doc_coverage`, {
  method: "POST",
  headers: {
    apikey: ANON_KEY,
    "content-type": "application/json",
    accept: "application/json",
  },
  body: "{}",
});

if (!res.ok) {
  console.error(`verify:table-docs — la sonda respondio ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const rows = await res.json();
const row = Array.isArray(rows) ? rows[0] : rows;
if (!row) {
  console.error("verify:table-docs — la sonda no devolvio filas");
  process.exit(1);
}

const { total_tables: total, undocumented, missing } = row;

if (undocumented > 0) {
  console.error(`verify:table-docs — ${undocumented} tabla(s) publica(s) sin descripcion de ${total}:`);
  for (const name of missing ?? []) console.error(`  - ${name}`);
  console.error("Anade `comment on table public.<tabla> is '...'` en una migracion.");
  process.exit(1);
}

console.log(`verify:table-docs — OK: ${total}/${total} tablas publicas documentadas.`);
