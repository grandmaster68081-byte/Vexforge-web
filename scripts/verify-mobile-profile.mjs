import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/(tabs)/profile.tsx',
  supabase: 'mobile/lib/supabase.ts',
  context: 'mobile/context/GameContext.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['profile screen exists', contents.screen.includes('export default function ProfileScreen')],
  ['profile reads authenticated identity', contents.screen.includes('player.email') && contents.supabase.includes('loadPlayerProfile')],
  ['profile reads authoritative rank', contents.screen.includes('loadPlayerRank') && contents.supabase.includes("'get_player_rank'")],
  ['profile reads real achievements', contents.screen.includes('loadPlayerAchievements') && contents.supabase.includes('player_achievements')],
  ['profile displays progression and resources', contents.screen.includes('progress?.xp') && contents.screen.includes('wallet?.vex_ingame')],
  ['profile displays real player stats', contents.screen.includes('stats?.pvp_wins') && contents.context.includes('loadStats')],
  ['profile exposes loading and error states', contents.screen.includes('profile-loading') && contents.screen.includes('accessibilityRole="alert"')],
  ['profile exposes an empty achievements state', contents.screen.includes('profile-empty-achievements')],
  ['profile supports pull to refresh', contents.screen.includes('RefreshControl') && contents.screen.includes('handleRefresh')],
  ['profile has tactile navigation actions', contents.screen.includes("router.push('/missions')") && contents.screen.includes("router.push('/collection')") && contents.screen.includes("router.push('/deck')")],
  ['profile has account sign out', contents.screen.includes('profile-sign-out') && contents.screen.includes('signOut')],
  ['no client profile simulation', !contents.screen.includes('Math.random') && !contents.screen.includes('mock')],
  ['no emoji characters in profile UI', !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile profile verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile profile verification OK: ${assertions.length}/${assertions.length} checks`);