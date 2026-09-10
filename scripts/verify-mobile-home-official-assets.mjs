import { readFile } from 'node:fs/promises';

const files = {
  visual: 'mobile/constants/visual.ts',
  screen: 'mobile/app/(tabs)/index.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);
const referenceAsset = await readFile('mobile/assets/images/home-reference-scene.png');
const referenceColorType = referenceAsset[25];
const referenceWidth = referenceAsset.readUInt32BE(16);
const referenceHeight = referenceAsset.readUInt32BE(20);

const assertions = [
  ['Home consumes the registered operator reference scene', contents.screen.includes("require('../../assets/images/home-reference-scene.png')")],
  ['Home exposes the reference scene hook and accessibility label', contents.screen.includes('testID="home-reference-scene"') && contents.screen.includes('Escena de Home proporcionada por el operador')],
  ['Home exposes functional reference hotspots', contents.screen.includes('const HOTSPOTS') && contents.screen.includes('testID={`home-reference-${hotspot.id}`}') && contents.screen.includes('onPress={() => routeTo(hotspot.route)}')],
  ['Home routes the visible forge action to the real fusion flow', contents.screen.includes("route: '/store?mode=fusion'") && contents.screen.includes("id: 'forge'")],
  ['Home reference is 1080x2340 RGB', referenceWidth === 1080 && referenceHeight === 2340 && referenceColorType === 2],
  ['Home uses the shared canonical reference canvas', contents.screen.includes('getCanonicalFrameMetrics') && contents.screen.includes('width: frameWidth') && contents.screen.includes('height: sceneHeight') && contents.screen.includes('marginTop: insets.top') && contents.screen.includes('resizeMode="cover"')],
  ['Home does not duplicate live resource overlays', !contents.screen.includes('energyValue') && !contents.screen.includes('vexValue') && !contents.screen.includes("id: 'energy-economy'") && !contents.screen.includes("id: 'vex-economy'")],
  ['Home keeps the existing reduced-motion contract', contents.screen.includes('useReducedMotion()') && contents.screen.includes('reduceMotion ? undefined : FadeIn.duration(450)')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile Home official asset verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile Home official asset verification OK: ${assertions.length}/${assertions.length} checks`);