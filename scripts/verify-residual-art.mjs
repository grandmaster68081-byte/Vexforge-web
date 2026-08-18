/**
 * VE-12-RESIDUAL-ART-PROVENANCE — guarda del arte residual del manifiesto.
 *
 * Cubre todos los roles del manifiesto oficial que no verifican las guardas de
 * jefes (`verify:boss-art`), cartas (`verify:card-art`) ni superficie
 * (`verify:surface-art`): boost_*, frame_*, icon_*, logo_variant_*,
 * progression_*, reward_*, chest_hero, cover_hero, lobby_hero, market_hero,
 * tutorial_hero, wallet_hero y las filas `*_collection`.
 *
 * Decisión canónica verificada aquí:
 *   1. Todo rol del manifiesto queda cubierto por una guarda: no hay rol huérfano.
 *   2. Todo arte residual es official = true, enabled = true y existe en Storage.
 *   3. Las filas `*_collection` son marcadores de prefijo, no objetos: están
 *      declaradas en `MANIFEST_BUNDLE_PREFIXES` y nunca se sirven como imagen.
 *   4. Todo arte residual consumido está inscrito, y todo arte residual inscrito
 *      y no consumido está declarado en `RESERVED_RESIDUAL_ART`.
 *   5. Ningún archivo de `src` fija rutas residuales en literales crudos, y no
 *      queda arte local en `public/` suplantando arte oficial de facción.
 *
 * Lee sólo el payload público (rol anon) y el código del repositorio.
 * No usa service_role, Management API, sesiones fabricadas ni escrituras.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";
const STORAGE_BASE = SUPABASE_URL + "/storage/v1/object/public/vexforge-assets";
const headers = { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY };

/** Roles ya verificados por guardas propias. */
const GUARDED_ELSEWHERE = new Set([
  "world_boss_art",
  "world_boss_art_variant",
  "card_art",
  "route_hero",
  "route_background",
  "region_art",
  "faction_icon",
  "faction_background",
  "season_banner",
]);

const RESIDUAL_PREFIXES = [
  "boosts/",
  "chests/",
  "clans/",
  "cover/",
  "founders/",
  "frames/",
  "icons/",
  "lobby/",
  "logo/",
  "market/",
  "misc/",
  "progression/",
  "rewards/",
  "sessions/",
  "tutorial/",
  "ui sistema/",
  "wallet/",
  "backgrounds/",
  "events/",
];

const response = await fetch(
  SUPABASE_URL +
    "/rest/v1/vexforge_official_asset_manifest?select=asset_code,internal_path,semantic_role,official,enabled&limit=1000",
  { headers },
);
if (!response.ok) throw new Error("Lectura pública del manifiesto -> HTTP " + response.status);
const manifest = await response.json();

const failures = [];
const residual = manifest.filter((row) => !GUARDED_ELSEWHERE.has(row.semantic_role));
if (residual.length === 0) failures.push("no hay arte residual inscrito en el manifiesto");

const source = readFileSync("src/lib/assetManifest.ts", "utf8");
function listFrom(name) {
  const body = source.match(new RegExp(name + "[\\s\\S]*?\\[([\\s\\S]*?)\\];"))?.[1] ?? "";
  return [...body.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}
const verified = [
  ...(source.match(/VERIFIED_ASSETS = \[([\s\S]*?)\] as const/)?.[1] ?? "").matchAll(/"([^"]+)"/g),
].map((match) => match[1]);
const reserved = listFrom("RESERVED_RESIDUAL_ART");
const bundlesDeclared = listFrom("MANIFEST_BUNDLE_PREFIXES");
const surfaceReserved = listFrom("RESERVED_SURFACE_ART");

const objects = new Set();
const bundles = new Set();
for (const row of residual) {
  if (row.official !== true || row.enabled !== true) {
    failures.push("arte residual no oficial o deshabilitado: " + row.internal_path);
  }
  if (!RESIDUAL_PREFIXES.some((prefix) => row.internal_path.startsWith(prefix))) {
    failures.push("arte residual fuera de prefijo canónico: " + row.internal_path);
  }
  if (row.internal_path.endsWith("/")) bundles.add(row.internal_path);
  else objects.add(row.internal_path);
}

for (const prefix of bundles) {
  if (!bundlesDeclared.includes(prefix)) {
    failures.push("marcador de prefijo sin declarar en MANIFEST_BUNDLE_PREFIXES: " + prefix);
  }
}
for (const prefix of bundlesDeclared) {
  if (!bundles.has(prefix)) failures.push("prefijo declarado sin fila en el manifiesto: " + prefix);
}

// Consumo: rutas residuales declaradas en VERIFIED_ASSETS (única vía de storageAsset).
const consumed = new Set();
for (const path of verified) {
  if (objects.has(path)) {
    consumed.add(path);
    continue;
  }
  const isResidualPrefix = RESIDUAL_PREFIXES.some((prefix) => path.startsWith(prefix));
  const inManifest = manifest.some((row) => row.internal_path === path);
  if (isResidualPrefix && !inManifest) {
    failures.push("asset consumido y no inscrito en el manifiesto oficial: " + path);
  }
}

for (const path of reserved) {
  if (!objects.has(path)) failures.push("reserva residual sin fila en el manifiesto: " + path);
  if (consumed.has(path)) failures.push("arte residual en reserva y consumido a la vez: " + path);
  if (surfaceReserved.includes(path)) {
    failures.push("arte declarado en dos reservas a la vez: " + path);
  }
}

for (const path of objects) {
  if (!consumed.has(path) && !reserved.includes(path)) {
    failures.push("arte residual inscrito, no consumido y no declarado en reserva: " + path);
  }
}

for (const path of objects) {
  const head = await fetch(STORAGE_BASE + "/" + encodeURI(path), { method: "HEAD" });
  if (!head.ok) {
    failures.push("arte residual ausente en Storage: " + path + " -> HTTP " + head.status);
  }
}

// Ningún rol del manifiesto queda sin guarda.
for (const row of manifest) {
  const guarded =
    GUARDED_ELSEWHERE.has(row.semantic_role) ||
    objects.has(row.internal_path) ||
    bundles.has(row.internal_path);
  if (!guarded) failures.push("fila del manifiesto sin guarda: " + row.internal_path);
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
    RESIDUAL_PREFIXES.map((prefix) => prefix.replace("/", "\\/")).join("|") +
    ")[A-Za-z0-9_. -]+\\.(?:jpg|jpeg|png|webp|avif)",
);
for (const file of walk("src")) {
  if (file.endsWith("lib/assetManifest.ts")) continue;
  const contents = readFileSync(file, "utf8").replace(
    /storageAsset\(\s*"[^"]+"\s*\)/g,
    "storageAsset()",
  );
  const match = contents.match(literal);
  if (match) failures.push("ruta de arte residual fijada fuera del manifiesto: " + file + " -> " + match[0]);
}

// Baja canónica de los emblemas locales suplantados por arte oficial inscrito.
if (existsSync("public/factions")) {
  failures.push("arte local de facción resucitado en public/factions: dado de baja en VE-12");
}

if (failures.length > 0) {
  throw new Error("Procedencia de arte residual rota:\n" + failures.join("\n"));
}

console.log(
  "VE-12 arte residual | filas: " +
    residual.length +
    " | objetos: " +
    objects.size +
    " | consumidos: " +
    consumed.size +
    " | en reserva: " +
    reserved.length +
    " | prefijos: " +
    bundles.size +
    " | manifiesto total: " +
    manifest.length +
    " | OK",
);
