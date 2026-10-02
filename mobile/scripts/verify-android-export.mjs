import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getVerifiedCriticalAssetHashes } from './critical-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vexforge-android-export-'));

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

try {
  const criticalAssets = getVerifiedCriticalAssetHashes(root);
  const expoCli = path.join(root, 'node_modules/expo/bin/cli');
  if (!fs.existsSync(expoCli)) throw new Error('Expo CLI is missing; install the locked mobile dependencies first.');

  execFileSync(
    process.execPath,
    ['--max-old-space-size=4096', expoCli, 'export', '--platform', 'android', '--output-dir', exportDir],
    { cwd: root, stdio: 'inherit' },
  );

  const assetDirectory = path.join(exportDir, 'assets');
  const metadataPath = path.join(exportDir, 'metadata.json');
  const androidBundleDirectory = path.join(exportDir, '_expo/static/js/android');
  if (!fs.existsSync(assetDirectory)) throw new Error('Expo Android export did not produce an assets directory.');
  if (!fs.existsSync(metadataPath)) throw new Error('Expo Android export did not produce metadata.json.');
  if (
    !fs.existsSync(androidBundleDirectory) ||
    !fs.readdirSync(androidBundleDirectory).some((file) => /\.(?:hbc|js)$/i.test(file))
  ) {
    throw new Error('Expo Android export did not produce an Android JavaScript bundle.');
  }

  const exportedHashes = new Set(walkFiles(assetDirectory).map(sha256File));
  const missingAssets = criticalAssets
    .filter(({ sha256 }) => !exportedHashes.has(sha256))
    .map(({ path: assetPath }) => assetPath);
  if (missingAssets.length) {
    throw new Error(
      `Expo Android export is missing ${missingAssets.length} of ${criticalAssets.length} official assets:\n${missingAssets.join('\n')}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        exportedAssetFiles: exportedHashes.size,
        verifiedCriticalAssets: criticalAssets.length,
        bundle: 'present',
      },
      null,
      2,
    ),
  );
} finally {
  fs.rmSync(exportDir, { recursive: true, force: true });
}