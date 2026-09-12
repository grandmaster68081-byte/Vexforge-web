const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'authorization, expo-protocol-version, expo-platform, expo-runtime-version, expo-channel-name, expo-manifest-filters',
};

function noUpdate() {
  return new Response(null, { status: 204, headers: { ...corsHeaders, 'cache-control': 'no-store' } });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const platform = request.headers.get('expo-platform') ?? 'android';
  const runtimeVersion = request.headers.get('expo-runtime-version');
  const channel = request.headers.get('expo-channel-name') ?? 'production';
  if (platform !== 'android' || !runtimeVersion || !['development', 'internal', 'closed', 'production'].includes(channel)) return noUpdate();

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return new Response('Update service is not configured', { status: 503, headers: corsHeaders });

  const query = new URL(`${supabaseUrl}/rest/v1/vexforge_android_release_registry`);
  query.searchParams.set('select', 'manifest_url,runtime_version,channel,status');
  query.searchParams.set('delivery_type', 'eq.OTA_UPDATE');
  query.searchParams.set('runtime_version', `eq.${runtimeVersion}`);
  query.searchParams.set('channel', `eq.${channel}`);
  query.searchParams.set('status', 'eq.PUBLISHED');
  query.searchParams.set('order', 'published_at.desc');
  query.searchParams.set('limit', '1');

  const releaseResponse = await fetch(query, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
  if (!releaseResponse.ok) return new Response('Could not read release registry', { status: 502, headers: corsHeaders });
  const releases = await releaseResponse.json();
  const release = releases[0];
  if (!release?.manifest_url) return noUpdate();

  const allowedPrefix = `${supabaseUrl}/storage/v1/object/public/vexforge-updates/`;
  if (!release.manifest_url.startsWith(allowedPrefix)) return new Response('Invalid update manifest origin', { status: 500, headers: corsHeaders });

  const manifestResponse = await fetch(release.manifest_url, { headers: { accept: 'application/expo+json,application/json' } });
  if (!manifestResponse.ok) return new Response('Update manifest unavailable', { status: 502, headers: corsHeaders });
  const manifest = await manifestResponse.json();
  if (manifest.runtimeVersion !== runtimeVersion) return noUpdate();

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      ...corsHeaders,
      'cache-control': 'no-store, no-cache, must-revalidate',
      'content-type': 'application/expo+json',
      'expo-protocol-version': '1',
    },
  });
});
