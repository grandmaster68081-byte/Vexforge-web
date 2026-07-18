# Pending: backend gaps — session 38 update

## RESOLVED since original gap document
- Auth provider -> ensure_player_row RPC + AuthProvider.tsx (S27/S37)
- Inventory RLS -> authenticated_read_own_inventory added (S37) -- see gap 1 below
- Clan write -> create_clan RPC SECURITY DEFINER (S37)
- Market write -> create_listing / buy_listing / cancel_listing RPCs

## Still open — owner SQL action required

### 1. inventory — PostgREST API exposure (HIGH)
RLS policy exists but table returns "permission denied" via REST for all keys.
Fix in Supabase SQL Editor:
  GRANT SELECT ON public.inventory TO authenticated;
  -- Then: Dashboard -> API -> Reload schema cache
After applying: create useInventory.ts + rewrite InventoryRoute.tsx.
Query columns first:
  SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'inventory';

### 2. fusion — fuse_cards RPC (HIGH)
useFusion.ts calls supabase.rpc("fuse_cards", { p_card_a_id, p_card_b_id }). RPC missing.

CREATE OR REPLACE FUNCTION public.fuse_cards(
  p_card_a_id UUID,
  p_card_b_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
BEGIN
  SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not signed in');
  END IF;
  -- TODO: implement per vexforge_card_fusion_policy table
  RETURN jsonb_build_object('ok', false, 'reason', 'Fusion logic pending implementation');
END;
$$;
GRANT EXECUTE ON FUNCTION public.fuse_cards TO authenticated;

### 3. SECURITY DEFINER views (LOW — not frontend-blocking)
18 views flagged. Convert to SECURITY INVOKER per view or document justification.
