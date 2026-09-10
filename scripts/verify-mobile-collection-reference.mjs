import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetPath = path.join(root, 'mobile', 'assets', 'images', 'collection-reference-scene.png');
const collectionPath = path.join(root, 'mobile', 'app', '(tabs)', 'collection.tsx');
const supabasePath = path.join(root, 'mobile', 'lib', 'supabase.ts');
const asset = fs.readFileSync(assetPath);
const collection = fs.readFileSync(collectionPath, 'utf8');
const supabase = fs.readFileSync(supabasePath, 'utf8');
const pngSignature = '89504e470d0a1a0a';
const width = asset.readUInt32BE(16);
const height = asset.readUInt32BE(20);
const colorType = asset[25];

const checks = [
  ['PNG signature', asset.subarray(0, 8).toString('hex') === pngSignature],
  ['reference is 1080x2340', width === 1080 && height === 2340],
  ['reference is RGB', colorType === 2],
  ['collection uses the canonical reference asset', collection.includes("collection-reference-scene.png")],
  ['reference fills the calibrated canvas', collection.includes('resizeMode="cover"') && collection.includes('top: canvasHeight * 0.392')],
  ['cards use the four-column reference grid', collection.includes("width: '22%'") && collection.includes("justifyContent: 'space-between'")],
  ['home connector uses the canonical root route', collection.includes("navigateFromReference('/')") && !collection.includes("navigateFromReference('/index')")],
  ['catalog exposes the real creation date', supabase.includes('created_at%2Cfaction')],
  ['recent ordering is implemented', collection.includes("sort === 'recent'")],
  ['collection paginates twelve cards', collection.includes('index += 12') && collection.includes('length: 12')],
  ['fusion route is wired', collection.includes("router.push('/store?mode=fusion')")],
  ['achievements route is wired', collection.includes("router.push('/profile?section=achievements')")],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length > 0) {
  for (const [label] of failed) console.error(`FAIL: ${label}`);
  process.exit(1);
}

console.log(`verify:mobile-collection-reference ${checks.length}/${checks.length} passed`);