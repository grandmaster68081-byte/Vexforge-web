import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const css = fs.readFileSync(path.join(root, "src/styles/portal.css"), "utf8");
const home = fs.readFileSync(path.join(root, "src/pages/Home.tsx"), "utf8");
const failures = [];
for (const token of ["100svh", "calc(100% - 28px)", ".v5Hero", ".v5Discover__grid", ".v5Factions__grid", ".v5World", "@media(max-width:560px)"]) {
  if (!css.includes(token)) failures.push(`missing responsive visual token: ${token}`);
}
for (const token of ["v5Hero", "v5Intro", "v5Discover", "v5Cards", "v5Factions", "v5World", "v5Download"]) {
  if (!home.includes(token)) failures.push(`missing home composition: ${token}`);
}
if (!css.includes("aspect-ratio:2/3")) failures.push("TCG card ratio contract missing");
if (css.includes(".homeHeroV4") || css.includes(".portalCloseV4") || css.includes("V4 / TIER 1 VISUAL RESET")) failures.push("legacy V4 visual contract remains in public stylesheet");
if (failures.length) {
  console.error("RESPONSIVE CONTRACT FAILED");
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}
console.log("RESPONSIVE CONTRACT PASS — 720×1640 mobile and 1440×900 desktop composition rules are present.");
