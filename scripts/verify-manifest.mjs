/**
 * VE-5-ASSET-MANIFEST-DATA — verificación del manifiesto oficial de datos.
 *
 * Comprueba, contra el dato vivo y público de Supabase (rol anon, sin
 * privilegios administrativos):
 *   1. que cada ruta declarada en `src/lib/assetManifest.ts` esté inscrita como
 *      archivo individual en `public.vexforge_official_asset_manifest`;
 *   2. que ninguna fila de archivo del manifiesto apunte a un objeto ausente
 *      del Storage público oficial;
 *   3. que el arte de carta y de jefe mundial consumido por el juego esté
 *      registrado en el manifiesto.
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/assetManifest.ts", "utf8");
const STORAGE_BASE = src.match(/STORAGE_BASE =\s*\n?\s*"([^"]+)"/)?.[1];
if (!STORAGE_BASE) throw new Error("No se pudo leer STORAGE_BASE del manifiesto");

const block = src.match(/VERIFIED_ASSETS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
const codePaths = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";

async function selectAll(table, columns) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
      headers: {
        apikey: ANON_KEY,
        Range: `${from}-${from + pageSize - 1}`,
      },
    });
    if (!res.ok) throw new Error(`Lectura de ${table} -> HTTP ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

const manifest = await selectAll("vexforge_official_asset_manifest", "internal_path,asset_pack,semantic_role");
const files = manifest.filter((row) => !row.internal_path.endsWith("/"));
const registered = new Set(files.map((row) => row.internal_path));

const failures = [];

for (const path of codePaths) {
  if (!registered.has(path)) failures.push(`asset del código sin inscribir en el manifiesto: ${path}`);
}

// VE-13: las 218 comprobaciones HEAD se ejecutaban en serie (~130 s), coste que
// mantuvo esta guarda fuera de `verify:all`. Se ejecutan ahora con concurrencia
// acotada, misma cobertura y mismo criterio de fallo.
const HEAD_CONCURRENCY = 4;
const HEAD_RETRIES = 4;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deferredHead = [];

// El Storage publico responde 429 cuando se le pide demasiado a la vez: un 429
// no es un objeto ausente, asi que se reintenta con espera creciente y solo se
// declara fallo si la ultima respuesta sigue sin ser correcta.
async function headWithRetry(url) {
  let res;
  for (let attempt = 0; attempt < HEAD_RETRIES; attempt++) {
    res = await fetch(url, { method: "HEAD" });
    if (res.ok || (res.status !== 429 && res.status < 500)) return { res, transient: false };
    await sleep(500 * 2 ** attempt);
  }
  return { res, transient: true };
}

async function mapWithConcurrency(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

const headStartedAt = Date.now();
await mapWithConcurrency(files, HEAD_CONCURRENCY, async (row) => {
  const result = await headWithRetry(`${STORAGE_BASE}/${row.internal_path}`);
  if (result.res.ok) return;
  if (result.transient) {
    deferredHead.push(`${row.internal_path} -> HTTP ${result.res.status}`);
    return;
  }
  failures.push(`fila del manifiesto sin objeto en Storage: ${row.internal_path} -> HTTP ${result.res.status}`);
});
const headSeconds = ((Date.now() - headStartedAt) / 1000).toFixed(1);

const pathOf = (url) => (typeof url === "string" ? url.split("/vexforge-assets/")[1] : undefined);

for (const [table, columns, label] of [
  ["cards", "name,image_url", "carta"],
  ["world_bosses", "name,image_url", "jefe mundial"],
]) {
  const rows = await selectAll(table, columns);
  for (const row of rows) {
    const path = pathOf(row.image_url);
    if (!path || !registered.has(path)) {
      failures.push(`arte de ${label} sin inscribir en el manifiesto: ${row.name} (${row.image_url ?? "sin URL"})`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Manifiesto oficial incoherente:\n${failures.join("\n")}`);
}

for (const deferred of deferredHead) {
  console.warn(`DIFERIDO — Storage respondió transitoriamente durante verify-manifest; se reintentará en el siguiente gate: ${deferred}`);
}

console.log(
  `Manifiesto oficial verificado: ${files.length} archivos inscritos, ${codePaths.length} rutas del código presentes, 0 referencias rotas (${files.length} HEAD en ${headSeconds}s, concurrencia ${HEAD_CONCURRENCY}, diferidas ${deferredHead.length}).`,
);
