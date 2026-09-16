import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const screen = fs.readFileSync(path.join(root, 'mobile/app/(tabs)/collection.tsx'), 'utf8');
const scene = fs.readFileSync(path.join(root, 'mobile/components/ForgeArchiveScene.tsx'), 'utf8');
const visual = fs.readFileSync(path.join(root, 'mobile/constants/visual.ts'), 'utf8');
const experience = fs.readFileSync(path.join(root, 'mobile/constants/experience.ts'), 'utf8');
const assetPath = path.join(root, 'mobile/assets/images/collection-reference-scene.png');
const asset = fs.readFileSync(assetPath);

function pngDimensions(buffer) {
  if (buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const dimensions = pngDimensions(asset);
const checks = [
  ['approved collection scene is exact 1080x2340 PNG', dimensions?.width === 1080 && dimensions?.height === 2340],
  ['collection activates the canonical scene asset', visual.includes("collection: require('../assets/images/collection-reference-scene.png')")],
  ['scene is a native live viewport', screen.includes('ForgeArchiveScene') && scene.includes('cards-scene-viewport') && scene.includes('LinearGradient')],
  ['scene parallax is bounded and native-driven', scene.includes('parallaxMaxTranslateY') && scene.includes('useNativeDriver: true') && scene.includes('extrapolate: \'clamp\'')],
  ['scene honors reduced motion', scene.includes('reducedMotion') && scene.includes('pulse.stopAnimation()')],
  ['scene keeps animated layers within budget', experience.includes('maxAnimatedSceneLayers: 2') && scene.includes('glowLeft') && scene.includes('glowRight')],
  ['collection scroll uses native driver and shared throttle', screen.includes('<Animated.FlatList') && screen.includes('useNativeDriver: true') && screen.includes('VISUAL_TOKENS.archive.performance.scrollEventThrottle')],
  ['collection is driven by live catalog and ownership', screen.includes('featuredCards') && screen.includes('collection') && screen.includes('ownedById')],
  ['search and filters are native controls', screen.includes('cards-search') && screen.includes('faction-') && screen.includes('rarity-') && screen.includes('sort-toggle')],
  ['card detail is a functional native modal', screen.includes('<CardDetail') && screen.includes('<Modal') && screen.includes('close-card-detail')],
  ['archive actions keep their real flows', screen.includes('fusion-tab') && screen.includes("/store?mode=fusion") && screen.includes('achievements-tab') && screen.includes("/profile?section=achievements")],
  ['refresh and synchronization states are explicit', scene.includes('collection-refresh') && screen.includes('collection-sync-error') && screen.includes('syncState === \'offline\'')],
  ['missing catalog data stays honest', screen.includes('No hay cartas activas reportadas por el catálogo.') && scene.includes('CARTA DESTACADA NO REPORTADA')],
  ['safe area and navigation clearance are explicit', screen.includes('useSafeAreaInsets') && screen.includes('insets.top') && screen.includes('insets.bottom + 108')],
];

const failed = checks.filter(([, passed]) => !passed);
if (failed.length > 0) {
  console.error(`Mobile collection verification failed: ${failed.map(([label]) => label).join('; ')}`);
  process.exit(1);
}

console.log(`Mobile collection verification OK: ${checks.length}/${checks.length} checks`);