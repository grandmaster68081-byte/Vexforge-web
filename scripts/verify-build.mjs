import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const dist = path.join(root, "dist");
if (!fs.existsSync(dist)) {
  console.error("Build verification failed: dist/ does not exist.");
  process.exit(1);
}
const indexPath = path.join(dist, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error("Build verification failed: dist/index.html does not exist.");
  process.exit(1);
}
const index = fs.readFileSync(indexPath, "utf8");
if (!index.includes("id=\"root\"")) {
  console.error("Build verification failed: root mount not found.");
  process.exit(1);
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(dist);
const text = files.filter((file) => /\.(html|css|js|json|svg|txt)$/i.test(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n");
const forbidden = [
  /PUBLICACIÓN PENDIENTE/i, /ARTE NO DISPONIBLE/i, /CUANDO SEA REAL/i, /ESPERANDO EL ARCHIVO/i,
  /SOLO HABRÁ/i, /CUANDO LLEGUE EL MOMENTO/i, /EL ARCHIVO PÚBLICO/i, /UNITY ANDROID/i,
  /SUPABASE PERMANECE/i, /INFORMACIÓN DE BACKEND/i,
];
const failures = forbidden.filter((re) => re.test(text)).map((re) => `forbidden built-surface token: ${re}`);
if (text.includes("V4 / TIER 1 VISUAL RESET") || text.includes("homeHeroV4")) failures.push("legacy V4 visual surface present in build");
if (failures.length) {
  console.error("BUILD VERIFY FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`BUILD VERIFY PASS — ${files.length} built files scanned with public-surface checks.`);
