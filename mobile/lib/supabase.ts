const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rscuzqnfccqvltkdcdny.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58';

export type PublicCard = {
  id: string;
  code: string;
  name: string;
  faction: string | null;
  rarity: string | null;
  image_url: string | null;
};

export type CatalogSnapshot = {
  cardsTotal: number;
  featuredCards: PublicCard[];
};

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export async function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
  const response = await request('cards?select=id%2Ccode%2Cname%2Cfaction%2Crarity%2Cimage_url&order=code.asc&limit=6', {
    headers: { Prefer: 'count=exact' },
  });
  if (!response.ok) {
    throw new Error(`Supabase catalog request failed (${response.status})`);
  }

  const cards = (await response.json()) as PublicCard[];
  const contentRange = response.headers.get('content-range');
  const totalFromRange = contentRange?.split('/')[1];
  const cardsTotal = totalFromRange && totalFromRange !== '*' ? Number(totalFromRange) : cards.length;

  return {
    cardsTotal: Number.isFinite(cardsTotal) ? cardsTotal : cards.length,
    featuredCards: cards,
  };
}
