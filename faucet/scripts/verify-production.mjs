import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const required = [
  'package.json', 'index.html', 'src/App.tsx', 'src/kivora/KivoraFinalWorld.tsx',
  'src/styles.css', 'functions/api/config.ts', 'functions/api/public-config.ts',
  'functions/api/withdraw.ts', 'public/kivora/ui/kivora-sigil.svg',
  'public/kivora/ui/kivora-core.svg', 'public/kivora/scenes/deck.svg',
  'public/kivora/scenes/field.svg', 'public/kivora/scenes/vault.svg',
  'public/kivora/scenes/chronicle.svg', 'public/kivora/scenes/settlement.svg',
  'public/kivora/identity/identity-master.webp', 'public/kivora/identity/hero-environment.webp',
  'public/kivora/identity/field-environment.webp', 'public/kivora/identity/vault-environment.webp',
  'public/kivora/identity/chronicle-environment.webp', 'public/kivora/identity/settlement-environment.webp',
  'public/kivora/identity/mobile-atlas.webp',
];
for (const file of required) {
  if (!existsSync(join(root, file))) throw new Error(`Missing required file: ${file}`);
}
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.build !== 'vite build') throw new Error('Build command mismatch');
if (!pkg.scripts?.test) throw new Error('Test command missing');
if (pkg.version !== '5.2.1') throw new Error(`Expected 5.2.1, got ${pkg.version}`);
if (!pkg.devDependencies?.lightningcss) throw new Error('Explicit lightningcss dependency missing');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
if (!app.includes('providerConfigured: false')) throw new Error('Provider-safe fallback missing');
const withdraw = readFileSync(join(root, 'functions/api/withdraw.ts'), 'utf8');
if (!withdraw.includes("asset !== 'USDT' || network !== 'TRC20'")) throw new Error('USDT/TRC20 guard missing');
const world = readFileSync(join(root, 'src/kivora/KivoraFinalWorld.tsx'), 'utf8');
if (!world.includes("toLocaleDateString('en-CA')")) throw new Error('Daily run date boundary missing');
console.log(`KIVORA production verification PASS: ${required.length} required files and critical contracts present.`);
