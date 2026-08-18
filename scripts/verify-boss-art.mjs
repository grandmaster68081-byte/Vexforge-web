/**
 * VE-9-BOSS-ART-VARIANT-DECISION — guarda del arte canónico de jefes mundiales.
 *
 * Decisión canónica verificada aquí:
 *   1. El arte canónico de cada jefe es la fila `world_boss_art` inscrita en
 *      `vexforge_official_asset_manifest` con official = true y enabled = true,
 *      y es la única que puede aparecer en `world_bosses.image_url`.
 *   2. Las 15 filas `world_boss_art_variant` son arte alternativo en reserva:
 *      permanecen inscritas y oficiales, pero con enabled = false. No se
 *      consumen desde el dato del juego ni desde el código, y no se sustituyen
 *      automáticamente por el arte canónico.
 *   3. Ningún archivo de jefe inscrito puede faltar en el Storage oficial.
 *
 * Lee sólo el payload público (rol anon) y el código del repositorio.
 * No usa service_role, Management API, sesiones fabricadas ni escrituras.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";
const STORAGE_BASE = SUPABASE_URL + "/storage/v1/object/public/vexforge-assets";
const headers = { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY };

async function select(table, columns) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=" + columns, { headers });
  if (!response.ok) {
    throw new Error("Lectura pública de " + table + " -> HTTP " + response.status);
  }
  return response.json();
}

const manifest = await select(
  "vexforge_official_asset_manifest",
  "asset_code,internal_path,semantic_role,official,enabled",
);
const canonical = manifest.filter((row) => row.semantic_role === "world_boss_art");
const variants = manifest.filter((row) => row.semantic_role === "world_boss_art_variant");
const canonicalPaths = new Set(canonical.map((row) => row.internal_path));
const variantPaths = new Set(variants.map((row) => row.internal_path));

const failures = [];

if (canonical.length === 0) failures.push("no hay arte canónico de jefe inscrito en el manifiesto");

for (const row of canonical) {
  if (row.official !== true || row.enabled !== true) {
    failures.push("arte canónico deshabilitado o no oficial: " + row.internal_path);
  }
}

for (const row of variants) {
  if (row.official !== true) failures.push("variante marcada como no oficial: " + row.internal_path);
  if (row.enabled !== false) {
    failures.push("variante habilitada como canónica sin decisión: " + row.internal_path);
  }
}

const bosses = await select("world_bosses", "name,image_url");
for (const boss of bosses) {
  const path = typeof boss.image_url === "string" ? boss.image_url.split("/vexforge-assets/").pop() : undefined;
  if (!path) {
    failures.push("jefe sin arte asignado: " + boss.name);
    continue;
  }
  if (variantPaths.has(path)) {
    failures.push("jefe consumiendo arte en reserva: " + boss.name + " -> " + path);
  } else if (!canonicalPaths.has(path)) {
    failures.push("jefe con arte fuera del manifiesto canónico: " + boss.name + " -> " + path);
  }
}

for (const path of [...canonicalPaths, ...variantPaths]) {
  const head = await fetch(STORAGE_BASE + "/" + path, { method: "HEAD" });
  if (!head.ok) failures.push("archivo de jefe inscrito y ausente en Storage: " + path + " -> HTTP " + head.status);
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx|json)$/.test(entry)) files.push(full);
  }
  return files;
}

for (const file of walk("src")) {
  const content = readFileSync(file, "utf8");
  for (const path of variantPaths) {
    if (content.includes(path)) failures.push("código consumiendo arte en reserva: " + file + " -> " + path);
  }
}

console.log(
  "VE-9 arte de jefes | canónicos: " +
    canonical.length +
    " | variantes en reserva: " +
    variants.length +
    " | jefes verificados: " +
    bosses.length,
);

if (failures.length > 0) {
  console.error("FALLO — arte de jefes fuera de la decisión canónica:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("OK — arte canónico intacto y variantes en reserva sin consumir.");
