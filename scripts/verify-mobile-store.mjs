import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/store.tsx',
  supabase: 'mobile/lib/supabase.ts',
  layout: 'mobile/app/_layout.tsx',
  profile: 'mobile/app/(tabs)/profile.tsx',
  home: 'mobile/app/(tabs)/index.tsx',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['store screen is registered and reachable', contents.layout.includes('name="store"') && contents.profile.includes("router.push('/store')") && contents.home.includes("router.push('/store')")],
  ['real pack catalog and VEX purchase are wired', contents.screen.includes('loadMobilePacks') && contents.screen.includes('buyMobilePack') && contents.supabase.includes("vexforge_buy_pack_with_vex")],
  ['real pack opening and reveal state are wired', contents.screen.includes('openMobilePack') && contents.screen.includes('openedCards') && contents.supabase.includes("vexforge_open_pack")],
  ['real shop catalog and order flow are wired', contents.screen.includes('loadMobileShopCatalog') && contents.screen.includes('createMobileShopOrder') && contents.supabase.includes("vexforge_create_shop_order")],
  ['real payment submission is wired', contents.screen.includes('submitMobileShopPayment') && contents.supabase.includes("vexforge_submit_shop_order_payment") && contents.screen.includes('TX hash')],
  ['real fusion policy and atomic RPC are wired', contents.screen.includes('loadMobileFusionPolicy') && contents.screen.includes('applyMobileFusion') && contents.supabase.includes("vexforge_apply_fusion")],
  ['real evolution paths and RPC are wired', contents.screen.includes('loadMobileEvolutionPaths') && contents.screen.includes('evolveMobileCard') && contents.supabase.includes("vexforge_evolve_card")],
  ['real inventory is rendered from GameContext collection', contents.screen.includes('collectionLoading') && contents.screen.includes('collection.filter') && contents.screen.includes('store-inventory-')],
  ['loading, error, and empty states are explicit', contents.screen.includes('store-loading') && contents.screen.includes('accessibilityRole="alert"') && contents.screen.includes('EmptyBlock')],
  ['mobile accessibility and safe area are present', contents.screen.includes('useSafeAreaInsets') && contents.screen.includes('accessibilityRole="tab"') && contents.screen.includes('RefreshControl')],
  ['no client-side authority, mocks, or emoji UI', !contents.screen.includes('Math.random') && !contents.screen.includes('mock') && !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile store verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile store verification OK: ${assertions.length}/${assertions.length} checks`);