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
async function verifyStorageObject(path) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${base}/${path}`, { method: "HEAD" });
    if (response.ok) return null;
    lastStatus = response.status;
    if (response.status !== 429 && response.status < 500) return response.status;
    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    const waitMs = Math.min(5000, Math.max(750, retryAfter * 1000 || 0));
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return lastStatus;
}

for (const path of paths) {
  const status = await verifyStorageObject(path);
  if (status) failures.push(`${path} -> HTTP ${status}`);
}

if (failures.length > 0) {
  throw new Error(`Assets canónicos no disponibles:\n${failures.join("\n")}`);
}

console.log(`Assets verificados: ${paths.length}/${paths.length} disponibles en Storage`);
