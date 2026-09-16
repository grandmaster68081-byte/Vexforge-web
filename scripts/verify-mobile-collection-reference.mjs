import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetPath = path.join(root, 'mobile', 'assets', 'images', 'collection-reference-scene.png');
const collectionPath = path.join(root, 'mobile', 'app', '(tabs)', 'collection.tsx');
const scenePath = path.join(root, 'mobile', 'components', 'ForgeArchiveScene.tsx');
const visualPath = path.join(root, 'mobile', 'constants', 'visual.ts');
const experiencePath = path.join(root, 'mobile', 'constants', 'experience.ts');
const supabasePath = path.join(root, 'mobile', 'lib', 'supabase.ts');
const asset = fs.readFileSync(assetPath);
const collection = fs.readFileSync(collectionPath, 'utf8');
const scene = fs.readFileSync(scenePath, 'utf8');
const visual = fs.readFileSync(visualPath, 'utf8');
const experience = fs.readFileSync(experiencePath, 'utf8');
const supabase = fs.readFileSync(supabasePath, 'utf8');

function readPngDimensions(buffer) {
  if (buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const dimensions = readPngDimensions(asset);

const checks = [
  ['approved collection scene is exact 1080x2340 PNG', dimensions?.width === 1080 && dimensions?.height === 2340],
  ['collection activates the canonical scene asset', visual.includes("collection: require('../assets/images/collection-reference-scene.png')")],
  ['collection is a native live programmatic surface', collection.includes('testID="collection-screen"') && collection.includes('<ForgeArchiveScene') && scene.includes('cards-scene-viewport')],
  ['scene keeps parallax, reduced motion, and layer budget', scene.includes('parallaxMaxTranslateY') && scene.includes('pulse.stopAnimation()') && experience.includes('maxAnimatedSceneLayers: 2')],
  ['collection uses a two-column native card grid', collection.includes('numColumns={2}') && collection.includes('columnWrapperStyle={styles.gridRow}')],
  ['catalog exposes the real creation date', supabase.includes('created_at%2Cfaction')],
  ['recent ordering is implemented', collection.includes("sort === 'recent'")],
  ['collection paginates twelve cards', collection.includes('index += 12') && collection.includes('slice(index, index + 12)')],
  ['fusion route is wired', collection.includes("router.push('/store?mode=fusion')")],
  ['achievements route is wired', collection.includes("router.push('/profile?section=achievements')")],
  ['archive controls expose diegetic press depth', scene.includes('testID="collection-refresh"') && scene.includes('opacity: pressed ? 0.72 : 1') && collection.includes('testID="sort-toggle"') && collection.includes('opacity: pressed ? 0.76 : 1')],
  ['missing card statistics stay explicit', collection.includes("if (typeof value !== 'number' || !Number.isFinite(value)) return '—';") && collection.includes('PWR {numberLabel(card.power)}') && collection.includes('AFF {numberLabel(card.affinity)}') && collection.includes('numberLabel(card.supply)') && collection.includes('numberLabel(card.minted)') && !collection.includes('card.power ?? 0}')],
  ['missing detail statistics do not render as confirmed zero bars', collection.includes('const statReady = safeValue !== null && max > 0;') && collection.includes('styles.statUnknownTrack') && collection.includes('estadística no reportada') && collection.includes('collection-stat-unreported-') && !collection.includes('value={safeValue !== null && max > 0 ? (safeValue / max) * 100 : 0}')],
  ['missing card identity, faction, rarity, and lore stay explicit', collection.includes("'RAREZA NO REPORTADA'") && collection.includes("'FACCION NO REPORTADA'") && collection.includes("'LORE NO REPORTADO'") && collection.includes("'IDENTIDAD NO REPORTADA'") && !collection.includes("'Sin facción'") && !collection.includes("'Sin rareza'")],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length > 0) {
  for (const [label] of failed) console.error(`FAIL: ${label}`);
  process.exit(1);
}

console.log(`verify:mobile-collection-reference ${checks.length}/${checks.length} passed`);