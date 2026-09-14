import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/missions.tsx',
  supabase: 'mobile/lib/supabase.ts',
  layout: 'mobile/app/_layout.tsx',
  home: 'mobile/app/(tabs)/index.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['missions screen exists', contents.screen.includes('export default function MissionsScreen')],
  ['daily quests load from Supabase', contents.screen.includes('loadDailyQuests') && contents.supabase.includes('player_daily_quests')],
  ['daily quest claims use the official RPC', contents.screen.includes('claimDailyQuest') && contents.supabase.includes("'claim_daily_quest'")],
  ['missions load from live data', contents.screen.includes('loadMissions') && contents.supabase.includes('production_ready=eq.true')],
  ['mission execution uses authoritative RPCs', contents.screen.includes('executeMobileMission') && contents.supabase.includes("'execute_mission'") && contents.supabase.includes("'claim_mission_reward'")],
  ['explicit loading and error states', contents.screen.includes('missions-loading') && contents.screen.includes('accessibilityRole="alert"')],
  ['explicit empty states', contents.screen.includes('missions-empty-quests') && contents.screen.includes('missions-empty')],
  ['missions are anchored to a living domain', contents.screen.includes('<DomainHeader') && contents.screen.includes('domain="foja"') && contents.screen.includes('activityStatus')],
  ['missions expose a real activity signal', contents.screen.includes('testID="missions-energy-signal"') && contents.screen.includes('SIN SEÑAL · TOCA PARA REINTENTAR') && contents.screen.includes('ROTACIÓN EN ESPERA · SIN ACTIVIDAD ASIGNADA')],
  ['mission and quest missing values stay explicit', contents.screen.includes('MISIÓN SIN TÍTULO REPORTADO') && contents.screen.includes('DESCRIPCIÓN NO REPORTADA') && contents.screen.includes('ESTADO NO REPORTADO') && contents.screen.includes('numberSignal') && contents.screen.includes('PROGRESO NO REPORTADO')],
  ['mission and quest zero values stay visible', contents.screen.includes('Number.isFinite') && contents.screen.includes('numberSignal(definition?.reward_vex_ingame, \'VEX\')') && contents.screen.includes('numberSignal(mission.reward_vex_ingame, \'+VEX\')')],
  ['missions back action has press depth', contents.screen.includes('testID="missions-back"') && contents.screen.includes('translateY: pressed ? 1 : 0')],
  ['rewards are visible', contents.screen.includes('VEX') && contents.screen.includes('XP')],
  ['home links to missions', contents.home.includes('testID="home-missions"') && contents.home.includes("navigate('/missions')") && contents.home.includes('loadHomeMissions')],
  ['missions route is registered', contents.layout.includes('name="missions"')],
  ['no local mission simulation', !contents.screen.includes('Math.random') && !contents.screen.includes('simulate')],
  ['no emoji characters in missions UI', !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile rewards verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile rewards verification OK: ${assertions.length}/${assertions.length} checks`);