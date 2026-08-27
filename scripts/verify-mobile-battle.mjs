import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/(tabs)/battle.tsx',
  supabase: 'mobile/lib/supabase.ts',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['battle screen exists', contents.screen.includes('export default function BattleScreen')],
  ['battle loads real opponents', contents.screen.includes('findOpponents') && contents.screen.includes('battle-find-opponents')],
  ['battle requires explicit confirmation', contents.screen.includes('battle-confirmation') && contents.screen.includes('battle-confirm')],
  ['battle resolves through the authoritative action', contents.screen.includes('startBattle(selectedOpponent.player_id)')],
  ['battle renders authoritative turns', contents.screen.includes('battleResult?.turns') && contents.screen.includes('TurnView')],
  ['battle renders the authoritative result', contents.screen.includes('battle-result') && contents.screen.includes('result.match_id')],
  ['battle exposes loading and error states', contents.screen.includes('ActivityIndicator') && contents.screen.includes('localError || authError')],
  ['battle supports reduced motion', contents.screen.includes('isReduceMotionEnabled') && contents.screen.includes('reducedMotion')],
  ['supabase exposes the battle turn contract', contents.supabase.includes('export type BattleTurn') && contents.supabase.includes('turns?: BattleTurn[]')],
  ['supabase calls the official resolve RPC', contents.supabase.includes("'vexforge_battle_resolve'")],
  ['no client battle simulation', !contents.screen.includes('simulate') && !contents.screen.includes('Math.random')],
  ['no emoji characters in battle UI', !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile battle verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile battle verification OK: ${assertions.length}/${assertions.length} checks`);