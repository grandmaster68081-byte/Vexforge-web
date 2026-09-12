-- ============================================================
-- AP.1 / Y.3 Fix -- vexforge_player_shards table
-- Chat: 90 | Fecha: 2026-07-23
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vexforge_player_shards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  shard_rarity text NOT NULL CHECK (shard_rarity IN ('Common','Uncommon','Rare','Epic','Legendary','Mythic')),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, shard_rarity)
);
ALTER TABLE public.vexforge_player_shards ENABLE ROW LEVEL SECURITY;
CREATE POLICY players_read_own_shards ON public.vexforge_player_shards
  FOR SELECT TO authenticated
  USING (player_id = (SELECT id FROM players WHERE auth_user_id = auth.uid() LIMIT 1));
CREATE POLICY players_upsert_own_shards ON public.vexforge_player_shards
  FOR ALL TO authenticated
  USING (player_id = (SELECT id FROM players WHERE auth_user_id = auth.uid() LIMIT 1))
  WITH CHECK (player_id = (SELECT id FROM players WHERE auth_user_id = auth.uid() LIMIT 1));
-- Valores por rareza: Common=25pts(100 para forjar), Uncommon=75(400), Rare=200(1200),
--   Epic=500(4000), Legendary=1000(15000), Mythic=2500(50000)
