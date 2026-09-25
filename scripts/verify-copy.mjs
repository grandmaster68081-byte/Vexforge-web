import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const roots = [path.join(root, "src/pages"), path.join(root, "src/data"), path.join(root, "src/components")];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
}
roots.forEach(walk);

const engineeringTerms = [
  /\bSupabase\b/i, /\bREST\b/i, /\bAPI(?: key)?\b/i, /\bdatabase\b/i, /\bbackend\b/i,
  /\bruntime\b/i, /\bUnity\b/i, /\bdeployment\b/i, /\bimplementation\b/i,
  /\bimplementation status\b/i, /\bbuild system\b/i, /\binternal asset\b/i,
  /\basset ID\b/i, /\bReplit\b/i, /\bVite\b/i, /\bTypeScript\b/i,
  /\bservice_role\b/i, /\bpublishable key\b/i, /\/rest\/v1\//i,
];
const weakOrInternalPhrases = [
  /PUBLICACIÓN PENDIENTE/i,
  /ARTE NO DISPONIBLE/i,
  /CUANDO SEA REAL/i,
  /ESPERANDO EL ARCHIVO/i,
  /SE ABRIRÁ PRONTO/i,
  /SOLO HABRÁ/i,
  /CUANDO LLEGUE EL MOMENTO/i,
  /EL ARCHIVO PÚBLICO/i,
];
const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const re of engineeringTerms) if (re.test(text)) hits.push(`${path.relative(root, file)} matches engineering term ${re}`);
  for (const re of weakOrInternalPhrases) if (re.test(text)) hits.push(`${path.relative(root, file)} matches weak/internal phrase ${re}`);
}
if (hits.length) {
  console.error("PUBLIC COPY VERIFY FAIL");
  hits.forEach((h) => console.error(h));
  process.exit(1);
}
console.log(`PUBLIC COPY VERIFY PASS — ${files.length} player-facing source files scanned.`);
