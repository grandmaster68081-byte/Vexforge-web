import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/economy.tsx',
  supabase: 'mobile/lib/supabase.ts',
  layout: 'mobile/app/_layout.tsx',
  profile: 'mobile/app/(tabs)/profile.tsx',
  home: 'mobile/app/(tabs)/index.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['economy route is registered and reachable', contents.layout.includes('name="economy"') && contents.profile.includes("router.push('/economy')") && contents.home.includes("router.push('/economy')")],
  ['wallet and paginated ledger consumers are wired', contents.screen.includes('loadWallet') && contents.screen.includes('loadEconomyStats') && contents.screen.includes('loadEconomyLedger') && contents.supabase.includes("vexforge_get_my_economy_stats")],
  ['market read and three official mutations are wired', contents.screen.includes('loadMarketListings') && contents.screen.includes('loadMarketOwnedCards') && contents.screen.includes('createMarketListing') && contents.screen.includes('buyMarketListing') && contents.screen.includes('cancelMarketListing') && contents.supabase.includes("create_listing") && contents.supabase.includes("buy_listing") && contents.supabase.includes("cancel_listing")],
  ['deposit treasury and official RPC are wired', contents.screen.includes('loadTreasuryWallets') && contents.screen.includes('loadMyDeposits') && contents.screen.includes('submitMobileDeposit') && contents.supabase.includes("vexforge_treasury") && contents.supabase.includes("vexforge_submit_deposit") && contents.supabase.includes("vexforge_get_my_deposits")],
  ['withdrawal balance, history, formula, and official RPC are wired', contents.screen.includes('loadTradeableBalance') && contents.screen.includes('loadMyWithdrawals') && contents.screen.includes('requestMobileWithdrawal') && contents.screen.includes('MIN_WITHDRAWAL_VEX = 2500') && contents.screen.includes('WITHDRAWAL_FEE_RATE = 0.08') && contents.supabase.includes("vexforge_request_withdrawal")],
  ['referrals are read-only and use recorded reward state', contents.screen.includes('loadReferralSummary') && contents.screen.includes('reward_granted') && contents.supabase.includes("vexforge_referrals") && !contents.screen.includes('completed * 100')],
  ['loading, error, empty, refresh, and auth states are explicit', contents.screen.includes('ActivityIndicator') && contents.screen.includes('ErrorNotice') && contents.screen.includes('EmptyState') && contents.screen.includes('RefreshControl') && contents.screen.includes('Sesión requerida')],
  ['mobile accessibility and safe area are present', contents.screen.includes('useSafeAreaInsets') && contents.screen.includes('accessibilityRole="button"') && contents.screen.includes('testID="economy-')],
  ['economy has no direct table writes, mocks, or emoji UI', !/\.insert\(|\.update\(|\.upsert\(|\.delete\(/.test(contents.screen) && !contents.screen.includes('mock') && !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile economy verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile economy verification OK: ${assertions.length}/${assertions.length} checks`);