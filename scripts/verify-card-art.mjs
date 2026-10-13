import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src/lib/cards.ts'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(
  path.join(root, 'unity/Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json'),
  'utf8',
));
const supabaseUrl = process.env.VITE_SUPABASE_URL ||
  source.match(/VITE_SUPABASE_URL\s*\|\|\s*["']([^"']+)["']/)?.[1];
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  source.match(/SUPABASE_PUBLISHABLE_KEY[^\n]*\|\|\s*["'](sb_publishable_[^"']+)["']/)?.[1];
const publicPrefix = source.match(/OFFICIAL_PUBLIC_PREFIX\s*=\s*["']([^"']+)["']/)?.[1];
const failures = [];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

if (!supabaseUrl || !publishableKey || !publicPrefix) {
  console.error('CARD ART VERIFY FAILED — public catalog configuration could not be read from the portal source.');
  process.exit(1);
}

function validOfficialObjectUrl(value) {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    const prefix = new URL(publicPrefix);
    if (url.protocol !== 'https:' ||
        url.origin !== prefix.origin ||
        !url.pathname.startsWith(prefix.pathname) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash) {
      return null;
    }

    const objectPath = decodeURIComponent(url.pathname.slice(prefix.pathname.length));
    const segments = objectPath.split('/');
    if (!objectPath || segments.some((segment) => segment === '.' || segment === '..')) return null;
    return objectPath;
  } catch {
    return null;
  }
}

async function loadCatalog() {
  const query = new URLSearchParams({
    select: 'id,code,image_url',
    order: 'id.asc',
    limit: '1000',
  });
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/cards?${query}`, {
    headers: {
      apikey: publishableKey,
      Accept: 'application/json',
      Prefer: 'count=exact',
      Range: '0-999',
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    console.error(`CARD ART VERIFY FAILED — live cards query returned HTTP ${response.status}.`);
    process.exit(1);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    console.error('CARD ART VERIFY FAILED — live cards response was not an array.');
    process.exit(1);
  }

  const countRange = response.headers.get('content-range');
  const exactCount = countRange && Number(countRange.split('/').at(-1));
  if (Number.isFinite(exactCount) && exactCount !== rows.length) {
    failures.push(`catalog pagination incomplete: fetched ${rows.length} of ${exactCount}`);
  }
  return rows;
}

async function probeObject(cardId, url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        headers: { Accept: 'image/*' },
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      return { cardId, status: 'network_or_timeout' };
    }

    if (response.status === 405 || response.status === 501) {
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'image/*', Range: 'bytes=0-0' },
          signal: AbortSignal.timeout(15000),
        });
        await response.body?.cancel();
      } catch {
        return { cardId, status: 'range_probe_failed' };
      }
    }

    if (response.status === 429 || response.status >= 500) {
      if (attempt < 3) {
        await wait(600 * (2 ** attempt));
        continue;
      }
      return { cardId, status: response.status === 429 ? 'rate_limited' : `server_${response.status}` };
    }

    if (!response.ok) return { cardId, status: `http_${response.status}` };

    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!contentType?.startsWith('image/')) return { cardId, status: 'non_image_content_type' };

    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength <= 0) return { cardId, status: 'empty_object' };

    return { cardId, status: 'reachable' };
  }

  return { cardId, status: 'retry_exhausted' };
}

const cards = await loadCatalog();
if (cards.length === 0) failures.push('live card catalog is empty');

const ids = new Set();
const objectPaths = new Map();
const probes = [];

for (const card of cards) {
  const cardId = typeof card?.id === 'string' ? card.id : '';
  if (!cardId) {
    failures.push('catalog row has no card ID');
    continue;
  }
  if (ids.has(cardId)) failures.push(`duplicate card ID: ${cardId}`);
  ids.add(cardId);

  const objectPath = validOfficialObjectUrl(card.image_url);
  if (!objectPath) {
    failures.push(`card ${cardId} has no canonical public card-art URL`);
    continue;
  }

  const previousCardId = objectPaths.get(objectPath);
  if (previousCardId) failures.push(`cards ${previousCardId} and ${cardId} share one art object`);
  else objectPaths.set(objectPath, cardId);

  probes.push({ cardId, url: card.image_url });
}

const expectedCount = manifest?.official_card_art_source?.known_count;
if (expectedCount !== cards.length) {
  failures.push(`manifest count ${expectedCount} differs from live catalog count ${cards.length}`);
}

const results = [];
for (let offset = 0; offset < probes.length; offset += 8) {
  const batch = probes.slice(offset, offset + 8);
  for (let index = 0; index < batch.length; index += 2) {
    const pair = batch.slice(index, index + 2);
    results.push(...await Promise.all(pair.map((probe) => probeObject(probe.cardId, probe.url))));
  }
  if (offset + 8 < probes.length) await wait(150);
}

for (const result of results) {
  if (result.status !== 'reachable') failures.push(`card ${result.cardId}: ${result.status}`);
}

const reachableCount = results.filter((result) => result.status === 'reachable').length;
if (failures.length) {
  console.error('CARD ART VERIFY FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`Catalog rows: ${cards.length}; unique IDs: ${ids.size}; reachable objects: ${reachableCount}/${probes.length}.`);
  process.exit(1);
}

console.log(
  `CARD ART VERIFY PASS — live cards: ${cards.length}; unique IDs/art objects: ${ids.size}; ` +
  `Storage responses: ${reachableCount}/${probes.length}. ` +
  'This verifies URL policy and object reachability only; Unity texture decoding and material assignment are separate runtime gates.',
);
