import { supabase } from "../../lib/supabase";
    import type { DomainResult } from "../../shared/types/domain";

    // ─── Types ────────────────────────────────────────────────────────────────────

    export interface OpenedCard {
    id: string;
    name: string;
    rarity: string;
    faction?: string;
    image_url?: string;
    }

    export interface PackOrder {
    id: string;
    player_id: string;
    pack_key: string;
    price_usdt: number;
    status: string;       // 'pending' | 'fulfilled' | 'cancelled'
    payment_method: string | null;
    cards_received?: OpenedCard[];
    created_at: string;
    }

    export interface VexBalance {
    vex_ingame: number;
    }

    export interface CatalogPack {
    pack_key: string;
    pack_name: string;
    price_vex: number;
    price_usdt: number;
    card_count: number;
    notes: string | null;
    rarity_weights: Record<string, number> | null;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    async function getCurrentPlayerId(): Promise<string | null> {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return null;
    const { data } = await supabase
      .from("players")
      .select("id")
      .eq("auth_user_id", s.session.user.id)
      .maybeSingle();
    return data?.id ?? null;
    }

    // ─── Pack catalog (chat72 P.2) ────────────────────────────────────────────────

    /**
    * Reads the official vexforge_pack_catalog. Public — no auth required.
    * Replaces the hardcoded PACK_CATALOG that used non-existent keys.
    */
    export async function getPackCatalog(): Promise<DomainResult<CatalogPack[]>> {
    const { data, error } = await supabase
      .from("vexforge_pack_catalog")
      .select("pack_key, pack_name, price_vex, price_usdt, card_count, notes, active, metadata")
      .eq("active", true)
      .order("price_vex", { ascending: true });

    if (error) return { status: "ready", data: null, reason: error.message };

    const packs: CatalogPack[] = (data ?? []).map((row: Record<string, unknown>) => {
      const meta = (row.metadata as { rarity_weights?: Record<string, number> } | null) ?? {};
      return {
        pack_key: row.pack_key as string,
        pack_name: row.pack_name as string,
        price_vex: Number(row.price_vex ?? 0),
        price_usdt: Number(row.price_usdt ?? 0),
        card_count: Number(row.card_count ?? 0),
        notes: (row.notes as string | null) ?? null,
        rarity_weights: meta.rarity_weights ?? null,
      };
    });

    return { status: "ready", data: packs };
    }

    // ─── VEX balance ──────────────────────────────────────────────────────────────

    /**
    * Returns the player's current in-game VEX balance.
    * E.1.b: moved from PacksRoute direct query into repository.
    */
    export async function getMyVexBalance(): Promise<DomainResult<VexBalance>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tu balance." };

    const { data, error } = await supabase
      .from("player_wallet")
      .select("vex_ingame")
      .eq("player_id", playerId)
      .maybeSingle();

    if (error) return { status: "ready", data: null, reason: error.message };
    return { status: "ready", data: (data as VexBalance) ?? { vex_ingame: 0 } };
    }

    // ─── Pack order history ────────────────────────────────────────────────────────

    /**
    * Returns the last 20 pack orders for the current player.
    */
    export async function getMyPackHistory(): Promise<DomainResult<PackOrder[]>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver historial." };

    const { data, error } = await supabase
      .from("vexforge_pack_orders")
      .select("id, player_id, pack_key, price_usdt, status, payment_method, metadata, created_at")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { status: "ready", data: null, reason: error.message };

    const orders = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      player_id: row.player_id as string,
      pack_key: row.pack_key as string,
      price_usdt: row.price_usdt as number,
      status: row.status as string,
      payment_method: row.payment_method as string | null,
      cards_received: (row.metadata as { cards?: OpenedCard[] })?.cards,
      created_at: row.created_at as string,
    }));

    return { status: "ready", data: orders };
    }

    // ─── Buy pack with in-game VEX ─────────────────────────────────────────────────

    /**
    * E.1.b: Calls vexforge_buy_pack_with_vex RPC.
    * Returns { ok, orderId } on success.
    */
    export async function buyPackWithVex(
    packKey: string
    ): Promise<{ ok: boolean; orderId?: string; reason?: string }> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { ok: false, reason: "No autenticado." };

    const { data, error } = await supabase.rpc("vexforge_buy_pack_with_vex", {
      p_player_id: playerId,
      p_pack_key: packKey,
    });

    if (error) return { ok: false, reason: error.message };

    const res = data as { ok: boolean; order_id?: string; reason?: string };
    return { ok: res?.ok ?? false, orderId: res?.order_id, reason: res?.reason };
    }

    // ─── Open a fulfilled pack order ───────────────────────────────────────────────

    /**
    * Calls vexforge_open_pack RPC. Returns the cards granted.
    */
    export async function openPackOrder(
    orderId: string
    ): Promise<{ ok: boolean; cards?: OpenedCard[]; reason?: string }> {
    const { data, error } = await supabase.rpc("vexforge_open_pack", {
      p_order_id: orderId,
    });

    if (error) return { ok: false, reason: error.message };

    const res = data as { ok: boolean; cards?: OpenedCard[]; reason?: string };
    return { ok: res?.ok ?? false, cards: res?.cards, reason: res?.reason };
    }
    
