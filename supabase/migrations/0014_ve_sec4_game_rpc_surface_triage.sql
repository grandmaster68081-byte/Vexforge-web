-- VE-SEC-4-GAME-RPC-SURFACE-TRIAGE
-- Objetivo: cerrar la superficie del rol publico (anon) sobre RPC de juego SECURITY DEFINER
-- y vincular la recompensa de batalla IA a la identidad real del llamador.
-- Idempotente. No cambia esquema, RLS, triggers, economia ni UI.

BEGIN;

-- 1) claim_ai_battle_reward: exigia sesion pero NO comprobaba que p_player_id
--    perteneciera al llamador -> un jugador autenticado podia acreditar VEX a otro.
CREATE OR REPLACE FUNCTION public.claim_ai_battle_reward(p_player_id uuid, p_difficulty text, p_date_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vex_reward  integer;
  v_daily_cap   integer;
  v_wins_today  integer;
  v_ref_id      text;
  v_caller_id   uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'not_authenticated');
  END IF;
  SELECT id INTO v_caller_id FROM players WHERE auth_user_id = auth.uid() LIMIT 1;
  IF v_caller_id IS NULL OR v_caller_id <> p_player_id THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'identity_mismatch');
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
$function$;

-- 2) Grupo A: funciones de trigger. Se ejecutan como propietario de la tabla,
--    no necesitan EXECUTE para ningun rol de API.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (p.proname LIKE 'trg_fn_%'
           OR p.proname IN ('fn_init_player_progress','fn_notify_mission_complete',
                            'handle_new_auth_user','process_referral_first_pack_reward_trigger'))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- 3) Grupo B: RPC de jugador. Requieren sesion iniciada; anon no aporta nada.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN (
        'abandon_mission_battle_run','abandon_mission_run_reservation','accept_friend_request',
        'check_my_achievements','claim_ai_battle_reward','claim_daily_ai_challenge','create_clan',
        'decline_friend_request','equip_cosmetic','fuse_cards','get_world_boss_progress',
        'resolve_mission_battle_run','respond_to_challenge','save_deck','send_challenge',
        'send_friend_request','start_mission_battle_run','sync_player_energy','validate_deck',
        'vexforge_buy_pack_with_vex','vexforge_create_shop_order','vexforge_equip_relic',
        'vexforge_find_opponents','vexforge_get_my_deposits','vexforge_get_my_economy_stats',
        'vexforge_get_my_shop_orders','vexforge_open_pack','vexforge_start_guild_war',
        'vexforge_submit_deposit','vexforge_submit_shop_order_payment','vexforge_unequip_relic'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- 4) Grupo C: lecturas publicas legitimas consumidas por rutas anonimas
--    (/, /leaderboard, /season-rankings). Se conservan para anon de forma explicita.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN ('get_home_stats','get_leaderboard','get_public_player_names','get_public_pvp_rankings')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', r.sig);
  END LOOP;
END $$;

COMMIT;
