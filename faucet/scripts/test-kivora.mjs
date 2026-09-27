import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
  'src/App.tsx',
  'src/kivora/KivoraFinalWorld.tsx',
  'src/styles.css',
  'public/kivora/ui/kivora-sigil.svg',
  'public/kivora/ui/kivora-core.svg',
  'public/kivora/ui/opportunity-gate.svg',
  'public/kivora/ui/settlement-beacon.svg',
  'public/kivora/identity/identity-master.webp',
  'public/kivora/identity/hero-environment.webp',
  'public/kivora/identity/field-environment.webp',
  'public/kivora/identity/vault-environment.webp',
  'public/kivora/identity/chronicle-environment.webp',
  'public/kivora/identity/settlement-environment.webp',
  'public/kivora/identity/mobile-atlas.webp',
  'public/kivora/identity/engine-environment.webp'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing required artifact: ${rel}`);
}
const world = fs.readFileSync(path.join(root, 'src/kivora/KivoraFinalWorld.tsx'), 'utf8');
for (const token of [
  'Command Deck', 'Opportunity Field', 'Kivora Vault', 'Chronicle', 'Settlement Terminal',
  'USDT', 'TRC20', 'DAILY RUN', 'KIVORA ENGINE', '/kivora/identity/hero-environment.webp',
  '/kivora/identity/field-environment.webp', '/kivora/identity/vault-environment.webp',
  '/kivora/identity/chronicle-environment.webp', '/kivora/identity/settlement-environment.webp'
]) {
  if (!world.includes(token)) throw new Error(`Missing product/identity token: ${token}`);
}
const config = fs.readFileSync(path.join(root, 'functions/api/config.ts'), 'utf8');
if (!config.includes('withdrawalMinPoints: Number(map.withdrawal_min_points ?? 10000)')) throw new Error('Minimum 10,000 KP contract missing');
const withdraw = fs.readFileSync(path.join(root, 'functions/api/withdraw.ts'), 'utf8');
if (!withdraw.includes("rpc('request_withdrawal_v2'")) throw new Error('request_withdrawal_v2 missing');
if (!withdraw.includes("asset !== 'USDT' || network !== 'TRC20'")) throw new Error('USDT/TRC20 validation missing');
const pub = fs.readFileSync(path.join(root, 'functions/api/public-config.ts'), 'utf8');
if (!pub.includes('providerConfigured')) throw new Error('providerConfigured missing');
if (!fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8').includes('TLAujgYmQAtFW6BZg4fVs1pUHx6vyX5SJD')) throw new Error('Treasury address missing');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.version !== '5.2.1') throw new Error(`Expected 5.2.1, got ${pkg.version}`);
console.log('KIVORA 5.2.1 PRODUCTION IDENTITY CONTRACT: PASS');
