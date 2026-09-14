import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/social.tsx',
  shell: 'mobile/components/ScreenShell.tsx',
  header: 'mobile/components/DomainHeader.tsx',
  supabase: 'mobile/lib/supabase.ts',
  contract: 'docs/VE-MOB-13-SOCIAL.md',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['social route consumes the live snapshot', contents.screen.includes('loadSocialSnapshot') && contents.supabase.includes('loadSocialSnapshot')],
  ['friend actions remain server-authoritative', contents.screen.includes('sendMobileFriendRequest') && contents.screen.includes('respondToMobileChallenge') && contents.supabase.includes('accept_friend_request')],
  ['clan actions remain server-authoritative', contents.screen.includes('createMobileClan') && contents.screen.includes('joinMobileClan') && contents.screen.includes('startMobileGuildWar')],
  ['social arena remains a read surface for PvP', contents.screen.includes('snapshot.rankings') && contents.screen.includes("router.push('/battle')") && contents.contract.includes('vexforge_battle_resolve')],
  ['parent domain is explicit', contents.shell.includes('surface === \'clans\'') && contents.shell.includes('domain="legado"') && contents.shell.includes('Red de Forjadores')],
  ['domain header supports a local subject without losing identity', contents.header.includes('title ?? identity.title') && contents.header.includes('purpose ?? identity.purpose')],
  ['loading error empty and refresh states remain explicit', contents.screen.includes('social-loading') && contents.screen.includes('social-error') && contents.screen.includes('EmptyState') && contents.screen.includes('RefreshControl')],
  ['social actions expose accessible controls', contents.screen.includes('accessibilityRole="button"') && contents.screen.includes('accessibilityRole="tab"') && contents.screen.includes('testID="social-screen"')],
  ['no client-side authority or emoji UI was added', !contents.screen.includes('Math.random') && !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile social verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile social verification OK: ${assertions.length}/${assertions.length} checks`);