/**
 * VE-11-SURFACE-ART-PROVENANCE — guarda del arte canónico de superficie.
 *
 * Roles cubiertos: route_hero, route_background, region_art, faction_icon,
 * faction_background, season_banner.
 *
 * Decisión canónica verificada aquí:
 *   1. Todo arte de superficie inscrito es official = true, enabled = true y
 *      existe en el Storage oficial.
 *   2. Toda ruta declarada en `VERIFIED_ASSETS` bajo un prefijo de superficie
 *      está inscrita en el manifiesto oficial.
 *   3. El arte de superficie inscrito y no consumido está declarado en
 *      `RESERVED_SURFACE_ART`: no hay arte oficial perdido ni sustituido.
 *   4. Ningún archivo de `src` fija rutas de superficie en literales crudos:
 *      el único acceso admitido es `storageAsset()` o los mapas exportados por
 *      `src/lib/assetManifest.ts`, nunca emblemas locales de `public/`.
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

const SURFACE_ROLES = [
  "route_hero",
  "route_background",
  "region_art",
  "faction_icon",
  "faction_background",
  "season_banner",
];
const SURFACE_PREFIXES = ["heroes/", "backgrounds/", "regions/", "factions/", "events/"];

const response = await fetch(
  SUPABASE_URL +
    "/rest/v1/vexforge_official_asset_manifest?select=asset_code,internal_path,semantic_role,official,enabled",
  { headers },
);
if (!response.ok) throw new Error("Lectura pública del manifiesto -> HTTP " + response.status);
const manifest = await response.json();
const surface = manifest.filter((row) => SURFACE_ROLES.includes(row.semantic_role));

const failures = [];
if (surface.length === 0) failures.push("no hay arte de superficie inscrito en el manifiesto");

const inscribed = new Set();
for (const row of surface) {
  if (row.official !== true || row.enabled !== true) {
    failures.push("arte de superficie no oficial o deshabilitado: " + row.internal_path);
  }
  if (!SURFACE_PREFIXES.some((prefix) => row.internal_path.startsWith(prefix))) {
    failures.push("arte de superficie fuera de prefijo canónico: " + row.internal_path);
  }
  if (inscribed.has(row.internal_path)) {
    failures.push("arte de superficie inscrito más de una vez: " + row.internal_path);
  }
  inscribed.add(row.internal_path);
}

const source = readFileSync("src/lib/assetManifest.ts", "utf8");
const verified = [
  ...(source.match(/VERIFIED_ASSETS = \[([\s\S]*?)\] as const/)?.[1] ?? "").matchAll(/"([^"]+)"/g),
].map((match) => match[1]);
const reserved = [
  ...(source.match(/RESERVED_SURFACE_ART[\s\S]*?\[([\s\S]*?)\];/)?.[1] ?? "").matchAll(/"([^"]+)"/g),
].map((match) => match[1]);

const consumed = new Set();
for (const path of verified) {
  if (!SURFACE_PREFIXES.some((prefix) => path.startsWith(prefix))) continue;
  if (!inscribed.has(path)) {
    failures.push("superficie consumida y no inscrita en el manifiesto oficial: " + path);
    continue;
  }
  consumed.add(path);
}

for (const path of reserved) {
  if (!inscribed.has(path)) failures.push("reserva declarada sin fila en el manifiesto: " + path);
  if (consumed.has(path)) failures.push("arte declarado en reserva y consumido a la vez: " + path);
}

for (const path of inscribed) {
  if (!consumed.has(path) && !reserved.includes(path)) {
    failures.push("arte de superficie inscrito, no consumido y no declarado en reserva: " + path);
  }
}

for (const path of inscribed) {
  const head = await fetch(STORAGE_BASE + "/" + path, { method: "HEAD" });
  if (!head.ok) failures.push("arte de superficie ausente en Storage: " + path + " -> HTTP " + head.status);
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) files.push(full);
  }
  return files;
}

const literal = new RegExp(
  '["\'`](?:/|\\$\\{[A-Za-z_$][\\w$]*\\}/)?(?:' +
    SURFACE_PREFIXES.map((prefix) => prefix.replace("/", "\\/")).join("|") +
    ')[A-Za-z0-9_.-]+\\.(?:jpg|jpeg|png|webp|avif)',
);
for (const file of walk("src")) {
  if (file.endsWith("lib/assetManifest.ts")) continue;
  // Las llamadas tipadas storageAsset("...") resuelven desde el manifiesto y son la vía canónica.
  const contents = readFileSync(file, "utf8").replace(/storageAsset\(\s*"[^"]+"\s*\)/g, "storageAsset()");
  const match = contents.match(literal);
  if (match) failures.push("ruta de arte de superficie fijada fuera del manifiesto: " + file + " -> " + match[0]);
}

if (failures.length > 0) {
  throw new Error("Procedencia de arte de superficie rota:\n" + failures.join("\n"));
}

console.log(
  "VE-11 arte de superficie | inscritos: " +
    inscribed.size +
    " | consumidos: " +
    consumed.size +
    " | en reserva: " +
    reserved.length +
    " | OK",
);
