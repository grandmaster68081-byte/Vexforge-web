import { readFile } from 'node:fs/promises';

const files = [
  'mobile/app/meta.tsx',
  'mobile/lib/supabase.ts',
  'mobile/app/_layout.tsx',
  'mobile/app/(tabs)/profile.tsx',
  'docs/VE-MOB-14-META.md',
];

const contents = await Promise.all(files.map(async (path) => [path, await readFile(path, 'utf8')]));
const source = Object.fromEntries(contents);

const assertions = [
  ['meta route exists', source['mobile/app/meta.tsx'].includes('export default function MetaScreen')],
  ['meta route is registered', source['mobile/app/_layout.tsx'].includes('name="meta"')],
  ['profile links to meta', source['mobile/app/(tabs)/profile.tsx'].includes("router.push('/meta')")],
  ['account and settings surface', source['mobile/app/meta.tsx'].includes('Cuenta y ajustes') && source['mobile/lib/supabase.ts'].includes('loadMobileSettings')],
  ['settings read is scoped to authenticated player', source['mobile/lib/supabase.ts'].includes('player_settings?select=player_id%2Ctelegram_enabled%2Cnotifications_enabled%2Clanguage%2Ctimezone%2Cui_mode&player_id=eq.') && source['mobile/lib/supabase.ts'].includes('currentPlayerId(session)')],
  ['cosmetics surface uses official contracts', source['mobile/app/meta.tsx'].includes('Cosméticos equipados') && source['mobile/lib/supabase.ts'].includes('equip_cosmetic')],
  ['relics surface uses authoritative RPCs', source['mobile/app/meta.tsx'].includes('Reliquias') && source['mobile/lib/supabase.ts'].includes('grant_starter_relics')],
  ['NFT surface reads contract and queue', source['mobile/lib/supabase.ts'].includes('vexforge_nft_contracts') && source['mobile/lib/supabase.ts'].includes('vexforge_nft_mint_queue')],
  ['Forge Ads preserves server record', source['mobile/app/meta.tsx'].includes('Forge Ads') && source['mobile/lib/supabase.ts'].includes('recordMobileAdView')],
  ['Assets remains an honest admin state', source['mobile/app/meta.tsx'].includes('Acceso restringido') && source['mobile/app/meta.tsx'].includes('isAdmin')],
  ['explicit loading, error, empty and refresh states', source['mobile/app/meta.tsx'].includes('Sincronizando sistemas') && source['mobile/app/meta.tsx'].includes('meta-sync-error') && source['mobile/app/meta.tsx'].includes('RefreshControl') && source['mobile/app/meta.tsx'].includes('Colección vacía')],
  ['no emoji characters in mobile meta UI', !/[\u{1F000}-\u{1FAFF}]/u.test(source['mobile/app/meta.tsx'])],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(`Mobile meta verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile meta verification OK: ${assertions.length}/${assertions.length} checks`);