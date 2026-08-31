import { readFile } from 'node:fs/promises';

const files = {
  registry: 'mobile/constants/cardPilot.ts',
  screen: 'mobile/app/(tabs)/collection.tsx',
  cardType: 'mobile/lib/supabase.ts',
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])),
);

const pilotCodes = ['VEX-0016', 'VEX-0017', 'VEX-0097'];
const assertions = [
  ['registry exists and is canonical-code keyed', contents.registry.includes('MOBILE_CARD_PILOT_IDENTITIES') && contents.registry.includes('getCardPilotIdentity')],
  ['pilot codes are all registered', pilotCodes.every((code) => contents.registry.includes(`'${code}'`))],
  ['collection consumes the authored registry', contents.screen.includes("from '@/constants/cardPilot'") && contents.screen.includes('getCardPilotIdentity(card.code)')],
  ['collection still reads official card image payloads', contents.screen.includes('source={{ uri: card.image_url }}') && contents.cardType.includes('image_url: string | null')],
  ['pilot treatment is presentation-only', contents.registry.includes('presentation-only') && contents.registry.includes('treatment:')],
  ['pilot exposes a visual test hook', contents.screen.includes('testID={`card-pilot-${card.code}`}')],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile card pilot verification failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Mobile card pilot verification OK: ${assertions.length}/${assertions.length} checks`);