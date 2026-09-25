export type PortalCard = {
  id: string;
  name: string;
  rarity: string;
  faction: string;
  image_url: string | null;
  power: number | null;
};

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co").replace(/\/$/, "");
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";
const OFFICIAL_PUBLIC_PREFIX = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/cards/";

export function isOfficialCardImage(url: string | null): boolean {
  return typeof url === "string" && url.startsWith(OFFICIAL_PUBLIC_PREFIX);
}

let featuredCardsCache: PortalCard[] | null = null;
let featuredCardsInFlight: Promise<PortalCard[]> | null = null;

async function fetchFeaturedCards(): Promise<PortalCard[]> {
  const query = new URLSearchParams({
    select: "id,name,rarity,faction,image_url,power",
    active: "eq.true",
    rarity: "in.(Mythic,Legendary)",
    order: "power.desc.nullslast",
    limit: "12",
  });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cards?${query.toString()}`, {
      method: "GET",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const data = await response.json() as unknown;
    if (!Array.isArray(data)) return [];
    return data.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const row = value as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.name !== "string") return [];
      if (row.rarity !== "Mythic" && row.rarity !== "Legendary") return [];
      return [{
        id: row.id,
        name: row.name,
        rarity: row.rarity,
        faction: typeof row.faction === "string" ? row.faction : "",
        image_url: isOfficialCardImage(typeof row.image_url === "string" ? row.image_url : null) ? row.image_url as string : null,
        power: typeof row.power === "number" && Number.isFinite(row.power) ? row.power : null,
      } satisfies PortalCard];
    });
  } catch {
    return [];
  } finally {
    window.clearTimeout(timer);
  }
}

export function loadFeaturedCards(limit = 8): Promise<PortalCard[]> {
  const safeLimit = Math.max(1, Math.min(12, Math.floor(limit)));
  if (featuredCardsCache) return Promise.resolve(featuredCardsCache.slice(0, safeLimit));
  if (!featuredCardsInFlight) {
    featuredCardsInFlight = fetchFeaturedCards().then((items) => {
      featuredCardsInFlight = null;
      if (items.length) featuredCardsCache = items;
      return items;
    });
  }
  return featuredCardsInFlight.then((items) => items.slice(0, safeLimit));
}
