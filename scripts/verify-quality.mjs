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
    else files.push(full);
  }
}
scanRoots.forEach(walk);

const text = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
const failures = [];

const forbiddenLegacy = [
  /ProtectedAdminRoute/i,
  /AuthProvider/i,
  /getSession\(\)/i,
  /Authorization:\s*Bearer/i,
  /service_role/i,
  /SUPABASE_ANON_KEY/i,
  /VITE_SUPABASE_ANON_KEY/i,
  /SUPABASE_SERVICE_ROLE/i,
  /admin[_-]?key/i,
  /secret[_-]?key/i,
  /private[_-]?key/i,
  /\/admin(?:["'`/]|\b)/i,
  /\/withdrawal(?:["'`/]|\b)/i,
  /\/deposit(?:["'`/]|\b)/i,
  /\/inventory(?:["'`/]|\b)/i,
  /\/deck-builder(?:["'`/]|\b)/i,
  /\/market(?:["'`/]|\b)/i,
  /\/pvp(?:["'`/]|\b)/i,
  /\/nft(?:["'`/]|\b)/i,
];
for (const re of forbiddenLegacy) if (re.test(text)) failures.push(`forbidden pattern: ${re}`);

const externalUrls = [...text.matchAll(/https?:\/\/[^\s'"`<>)]*/g)].map((m) => m[0].replace(/[),.;]+$/, ""));
const allowedHosts = new Set(["rscuzqnfccqvltkdcdny.supabase.co", "fonts.googleapis.com", "fonts.gstatic.com", "vexforge-web.pages.dev", "www.w3.org", "www.sitemaps.org"]);
for (const raw of externalUrls) {
  try {
    const host = new URL(raw).hostname;
    if (!allowedHosts.has(host)) failures.push(`unexpected external host: ${host}`);
  } catch {
    failures.push(`malformed external URL: ${raw}`);
  }
}

const assets = fs.readFileSync(path.join(root, "src/lib/assets.ts"), "utf8");
if (!assets.includes('googlePlay: ""') || !assets.includes('directAndroid: ""')) failures.push("download targets are not empty");
if (!assets.includes("rscuzqnfccqvltkdcdny.supabase.co")) failures.push("canonical asset host missing");
if (!text.includes('headerDownload--disabled')) failures.push("disabled header download treatment missing");
if (!text.includes('prefers-reduced-motion')) failures.push("reduced-motion fallback missing");
if (!text.includes('fetchPriority')) failures.push("image priority treatment missing");

const rasterExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".mp4"]);
for (const file of files) if (rasterExt.has(path.extname(file).toLowerCase())) failures.push(`local raster payload: ${path.relative(root, file)}`);

const css = fs.readFileSync(path.join(root, "src/styles/portal.css"), "utf8");
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
if (open !== close) failures.push(`CSS brace mismatch: ${open}/${close}`);

if (failures.length) {
  console.error("QUALITY VERIFY FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`QUALITY VERIFY PASS — ${files.length} portal files scanned; no legacy/public-security violations found.`);
