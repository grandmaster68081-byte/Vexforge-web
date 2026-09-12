import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/(tabs)/deck.tsx',
  tabs: 'mobile/app/(tabs)/_layout.tsx',
  supabase: 'mobile/lib/supabase.ts',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);
const referenceAsset = await readFile('mobile/assets/images/deck-forge-scene.jpg');

function readJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) return null;
    const segmentLength = buffer.readUInt16BE(offset);
    if (marker >= 0xc0 && marker <= 0xc3 && marker !== 0xc4) {
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
      };
    }
    offset += segmentLength;
  }
  return null;
}

const referenceDimensions = readJpegDimensions(referenceAsset);

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
  ['deck uses the supplied forge artwork without the legacy scene', contents.screen.includes('deck-forge-scene.jpg') && !contents.screen.includes('decks-reference-scene.png') && referenceDimensions?.width === 1136 && referenceDimensions?.height === 2048],
  ['deck uses a measured canonical frame with contain artwork', contents.screen.includes('useMeasuredCanonicalFrame') && contents.screen.includes('onReferenceRootLayout') && contents.screen.includes('onLayout={onReferenceRootLayout}') && contents.screen.includes('referenceScene') && contents.screen.includes('referenceImage') && contents.screen.includes("width: '100%'") && contents.screen.includes("height: '100%'") && contents.screen.includes('marginTop: insets.top') && contents.screen.includes('resizeMode="contain"')],
  ['deck keeps the authored scene free of duplicate chrome', contents.screen.includes('pointerEvents="box-none"') && contents.screen.includes('deckSlotHit') && !contents.screen.includes('<View style={[styles.deckCarousel')],
  ['deck summary is derived from official slots', contents.screen.includes('function summarizeDeck(slots: DeckSlot[]): DeckSummary') && contents.screen.includes('slot.faction.trim()') && contents.screen.includes('slot.power')],
  ['deck search uses official card identity', contents.screen.includes('slot.name, slot.code') && !contents.screen.includes("'mazo sin nombre'")],
  ['deck does not invent a persisted name or faction', contents.screen.includes('MAZO ACTIVO') && !contents.screen.includes('MAZO SIN NOMBRE') && !contents.screen.includes("'Sin facción'")],
  ['deck summary stays inside the forge table region', contents.screen.includes('testID="deck-summary-overlay"') && contents.screen.includes('top: canvasHeight * 0.755') && contents.screen.includes('deckSummaryMask')],
  ['deck controls align to the forge table regions', contents.screen.includes('top: canvasHeight * 0.462') && contents.screen.includes('top: canvasHeight * 0.555') && contents.screen.includes('top: canvasHeight * 0.755')],
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