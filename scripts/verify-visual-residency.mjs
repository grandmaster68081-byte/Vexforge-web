import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const css = fs.readFileSync(path.join(root, "src/styles/portal.css"), "utf8");
const files = ["Home.tsx", "Game.tsx", "Cards.tsx", "World.tsx", "News.tsx", "Media.tsx", "Download.tsx", "Support.tsx"];
const pages = Object.fromEntries(files.map((file) => [file, fs.readFileSync(path.join(root, "src/pages", file), "utf8")]));
const all = Object.values(pages).join("\n");
const failures = [];

const requiredCompositions = [
  "v53Hero", "v53Prologue", "v54WorldStrip", "v53Gateways", "v53Vault", "v53Factions", "v53WorldReveal", "v53Download",
  "v53InteriorIntro", "v53ChapterGrid", "v53CardArchive", "v53WorldAtlas", "v53NewsChamber", "v53MediaVault", "v53DownloadPage", "v53SupportChamber"
];
for (const token of requiredCompositions) if (!all.includes(token)) failures.push(`missing art-directed composition: ${token}`);

const imageRules = [
  ".v53Hero__image", ".v53Prologue__art", ".v54WorldStrip__item", ".v53Gateways:before", ".v53Vault__backdrop", ".v53Factions__ambient",
  ".v53WorldReveal", ".v53Download__scene", ".v53ChapterGrid:before", ".v53WorldNote__image", ".portalFooter:before"
];
for (const token of imageRules) if (!css.includes(token)) failures.push(`missing visual residency rule: ${token}`);

for (const token of ["scroll-snap-type:x mandatory", "overflow-x:auto", "min-height:82svh", "min-height:540px"]) {
  if (!css.includes(token)) failures.push(`missing density/responsive rule: ${token}`);
}

for (const token of ["--v54-slate-0", "--v54-slate-1", "--v54-slate-2", "--v54-gold-hi"]) {
  if (!css.includes(token)) failures.push(`V5.4 material token missing: ${token}`);
}
for (const token of [
  ".v53Gateways{background:linear-gradient",
  ".v53Vault{background:linear-gradient",
  ".v53Factions{background:linear-gradient",
  ".v53Download{background:linear-gradient",
  ".v53NewsLanes{background:linear-gradient",
  ".v53SupportPaths{background:linear-gradient"
]) {
  if (!css.includes(token)) failures.push(`missing differentiated chapter surface: ${token}`);
}

for (const [file, source] of Object.entries(pages)) {
  if (file !== "Home.tsx" && !source.includes("pageHero")) failures.push(`${file}: missing visual page hero`);
}
for (const token of ["ASSETS.cover", "ASSETS.lobby", "ASSETS.nexus", "ASSETS.regions.forgeCore"]) {
  if (!all.includes(token)) failures.push(`approved VEXFORGE visual asset not referenced in portal surfaces: ${token}`);
}

if (/placeholder|fake screenshot|lorem ipsum/i.test(all)) failures.push("player-facing placeholder/fake content detected");

if (failures.length) {
  console.error("VISUAL RESIDENCY VERIFY FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("VISUAL RESIDENCY VERIFY PASS — V5.4 art/material residency, chapter variation, mobile rails and approved-asset usage are present.");
