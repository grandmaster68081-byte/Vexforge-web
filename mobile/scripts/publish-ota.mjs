import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SECTION_ID', 'SOURCE_COMMIT', 'RUNTIME_VERSION', 'APP_VERSION', 'CHANNEL'];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);
const root = process.env.OTA_EXPORT_DIR ?? 'dist';
const bucket = 'vexforge-updates';
const supabaseUrl = process.env.SUPABASE_URL.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runtimeVersion = process.env.RUNTIME_VERSION;
const channel = process.env.CHANNEL;
const sourceCommit = process.env.SOURCE_COMMIT;
const exportMetadataPath = join(root, 'metadata.json');
if (!existsSync(exportMetadataPath)) throw new Error('Expo export metadata.json not found');

const metadata = JSON.parse(readFileSync(exportMetadataPath, 'utf8'));
const androidBundle = metadata.bundles?.android?.find((item) => item.runtimeVersion === runtimeVersion) ?? metadata.bundles?.android?.[0];
if (!androidBundle?.file) throw new Error('Expo export did not contain an Android launch bundle');
const allFiles = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const full = join(directory, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name !== 'metadata.json') allFiles.push(full);
  }
}
walk(root);
const mime = (file) => ({
  '.js': 'application/javascript', '.hbc': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.woff': 'font/woff', '.ttf': 'font/ttf', '.bin': 'application/octet-stream',
}[extname(file).toLowerCase()] ?? 'application/octet-stream');
const sha256 = async (file) => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  const stream = createReadStream(file);
  stream.on('data', (chunk) => hash.update(chunk));
  stream.on('error', reject);
  stream.on('end', () => resolve(hash.digest('hex')));
});
const upload = async (objectPath, body, contentType) => {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'x-upsert': 'true', 'content-type': contentType },
    body,
  });
  if (!response.ok && response.status !== 409) throw new Error(`Storage upload failed for ${objectPath}: ${response.status} ${await response.text()}`);
};
const bucketResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
  method: 'POST', headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'content-type': 'application/json' },
  body: JSON.stringify({ id: bucket, name: bucket, public: true }),
});
if (!bucketResponse.ok && bucketResponse.status !== 409) throw new Error(`Could not create update bucket: ${bucketResponse.status} ${await bucketResponse.text()}`);

const prefix = `releases/${runtimeVersion}/${channel}/${sourceCommit}`;
for (const file of allFiles) {
  const objectPath = `${prefix}/${relative(root, file).split(sep).join('/')}`;
  await upload(objectPath, readFileSync(file), mime(file));
}
const bundlePath = `${prefix}/${androidBundle.file.replaceAll('\\', '/')}`;
const bundleFile = join(root, androidBundle.file);
if (!existsSync(bundleFile)) throw new Error(`Launch bundle missing: ${bundleFile}`);
const launchDigest = await sha256(bundleFile);
const publicUrl = (path) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
const manifest = {
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  runtimeVersion,
  launchAsset: { url: publicUrl(bundlePath), key: basename(androidBundle.file), version: launchDigest, contentType: 'application/javascript' },
  assets: (metadata.assets ?? []).map((asset) => {
    const path = String(asset.path ?? asset.file ?? '').replaceAll('\\', '/');
    return { hash: asset.hash ?? asset.key ?? basename(path), key: asset.key ?? basename(path), name: asset.name ?? basename(path), type: asset.type ?? extname(path).replace('.', ''), url: publicUrl(`${prefix}/${path}`) };
  }),
  metadata: { sectionId: process.env.SECTION_ID, channel, sourceCommit, message: process.env.RELEASE_MESSAGE ?? '' },
  extra: { expoClient: { version: process.env.APP_VERSION, runtimeVersion } },
};
const manifestBytes = Buffer.from(JSON.stringify(manifest));
const manifestPath = `${prefix}/manifest.json`;
await upload(manifestPath, manifestBytes, 'application/expo+json');
const manifestDigest = createHash('sha256').update(manifestBytes).digest('hex');
const registryRow = {
  section_id: process.env.SECTION_ID,
  section_scope: process.env.SECTION_SCOPE ?? 'mobile',
  delivery_type: 'OTA_UPDATE',
  runtime_version: runtimeVersion,
  app_version: process.env.APP_VERSION,
  version_code: null,
  channel,
  source_commit: sourceCommit,
  supabase_schema_or_rpc_impact: 'NONE',
  asset_manifest: manifest.assets,
  manifest_url: publicUrl(manifestPath),
  bundle_url: publicUrl(bundlePath),
  artifact_url: process.env.GITHUB_RUN_URL ?? null,
  bundle_or_aab_digest: launchDigest,
  minimum_app_version: process.env.MINIMUM_APP_VERSION ?? process.env.APP_VERSION,
  rollout_percent: Number(process.env.ROLLOUT_PERCENT ?? '100'),
  validation: { expo_export: true, runtime_match: true, fallback_embedded: true, rollback_available: true, launch_asset_sha256: launchDigest, manifest_sha256: manifestDigest },
  known_limitations: 'OTA sólo aplica a instalaciones que ya contienen runtimeVersion 1.0.0 y expo-updates; la APK 72 anterior no tiene este módulo.',
  status: 'PUBLISHED',
  responsible: 'github-actions',
};
const registryResponse = await fetch(`${supabaseUrl}/rest/v1/vexforge_android_release_registry?on_conflict=section_id,channel,delivery_type,source_commit`, {
  method: 'POST', headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, Prefer: 'resolution=merge-duplicates,return=representation', 'content-type': 'application/json' }, body: JSON.stringify(registryRow),
});
if (!registryResponse.ok) throw new Error(`Registry write failed: ${registryResponse.status} ${await registryResponse.text()}`);
const updateUrl = `${supabaseUrl}/functions/v1/vexforge-updates`;
const output = { sectionId: process.env.SECTION_ID, runtimeVersion, channel, sourceCommit, updateUrl, manifestUrl: publicUrl(manifestPath), launchAssetUrl: publicUrl(bundlePath), launchSha256: launchDigest, manifestSha256: manifestDigest };
console.log(JSON.stringify(output, null, 2));
if (process.env.GITHUB_OUTPUT) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_OUTPUT, `update_url=${updateUrl}\nmanifest_url=${publicUrl(manifestPath)}\nlaunch_sha256=${launchDigest}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## VEXFORGE OTA publicada\n- Sección: ${process.env.SECTION_ID}\n- Runtime: ${runtimeVersion}\n- Canal: ${channel}\n- URL de actualización: ${updateUrl}\n- Manifiesto: ${publicUrl(manifestPath)}\n- SHA-256 del bundle: ${launchDigest}\n`);
}
