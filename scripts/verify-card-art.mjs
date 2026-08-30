/**
 * VE-10-CARD-ART-PROVENANCE — guarda del arte canónico de cartas.
 *
 * Decisión canónica verificada aquí:
 *   1. Toda fila de `cards` tiene arte asignado y ese arte está inscrito en
 *      `vexforge_official_asset_manifest` con semantic_role = 'card_art',
 *      official = true y enabled = true.
 *   2. La correspondencia es biyectiva: cada carta consume un arte distinto y
 *      no existe arte de carta inscrito sin carta que lo consuma.
 *   3. Ningún arte de carta inscrito puede faltar en el Storage oficial.
 *   4. El arte de carta se resuelve siempre desde el dato (`cards.image_url`);
 *      el código no fija rutas `cards/` literales.
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

function relativePath(imageUrl) {
  if (typeof imageUrl !== "string" || imageUrl.length === 0) return undefined;
  return imageUrl.split("/vexforge-assets/").pop();
}

const manifest = await select(
  "vexforge_official_asset_manifest",
  "asset_code,internal_path,semantic_role,official,enabled",
);
const cardArt = manifest.filter((row) => row.semantic_role === "card_art");
const cardArtPaths = new Set(cardArt.map((row) => row.internal_path));

const failures = [];

if (cardArt.length === 0) failures.push("no hay arte de carta inscrito en el manifiesto");

for (const row of cardArt) {
  if (row.official !== true || row.enabled !== true) {
    failures.push("arte de carta deshabilitado o no oficial: " + row.internal_path);
  }
  if (!row.internal_path.startsWith("cards/")) {
    failures.push("arte de carta fuera del prefijo canónico cards/: " + row.internal_path);
  }
}

const codeCounts = new Map();
for (const row of cardArt) {
  codeCounts.set(row.asset_code, (codeCounts.get(row.asset_code) ?? 0) + 1);
}
for (const [code, count] of codeCounts) {
  if (count > 1) failures.push("asset_code de carta inscrito más de una vez: " + code);
}

const cards = await select("cards", "id,name,image_url");
const consumed = new Map();
for (const card of cards) {
  const path = relativePath(card.image_url);
  if (!path) {
    failures.push("carta sin arte asignado: " + card.name);
    continue;
  }
  if (!cardArtPaths.has(path)) {
    failures.push("carta con arte fuera del manifiesto canónico: " + card.name + " -> " + path);
    continue;
  }
  consumed.set(path, [...(consumed.get(path) ?? []), card.name]);
}

for (const [path, names] of consumed) {
  if (names.length > 1) {
    failures.push("arte de carta compartido por varias cartas: " + path + " -> " + names.join(", "));
  }
}

for (const path of cardArtPaths) {
  if (!consumed.has(path)) failures.push("arte de carta inscrito y no consumido por ninguna carta: " + path);
}

async function verifyStorageObject(path) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(STORAGE_BASE + "/" + path, { method: "HEAD" });
    if (response.ok) return null;
    lastStatus = response.status;
    if (response.status !== 429 && response.status < 500) return response.status;
    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    const waitMs = Math.min(5000, Math.max(750, retryAfter * 1000 || 0));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return lastStatus;
}

for (const path of cardArtPaths) {
  const status = await verifyStorageObject(path);
  if (status) failures.push("arte de carta inscrito y ausente en Storage: " + path + " -> HTTP " + status);
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

const literal = /["'`]cards\/[A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|webp|avif)["'`]/;
for (const file of walk("src")) {
  const match = readFileSync(file, "utf8").match(literal);
  if (match) failures.push("ruta de arte de carta fijada en código: " + file + " -> " + match[0]);
}

console.log(
  "VE-10 arte de cartas | inscritos: " +
    cardArt.length +
    " | cartas verificadas: " +
    cards.length +
    " | consumos únicos: " +
    consumed.size,
);

if (failures.length > 0) {
  console.error("FALLO — arte de cartas fuera de la decisión canónica:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("OK — arte de cartas biyectivo, inscrito, presente en Storage y resuelto desde el dato.");
