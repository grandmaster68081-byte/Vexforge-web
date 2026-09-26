import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const scanRoots = [path.join(root, "src"), path.join(root, "public")];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|css|html|json|md|mjs|svg)$/i.test(entry.name)) files.push(full);
  }
}
scanRoots.forEach(walk);
const text = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
const failures = [];

const forbiddenLegacy = [
  /ProtectedAdminRoute/i, /AuthProvider/i, /getSession\(\)/i, /Authorization:\s*Bearer/i,
  /service_role/i, /SUPABASE_ANON_KEY/i, /VITE_SUPABASE_ANON_KEY/i, /SUPABASE_SERVICE_ROLE/i,
  /admin[_-]?key/i, /secret[_-]?key/i, /private[_-]?key/i,
  /\/admin(?:["'`\/]|\b)/i, /\/withdrawal(?:["'`\/]|\b)/i, /\/deposit(?:["'`\/]|\b)/i,
  /\/inventory(?:["'`\/]|\b)/i, /\/deck-builder(?:["'`\/]|\b)/i,
  /\/market(?:["'`\/]|\b)/i, /\/pvp(?:["'`\/]|\b)/i, /\/nft(?:["'`\/]|\b)/i,
];
for (const re of forbiddenLegacy) if (re.test(text)) failures.push(`forbidden pattern: ${re}`);

const externalUrls = [...text.matchAll(/https?:\/\/[^\s'"`<>)]*/g)].map((m) => m[0].replace(/[),.;]+$/, ""));
const allowedHosts = new Set(["rscuzqnfccqvltkdcdny.supabase.co", "fonts.googleapis.com", "fonts.gstatic.com", "vexforge-web.pages.dev", "www.w3.org", "www.sitemaps.org"]);
for (const raw of externalUrls) {
  if (raw.includes("${")) continue;
  try { if (!allowedHosts.has(new URL(raw).hostname)) failures.push(`unexpected external host: ${new URL(raw).hostname}`); }
  catch { failures.push(`malformed external URL: ${raw}`); }
}

function assetsMatchCardsOnly(fullText) {
  const storage = 'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/';
  const hits = [];
  for (const file of files) {
    const rel = path.relative(root, file);
    if (!['src/lib/cards.ts'].includes(rel)) {
      const body = fs.readFileSync(file, 'utf8');
      if (body.includes(storage)) hits.push(rel);
    }
  }
  return hits.length === 0;
}

const assets = fs.readFileSync(path.join(root, "src/lib/assets.ts"), "utf8");
if (!assets.includes('googlePlay: ""') || !assets.includes('directAndroid: ""')) failures.push("download targets are not empty");
if (assets.includes("rscuzqnfccqvltkdcdny.supabase.co")) failures.push("Supabase must not be referenced by platform assets.ts");
if (!text.includes("className=\"headerDownload\"")) failures.push("header download route missing");
if (!text.includes("prefers-reduced-motion")) failures.push("reduced-motion fallback missing");
if (!text.includes("fetchPriority")) failures.push("image priority treatment missing");
if (!text.includes("v53Hero")) failures.push("V5.4 hero missing");

const rasterExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".mp4"]);
for (const file of files) {
  const rel = path.relative(root, file);
  if (rasterExt.has(path.extname(file).toLowerCase()) && !rel.startsWith('public/art/')) failures.push(`unexpected local raster payload outside public/art: ${rel}`);
}
if (!fs.existsSync(path.join(root, 'public/art/portal/01-home-citadel-dawn.jpg'))) failures.push('V5.6 local portal art missing');
if (!fs.existsSync(path.join(root, 'public/art/references/REF_A_SWEeping_CITADEL.png'))) failures.push('V5.6 reference art missing');
if (!assetsMatchCardsOnly(text)) failures.push('non-card Supabase storage reference found');
const css = fs.readFileSync(path.join(root, "src/styles/portal.css"), "utf8");
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
if (open !== close) failures.push(`CSS brace mismatch: ${open}/${close}`);
if (css.includes("/* ========================= V4 / TIER 1 VISUAL RESET")) failures.push("V4 reset was not removed");
if (failures.length) {
  console.error("QUALITY VERIFY FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`QUALITY VERIFY PASS — ${files.length} portal files scanned; V5.6 visual/source contract passed.`);
