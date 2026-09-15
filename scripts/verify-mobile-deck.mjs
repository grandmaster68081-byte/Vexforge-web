import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/(tabs)/deck.tsx',
  tabs: 'mobile/app/(tabs)/_layout.tsx',
  supabase: 'mobile/lib/supabase.ts',
  visual: 'mobile/constants/visual.ts',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);
const referenceAsset = await readFile('mobile/assets/images/decks-reference-scene.png');

function readPngDimensions(buffer) {
  if (buffer.length < 24 || buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const referenceDimensions = readPngDimensions(referenceAsset);

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
  ['deck uses approved scene art with native layers', contents.screen.includes('testID="deck-scene-art"') && contents.screen.includes('CANONICAL_BACKGROUNDS.forge') && contents.visual.includes("forge: require('../assets/images/decks-reference-scene.png')") && contents.screen.includes('Animated.Image') && contents.screen.includes('formation-slot-')],
  ['deck keeps the measured canonical frame for the scene', contents.screen.includes('useMeasuredCanonicalFrame') && contents.screen.includes('onReferenceRootLayout') && contents.screen.includes('onLayout={onReferenceRootLayout}') && contents.screen.includes('referenceScene') && contents.screen.includes('marginTop: insets.top')],
  ['deck announces the shared Forja identity', contents.screen.includes("from '@/components/DomainHeader'") && contents.screen.includes('<DomainHeader') && contents.screen.includes('domain="forja"') && contents.screen.includes('status={domainStatus}')],
  ['deck header status reflects live sync state', contents.screen.includes("collectionLoading || deckLoading") && contents.screen.includes("'SINCRONIZANDO MAZOS'") && contents.screen.includes("'SIN SEÑAL · TOCA PARA REINTENTAR'") && contents.screen.includes('savedSummary.cardCount')],
  ['deck keeps native scene controls wired', contents.screen.includes('deck-programmatic-surface') && contents.screen.includes('deck-refresh-visible') && contents.screen.includes('testID="edit-deck"') && contents.screen.includes('testID="view-deck-detail"')],
  ['deck summary is derived from official slots', contents.screen.includes('function summarizeDeck(slots: DeckSlot[]): DeckSummary') && contents.screen.includes('slot.faction.trim()') && contents.screen.includes('slot.power')],
  ['deck search uses official card identity', contents.screen.includes('slot.name, slot.code') && !contents.screen.includes("'mazo sin nombre'")],
  ['deck does not invent a persisted name or faction', contents.screen.includes('MAZO ACTIVO') && !contents.screen.includes('MAZO SIN NOMBRE') && !contents.screen.includes("'Sin facción'")],
  ['deck summary stays inside the forge scene region', contents.screen.includes('testID="deck-summary-overlay"') && contents.screen.includes('top: canvasHeight * 0.735') && contents.screen.includes('forgeReadout')],
  ['deck controls align to the forge scene regions', contents.screen.includes('top: canvasHeight * 0.405') && contents.screen.includes('top: canvasHeight * 0.605') && contents.screen.includes('top: canvasHeight * 0.785')],
  ['deck uses both native card rails', contents.screen.includes('formation-slot-') && contents.screen.includes('reserve-slot-') && contents.screen.includes('reserveRail')],
  ['deck controls use the scene sockets', contents.screen.includes('bottomConsole') && contents.screen.includes('searchDock') && contents.screen.includes('coreAction') && contents.screen.includes('utilityDock')],
  ['deck removes the nonfunctional dashboard sorter', !contents.screen.includes('deck-sort') && !contents.screen.includes('SortMode') && !contents.screen.includes('RECIENTES')],
  ['deck home connector uses the canonical root route', contents.screen.includes("navigate('/')") && !contents.screen.includes("navigate('/index')")],
  ['no emoji characters in deck UI', !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
  ['missing art is explicit, not generic', contents.screen.includes('ARTE CANÓNICO PENDIENTE') && contents.screen.includes('styles.editorArtFallback')],
  ['forge actions expose diegetic press depth', contents.screen.includes('testID="validate-deck"') && contents.screen.includes('opacity: pressed ? 0.78 : 1') && contents.screen.includes('testID="save-deck"') && contents.screen.includes('opacity: saving ? 0.7 : pressed ? 0.82 : 1')],
  ['deck keeps empty and filtered states explicit', contents.screen.includes("showSavedDeck ? savedSummary.cardCount : '—'") && contents.screen.includes("showSavedDeck ? savedSummary.power : '—'") && contents.screen.includes("hasSavedDeck ? 'SIN COINCIDENCIAS' : 'NÚCLEO EN ESPERA'") && contents.screen.includes("summary.championName ? `CAMPEÓN · ${summary.championName}` : 'CAMPEÓN NO REPORTADO'") && !contents.screen.includes('summary?.cardCount ?? 0')],
  ['deck scene has motion safety and depth layers', contents.screen.includes('useReducedMotion') && contents.screen.includes('coreGlowStyle') && contents.screen.includes('lightSweepStyle') && contents.screen.includes('LinearGradient')],
  ['deck reference is canonical 1080 by 2340 PNG', referenceDimensions?.width === 1080 && referenceDimensions?.height === 2340],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile deck verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile deck verification OK: ${assertions.length}/${assertions.length} checks`);