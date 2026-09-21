import { supabase } from "./supabase";

export type PortalCard = {
  id: string;
  code: string;
  name: string;
  rarity: string;
  faction: string;
  image_url: string | null;
  lore: string | null;
  power: number;
  affinity: number;
  prestige: number;
  charge: number;
};

const OFFICIAL_HOST = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/";

export function isOfficialCardImage(url: string | null): boolean {
  return typeof url === "string" && url.startsWith(`${OFFICIAL_HOST}public/vexforge-assets/cards/`);
}

export async function loadFeaturedCards(): Promise<PortalCard[]> {
  const { data, error } = await supabase
    .from("cards")
    .select("id, code, name, rarity, faction, image_url, lore, power, affinity, prestige, charge")
    .eq("active", true)
    .in("rarity", ["Mythic", "Legendary"])
    .order("rarity", { ascending: false })
    .order("power", { ascending: false })
    .limit(6);

  if (error || !data) return [];
  return (data as PortalCard[]).map((card) => ({
    ...card,
    image_url: isOfficialCardImage(card.image_url) ? card.image_url : null,
  }));
}
