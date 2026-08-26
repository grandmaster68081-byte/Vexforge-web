import { readFile } from 'node:fs/promises';

const files = {
  screen: 'mobile/app/(tabs)/deck.tsx',
  tabs: 'mobile/app/(tabs)/_layout.tsx',
  supabase: 'mobile/lib/supabase.ts',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const assertions = [
  ['deck screen exists', contents.screen.includes('export default function DeckScreen')],
  ['deck reads the player deck', contents.screen.includes('loadPlayerDeck(session, player.id)')],
  ['deck uses the shared player collection', contents.screen.includes('const { session, player, collection')],
  ['deck enforces standard deck bounds', contents.screen.includes('const MIN_DECK = 5') && contents.screen.includes('const MAX_DECK = 30')],
  ['deck enforces rarity copy limits', contents.screen.includes("card.rarity === 'Legendary' || card.rarity === 'Mythic'")],
  ['deck exposes authoritative validation', contents.screen.includes('validateDeck(selectedIds, session)')],
  ['deck saves through the authoritative action', contents.screen.includes('saveDeck(selectedIds, session)')],
  ['supabase exposes deck RPCs', contents.supabase.includes("'validate_deck'") && contents.supabase.includes("'save_deck'")],
  ['deck is registered in both tab layouts', contents.tabs.includes('name="deck"') && contents.tabs.includes("name=\"deck\" options=")],
  ['no emoji characters in deck UI', !/[\u{1F000}-\u{1FAFF}]/u.test(contents.screen)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile deck verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile deck verification OK: ${assertions.length}/${assertions.length} checks`);