import { readFile } from 'node:fs/promises';

const files = {
  visual: 'mobile/constants/visual.ts',
  screen: 'mobile/app/(tabs)/index.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['Home consumes the registered operator reference scene', contents.screen.includes("require('../../assets/images/home-reference-scene.png')")],
  ['Home exposes the reference scene hook and accessibility label', contents.screen.includes('testID="home-reference-scene"') && contents.screen.includes('Escena de Home proporcionada por el operador')],
  ['Home exposes functional reference hotspots', contents.screen.includes('const HOTSPOTS') && contents.screen.includes('testID={`home-reference-${hotspot.id}`}') && contents.screen.includes('onPress={() => routeTo(hotspot.route)}')],
  ['Home routes the visible forge action to the real fusion flow', contents.screen.includes("route: '/store?mode=fusion'") && contents.screen.includes("id: 'forge'")],
  ['Home aligns the live resource and settings hotspots with the reference', contents.screen.includes("id: 'energy-economy'") && contents.screen.includes("left: '57%'") && contents.screen.includes("id: 'vex-economy'") && contents.screen.includes("left: '75%'") && contents.screen.includes("id: 'settings'") && contents.screen.includes("left: '90%'")],
  ['Home reports synchronization and error states', contents.screen.includes('Sincronizando datos de Foja.') && contents.screen.includes('homeError') && contents.screen.includes('setHomeError')],
  ['Home keeps the existing reduced-motion contract', contents.screen.includes('useReducedMotion()') && contents.screen.includes('reduceMotion ? undefined : FadeIn.duration(450)')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile Home official asset verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile Home official asset verification OK: ${assertions.length}/${assertions.length} checks`);