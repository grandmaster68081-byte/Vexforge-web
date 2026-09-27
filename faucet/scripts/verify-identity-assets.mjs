import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const dir = path.join(root, 'public/kivora/identity');
const files = [
  'identity-master.webp',
  'hero-environment.webp',
  'field-environment.webp',
  'vault-environment.webp',
  'chronicle-environment.webp',
  'settlement-environment.webp',
  'engine-environment.webp',
  'mobile-atlas.webp',
];
for (const file of files) {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) throw new Error(`Missing identity asset: ${file}`);
  const size = fs.statSync(full).size;
  if (size < 5000) throw new Error(`Identity asset unexpectedly small: ${file} (${size} bytes)`);
}
const world = fs.readFileSync(path.join(root, 'src/kivora/KivoraFinalWorld.tsx'), 'utf8');
for (const file of ['identity-master.webp','hero-environment.webp','field-environment.webp','vault-environment.webp','chronicle-environment.webp','settlement-environment.webp','engine-environment.webp']) {
  if (!world.includes(`/kivora/identity/${file}`)) throw new Error(`Live renderer does not consume ${file}`);
}
console.log('KIVORA PRODUCTION IDENTITY ASSETS: PASS');
