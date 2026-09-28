import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
  'public/kivora/final/station-wide.webp',
  'public/kivora/final/station-panorama.webp',
  'public/kivora/final/core-environment.webp',
  'public/kivora/ui/kivora-core.svg',
  'public/kivora/ui/kivora-sigil.svg',
  'public/kivora/ui/settlement-beacon.svg'
];
for (const file of required) {
  const full = path.join(root,file);
  if (!fs.existsSync(full)) throw new Error(`Missing golden identity asset: ${file}`);
  if (fs.statSync(full).size < 500) throw new Error(`Asset unexpectedly small: ${file}`);
}
const world = fs.readFileSync(path.join(root,'src/kivora/KivoraFinalWorld.tsx'),'utf8');
const css = fs.readFileSync(path.join(root,'src/kivora/golden.css'),'utf8');
for (const token of ['kg-world-image','kg-stage-scene','kg-engine','kg-console','kg-mobile-nav']) if (!css.includes(token)) throw new Error(`Golden visual primitive missing: ${token}`);
for (const token of ['/kivora/final/station-wide.webp','/kivora/ui/kivora-core.svg','/kivora/ui/kivora-sigil.svg']) if (!world.includes(token)) throw new Error(`Golden renderer asset missing: ${token}`);
if (/\bkv5?[-_]/.test(fs.readFileSync(path.join(root,'src/styles.css'),'utf8'))) throw new Error('Legacy visual shell selector remains in shared CSS');
for (const asset of new Set(world.match(/\/kivora\/(?:final|ui)\/[A-Za-z0-9._-]+/g) ?? [])) {
  if (!fs.existsSync(path.join(root, 'public', asset.slice(1)))) throw new Error(`Renderer asset path is missing: ${asset}`);
}
console.log('KIVORA GOLDEN VISUAL ASSETS: PASS');
