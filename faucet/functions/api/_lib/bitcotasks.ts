import type { Env } from './env';

export type ProviderOffer = Record<string, unknown>;

export function bitcoTasksConfigured(env: Env) {
  return Boolean(env.BITCOTASKS_API_KEY && env.BITCOTASKS_BEARER_TOKEN && env.BITCOTASKS_SECRET_KEY);
}

function providerCredentials(env: Env) {
  if (!env.BITCOTASKS_API_KEY || !env.BITCOTASKS_BEARER_TOKEN) throw new Error('BITCOTASKS_NOT_CONFIGURED');
  return { apiKey: env.BITCOTASKS_API_KEY, bearer: env.BITCOTASKS_BEARER_TOKEN };
}

const headers = (bearer: string, userAgent: string) => ({ Authorization: `Bearer ${bearer}`, 'User-Agent': userAgent });

async function get(url: string, bearer: string, request: Request) {
  const res = await fetch(url, { headers: headers(bearer, request.headers.get('User-Agent') ?? 'Kivora/5.0') });
  if (!res.ok) throw new Error(`BitcoTasks responded with HTTP ${res.status}`);
  const body = await res.json() as any;
  if (String(body.status) !== '200') throw new Error(body.message || 'BitcoTasks returned an error.');
  return Array.isArray(body.data) ? body.data : [];
}

export async function loadOffers(env: Env, request: Request, userId: string) {
  const { apiKey, bearer } = providerCredentials(env);
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
  const base = 'https://bitcotasks.com';
  const urls = [
    ['ptc', `${base}/api/${apiKey}/${encodeURIComponent(userId)}/${encodeURIComponent(ip)}`],
    ['shortlink', `${base}/sl-api/${apiKey}/${encodeURIComponent(userId)}/${encodeURIComponent(ip)}`],
    ['article', `${base}/ra-api/${apiKey}/${encodeURIComponent(userId)}/${encodeURIComponent(ip)}`],
    ['offer', `${base}/offer-api.php?key=${encodeURIComponent(apiKey)}&sub_id=${encodeURIComponent(userId)}&ip=${encodeURIComponent(ip)}`],
    ['survey', `${base}/survey-api.php?key=${encodeURIComponent(apiKey)}&sub_id=${encodeURIComponent(userId)}&ip=${encodeURIComponent(ip)}`],
  ] as const;
  const result = await Promise.allSettled(urls.map(async ([type, url]) => [type, await get(url, bearer, request)] as const));
  return result.flatMap((item, index) => item.status === 'fulfilled' ? item.value[1].map((value: any) => normalize(value, urls[index][0])) : []);
}

function normalize(item: any, category: string) {
  return {
    id: String(item.id ?? crypto.randomUUID()),
    title: String(item.title ?? 'Opportunity'),
    description: String(item.description ?? item.requirements ?? ''),
    image: item.image ? String(item.image) : undefined,
    reward: Number(item.reward ?? 0),
    currencyName: String(item.currency_name ?? item.reward_name ?? 'Points'),
    url: String(item.url ?? item.link ?? ''),
    category,
    source: 'BitcoTasks',
    durationSeconds: item.duration ? Number(item.duration) : undefined,
    available: item.available ? Number(item.available) : undefined,
    boosted: Boolean(item.boosted_campaign),
    requirements: item.requirements ? String(item.requirements) : undefined,
    earnUpTo: item.earn_up_to ? Number(item.earn_up_to) : undefined,
    goals: Array.isArray(item.goals) ? item.goals.map((goal: any) => ({ name: String(goal.name ?? ''), description: goal.description ? String(goal.description) : undefined, virtualCurrencyValue: goal.virtual_currency_value ? Number(goal.virtual_currency_value) : undefined })) : undefined,
  };
}
