import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetPath = path.join(root, 'mobile', 'assets', 'images', 'collection-archive-scene.jpg');
const collectionPath = path.join(root, 'mobile', 'app', '(tabs)', 'collection.tsx');
const supabasePath = path.join(root, 'mobile', 'lib', 'supabase.ts');
const asset = fs.readFileSync(assetPath);
const collection = fs.readFileSync(collectionPath, 'utf8');
const supabase = fs.readFileSync(supabasePath, 'utf8');

function readJpegDimensions(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3;
    if (isStartOfFrame && offset + 7 < buffer.length) {
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
        components: buffer[offset + 7],
      };
    }
    offset += segmentLength;
  }
  return null;
}

const dimensions = readJpegDimensions(asset);

const checks = [
  ['archive asset is JPEG', asset.subarray(0, 2).toString('hex') === 'ffd8'],
  ['archive is 1136x2048 RGB', dimensions?.width === 1136 && dimensions.height === 2048 && dimensions.components === 3],
  ['collection uses the archive asset', collection.includes("collection-archive-scene.jpg")],
  ['reference uses a measured canonical frame', collection.includes('useMeasuredCanonicalFrame') && collection.includes('onReferenceRootLayout') && collection.includes('onLayout={onReferenceRootLayout}') && collection.includes('referenceScene') && collection.includes('referenceImage') && collection.includes("width: '100%'") && collection.includes("height: '100%'") && collection.includes('resizeMode="cover"') && collection.includes('top: canvasHeight * 0.392')],
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