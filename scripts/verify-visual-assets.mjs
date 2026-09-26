import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const scanRoots = ['src', 'public'];
const supabaseStorage = 'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/';
const forbidden = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (/\.(ts|tsx|css|html|json|md|mjs)$/i.test(entry.name)) {
      const text = fs.readFileSync(abs, 'utf8');
      if (text.includes(supabaseStorage) && !abs.endsWith(path.join('src','lib','cards.ts'))) {
        forbidden.push(path.relative(root, abs));
      }
    }
  }
}
scanRoots.forEach((dir) => walk(path.join(root, dir)));

const required = [
  'public/art/portal/01-home-citadel-dawn.jpg',
  'public/art/portal/02-game-forge-cathedral.jpg',
  'public/art/portal/03-battle-arena.jpg',
  'public/art/portal/04-world-atlas.jpg',
  'public/art/portal/05-news-courtyard.jpg',
  'public/art/portal/06-media-citadel.jpg',
  'public/art/portal/07-download-forge.jpg',
  'public/art/portal/08-support-sanctum.jpg',
  'public/art/portal/09-faction-warrior.jpg',
  'public/art/portal/10-faction-mage.jpg',
  'public/art/portal/11-faction-paladin.jpg',
  'public/art/portal/12-faction-rogue.jpg',
  'public/art/portal/13-footer-great-gate.jpg',
  'public/art/portal/14-mobile-chamber.jpg',
  'public/art/factions/icon_guerrero.svg',
  'public/art/factions/icon_mago.svg',
  'public/art/factions/icon_paladin.svg',
  'public/art/factions/icon_picaro.svg',
  'public/art/references/REF_A_SWEeping_CITADEL.png',
  'public/art/references/REF_B_ARENA_CITADEL.png',
  'public/art/references/REF_C_FORGE_CATHEDRAL.png',
  'public/art/references/REF_CURRENT_PORTAL_QA_CONTACT_SHEET.jpg',
];
const missing = required.filter((p) => !fs.existsSync(path.join(root, p)));

if (forbidden.length || missing.length) {
  if (forbidden.length) console.error(`FORBIDDEN STORAGE REFERENCES:\n${forbidden.join('\n')}`);
  if (missing.length) console.error(`MISSING PORTAL ART:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log(`VISUAL ASSET CONTRACT PASS — ${required.length} required local art files present; Supabase storage references remain card-only.`);
