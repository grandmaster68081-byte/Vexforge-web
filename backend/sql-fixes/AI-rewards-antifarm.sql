-- ============================================================
-- Rewards IA: claim_ai_battle_reward — anti-farm cap
-- Ejecutar en SQL Editor de Supabase
-- Fecha: 2026-07-28 · Chat 111
-- ============================================================
-- Easy:   +3 VEX  · cap 5 victorias/día
-- Normal: +6 VEX  · cap 4 victorias/día
-- Expert: +12 VEX · cap 3 victorias/día
-- Legend: +20 VEX · cap 2 victorias/día
-- Anti-farm: conteo por economy_ledger (source_table='ai_battle_reward')
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_ai_battle_reward(
  p_player_id uuid,
  p_difficulty text,
  p_date_key   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vex_reward  integer;
  v_daily_cap   integer;
  v_wins_today  integer;
  v_ref_id      text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'not_authenticated');
  END IF;
  IF p_date_key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'invalid_date_format');
  END IF;
  IF p_date_key > to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD') THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'cannot_claim_future');
  END IF;
  CASE p_difficulty
    WHEN 'easy'   THEN v_vex_reward := 3;  v_daily_cap := 5;
    WHEN 'normal' THEN v_vex_reward := 6;  v_daily_cap := 4;
    WHEN 'expert' THEN v_vex_reward := 12; v_daily_cap := 3;
    WHEN 'legend' THEN v_vex_reward := 20; v_daily_cap := 2;
    ELSE RETURN jsonb_build_object('claimed', false, 'reason', 'invalid_difficulty');
  END CASE;
  SELECT COUNT(*) INTO v_wins_today
  FROM economy_ledger
  WHERE player_id = p_player_id
    AND source_table = 'ai_battle_reward'
    AND metadata->>'difficulty' = p_difficulty
    AND metadata->>'date_key'   = p_date_key
    AND entry_type = 'reward';
  IF v_wins_today >= v_daily_cap THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'daily_cap_reached',
      'wins_today', v_wins_today, 'cap', v_daily_cap);
  END IF;
  v_ref_id := 'aibr_' || p_player_id::text || '_' || p_difficulty || '_' || p_date_key || '_' || (v_wins_today + 1);
  IF EXISTS (SELECT 1 FROM economy_ledger WHERE reference_id = v_ref_id) THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'duplicate_reference');
  END IF;
  UPDATE player_wallet
  SET vex_ingame = vex_ingame + v_vex_reward, updated_at = now()
  WHERE player_id = p_player_id;
  INSERT INTO economy_ledger(player_id, currency, entry_type, amount, source_table, reference_id, metadata, is_final)
  VALUES (p_player_id, 'vex_ingame', 'reward', v_vex_reward, 'ai_battle_reward', v_ref_id,
    jsonb_build_object('difficulty', p_difficulty, 'date_key', p_date_key,
      'win_number', v_wins_today + 1, 'source', 'ai_battle_reward'), true);
  RETURN jsonb_build_object('claimed', true, 'vex_awarded', v_vex_reward,
    'wins_today', v_wins_today + 1, 'cap', v_daily_cap,
    'remaining_today', v_daily_cap - (v_wins_today + 1));
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_ai_battle_reward(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_battle_reward(uuid, text, text) TO service_role;

-- Test (retorna invalid_difficulty con dificultad inválida):
SELECT claim_ai_battle_reward('00000000-0000-0000-0000-000000000000'::uuid, 'invalid', '2026-07-28');
