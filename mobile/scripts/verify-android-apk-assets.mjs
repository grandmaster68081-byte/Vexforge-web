import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getVerifiedCriticalAssetHashes } from './critical-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apkArgument = process.argv[2];
if (!apkArgument) {
  console.error('Usage: node scripts/verify-android-apk-assets.mjs <path-to-apk>');
  process.exit(2);
}

const apkPath = path.resolve(process.cwd(), apkArgument);
if (!fs.existsSync(apkPath) || !fs.statSync(apkPath).isFile()) {
  throw new Error(`APK does not exist: ${apkArgument}`);
}

const entries = execFileSync('jar', ['tf', apkPath], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const entryNames = entries.split(/\r?\n/).filter(Boolean);
if (!entryNames.includes('assets/index.android.bundle')) {
  throw new Error('APK is missing assets/index.android.bundle and would require Metro.');
}

for (const entry of entryNames) {
  const normalized = entry.replaceAll('\\', '/');
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error(`APK contains an unsafe archive path: ${entry}`);
  }
}

const extractionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vexforge-apk-check-'));

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

try {
  const criticalAssets = getVerifiedCriticalAssetHashes(root);
  execFileSync('jar', ['xf', apkPath], { cwd: extractionDir, stdio: 'ignore' });

  const criticalPngs = criticalAssets.filter(
    ({ path: assetPath }) => assetPath.startsWith('assets/vexforge/') && assetPath.endsWith('.png'),
  );
  const missingRawPngs = criticalPngs
    .filter(({ path: assetPath, sha256 }) => {
      const rawAssetPath = path.join(
        extractionDir,
        'assets',
        'vexforge-critical',
        path.basename(assetPath),
      );
      return (
        !fs.existsSync(rawAssetPath) ||
        !fs.statSync(rawAssetPath).isFile() ||
        sha256File(rawAssetPath) !== sha256
      );
    })
    .map(({ path: assetPath }) => assetPath);
  if (missingRawPngs.length) {
    throw new Error(
      `APK does not preserve ${missingRawPngs.length} of ${criticalPngs.length} official support PNGs under assets/vexforge-critical:\n${missingRawPngs.join('\n')}`,
    );
  }

  const packagedAssetHashes = new Set();
  for (const entry of entryNames) {
    if (entry.endsWith('/') || !(entry.startsWith('assets/') || entry.startsWith('res/'))) continue;
    const extractedPath = path.join(extractionDir, entry);
    if (fs.existsSync(extractedPath) && fs.statSync(extractedPath).isFile()) {
      packagedAssetHashes.add(sha256File(extractedPath));
    }
  }

  const missingAssets = criticalAssets
    .filter(({ sha256 }) => !packagedAssetHashes.has(sha256))
    .map(({ path: assetPath }) => assetPath);
  if (missingAssets.length) {
    throw new Error(
      `APK is missing ${missingAssets.length} of ${criticalAssets.length} official asset hashes:\n${missingAssets.join('\n')}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        verifiedCriticalAssets: criticalAssets.length,
        embeddedJavaScript: true,
        apkEntries: entryNames.length,
      },
      null,
      2,
    ),
  );
} finally {
  fs.rmSync(extractionDir, { recursive: true, force: true });
}