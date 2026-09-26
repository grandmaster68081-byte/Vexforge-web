import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const css = fs.readFileSync(path.join(root, "src/styles/portal.css"), "utf8");
const home = fs.readFileSync(path.join(root, "src/pages/Home.tsx"), "utf8");
const failures = [];
for (const token of ["100svh", "calc(100% - 28px)", ".v53Hero", ".v53GatewayGrid", ".v53FactionRail", ".v53WorldReveal", ".v53WorldAtlas__rail", "overflow-x:auto", "scroll-snap-type:x mandatory", "@media(max-width:560px)"]) {
  if (!css.includes(token)) failures.push(`missing responsive visual token: ${token}`);
}
for (const token of ["v53Hero", "v53Prologue", "v53Gateways", "v53Vault", "v53Factions", "v53WorldReveal", "v53Download"]) {
  if (!home.includes(token)) failures.push(`missing home composition: ${token}`);
}
if (!css.includes("aspect-ratio:2/3")) failures.push("TCG card ratio contract missing");
if (css.includes(".homeHeroV4") || css.includes(".portalCloseV4") || css.includes("V4 / TIER 1 VISUAL RESET")) failures.push("legacy V4 visual contract remains in public stylesheet");
if (failures.length) {
  console.error("RESPONSIVE CONTRACT FAILED");
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}
console.log("RESPONSIVE CONTRACT PASS — V5.4 world-class art-directed desktop/mobile composition rules are present.");
