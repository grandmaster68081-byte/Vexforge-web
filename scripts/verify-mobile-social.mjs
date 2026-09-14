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
  ['missing social identity stays explicit', contents.screen.includes('IDENTIDAD NO REPORTADA') && contents.screen.includes('DESCRIPCIÓN NO REPORTADA') && !contents.screen.includes('Forjador #')],
  ['social ranking preserves absent metrics', contents.supabase.includes('mmr: number | null') && contents.supabase.includes('rank_position: number | null') && contents.supabase.includes('typeof row.mmr === \'number\'') && contents.screen.includes("rankingMetric(entry.mmr, 'MMR')") && contents.screen.includes('PUESTO NO REPORTADO') && contents.screen.includes('PORCENTAJE NO REPORTADO')],
  ['social ranking keeps empty match samples explicit', contents.screen.includes('rankingWinRate') && contents.screen.includes("if (total <= 0) return 'PORCENTAJE NO REPORTADO'") && !contents.screen.includes('total > 0 ? Math.round((entry.wins! / total) * 100) : 0') && !contents.supabase.includes('mmr: Number(row.mmr ?? 0)')],
  ['social relationship and clan metrics preserve absent signals', contents.supabase.includes('level: number | null') && contents.supabase.includes('prestige: number | null') && contents.supabase.includes('contribution_total: number | null') && contents.supabase.includes('mapSocialLevel') && contents.screen.includes('NIVEL NO REPORTADO') && contents.screen.includes('PRESTIGIO NO REPORTADO') && contents.screen.includes('CONTRIBUCIÓN NO REPORTADA') && !contents.supabase.includes('info?.level ?? 1') && !contents.supabase.includes('Number(clanRow.prestige ?? 0)')],
  ['social statuses and counterpart identities remain explicit', contents.supabase.includes('status: string | null') && contents.supabase.includes('opponent_name: string | null') && contents.screen.includes('ESTADO NO REPORTADO') && contents.screen.includes('CLAN RIVAL NO REPORTADO') && contents.screen.includes('NOMBRE DE CLAN NO REPORTADO') && !contents.supabase.includes("?? 'Clan rival'")],
  ['social history never converts missing ELO into a dash', contents.screen.includes("socialNumber(elo, 'MMR NO REPORTADO')") && !contents.screen.includes("match.elo_change_a ?? '—'")],
  ['social dates distinguish missing and invalid timestamps', contents.screen.includes('function formatDate') && contents.screen.includes('FECHA NO REPORTADA') && contents.screen.includes('FECHA NO VÁLIDA') && !contents.screen.includes("? 'FECHA NO REPORTADA' : date.toLocaleDateString")],
  ['social actions expose accessible controls', contents.screen.includes('accessibilityRole="button"') && contents.screen.includes('accessibilityRole="tab"') && contents.screen.includes('testID="social-screen"')],
  ['no client-side authority or emoji UI was added', !contents.screen.includes('Math.random') && !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile social verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile social verification OK: ${assertions.length}/${assertions.length} checks`);