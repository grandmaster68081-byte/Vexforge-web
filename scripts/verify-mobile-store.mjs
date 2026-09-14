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
  ['store screen is registered and reachable', contents.layout.includes('name="store"') && contents.profile.includes("router.push('/store?mode=fusion')") && contents.home.includes("'/store?mode=fusion'") && contents.home.includes('navigate(route as HomeRoute)')],
  ['real pack catalog and VEX purchase are wired', contents.screen.includes('loadMobilePacks') && contents.screen.includes('buyMobilePack') && contents.supabase.includes("vexforge_buy_pack_with_vex")],
  ['real pack opening and reveal state are wired', contents.screen.includes('openMobilePack') && contents.screen.includes('openedCards') && contents.supabase.includes("vexforge_open_pack")],
  ['real shop catalog and order flow are wired', contents.screen.includes('loadMobileShopCatalog') && contents.screen.includes('createMobileShopOrder') && contents.supabase.includes("vexforge_create_shop_order")],
  ['real payment submission is wired', contents.screen.includes('submitMobileShopPayment') && contents.supabase.includes("vexforge_submit_shop_order_payment") && contents.screen.includes('TX hash')],
  ['real fusion policy and atomic RPC are wired', contents.screen.includes('loadMobileFusionPolicy') && contents.screen.includes('applyMobileFusion') && contents.supabase.includes("vexforge_apply_fusion")],
  ['real evolution paths and RPC are wired', contents.screen.includes('loadMobileEvolutionPaths') && contents.screen.includes('evolveMobileCard') && contents.supabase.includes("vexforge_evolve_card")],
  ['real inventory is rendered from GameContext collection', contents.screen.includes('collectionLoading') && contents.screen.includes('collection.filter') && contents.screen.includes('store-inventory-')],
  ['unknown VEX balance never becomes zero or enables a purchase', contents.screen.includes("typeof balance === 'number' && Number.isFinite(balance)") && contents.screen.includes('BALANCE PENDIENTE') && contents.screen.includes('disabled={!balanceKnown || !affordable || busy !== null}') && !contents.screen.includes('Number(balance ?? 0)')],
  ['shop prices and treasury terms never use invented defaults', contents.screen.includes('function formatUsd') && contents.screen.includes('PRECIO NO REPORTADO') && contents.screen.includes('PRECIO PENDIENTE') && contents.screen.includes('CADENA NO REPORTADA') && contents.screen.includes('TOKEN NO REPORTADO') && contents.screen.includes('ESTÁNDAR NO REPORTADO') && contents.screen.includes('TESORERÍA NO REPORTADA') && !contents.screen.includes('Number(item.price_usdt).toFixed(2)') && !contents.screen.includes("selectedOrder.chain ?? 'BSC'") && !contents.screen.includes("selectedOrder.token_symbol ?? 'USDT'")],
  ['fusion policy keeps missing costs and absent rules honest', contents.supabase.includes('neededCards: typeof row.needed_cards') && contents.supabase.includes('targetRarity: typeof row.target_rarity') && contents.screen.includes('policyLoading') && contents.screen.includes('Regla de fusión no reportada') && contents.screen.includes('CARTAS NO REPORTADAS') && contents.screen.includes('SHARDS NO REPORTADOS') && contents.screen.includes('VEX NO REPORTADO') && contents.screen.includes('RESULTADO NO REPORTADO') && contents.screen.includes('policy.neededCards === null')],
  ['evolution requirements never use invented defaults', contents.screen.includes('COPIAS NO REPORTADAS') && contents.screen.includes('VEX NO REPORTADO') && contents.screen.includes('NIVEL NO REPORTADO') && contents.screen.includes('Victorias PvP requeridas') && !contents.screen.includes('copies_required ?? 2') && !contents.screen.includes('vex_ingame ?? 0') && !contents.screen.includes('level_required ?? 1')],
  ['loading, error, and empty states are explicit', contents.screen.includes('store-loading') && contents.screen.includes('accessibilityRole="alert"') && contents.screen.includes('EmptyBlock')],
  ['store is anchored to a living domain', contents.screen.includes('<DomainHeader') && contents.screen.includes('domain="foja"') && contents.screen.includes('CÁMARA ACTIVA')],
  ['active chamber exposes live catalog identity', contents.screen.includes('testID="store-domain-status"') && contents.screen.includes('CATÁLOGO VIVO') && contents.screen.includes('activeMode')],
  ['store actions expose press depth', contents.screen.includes('translateY: pressed ? 2 : 0') && contents.screen.includes('translateY: pressed ? 1 : 0')],
  ['mobile accessibility and safe area are present', contents.screen.includes('useSafeAreaInsets') && contents.screen.includes('accessibilityRole="tab"') && contents.screen.includes('RefreshControl')],
  ['no client-side authority, mocks, or emoji UI', !contents.screen.includes('Math.random') && !contents.screen.includes('mock') && !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile store verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile store verification OK: ${assertions.length}/${assertions.length} checks`);