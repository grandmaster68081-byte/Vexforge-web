/**
 * VE-8-IDENTITY-DATA-GUARD — verificación pública de identidad de datos.
 *
 * Lee únicamente el payload público servido por Supabase con el rol anon.
 * No usa service_role, Management API, sesiones fabricadas ni escrituras.
 * Los campos legacy_icon y vexforge_icon_legacy son respaldos reversibles y
 * quedan fuera de la identidad visible por decisión canónica VE-8.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";
const TABLES = [
  "cards",
  "achievements",
  "missions",
  "world_bosses",
  "vexforge_shop_catalog",
  "vexforge_pack_catalog",
  "relics",
  "clans",
  "factions",
];
const EXCLUDED_KEYS = new Set(["legacy_icon", "vexforge_icon_legacy"]);
const GENERIC_UNICODE = /[\u{1F300}-\u{1FAFF}\u{2300}-\u{23FF}\u{2190}-\u{21FF}\u{2500}-\u{257F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
const headers = {
  apikey: ANON_KEY,
  Authorization: "Bearer " + ANON_KEY,
};

async function selectAll(table) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/" + table + "?select=*",
      {
        headers: { ...headers, Range: from + "-" + (from + pageSize - 1) },
      },
    );
    if (!response.ok) {
      throw new Error("Lectura pública de " + table + " -> HTTP " + response.status);
    }
    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

const violations = [];
let rowCount = 0;
let scannedLeafValues = 0;

function scan(value, path, table, rowId) {
  if (typeof value === "string") {
    scannedLeafValues += 1;
    if (GENERIC_UNICODE.test(value)) {
      violations.push({
        table,
        rowId,
        path: path || "<row>",
        sample: value.slice(0, 120),
      });
    }
    return;
  }
  if (value === null || typeof value !== "object") {
    scannedLeafValues += 1;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scan(item, path + "[" + index + "]", table, rowId));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (EXCLUDED_KEYS.has(key)) continue;
    scan(child, path ? path + "." + key : key, table, rowId);
  }
}

for (const table of TABLES) {
  const rows = await selectAll(table);
  rowCount += rows.length;
  for (const row of rows) {
    const rowId = row.id ?? row.code ?? row.pack_key ?? row.item_key ?? row.boss_code ?? "unknown";
    scan(row, "", table, rowId);
  }
  console.log(table + ": " + rows.length + " filas públicas");
}

const result = {
  tables: TABLES.length,
  rows: rowCount,
  scannedLeafValues,
  violations: violations.length,
  examples: violations.slice(0, 20),
};

console.log(JSON.stringify(result, null, 2));
if (violations.length > 0) {
  throw new Error("La identidad de datos pública contiene " + violations.length + " valor(es) Unicode genérico(s).");
}

console.log("Identidad de datos verificada: 0 violaciones en el payload público.");
