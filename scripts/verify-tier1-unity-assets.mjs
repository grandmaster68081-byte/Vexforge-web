import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const unityRoot = path.join(root, 'unity');
const resourcesRoot = path.join(unityRoot, 'Assets/Resources');
const manifestPath = path.join(resourcesRoot, 'VexforgeTier1/VexforgeTier1AssetManifest.json');
const failures = [];
const supportedExtensions = ['.png', '.jpg', '.jpeg', '.tga', '.tif', '.tiff', '.wav', '.mp3', '.ogg'];

function readPngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 ||
      bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a' ||
      bytes.toString('ascii', 12, 16) !== 'IHDR') {
    return null;
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

if (!fs.existsSync(manifestPath)) {
  console.error('UNITY ASSET VERIFY FAILED — Tier1 asset manifest is missing.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.schema_version !== '3.0') failures.push(`unsupported manifest schema: ${manifest.schema_version}`);
if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) failures.push('manifest has no asset entries');
if (manifest?.official_card_art_source?.local_card_art_copy_forbidden !== true) {
  failures.push('manifest does not forbid local copies of official card art');
}
if (manifest?.official_card_art_source?.replacement_artwork_for_official_127 !== false) {
  failures.push('manifest permits substituting the official card catalog');
}

const ids = new Set();
const criticalTextureAssets = [];
const resourceKeys = new Set();
const criticalImageFiles = [];

for (const entry of manifest.assets || []) {
  if (!entry || typeof entry.asset_id !== 'string' || typeof entry.domain !== 'string' ||
      typeof entry.resources_key !== 'string') {
    failures.push('manifest contains an entry with missing identity/domain/Resources key');
    continue;
  }

  if (ids.has(entry.asset_id)) failures.push(`duplicate asset ID: ${entry.asset_id}`);
  ids.add(entry.asset_id);

  if (entry.domain === 'card/art' || entry.domain === 'official_card_art' ||
      entry.resources_key.toLowerCase().includes('/cards/')) {
    failures.push(`official card artwork must remain remote, not a Unity Resources copy: ${entry.asset_id}`);
  }

  if (entry.identity_critical && (entry.fallback_id || entry.fallback !== 'none')) {
    failures.push(`critical asset has a substitute fallback: ${entry.asset_id}`);
  }

  if (!entry.identity_critical && entry.fallback_id) {
    const fallback = (manifest.assets || []).find((candidate) => candidate.asset_id === entry.fallback_id);
    if (!fallback) failures.push(`unregistered fallback for ${entry.asset_id}: ${entry.fallback_id}`);
    else if (fallback.identity_critical || fallback.domain !== entry.domain) {
      failures.push(`fallback crosses a critical/domain boundary: ${entry.asset_id} -> ${entry.fallback_id}`);
    }
  }

  if (resourceKeys.has(entry.resources_key)) {
    failures.push(`duplicate Resources key: ${entry.resources_key}`);
  }
  resourceKeys.add(entry.resources_key);

  const basePath = path.resolve(resourcesRoot, entry.resources_key);
  if (basePath !== resourcesRoot && !basePath.startsWith(`${resourcesRoot}${path.sep}`)) {
    failures.push(`${entry.asset_id}: Resources key escapes the Unity Resources folder`);
    continue;
  }
  const files = supportedExtensions
    .map((extension) => `${basePath}${extension}`)
    .filter((filePath) => fs.existsSync(filePath));
  if (files.length !== 1) {
    failures.push(`${entry.asset_id}: expected one local resource file, found ${files.length}`);
    continue;
  }

  const assetPath = files[0];
  const isTexture = ['.png', '.jpg', '.jpeg', '.tga', '.tif', '.tiff'].includes(path.extname(assetPath).toLowerCase());
  if (entry.identity_critical) {
    if (!isTexture) failures.push(`${entry.asset_id}: identity-critical resource is not a texture`);
    else {
      criticalTextureAssets.push(entry.asset_id);
      criticalImageFiles.push(assetPath);
      const metaPath = `${assetPath}.meta`;
      if (!fs.existsSync(metaPath)) failures.push(`${entry.asset_id}: Unity importer metadata is missing`);
      else if (!fs.readFileSync(metaPath, 'utf8').includes('TextureImporter:')) {
        failures.push(`${entry.asset_id}: Unity metadata does not declare a TextureImporter`);
      }

      if (path.extname(assetPath).toLowerCase() === '.png') {
        const dimensions = readPngDimensions(assetPath);
        if (!dimensions || dimensions.width < 256 || dimensions.height < 256) {
          failures.push(`${entry.asset_id}: PNG dimensions are unreadable or below 256x256`);
        }
      }
    }
  }
}

const localCardArtFolders = [];
function scanForLocalCardArt(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['cards', 'card-art', 'cardart'].includes(entry.name.toLowerCase())) {
        localCardArtFolders.push(absolutePath);
      }
      scanForLocalCardArt(absolutePath);
    }
  }
}
scanForLocalCardArt(path.join(unityRoot, 'Assets'));
if (localCardArtFolders.length) {
  failures.push('local card-art directories are forbidden; official card art must remain remote');
}

if (failures.length) {
  console.error('UNITY ASSET VERIFY FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `UNITY ASSET SOURCE PASS — ${manifest.assets.length} manifest entries resolve to one local file; ` +
  `${criticalTextureAssets.length} critical textures have importer metadata and readable source dimensions. ` +
  'Unity AssetDatabase import, shader/material use, and Android build inclusion remain separate Editor gates.',
);
