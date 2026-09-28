import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const required = [
  'package.json','package-lock.json','index.html','src/App.tsx','src/styles.css','src/kivora/KivoraFinalWorld.tsx','src/kivora/golden.css',
  'functions/api/config.ts','functions/api/public-config.ts','functions/api/withdraw.ts',
  'public/kivora/ui/kivora-sigil.svg','public/kivora/ui/kivora-core.svg','public/kivora/ui/settlement-beacon.svg',
  'public/kivora/final/station-wide.webp','public/kivora/final/station-panorama.webp','public/kivora/final/core-environment.webp'
];
for (const file of required) if (!existsSync(join(root,file))) throw new Error(`Missing required file: ${file}`);
const pkg = JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
if (pkg.version !== '6.0.0') throw new Error(`Expected 6.0.0, got ${pkg.version}`);
if (pkg.scripts?.build !== 'vite build') throw new Error('Build command mismatch');
if (!pkg.devDependencies?.lightningcss) throw new Error('Explicit lightningcss dependency missing');
const app = readFileSync(join(root,'src/App.tsx'),'utf8');
if (!app.includes('providerConfigured: false')) throw new Error('Provider-safe fallback missing');
if (!app.includes('TLAujgYmQAtFW6BZg4fVs1pUHx6vyX5SJD')) throw new Error('Treasury address missing');
if (!app.includes('<KivoraFinalWorld')) throw new Error('KivoraFinalWorld is not the authenticated application shell');
if (/\bkv5?[-_]/.test(app)) throw new Error('Legacy visual shell selector remains in App.tsx');
const world = readFileSync(join(root,'src/kivora/KivoraFinalWorld.tsx'),'utf8');
for (const token of ['/kivora/final/station-wide.webp','/kivora/final/station-panorama.webp','/kivora/final/core-environment.webp','/kivora/ui/kivora-core.svg','KIVORA ENGINE','DAILY RUN','USDT','TRC20']) if (!world.includes(token)) throw new Error(`Missing live implementation token: ${token}`);
const css = readFileSync(join(root,'src/styles.css'),'utf8');
if (/\bkv5?[-_]/.test(css)) throw new Error('Legacy visual shell selector remains in styles.css');
for (const asset of new Set(world.match(/\/kivora\/(?:final|ui)\/[A-Za-z0-9._-]+/g) ?? [])) {
  if (!existsSync(join(root, 'public', asset.slice(1)))) throw new Error(`Renderer asset path is missing: ${asset}`);
}
const withdraw = readFileSync(join(root,'functions/api/withdraw.ts'),'utf8');
if (!withdraw.includes("asset !== 'USDT' || network !== 'TRC20'")) throw new Error('USDT/TRC20 guard missing');
console.log('KIVORA GOLDEN LOCK 6.0.0 production verification PASS');
