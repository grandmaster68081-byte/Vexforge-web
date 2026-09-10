import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/(tabs)/deck.tsx',
  tabs: 'mobile/app/(tabs)/_layout.tsx',
  supabase: 'mobile/lib/supabase.ts',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);
const referenceAsset = await readFile('mobile/assets/images/decks-reference-scene.png');
const referenceColorType = referenceAsset[25];
const referenceWidth = referenceAsset.readUInt32BE(16);
const referenceHeight = referenceAsset.readUInt32BE(20);

const assertions = [
  ['deck screen exists', contents.screen.includes('export default function DeckScreen')],
  ['deck reads the player deck', contents.screen.includes('loadPlayerDeck(session, player.id)')],
  ['deck uses the shared player collection', contents.screen.includes('const { session, player, collection')],
  ['deck enforces standard deck bounds', contents.screen.includes('const MIN_DECK = 5') && contents.screen.includes('const MAX_DECK = 30')],
  ['deck enforces rarity copy limits', contents.screen.includes("card.rarity === 'Legendary' || card.rarity === 'Mythic'")],
  ['deck enforces live Mythic cap', contents.screen.includes('const MAX_MYTHIC = 1')],
  ['deck enforces live Legendary cap', contents.screen.includes('const MAX_LEGENDARY = 3')],
  ['deck exposes authoritative validation', contents.screen.includes('validateDeck(selectedIds, session)')],
  ['deck saves through the authoritative action', contents.screen.includes('saveDeck(selectedIds, session)')],
  ['supabase exposes deck RPCs', contents.supabase.includes("'validate_deck'") && contents.supabase.includes("'save_deck'")],
  ['deck is registered in both tab layouts', contents.tabs.includes('name="deck"') && contents.tabs.includes("name=\"deck\" options=")],
  ['deck reference is 1080x2340 RGB', referenceWidth === 1080 && referenceHeight === 2340 && referenceColorType === 2],
  ['deck uses the measured canonical reference canvas', contents.screen.includes('useMeasuredCanonicalFrame') && contents.screen.includes('onLayout={onLayout}') && contents.screen.includes('marginTop: insets.top') && contents.screen.includes('resizeMode="stretch"')],
  ['deck keeps the authored scene free of duplicate chrome', contents.screen.includes('pointerEvents="box-none"') && contents.screen.includes('deckSlotHit') && !contents.screen.includes('<View style={[styles.deckCarousel')],
  ['deck controls align to the reference flows', contents.screen.includes('top: canvasHeight * 0.374') && contents.screen.includes('top: canvasHeight * 0.445') && contents.screen.includes('top: canvasHeight * 0.731')],
  ['deck home connector uses the canonical root route', contents.screen.includes("navigate('/')") && !contents.screen.includes("navigate('/index')")],
  ['no emoji characters in deck UI', !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
  ['missing art is explicit, not generic', contents.screen.includes('ARTE CANÓNICO PENDIENTE') && !contents.screen.includes('Feather name="layers"')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile deck verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile deck verification OK: ${assertions.length}/${assertions.length} checks`);