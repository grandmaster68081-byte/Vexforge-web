import { readFile } from 'node:fs/promises';

const files = {
  visual: 'mobile/constants/visual.ts',
  screen: 'mobile/app/(tabs)/index.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['Home burst is registered in the Android visual registry', contents.visual.includes("homeNexusBurst: storageAsset('misc/IMG_20260619_122314.jpg')")],
  ['Home consumes the registered burst asset', contents.screen.includes("OFFICIAL_ASSETS.homeNexusBurst")],
  ['Home exposes a visual test hook and accessibility label', contents.screen.includes('testID="home-official-nexus-burst"') && contents.screen.includes('Atmósfera oficial del pulso del Nexus')],
  ['Home reports loading and error states for the burst', contents.screen.includes('home-nexus-burst-loading') && contents.screen.includes('home-nexus-burst-error')],
  ['Home keeps the existing reduced-motion contract', contents.screen.includes('useReducedMotion()') && contents.screen.includes('reduceMotion ? undefined : FadeIn.duration(MOTION.navigation)')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile Home official asset verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile Home official asset verification OK: ${assertions.length}/${assertions.length} checks`);