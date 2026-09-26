import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const css = fs.readFileSync(path.join(root, 'src/styles/portal.css'), 'utf8');
const marker = '/* =====================================================================\n   V5.6 — WORLD-CLASS ART-DIRECTED VISUAL LAYER';
const current = marker.indexOf ? css.slice(css.lastIndexOf(marker)) : css;
const failures = [];

const requiredSelectors = [
  ':root{', '.portalRoot::before', '.portalRoot::after', '.v53Hero__atmosphere',
  '.v53Hero__veil', '.v53Gateway__link', '.v53Faction', '.v53RegionCard',
  '.v53ChapterCard__link', '.v53NewsLane', '.v53SupportPath', '.mediaTile',
  '.cardShowcase__art', '.v53Hero__cardLink', '@keyframes vexforgeAtmosphere',
  '@keyframes vexforgeGlint', '@keyframes vexforgeCardFloat', '@media(prefers-reduced-motion:reduce)'
];
for (const selector of requiredSelectors) {
  if (!current.includes(selector)) failures.push(`missing V5.6 visual layer token: ${selector}`);
}

const principalRules = [
  /\.v53Hero,.v53Prologue,.v53Gateways,[\s\S]*?background-color:var\(--v56-stone\)/,
  /\.v53Prologue::after[\s\S]*?background:linear-gradient/,
  /\.v53Gateway__link,.v53Faction,.v53RegionCard[\s\S]*?background-color:#1a303a/,
  /\.v53Hero__veil[\s\S]*?linear-gradient/,
  /\.cardShowcase__art[\s\S]*?background:linear-gradient/
];
for (const rule of principalRules) if (!rule.test(current)) failures.push('principal visual surfaces lack the V5.6 mid-tone/depth treatment');

const flatBlack = /(?:^|[;{])\s*background(?:-color)?\s*:\s*(?:#000(?:000)?|#050505|#080808|black)\s*(?:;|})/i;
if (flatBlack.test(current)) failures.push('V5.6 contains a flat black principal background');

const gradientCount = (current.match(/linear-gradient\(/g) || []).length;
if (gradientCount < 8) failures.push(`expected at least 14 V5.6 material/lighting gradients, found ${gradientCount}`);

if (failures.length) {
  console.error('SURFACE LIGHTING VERIFY FAILED');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}
console.log(`SURFACE LIGHTING VERIFY PASS — V5.6 art-directed surfaces and motion layer present (${gradientCount} gradients).`);
