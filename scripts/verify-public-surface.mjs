import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const dirs = ["src/pages", "src/components", "src/data"];
const extensions = new Set([".ts", ".tsx"]);
const forbidden = [
  /\bUnity\b/i, /\bSupabase\b/i, /\bREST\b/i, /\bAPI(?:\s*key)?\b/i, /\bdatabase\b/i,
  /\bbackend\b/i, /\bruntime\b/i, /\bdeployment\b/i, /\bbuild system\b/i, /\bimplementation\b/i,
  /\bReplit\b/i, /\bVite\b/i, /\bTypeScript\b/i, /\bGradle\b/i, /\bIL2CPP\b/i,
  /\bGitHub\b/i, /\brepository\b/i, /\benvironment variable\b/i, /\basset ID\b/i,
  /PUBLICACIÓN PENDIENTE/i, /ARTE NO DISPONIBLE/i, /CUANDO SEA REAL/i, /ESPERANDO EL ARCHIVO/i,
  /SOLO HABRÁ/i, /CUANDO LLEGUE EL MOMENTO/i, /EL ARCHIVO PÚBLICO/i, /UNITY ANDROID/i,
];
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (extensions.has(path.extname(name))) files.push(p);
  }
}
for (const dir of dirs) walk(path.join(root, dir));
const failures = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) failures.push(`${path.relative(root, file)}: ${pattern}`);
  }
}
if (failures.length) {
  console.error("PUBLIC SURFACE VERIFY FAIL");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log(`PUBLIC SURFACE VERIFY PASS — ${files.length} player-facing source files scanned.`);
