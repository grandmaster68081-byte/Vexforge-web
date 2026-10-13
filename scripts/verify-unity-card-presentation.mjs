import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cardViewPath = path.join(
  root,
  'unity/Assets/Scripts/Presentation/VexforgeCardView.cs',
);
const manifestPath = path.join(
  root,
  'unity/Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json',
);
const fallbackPath = path.join(
  root,
  'unity/Assets/Resources/VexforgeTier1/Art/VF_CARD_FALLBACK_NEUTRAL.png',
);
const cardView = fs.readFileSync(cardViewPath, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];

function requireText(source, fragment, label) {
  if (!source.includes(fragment)) failures.push(`${label}: missing ${JSON.stringify(fragment)}`);
}

if (/GameObject\.CreatePrimitive/.test(cardView)) {
  failures.push('VexforgeCardView still creates a visible Unity primitive.');
}
requireText(cardView, 'BuildCardBodyMesh()', 'beveled card body mesh');
requireText(cardView, 'BuildRoundedRectOutline(', 'rounded card silhouette');
requireText(cardView, 'BuildArtworkQuadMesh()', 'authored artwork surface');
requireText(
  cardView,
  'Resources.Load<Texture2D>(UnavailableArtResourcesKey)',
  'card-art state texture loading',
);
requireText(
  cardView,
  'var displayedTexture = texture != null ? texture : unavailableArtTexture;',
  'explicit card-art fallback state',
);
requireText(
  cardView,
  'return texture != null && hasTextureProperty;',
  'official art must still succeed independently of the fallback',
);
requireText(cardView, '"CARGANDO ARTE"', 'visible card-art loading state');
requireText(cardView, 'SetArtStatus("ARTE NO\\nDISPONIBLE"', 'visible card-art failure state');

const officialArtContract = manifest?.official_card_art_source;
if (officialArtContract?.known_count !== 127 ||
    officialArtContract?.local_card_art_copy_forbidden !== true ||
    officialArtContract?.replacement_artwork_for_official_127 !== false) {
  failures.push('manifest no longer keeps official card art remote for all 127 cards.');
}

const fallbackEntry = Array.isArray(manifest?.assets)
  ? manifest.assets.find((entry) => entry?.asset_id === 'VF_CARD_FALLBACK_NEUTRAL')
  : null;
if (fallbackEntry?.resources_key !== 'VexforgeTier1/Art/VF_CARD_FALLBACK_NEUTRAL' ||
    fallbackEntry?.identity_critical !== false) {
  failures.push('non-critical loading/error art is not registered in the card state domain.');
}

const png = fs.readFileSync(fallbackPath);
if (png.length < 24 ||
    png.toString('ascii', 1, 4) !== 'PNG' ||
    png.readUInt32BE(16) <= 0 ||
    png.readUInt32BE(20) / png.readUInt32BE(16) < 1.4) {
  failures.push('card loading/error artwork is missing or is not portrait-oriented.');
}

if (failures.length > 0) {
  console.error('UNITY CARD PRESENTATION STATIC CONTRACT FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  'UNITY CARD PRESENTATION STATIC CONTRACT PASS — custom beveled mesh, authored artwork surface, ' +
  'portrait fallback state and explicit official-art failure status are present. ' +
  'This is not Unity compilation, texture import, or Play Mode evidence.',
);
