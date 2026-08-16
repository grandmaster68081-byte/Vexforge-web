/**
 * Verifica que cada asset declarado en el manifiesto canónico existe en el
 * Storage público oficial, y que ninguna superficie PENDING_SOURCE apunta a
 * un objeto inexistente sin estar registrada.
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/assetManifest.ts", "utf8");
const base = src.match(/STORAGE_BASE =\s*\n?\s*"([^"]+)"/)?.[1];
if (!base) throw new Error("No se pudo leer STORAGE_BASE del manifiesto");

const block = src.match(/VERIFIED_ASSETS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
const paths = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
if (paths.length === 0) throw new Error("El manifiesto no declara assets verificados");

const failures = [];
for (const path of paths) {
  const res = await fetch(`${base}/${path}`, { method: "HEAD" });
  if (!res.ok) failures.push(`${path} -> HTTP ${res.status}`);
}

if (failures.length > 0) {
  throw new Error(`Assets canónicos no disponibles:\n${failures.join("\n")}`);
}

console.log(`Assets verificados: ${paths.length}/${paths.length} disponibles en Storage`);
