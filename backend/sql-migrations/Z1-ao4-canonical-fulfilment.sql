-- ============================================================
-- AO.4 — Canonical fulfilment para todos los productos del shop
-- Chat: 89 | Fecha: 2026-07-23
-- Productos cubiertos: season_pass_premium, xp_boost_24h, xp_boost_7d,
--   charm_common, charm_rare, charm_epic, battle_skin, raid_key, vex_conversion_token
-- ============================================================

-- PARTE 1: Cosméticos + tablas de fulfilment
INSERT INTO public.cosmetics (code, name, description, cosmetic_type, rarity, obtainable_via, active, metadata)
VALUES
  ('CHARM-COMMON','Encanto Común','Encanto decorativo — buff visual menor','charm','Common',ARRAY['shop'],true,'{}'),
  ('CHARM-RARE','Encanto Raro','Efecto visual + buff pasivo menor','charm','Rare',ARRAY['shop'],true,'{}'),
  ('CHARM-EPIC','Encanto Épico','Efecto animado + buff pasivo en batallas','charm','Epic',ARRAY['shop'],true,'{"animated":true}'),
  ('BATTLE-SKIN','Skin de Batalla','Skin exclusiva para el tablero de batalla','battle_skin','Rare',ARRAY['shop'],true,'{}')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.player_active_boosts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  boost_type text NOT NULL CHECK (boost_type IN ('xp_boost_24h','xp_boost_7d')),
  multiplier numeric NOT NULL DEFAULT 1.5,
  expires_at timestamptz NOT NULL,
  shop_order_id uuid REFERENCES public.vexforge_shop_orders(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_consumables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  shop_order_id uuid REFERENCES public.vexforge_shop_orders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PARTE 2: RPC vexforge_approve_shop_order reescrita con CASE completo
-- Cubre los 9 productos del catálogo (ver código completo en chat 89)
-- Ejecutado via Management API — Supabase SQL Editor
