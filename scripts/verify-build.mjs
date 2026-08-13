import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const manifestPath = "dist/build-manifest.json";
const indexPath = "dist/index.html";

if (!existsSync(manifestPath) || !existsSync(indexPath)) {
  throw new Error("Build incompleto: falta dist/build-manifest.json o dist/index.html");
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const expectedCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();

if (manifest.project !== "VEXFORGE" || manifest.outputDirectory !== "dist") {
  throw new Error("Manifest de build inválido: proyecto o salida no canónicos");
}

if (!manifest.sourceCommit || manifest.sourceCommit === "unknown") {
  throw new Error("El build no contiene un commit fuente verificable");
}

if (manifest.sourceCommit !== expectedCommit) {
  throw new Error(
    `El build no corresponde a HEAD: ${manifest.sourceCommit} !== ${expectedCommit}`,
  );
}

const index = readFileSync(indexPath, "utf8");
const assetReferences = [
  ...index.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g),
].map((match) => match[1]);

if (assetReferences.length === 0) {
  throw new Error("El index generado no referencia assets compilados");
}

const missingAssets = assetReferences.filter(
  (asset) => !existsSync(`dist/assets/${asset}`),
);

if (missingAssets.length > 0) {
  throw new Error(`Faltan assets referenciados por el index: ${missingAssets.join(", ")}`);
}

console.log(
  `Build verificado: ${manifest.sourceCommit} (${assetReferences.length} assets raíz)`,
);