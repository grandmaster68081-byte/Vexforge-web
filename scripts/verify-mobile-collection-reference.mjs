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
  ['collection is a programmatic surface without an archive skin', collection.includes('testID="collection-refresh"') && !collection.includes("collection-archive-scene.jpg") && !collection.includes('COLLECTION_REFERENCE')],
  ['collection keeps the measured programmatic frame', collection.includes('useMeasuredCanonicalFrame') && collection.includes('onReferenceRootLayout') && collection.includes('onLayout={onReferenceRootLayout}') && collection.includes('referenceScene') && collection.includes('top: canvasHeight * 0.392')],
  ['cards use the four-column reference grid', collection.includes("width: '22%'") && collection.includes("justifyContent: 'space-between'")],
  ['home connector uses the canonical root route', collection.includes("navigateFromReference('/')") && !collection.includes("navigateFromReference('/index')")],
  ['catalog exposes the real creation date', supabase.includes('created_at%2Cfaction')],
  ['recent ordering is implemented', collection.includes("sort === 'recent'")],
  ['collection paginates twelve cards', collection.includes('index += 12') && collection.includes('length: 12')],
  ['fusion route is wired', collection.includes("router.push('/store?mode=fusion')")],
  ['achievements route is wired', collection.includes("router.push('/profile?section=achievements')")],
  ['archive controls expose diegetic press depth', collection.includes('styles.referenceTopTab') && collection.includes('opacity: pressed ? 0.76 : 1') && collection.includes('styles.referencePageButton') && collection.includes('opacity: pressed ? 0.72 : 1')],
  ['missing card statistics stay explicit', collection.includes("if (typeof value !== 'number' || !Number.isFinite(value)) return '—';") && collection.includes('PWR {numberLabel(card.power)}') && collection.includes('AFF {numberLabel(card.affinity)}') && collection.includes('numberLabel(card.supply)') && collection.includes('numberLabel(card.minted)') && !collection.includes('card.power ?? 0}')],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length > 0) {
  for (const [label] of failed) console.error(`FAIL: ${label}`);
  process.exit(1);
}

console.log(`verify:mobile-collection-reference ${checks.length}/${checks.length} passed`);