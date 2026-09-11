import { readFile } from 'node:fs/promises';

const screen = await readFile('mobile/app/(tabs)/index.tsx', 'utf8');
const visual = await readFile('mobile/constants/visual.ts', 'utf8');

const requiredDataLoaders = ['loadHomeStats', 'loadDailyFeaturedCard', 'loadHomeMissions', 'loadRecentActivity'];
const requiredTestIds = ['home-scene', 'home-sync', 'home-battle', 'home-event', 'home-missions', 'home-featured-card', 'home-profile', 'home-world'];

const assertions = [
  ['Home is a native composition inside the shared shell', screen.includes('<ScreenShell surface="home" sceneMode="shell">') && screen.includes('ScrollView')],
  ['Home no longer mounts the legacy reference scene or hotspot overlay', !screen.includes('home-reference-scene.png') && !screen.includes('const HOTSPOTS') && !screen.includes('home-reference-')],
  ['Home consumes live Nexus data contracts', requiredDataLoaders.every((loader) => screen.includes(loader)) && screen.includes('Promise.allSettled')],
  ['Home uses registered official visual assets', screen.includes('OFFICIAL_ASSETS.homeNexusBurst') && visual.includes('homeNexusBurst') && screen.includes('source={{ uri: OFFICIAL_ASSETS.homeNexusBurst }}')],
  ['Home exposes explicit visual asset failure states', screen.includes('ARTE NO DISPONIBLE') && screen.includes('NEXUS CORE OFFLINE') && screen.includes('onError={() => setFeaturedAssetState')],
  ['Home exposes functional Android routes', screen.includes("navigate('/battle')") && screen.includes("navigate('/missions')") && screen.includes("navigate('/collection')") && screen.includes("navigate('/world')") && screen.includes("navigate('/economy')")],
  ['Home exposes the live resource HUD', screen.includes('progress.energy') && screen.includes('wallet?.vex_ingame') && screen.includes('playerStats?.pvp_wins')],
  ['Home handles loading, partial, empty and error data states', screen.includes("HomeState = 'loading' | 'ready' | 'partial' | 'error'") && screen.includes('SEÑAL INTERRUMPIDA') && screen.includes('SIN FRENTE ACTIVO')],
  ['Home keeps reduced-motion and pull-to-refresh contracts', screen.includes('useReducedMotion()') && screen.includes('reduceMotion ? undefined') && screen.includes('RefreshControl')],
  ['Home exposes the required review surfaces', requiredTestIds.every((testID) => screen.includes(`testID="${testID}"`))],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile Home official asset verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile Home native composition verification OK: ${assertions.length}/${assertions.length} checks`);
