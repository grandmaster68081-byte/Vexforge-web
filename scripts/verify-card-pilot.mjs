/**
 * VE-3-PILOT — provenance and consumer guard for the three canonical cards.
 *
 * This check reads only public Supabase payloads and local source. It never
 * writes data, fabricates card metadata, or treats a visual treatment as game
 * authority. Storage probes retry transient responses and report deferred
 * checks explicitly without treating a missing object as present.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  "https://rscuzqnfccqvltkdcdny.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/vexforge-assets`;
const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const pilotCodes = ["VEX-0016", "VEX-0017", "VEX-0097"];
const requiredFields = [
  "id",
  "code",
  "name",
  "faction",
  "rarity",
  "specialization",
  "power",
  "affinity",
  "prestige",
  "charge",
  "image_url",
  "card_domain",
  "release_status",
  "synergy_json",
];

async function select(table, query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`lectura pública de ${table} -> HTTP ${response.status}`);
  }
  return response.json();
}

function pathFromImageUrl(imageUrl) {
  if (typeof imageUrl !== "string" || imageUrl.length === 0) return null;
  const marker = "/vexforge-assets/";
  const index = imageUrl.indexOf(marker);
  return index === -1 ? null : imageUrl.slice(index + marker.length);
}

const cards = await select(
  "cards",
  `select=${encodeURIComponent(requiredFields.join(","))}&code=in.(${pilotCodes.join(",")})&active=eq.true`,
);
const failures = [];
const byCode = new Map(cards.map((card) => [card.code, card]));

for (const code of pilotCodes) {
  const card = byCode.get(code);
  if (!card) {
    failures.push(`carta piloto ausente o inactiva: ${code}`);
    continue;
  }
  for (const field of requiredFields) {
    if (card[field] === null || card[field] === undefined || card[field] === "") {
      failures.push(`${code} sin campo canónico requerido: ${field}`);
    }
  }
  if (card.card_domain !== "canonical") {
    failures.push(`${code} no tiene card_domain=canonical`);
  }
  const keywords = card.synergy_json?.keywords;
  if (!Array.isArray(keywords) || keywords.length === 0) {
    failures.push(`${code} sin keywords en synergy_json`);
  }
}

const paths = cards.map((card) => pathFromImageUrl(card.image_url)).filter(Boolean);
if (paths.length !== new Set(paths).size) {
  failures.push("las cartas piloto comparten o repiten una ruta de arte");
}
if (paths.some((path) => !path.startsWith("cards/"))) {
  failures.push("una imagen piloto está fuera del prefijo canónico cards/");
}

const manifest = await select(
  "vexforge_official_asset_manifest",
  `select=internal_path,semantic_role,official,enabled&internal_path=in.(${paths.join(",")})`,
);
const manifestByPath = new Map(manifest.map((row) => [row.internal_path, row]));
const warnings = [];

async function verifyStorageObject(path) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${STORAGE_BASE}/${path}`, { method: "HEAD" });
    if (response.ok) return { status: 0, deferred: false };
    lastStatus = response.status;
    if (response.status !== 429 && response.status < 500) {
      return { status: response.status, deferred: false };
    }
    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    const fallbackWait = 750 * 2 ** attempt;
    const waitMs = Math.min(
      5000,
      Math.max(750, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : fallbackWait),
    );
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return { status: lastStatus, deferred: true };
}

for (const path of paths) {
  const row = manifestByPath.get(path);
  if (!row) {
    failures.push(`arte piloto no inscrito en el manifiesto: ${path}`);
  } else if (
    row.semantic_role !== "card_art" ||
    row.official !== true ||
    row.enabled !== true
  ) {
    failures.push(`arte piloto no es card_art oficial habilitado: ${path}`);
  }
  const storage = await verifyStorageObject(path);
  if (storage.status && storage.deferred) {
    warnings.push(`comprobación de Storage diferida por respuesta transitoria: ${path} -> HTTP ${storage.status}`);
  } else if (storage.status) {
    failures.push(`arte piloto no disponible en Storage: ${path} -> HTTP ${storage.status}`);
  }
}

const routeSource = readFileSync(join("src", "routes", "CardsRoute.tsx"), "utf8");
const pilotSource = readFileSync(join("src", "lib", "cardPilot.ts"), "utf8");
const battleSource = readFileSync(
  join("src", "components", "battle", "BattleCard.tsx"),
  "utf8",
);
for (const [label, source, markers] of [
  ["CardsRoute", routeSource, ["card.image_url", "card.rarity", "card.faction"]],
  ["BattleCard", battleSource, ["unit.image_url", "unit.rarity", "unit.faction"]],
]) {
  for (const marker of markers) {
    if (!source.includes(marker)) {
      failures.push(`${label} dejó de consumir datos reales: ${marker}`);
    }
  }
}
for (const code of pilotCodes) {
  if (!pilotSource.includes(`"${code}"`)) {
    failures.push(`registro authored ausente para ${code}`);
  }
}
if (!pilotSource.includes("getCardPilotIdentity") || !routeSource.includes("getCardPilotIdentity")) {
  failures.push("el tratamiento authored no está conectado a CardsRoute");
}
if (routeSource.match(/["'`]cards\/[^"'`]+["'`]/)) {
  failures.push("CardsRoute contiene una ruta cards/ literal fuera del dato");
}

console.log(
  JSON.stringify(
    {
      pilot: pilotCodes,
      cards: cards.length,
      manifest: manifest.length,
      storageObjects: paths.length,
      consumerChecks: 2,
      failures: failures.length,
      warnings: warnings.length,
    },
    null,
    2,
  ),
);

if (failures.length > 0) {
  console.error("VE-3-PILOT FAIL");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn("VE-3-PILOT WARN — datos y manifiesto válidos; algunas comprobaciones de Storage quedaron diferidas por rate limiting/transitorio.");
  for (const warning of warnings) console.warn(` - ${warning}`);
} else {
  console.log(
    "VE-3-PILOT OK — tres cartas canónicas, arte oficial y consumidores data-driven verificados.",
  );
}
