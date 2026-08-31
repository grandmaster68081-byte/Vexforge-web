/** VE-VIS-3-EMPTY-STATE-ART — shared state identity guard. */
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "src/shared/components/ForgeStateArt.tsx",
  "src/shared/components/EmptyState.tsx",
  "src/shared/components/ErrorState.tsx",
  "src/shared/components/BlockedAuthState.tsx",
  "src/shared/components/PageLoader.tsx",
  "src/styles.css",
];
const missingFiles = requiredFiles.filter((path) => !existsSync(path));
if (missingFiles.length) throw new Error(`Faltan archivos del contrato de estados: ${missingFiles.join(", ")}`);

const art = readFileSync("src/shared/components/ForgeStateArt.tsx", "utf8");
const empty = readFileSync("src/shared/components/EmptyState.tsx", "utf8");
const error = readFileSync("src/shared/components/ErrorState.tsx", "utf8");
const blocked = readFileSync("src/shared/components/BlockedAuthState.tsx", "utf8");
const loader = readFileSync("src/shared/components/PageLoader.tsx", "utf8");
const styles = readFileSync("src/styles.css", "utf8");

const variants = ["empty", "loading", "error", "locked"];
const result = {
  variants: variants.filter((variant) => art.includes(`"${variant}"`)).length,
  sharedConsumers: {
    empty: empty.includes("ForgeStateArt") && empty.includes('data-forge-state="empty"'),
    error: error.includes("ForgeStateArt") && error.includes('data-forge-state="error"'),
    blocked: blocked.includes("ForgeStateArt") && blocked.includes("variant=\"locked\""),
    loading: loader.includes('data-forge-state-art="loading"') && loader.includes('aria-busy="true"'),
  },
  css: {
    mark: styles.includes(".forge-state-art-mark"),
    reducedMotion: styles.includes(".forge-state-art-mark") && styles.includes("@media (prefers-reduced-motion: reduce)"),
    legacyCoverage: styles.includes(".empty-state::before"),
  },
};
console.log(JSON.stringify(result, null, 2));
if (result.variants !== 4 || Object.values(result.sharedConsumers).some((value) => !value) || Object.values(result.css).some((value) => !value)) {
  throw new Error("Contrato de arte de estados incompleto.");
}
console.log("State art verified: 4 variants, shared consumers, legacy coverage, and reduced-motion fallback.");
