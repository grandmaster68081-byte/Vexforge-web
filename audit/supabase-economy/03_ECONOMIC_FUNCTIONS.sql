-- VEXFORGE ECONOMIC FORENSIC EXTRACTION
-- Live Supabase project: rscuzqnfccqvltkdcdny
-- Extracted: 2026-09-20T13:37:53.575Z
-- READ-ONLY export. Definitions were read from pg_proc; no function was executed.

-- public._vexforge_gen_synthetic_deck(p_mmr numeric, p_side text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public._vexforge_gen_synthetic_deck(p_mmr numeric, p_side text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_base_power int;
  v_units      jsonb := '[]'::jsonb;
  v_i          int;
  v_power      int;
  v_hp         int;
  v_atk        int;
  v_def        int;
  v_spd        int;
  v_rarity     text;
  v_factions   text[] := ARRAY['Guerrero','Mago','Pícaro','Paladín'];
  v_faction    text;
  v_guard      bool;
  v_is_champ   bool;
  v_names      text[] := ARRAY[
    'Forjador Gris','Centinela del Umbral','Guardián del Vórtice',
    'Maestro del Filo','Vidente de Ceniza'
  ];
BEGIN
  v_base_power := GREATEST(10, LEAST(300, (p_mmr / 1000.0 * 25 + 10)::int));
  FOR v_i IN 1..5 LOOP
    v_power   := v_base_power + (v_i - 1) * 5;
    v_hp      := v_power * 4 + 10;
    v_atk     := v_power + 5;
    v_def     := 5 + v_i;
    v_spd     := 4 + v_i;
    v_rarity  := CASE
      WHEN v_power >= 200 THEN 'Mythic'
      WHEN v_power >= 100 THEN 'Legendary'
      WHEN v_power >= 60  THEN 'Epic'
      WHEN v_power >= 30  THEN 'Rare'
      WHEN v_power >= 15  THEN 'Uncommon'
      ELSE 'Common'
    END;
    v_faction := v_factions[(v_i - 1) % array_length(v_factions, 1) + 1];
    v_guard   := (v_i = 1);  -- first unit in synthetic deck is the guard/vanguard
    v_is_champ := (v_i = 2); -- second unit is the champion
    v_units := v_units || jsonb_build_array(jsonb_build_object(
      'id',          gen_random_uuid(),
      'name',        v_names[v_i],
      'faction',     v_faction,
      'rarity',      v_rarity,
      'image_url',   '',
      'hp',          v_hp,
      'max_hp',      v_hp,
      'atk',         v_atk,
      'def',         v_def,
      'spd',         v_spd,
      'power',       v_power,
      'keywords',    CASE WHEN v_guard THEN '["Guard"]'::jsonb ELSE '[]'::jsonb END,
      'alive',       true,
      'guard',       v_guard,
      'lifesteal',   false,
      'shielded',    false,
      'side',        p_side,
      'is_champion', v_is_champ
    ));
  END LOOP;
  RETURN v_units;
END;
$function$

-- public.add_player_xp(p_player uuid, p_xp integer, p_source text) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.add_player_xp(p_player uuid, p_xp integer, p_source text DEFAULT 'unknown'::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_level integer;
  v_xp bigint;
  v_required integer;
BEGIN
  IF p_player IS NULL OR COALESCE(p_xp, 0) <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.player_progress (player_id, level, xp, xp_to_next)
  VALUES (p_player, 1, 0, public.get_xp_required(1))
  ON CONFLICT (player_id) DO NOTHING;

  SELECT level, xp
    INTO v_level, v_xp
    FROM public.player_progress
   WHERE player_id = p_player
   FOR UPDATE;

  v_xp := v_xp + p_xp;
  v_required := public.get_xp_required(v_level);
  WHILE v_xp >= v_required LOOP
    v_xp := v_xp - v_required;
    v_level := v_level + 1;
    v_required := public.get_xp_required(v_level);
  END LOOP;

  UPDATE public.player_progress
     SET level = v_level,
         xp = v_xp,
         xp_to_next = v_required,
         updated_at = now()
   WHERE player_id = p_player;

  PERFORM public.emit_game_event(
    p_player,
    'xp_gained',
    p_player::text,
    jsonb_build_object(
      'xp_added', p_xp,
      'level', v_level,
      'source', p_source
    )
  );
END;
$function$

-- public.add_xp(p_telegram_id bigint, amount integer) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.add_xp(p_telegram_id bigint, amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  update tg_players
  set xp = xp + amount
  where telegram_id = p_telegram_id;
end;
$function$

-- public.admin_approve_withdrawal(p_admin uuid, p_withdrawal_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(p_admin uuid, p_withdrawal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_req record; v_locked_before numeric; v_locked_after numeric; v_effective_admin uuid;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RAISE EXCEPTION 'NOT_ADMIN'; END IF;
 IF auth.uid()<>p_admin THEN RAISE EXCEPTION 'ADMIN_IDENTITY_MISMATCH'; END IF;
 v_effective_admin:=auth.uid();
 SELECT * INTO v_req FROM vexforge_withdrawal_requests_official WHERE id=p_withdrawal_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND'; END IF; IF v_req.status<>'pending_review' THEN RAISE EXCEPTION 'WITHDRAWAL_NOT_PENDING'; END IF;
 SELECT coalesce(trade_balance_locked,0) INTO v_locked_before FROM player_economy_state WHERE player_id=v_req.player_id FOR UPDATE; v_locked_after:=greatest(v_locked_before-v_req.tradeable_amount,0);
 UPDATE player_economy_state SET trade_balance_locked=v_locked_after,withdrawal_pending=(v_locked_after>0),updated_at=now() WHERE player_id=v_req.player_id;
 UPDATE vexforge_withdrawal_requests_official SET status='approved',reviewed=true,approved_by=v_effective_admin::text,processed_at=now(),updated_at=now() WHERE id=p_withdrawal_id;
 INSERT INTO economy_ledger(reference_id,player_id,entry_type,currency,amount,balance_before,balance_after,source_table,source_id,metadata,created_at,is_final) VALUES(p_withdrawal_id::text,v_req.player_id,'withdrawal_approved','vex_tradeable',v_req.tradeable_amount,v_locked_before,v_locked_after,'vexforge_withdrawal_requests_official',p_withdrawal_id::text,jsonb_build_object('usdt_net',v_req.usdt_net,'approved_by',v_effective_admin),now(),true);
 INSERT INTO admin_actions(admin_id,action_type,target_table,target_id,payload) VALUES(v_effective_admin,'withdrawal_approve','vexforge_withdrawal_requests_official',p_withdrawal_id::text,jsonb_build_object('tradeable_amount',v_req.tradeable_amount,'usdt_net',v_req.usdt_net));
 RETURN jsonb_build_object('ok',true,'status','approved','withdrawal_id',p_withdrawal_id,'player_id',v_req.player_id,'tradeable_amount',v_req.tradeable_amount,'usdt_net',v_req.usdt_net);
END;$function$

-- public.admin_approve_withdrawal_judge_quarantine_duplicate(p_admin uuid, p_withdrawal_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal_judge_quarantine_duplicate(p_admin uuid, p_withdrawal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE w record;
BEGIN

  IF NOT public.is_admin(p_admin) THEN
    RAISE EXCEPTION 'NOT_ADMIN';
  END IF;

  SELECT * INTO w
  FROM withdrawal_queue
  WHERE id = p_withdrawal_id;

  IF w IS NULL THEN
    RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND';
  END IF;

  UPDATE withdrawal_queue
  SET status = 'approved',
      reviewed = true,
      approved_by = p_admin,
      processed_at = now()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'status', 'approved',
    'withdrawal_id', p_withdrawal_id
  );
END;
$function$

-- public.admin_economy_snapshot() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.admin_economy_snapshot()
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'total_ingame', (SELECT SUM(vex_ingame) FROM player_wallet),
    'total_tradeable', (SELECT SUM(vex_tradeable) FROM player_wallet),
    'pending_withdrawals', (SELECT COUNT(*) FROM withdrawal_queue WHERE status = 'pending'),
    'active_listings', (SELECT COUNT(*) FROM market_listings WHERE status = 'active'),
    'timestamp', now()
  );
$function$

-- public.admin_reject_withdrawal(p_admin uuid, p_withdrawal_id uuid, p_reason text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(p_admin uuid, p_withdrawal_id uuid, p_reason text DEFAULT 'invalid_transaction'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_req record; v_trade_before numeric; v_trade_after numeric; v_locked_before numeric; v_locked_after numeric; v_effective_admin uuid;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RAISE EXCEPTION 'NOT_ADMIN'; END IF;
 IF auth.uid()<>p_admin THEN RAISE EXCEPTION 'ADMIN_IDENTITY_MISMATCH'; END IF;
 v_effective_admin:=auth.uid();
 SELECT * INTO v_req FROM vexforge_withdrawal_requests_official WHERE id=p_withdrawal_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'WITHDRAWAL_NOT_FOUND'; END IF; IF v_req.status<>'pending_review' THEN RAISE EXCEPTION 'WITHDRAWAL_NOT_PENDING'; END IF;
 SELECT coalesce(trade_balance,0),coalesce(trade_balance_locked,0) INTO v_trade_before,v_locked_before FROM player_economy_state WHERE player_id=v_req.player_id FOR UPDATE; v_trade_after:=v_trade_before+v_req.tradeable_amount; v_locked_after:=greatest(v_locked_before-v_req.tradeable_amount,0);
 UPDATE player_economy_state SET trade_balance=v_trade_after,trade_balance_locked=v_locked_after,withdrawal_pending=(v_locked_after>0),updated_at=now() WHERE player_id=v_req.player_id;
 UPDATE vexforge_withdrawal_requests_official SET status='rejected',reviewed=true,approved_by=v_effective_admin::text,rejected_reason=nullif(trim(p_reason),''),processed_at=now(),updated_at=now() WHERE id=p_withdrawal_id;
 INSERT INTO economy_ledger(reference_id,player_id,entry_type,currency,amount,balance_before,balance_after,source_table,source_id,metadata,created_at,is_final) VALUES(p_withdrawal_id::text,v_req.player_id,'withdrawal_rejected','vex_tradeable',v_req.tradeable_amount,v_trade_before,v_trade_after,'vexforge_withdrawal_requests_official',p_withdrawal_id::text,jsonb_build_object('rejected_by',v_effective_admin,'reason',p_reason),now(),true);
 INSERT INTO admin_actions(admin_id,action_type,target_table,target_id,payload) VALUES(v_effective_admin,'withdrawal_reject','vexforge_withdrawal_requests_official',p_withdrawal_id::text,jsonb_build_object('tradeable_amount',v_req.tradeable_amount,'reason',p_reason));
 RETURN jsonb_build_object('ok',true,'status','rejected','withdrawal_id',p_withdrawal_id,'player_id',v_req.player_id,'returned_tradeable',v_req.tradeable_amount);
END;$function$

-- public.admin_reject_withdrawal_judge_quarantine_duplicate(p_admin uuid, p_withdrawal_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal_judge_quarantine_duplicate(p_admin uuid, p_withdrawal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  IF NOT public.is_admin(p_admin) THEN
    RAISE EXCEPTION 'NOT_ADMIN';
  END IF;

  UPDATE withdrawal_queue
  SET status = 'rejected',
      reviewed = true,
      approved_by = p_admin,
      processed_at = now()
  WHERE id = p_withdrawal_id;

  RETURN jsonb_build_object(
    'status', 'rejected',
    'withdrawal_id', p_withdrawal_id
  );
END;
$function$

-- public.analyze_economic_patterns() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.analyze_economic_patterns()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_wallet numeric;
  market_vol int;
  pvp_vol int;
BEGIN

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_wallet
  FROM player_wallet;

  SELECT COUNT(*) INTO market_vol FROM market_listings;
  SELECT COUNT(*) INTO pvp_vol FROM pvp_matches
  WHERE created_at > now() - interval '1 hour';


  /* =====================================================
     GENERACIÓN DE NODOS AST
     ===================================================== */

  INSERT INTO economy_ast_nodes(node_type, input_data)
  VALUES
    ('wallet_behavior', jsonb_build_object('avg_wallet', avg_wallet)),
    ('market_pattern', jsonb_build_object('market_volume', market_vol)),
    ('pvp_meta', jsonb_build_object('pvp_volume', pvp_vol));

END;
$function$

-- public.analyze_system_behavior() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.analyze_system_behavior()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  market_volatility numeric;
  pvp_instability numeric;
  wallet_flux numeric;
BEGIN

  SELECT stddev(price) INTO market_volatility
  FROM market_listings;

  SELECT COUNT(*) INTO pvp_instability
  FROM pvp_matches
  WHERE created_at > now() - interval '30 minutes';

  SELECT AVG(vex_tradeable) INTO wallet_flux
  FROM player_wallet;

  RETURN jsonb_build_object(
    'market_volatility', COALESCE(market_volatility,0),
    'pvp_instability', COALESCE(pvp_instability,0),
    'wallet_flux', COALESCE(wallet_flux,0)
  );

END;
$function$

-- public.analyze_world_state() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.analyze_world_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_wallet numeric;
  market_pressure int;
  pvp_pressure int;
BEGIN

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_wallet
  FROM player_wallet;

  SELECT COUNT(*) INTO market_pressure FROM market_listings;

  SELECT COUNT(*) INTO pvp_pressure FROM pvp_matches
  WHERE created_at > now() - interval '1 hour';

  RETURN jsonb_build_object(
    'avg_wallet', avg_wallet,
    'market_pressure', market_pressure,
    'pvp_pressure', pvp_pressure
  );

END;
$function$

-- public.apply_combat_reward(p_winner uuid, p_loser uuid, p_amount numeric) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.apply_combat_reward(p_winner uuid, p_loser uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin

    -- winner gain
    insert into economy_flow_events(player_id, direction, amount, event_type, metadata)
    values (p_winner, 'in', p_amount, 'combat_reward', '{"type":"combat_reward"}');

    -- loser sink (soft loss, not negative explosion)
    insert into economy_flow_events(player_id, direction, amount, event_type, metadata)
    values (p_loser, 'out', p_amount * 0.5, 'combat_loss', '{"type":"combat_loss"}');

end;
$function$

-- public.apply_global_sink(p_player_id uuid, p_amount numeric, p_reason text) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.apply_global_sink(p_player_id uuid, p_amount numeric, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin

    insert into economy_ledger(
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        p_player_id,
        'debit',
        'vex_ingame',
        p_amount,
        'sink_engine',
        gen_random_uuid()::text,
        jsonb_build_object('reason', p_reason),
        now(),
        true
    );

end;
$function$

-- public.apply_market_trade_quarantine_novalidation_direct(buyer_id uuid, seller_id uuid, price numeric, fee numeric) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.apply_market_trade_quarantine_novalidation_direct(buyer_id uuid, seller_id uuid, price numeric, fee numeric)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    -- buyer debit
    insert into economy_ledger(player_id, entry_type, currency, amount, source_table, metadata, created_at, is_final)
    values (buyer_id,'debit','vex_tradeable',price,'market','{"type":"market_purchase"}',now(),true);

    -- seller credit
    insert into economy_ledger(player_id, entry_type, currency, amount, source_table, metadata, created_at, is_final)
    values (seller_id,'credit','vex_tradeable',price-fee,'market','{"type":"market_sale"}',now(),true);

    -- platform fee sink (tracked, not breaking enum)
    insert into economy_ledger(player_id, entry_type, currency, amount, source_table, metadata, created_at, is_final)
    values (null,'fee','vex_tradeable',fee,'market','{"type":"market_fee"}',now(),true);

end;
$function$

-- public.apply_meta_adjustment(p_meta jsonb) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.apply_meta_adjustment(p_meta jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  meta_type text;
  adjustment jsonb;
BEGIN

  meta_type := interpret_meta(p_meta);
  adjustment := '{}'::jsonb;

  /* =====================================================
     META: FARMING EXPLOIT
     ===================================================== */

  IF meta_type = 'FARMING_EXPLOIT' THEN
    adjustment := jsonb_build_object(
      'reward_multiplier', 0.75,
      'mission_cooldown_multiplier', 1.5
    );
  END IF;


  /* =====================================================
     META: MARKET OVERHEAT
     ===================================================== */

  IF meta_type = 'MARKET_OVERHEAT' THEN
    adjustment := jsonb_build_object(
      'market_fee_multiplier', 1.3,
      'listing_limit_reduction', 0.8
    );
  END IF;


  /* =====================================================
     META: PVP WAR META
     ===================================================== */

  IF meta_type = 'PVP_WAR_META' THEN
    adjustment := jsonb_build_object(
      'pvp_reward_multiplier', 0.9,
      'elo_decay_increase', 1.2
    );
  END IF;


  RETURN jsonb_build_object(
    'meta_type', meta_type,
    'adjustment', adjustment
  );

END;
$function$

-- public.apply_mission_reward(p_player uuid, p_mission uuid, p_amount numeric) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.apply_mission_reward(p_player uuid, p_mission uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin

    -- update state
    insert into player_economy_state(player_id, vex_balance)
    values (p_player, p_amount)
    on conflict (player_id)
    do update set vex_balance = player_economy_state.vex_balance + excluded.vex_balance;

    -- flow event (SAFE, no enums)
    insert into economy_flow_events(
        player_id,
        direction,
        amount,
        event_type,
        source_table,
        source_id,
        metadata
    )
    values (
        p_player,
        'in',
        p_amount,
        'mission_reward',
        'mission_runs',
        p_mission,
        jsonb_build_object('type','mission_reward')
    );

end;
$function$

-- public.apply_mission_rewards() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.apply_mission_rewards()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  k numeric;
BEGIN

  SELECT k_multiplier INTO k
  FROM meta_state
  WHERE state_key = 'global';

  IF k IS NULL THEN
    k := 1;
  END IF;

  NEW.ingame_reward :=
    COALESCE(NEW.ingame_reward, 0) * k;

  NEW.tradeable_reward :=
    COALESCE(NEW.tradeable_reward, 0) * k;

  RETURN NEW;

END;
$function$

-- public.apply_pvp_rewards() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.apply_pvp_rewards()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  k numeric;
BEGIN

  SELECT k_multiplier INTO k
  FROM meta_state
  WHERE state_key = 'global';

  IF k IS NULL THEN
    k := 1;
  END IF;

  NEW.elo_change_a := NEW.elo_change_a * k;
  NEW.elo_change_b := NEW.elo_change_b * k;

  RETURN NEW;

END;
$function$

-- public.attack_world_boss(p_boss_id uuid, p_player_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.attack_world_boss(p_boss_id uuid, p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE
    v_boss RECORD;
    v_deck_power BIGINT := 0;
    v_damage BIGINT;
    v_damage_dealt BIGINT := 0;
    v_remaining_hp BIGINT;
    v_reward JSONB;
    v_enc_id UUID;
    v_vex_reward INT;
    v_xp_reward INT;
    BEGIN
    SELECT * INTO v_boss FROM world_bosses WHERE id=p_boss_id AND active=true;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok',false,'reason','Boss not found or inactive');
    END IF;

    SELECT COALESCE(SUM(damage) FILTER (WHERE status='completed'),0)
      INTO v_damage_dealt
      FROM world_boss_encounters
     WHERE world_boss_id=p_boss_id;

    v_remaining_hp := GREATEST(0, v_boss.hp - v_damage_dealt);
    IF v_remaining_hp <= 0 THEN
      RETURN jsonb_build_object(
        'ok',false,
        'reason','Boss already defeated',
        'max_hp',v_boss.hp,
        'damage_dealt',v_damage_dealt,
        'remaining_hp',0
      );
    END IF;

    SELECT COALESCE(SUM(c.power+c.affinity),0) INTO v_deck_power
      FROM player_deck pd JOIN cards c ON c.id=pd.card_id WHERE pd.player_id=p_player_id;
    IF v_deck_power=0 THEN
      SELECT COALESCE(SUM(c.power),0) INTO v_deck_power
        FROM player_cards pc JOIN cards c ON c.id=pc.card_id WHERE pc.player_id=p_player_id LIMIT 1;
      v_deck_power:=COALESCE(v_deck_power,100);
    END IF;

    v_damage := GREATEST(10, v_deck_power + (random()*v_deck_power*0.2)::BIGINT);
    v_damage := LEAST(v_damage, v_remaining_hp);
    v_vex_reward := COALESCE((v_boss.reward_pool->>'vex_ingame')::INT,0) / 10;
    v_xp_reward := v_vex_reward * 3;

    INSERT INTO world_boss_encounters(world_boss_id,player_id,damage,reward_json,status)
    VALUES(p_boss_id,p_player_id,v_damage,
      jsonb_build_object('vex_ingame',v_vex_reward,'xp',v_xp_reward,'deck_power',v_deck_power),'completed')
    RETURNING id INTO v_enc_id;

    INSERT INTO player_wallet(player_id,vex_ingame,vex_tradeable,created_at,updated_at)
    VALUES(p_player_id,v_vex_reward,0,now(),now())
    ON CONFLICT(player_id) DO UPDATE SET vex_ingame=player_wallet.vex_ingame+v_vex_reward,updated_at=now();

    INSERT INTO player_progress(player_id,level,xp,xp_to_next,energy,max_energy,created_at,updated_at)
    VALUES(p_player_id,1,v_xp_reward,1000,100,100,now(),now())
    ON CONFLICT(player_id) DO UPDATE SET
      xp=player_progress.xp+v_xp_reward,
      level=CASE WHEN player_progress.xp+v_xp_reward >= player_progress.xp_to_next
        THEN player_progress.level+1 ELSE player_progress.level END,
      updated_at=now();

    v_damage_dealt := v_damage_dealt + v_damage;
    v_remaining_hp := GREATEST(0, v_boss.hp - v_damage_dealt);
    RETURN jsonb_build_object(
      'ok',true,
      'damage_dealt',v_damage,
      'damage_dealt_total',v_damage_dealt,
      'max_hp',v_boss.hp,
      'remaining_hp',v_remaining_hp,
      'boss_name',v_boss.name,
      'vex_reward',v_vex_reward,
      'xp_reward',v_xp_reward,
      'encounter_id',v_enc_id
    );
    END;
    $function$

-- public.buy_listing(p_buyer_id uuid, p_listing_id uuid, p_reference_id text, p_metadata jsonb) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.buy_listing(p_buyer_id uuid, p_listing_id uuid, p_reference_id text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  declare
      v_listing record;
      v_card_id uuid;
      v_price numeric;
      v_fee numeric;
      v_seller_net numeric;
  begin

      perform public.assert_caller_is_player(p_buyer_id);

      select *
      into v_listing
      from public.market_listings
      where id = p_listing_id
      for update;

      if v_listing is null then
          raise exception 'listing_not_found';
      end if;

      if v_listing.status <> 'active' then
          raise exception 'listing_not_active';
      end if;

      if v_listing.expires_at is not null and v_listing.expires_at < now() then
          raise exception 'listing_expired';
      end if;

      if v_listing.player_id = p_buyer_id then
          raise exception 'cannot_buy_own_listing';
      end if;

      v_price := v_listing.price;
      v_card_id := v_listing.player_card_id;
      v_fee := coalesce(v_listing.fee, public.vexforge_market_fee(v_price));
      if v_fee < 0 or v_fee > v_price then
          v_fee := public.vexforge_market_fee(v_price);
      end if;
      v_seller_net := v_price - v_fee;

      perform public.safe_wallet_transaction(
          p_buyer_id,
          'vex_ingame',
          v_price,
          'debit',
          p_reference_id || '_buyer_debit',
          'market_listings',
          p_listing_id,
          p_metadata
      );

      perform public.safe_wallet_transaction(
          v_listing.player_id,
          'vex_ingame',
          v_seller_net,
          'credit',
          p_reference_id || '_seller_credit',
          'market_listings',
          p_listing_id,
          p_metadata
      );

      if v_fee > 0 then
          insert into public.economy_ledger (
              player_id, entry_type, currency, amount,
              reference_id, source_table, source_id, metadata, created_at, is_final
          ) values (
              null, 'fee', 'vex_ingame', v_fee,
              p_reference_id || '_fee', 'market_listings', p_listing_id,
              jsonb_build_object('type','market_fee'), now(), true
          );
      end if;

      update public.player_cards
      set player_id = p_buyer_id,
          locked = false,
          listed = false,
          updated_at = now()
      where id = v_card_id;

      update public.market_listings
      set status = 'sold',
          locked = true,
          updated_at = now()
      where id = p_listing_id;

      perform public.log_event(
          p_buyer_id,
          'LISTING_SOLD',
          p_reference_id,
          'market_listings',
          p_listing_id::text,
          jsonb_build_object(
              'price', v_price,
              'fee', v_fee,
              'seller_net', v_seller_net,
              'card_id', v_card_id,
              'seller_id', v_listing.player_id
          )
      );

      return jsonb_build_object(
          'ok', true,
          'listing_id', p_listing_id,
          'price', v_price,
          'fee', v_fee,
          'seller_net', v_seller_net
      );

  end;
  $function$

-- public.buy_listing_quarantine_2arg_nopayment(p_listing_id uuid, p_buyer uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.buy_listing_quarantine_2arg_nopayment(p_listing_id uuid, p_buyer uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_listing record;
BEGIN

  SELECT * INTO v_listing
  FROM market_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing.status <> 'active' THEN
    RAISE EXCEPTION 'Listing not active';
  END IF;

  -- mark sold
  UPDATE market_listings
  SET status = 'sold'
  WHERE id = p_listing_id;

  RETURN jsonb_build_object(
    'status', 'sold'
  );

END;
$function$

-- public.buy_listing_quarantine_3arg_wrongcurrency(p_buyer_id uuid, p_listing_id uuid, p_reference_id text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.buy_listing_quarantine_3arg_wrongcurrency(p_buyer_id uuid, p_listing_id uuid, p_reference_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                DECLARE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  v_listing record;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  BEGIN

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    SELECT * INTO v_listing
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      FROM market_listings
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE id = p_listing_id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          FOR UPDATE;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            IF v_listing.status <> 'active' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                RETURN jsonb_build_object('status','not_active');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- PAY BUYER
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      PERFORM safe_wallet_transaction(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          p_buyer_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              'vex_tradeable',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  v_listing.price,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'debit',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          p_reference_id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              -- SELLER CREDIT
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                PERFORM safe_wallet_transaction(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    v_listing.player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        'vex_tradeable',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            v_listing.price,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                'credit',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    p_reference_id || '_seller'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        -- FINALIZE LISTING
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          UPDATE market_listings
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            SET status = 'sold'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              WHERE id = p_listing_id;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                RETURN jsonb_build_object('status','sold');

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                $function$

-- public.buy_market_item_quarantine_directwallet_partialledger(p_buyer uuid, p_listing uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.buy_market_item_quarantine_directwallet_partialledger(p_buyer uuid, p_listing uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_price numeric;
    v_seller uuid;
begin

    select price, player_id
    into v_price, v_seller
    from market_listings
    where id = p_listing and status = 'active';

    if v_price is null then
        raise exception 'listing not available';
    end if;

    -- debit buyer
    update player_wallet
    set vex_tradeable = vex_tradeable - v_price
    where player_id = p_buyer;

    -- credit seller
    update player_wallet
    set vex_tradeable = vex_tradeable + (v_price * 0.92)
    where player_id = v_seller;

    -- platform fee sink (absorbed system value)
    insert into economy_ledger(
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        null,
        'fee',
        'vex_tradeable',
        v_price * 0.08,
        'market_listings',
        p_listing,
        '{"type":"market_fee"}',
        now(),
        true
    );

    -- close listing
    update market_listings
    set status = 'sold'
    where id = p_listing;

end;
$function$

-- public.calculate_economy_load() | SECURITY INVOKER | RETURNS numeric
CREATE OR REPLACE FUNCTION public.calculate_economy_load()
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  market_load int;
  pvp_load int;
  wallet_load int;
  total numeric;
BEGIN

  SELECT COUNT(*) INTO market_load FROM market_listings;
  SELECT COUNT(*) INTO pvp_load FROM pvp_matches
  WHERE created_at > now() - interval '1 hour';
  SELECT COUNT(*) INTO wallet_load FROM player_wallet;

  total := (market_load * 0.3) + (pvp_load * 0.5) + (wallet_load * 0.2);

  RETURN total;

END;
$function$

-- public.calculate_reward(base numeric) | SECURITY INVOKER | RETURNS numeric
CREATE OR REPLACE FUNCTION public.calculate_reward(base numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  k numeric;
BEGIN

  SELECT k_multiplier INTO k
  FROM meta_state
  WHERE state_key = 'global';

  IF k IS NULL THEN
    k := 1;
  END IF;

  RETURN GREATEST(base * k, 0);

END;
$function$

-- public.can_withdraw(p_player_id uuid, p_amount numeric) | SECURITY INVOKER | RETURNS boolean
CREATE OR REPLACE FUNCTION public.can_withdraw(p_player_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pes numeric;
  v_limit numeric := 0.20;
  v_used numeric;
BEGIN

  SELECT pes_value INTO v_pes
  FROM player_pes_snapshot
  WHERE player_id = p_player_id;

  SELECT used_this_week INTO v_used
  FROM withdrawal_controls
  WHERE player_id = p_player_id;

  IF v_used IS NULL THEN
    v_used := 0;
  END IF;

  IF v_pes < 0.3 THEN
    RETURN false;
  END IF;

  IF (v_used + p_amount) > v_limit THEN
    RETURN false;
  END IF;

  RETURN true;

END;
$function$

-- public.cancel_listing(p_player_id uuid, p_listing_id uuid, p_reference_id text, p_metadata jsonb) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.cancel_listing(p_player_id uuid, p_listing_id uuid, p_reference_id text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_listing record;
begin
    perform public.assert_caller_is_player(p_player_id);

    select *
    into v_listing
    from public.market_listings
    where id = p_listing_id
      and player_id = p_player_id
    for update;

    if not found then
        raise exception 'listing_not_found';
    end if;

    if v_listing.status <> 'active' then
        return jsonb_build_object(
            'status', v_listing.status,
            'listing_id', p_listing_id
        );
    end if;

    update public.market_listings
    set status = 'cancelled',
        locked = false,
        updated_at = now()
    where id = p_listing_id;

    update public.player_cards
    set locked = false,
        listed = false,
        updated_at = now()
    where id = v_listing.player_card_id;

    return jsonb_build_object(
        'status', 'cancelled',
        'listing_id', p_listing_id,
        'reference_id', p_reference_id
    );
end;
$function$

-- public.canon_health_check() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.canon_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'world_system', (SELECT COUNT(*) FROM regions) >= 0,
    'economy_system', (SELECT COUNT(*) FROM economy_ledger) >= 0,
    'pvp_system', (SELECT COUNT(*) FROM pvp_matches) >= 0,
    'missions_system', (SELECT COUNT(*) FROM mission_runs) >= 0,
    'market_system', (SELECT COUNT(*) FROM market_listings) >= 0,
    'status', 'canon_integrated'
  );
END;
$function$

-- public.check_withdrawal_allowed(p_player_id uuid) | SECURITY INVOKER | RETURNS boolean
CREATE OR REPLACE FUNCTION public.check_withdrawal_allowed(p_player_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    age_days int;
begin
    select extract(day from now() - first_deposit_at)
    into age_days
    from withdrawal_profile
    where player_id = p_player_id;

    if age_days is null then
        return false;
    end if;

    -- soft economic constraint (NOT guarantee)
    if age_days < 90 then
        return false;
    end if;

    return true;
end;
$function$

-- public.claim_ai_battle_reward(p_player_id uuid, p_difficulty text, p_date_key text) | SECURITY DEFINER | RETURNS jsonb
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
$function$

-- public.claim_daily_ai_challenge(p_date_key text, p_difficulty text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.claim_daily_ai_challenge(p_date_key text, p_difficulty text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    DECLARE
    v_player_id  uuid;
    v_vex_reward integer;
    v_rows       integer;
    BEGIN
    -- 1. Verificar sesión autenticada
    v_player_id := auth.uid();
    IF v_player_id IS NULL THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Not authenticated');
    END IF;

    -- 2. Validar formato date_key y que no sea futuro
    IF p_date_key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Invalid date format');
    END IF;
    IF p_date_key > to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD') THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Cannot claim future date');
    END IF;

    -- 3. Ventana de seguridad: máximo 1 día atrás (anti-retroclam)
    IF p_date_key < to_char((now() AT TIME ZONE 'UTC' - interval '1 day')::date, 'YYYY-MM-DD') THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Claim window expired');
    END IF;

    -- 4. Calcular recompensa VEX según dificultad
    v_vex_reward := CASE p_difficulty
      WHEN 'easy'   THEN 50
      WHEN 'normal' THEN 100
      WHEN 'expert' THEN 200
      ELSE 50
    END;

    -- 5. Insertar claim (UNIQUE constraint previene doble claim)
    INSERT INTO player_daily_ai_claims(player_id, date_key, difficulty, vex_awarded)
    VALUES (v_player_id, p_date_key, p_difficulty, v_vex_reward)
    ON CONFLICT (player_id, date_key) DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'Already claimed for this date');
    END IF;

    -- 6. Acreditar VEX al wallet
    UPDATE player_wallet
    SET vex_ingame = vex_ingame + v_vex_reward,
        updated_at = now()
    WHERE player_id = v_player_id;

    -- 7. Registrar en economy_ledger
    INSERT INTO economy_ledger(
      player_id, currency, entry_type, amount,
      source_table, reference_id, metadata, is_final
    ) VALUES (
      v_player_id, 'vex_ingame', 'credit', v_vex_reward,
      'player_daily_ai_claims', p_date_key,
      jsonb_build_object('difficulty', p_difficulty, 'date_key', p_date_key, 'source', 'daily_ai_challenge'),
      true
    );

    RETURN jsonb_build_object(
      'claimed',     true,
      'vex_awarded', v_vex_reward,
      'difficulty',  p_difficulty,
      'date_key',    p_date_key
    );
    END;
    $function$

-- public.claim_mission_reward(p_player_id uuid, p_mission_run_id uuid, p_reference_id text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.claim_mission_reward(p_player_id uuid, p_mission_run_id uuid, p_reference_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_run public.mission_runs%ROWTYPE;
  v_reference_id text;
  v_ingame numeric;
  v_tradeable numeric;
  v_xp bigint;
BEGIN
  PERFORM public.assert_caller_is_player(p_player_id);

  IF p_mission_run_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'mission_run_not_found');
  END IF;

  v_reference_id := NULLIF(btrim(COALESCE(p_reference_id, '')), '');
  IF v_reference_id IS NULL THEN
    v_reference_id := 'mission:' || p_mission_run_id::text;
  END IF;

  SELECT *
  INTO v_run
  FROM public.mission_runs
  WHERE id = p_mission_run_id
    AND player_id = p_player_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'mission_run_not_found');
  END IF;

  -- A retry after a committed settlement is successful and side-effect free.
  IF v_run.status = 'claimed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'claimed', true,
      'idempotent', true,
      'mission_run_id', v_run.id,
      'reference_id', COALESCE(v_run.reward_reference_id, v_reference_id),
      'xp_applied', COALESCE(v_run.xp_reward, 0),
      'ingame_applied', COALESCE(v_run.ingame_reward, 0),
      'tradeable_applied', COALESCE(v_run.tradeable_reward, 0)
    );
  END IF;

  IF v_run.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'mission_run_not_settleable',
      'status', v_run.status::text
    );
  END IF;

  v_ingame := GREATEST(COALESCE(v_run.ingame_reward, 0), 0);
  v_tradeable := GREATEST(COALESCE(v_run.tradeable_reward, 0), 0);
  v_xp := GREATEST(COALESCE(v_run.xp_reward, 0), 0);

  -- This transition activates the existing completion hooks exactly once.
  UPDATE public.mission_runs
  SET status = 'completed',
      completed_at = now(),
      updated_at = now()
  WHERE id = v_run.id
    AND status = 'pending';

  -- The helper writes the canonical economy ledger while locking the wallet.
  -- Zero-value rewards do not create invalid ledger rows.
  IF v_ingame > 0 THEN
    PERFORM public.safe_wallet_transaction(
      p_player_id,
      'vex_ingame',
      v_ingame,
      'credit',
      v_reference_id || ':ingame',
      'mission_runs',
      v_run.id,
      jsonb_build_object('mission_run_id', v_run.id, 'settlement', 'mission')
    );
  END IF;

  IF v_tradeable > 0 THEN
    PERFORM public.safe_wallet_transaction(
      p_player_id,
      'vex_tradeable',
      v_tradeable,
      'credit',
      v_reference_id || ':tradeable',
      'mission_runs',
      v_run.id,
      jsonb_build_object('mission_run_id', v_run.id, 'settlement', 'mission')
    );
  END IF;

  UPDATE public.mission_runs
  SET status = 'claimed',
      reward_reference_id = v_reference_id,
      claimed_at = now(),
      updated_at = now()
  WHERE id = v_run.id
    AND status = 'completed';

  INSERT INTO public.mission_completion_log (
    id,
    mission_run_id,
    player_id,
    reward_vex,
    reward_xp,
    reward_gold,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_run.id,
    p_player_id,
    v_ingame,
    v_xp,
    NULL,
    now()
  );

  PERFORM public.log_event(
    p_player_id,
    'MISSION_CLAIMED',
    v_reference_id,
    'mission_runs',
    v_run.id::text,
    jsonb_build_object(
      'ingame_reward', v_ingame,
      'tradeable_reward', v_tradeable,
      'xp', v_xp
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'claimed', true,
    'idempotent', false,
    'mission_run_id', v_run.id,
    'reference_id', v_reference_id,
    'xp_applied', v_xp,
    'ingame_applied', v_ingame,
    'tradeable_applied', v_tradeable
  );
END;
$function$

-- public.claim_mission_reward_quarantine_incomplete_reward(p_run_id uuid, p_reference_id text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.claim_mission_reward_quarantine_incomplete_reward(p_run_id uuid, p_reference_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_run record;
BEGIN

  SELECT * INTO v_run
  FROM mission_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF v_run.status = 'claimed' THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;

  -- mark claimed
  UPDATE mission_runs
  SET status = 'claimed',
      claimed_at = now()
  WHERE id = p_run_id;

  -- reward (ONLY INGAME SAFE EXAMPLE)
  PERFORM safe_wallet_transaction(
    v_run.player_id,
    'vex_ingame',
    COALESCE(v_run.ingame_reward, 10),
    'credit',
    p_reference_id
  );

  RETURN jsonb_build_object(
    'status', 'claimed'
  );

END;
$function$

-- public.claim_mission_reward_quarantine_insecure_playerid(p_player_id uuid, p_run_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.claim_mission_reward_quarantine_insecure_playerid(p_player_id uuid, p_run_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                                                  DECLARE
                                                                                                                                                                                                                                                                                                                                                                                                                    v_run record;
                                                                                                                                                                                                                                                                                                                                                                                                                    BEGIN

                                                                                                                                                                                                                                                                                                                                                                                                                      SELECT * INTO v_run
                                                                                                                                                                                                                                                                                                                                                                                                                        FROM mission_runs
                                                                                                                                                                                                                                                                                                                                                                                                                          WHERE id = p_run_id
                                                                                                                                                                                                                                                                                                                                                                                                                            FOR UPDATE;

                                                                                                                                                                                                                                                                                                                                                                                                                              IF v_run.status = 'claimed' THEN
                                                                                                                                                                                                                                                                                                                                                                                                                                  RETURN jsonb_build_object('status','already_claimed');
                                                                                                                                                                                                                                                                                                                                                                                                                                    END IF;

                                                                                                                                                                                                                                                                                                                                                                                                                                      -- MARK CLAIMED
                                                                                                                                                                                                                                                                                                                                                                                                                                        UPDATE mission_runs
                                                                                                                                                                                                                                                                                                                                                                                                                                          SET status = 'claimed',
                                                                                                                                                                                                                                                                                                                                                                                                                                                claimed_at = now()
                                                                                                                                                                                                                                                                                                                                                                                                                                                  WHERE id = p_run_id;

                                                                                                                                                                                                                                                                                                                                                                                                                                                    -- REWARD XP + ECONOMY
                                                                                                                                                                                                                                                                                                                                                                                                                                                      PERFORM safe_wallet_transaction(
                                                                                                                                                                                                                                                                                                                                                                                                                                                          p_player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                              'vex_ingame',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  COALESCE(v_run.ingame_reward,0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'credit',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          v_run.idempotency_key
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                              PERFORM safe_wallet_transaction(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  p_player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'vex_tradeable',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          COALESCE(v_run.tradeable_reward,0),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              'credit',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  v_run.idempotency_key || '_trade'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      RETURN jsonb_build_object('status','rewarded');

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      $function$

-- public.compile_economy() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.compile_economy()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  wallet_node record;
  market_node record;
  pvp_node record;
  compiled jsonb;
BEGIN

  SELECT * INTO wallet_node
  FROM economy_ast_nodes
  WHERE node_type = 'wallet_behavior'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT * INTO market_node
  FROM economy_ast_nodes
  WHERE node_type = 'market_pattern'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT * INTO pvp_node
  FROM economy_ast_nodes
  WHERE node_type = 'pvp_meta'
  ORDER BY created_at DESC
  LIMIT 1;


  /* =====================================================
     TRADUCCIÓN A REGLAS EJECUTABLES
     ===================================================== */

  compiled := jsonb_build_object(
    'wallet_rule',
      CASE
        WHEN (wallet_node.input_data->>'avg_wallet')::numeric > 9000
        THEN jsonb_build_object('decay_rate', 0.97)
        ELSE jsonb_build_object('decay_rate', 1.0)
      END,

    'market_rule',
      CASE
        WHEN (market_node.input_data->>'market_volume')::int > 400
        THEN jsonb_build_object('fee_multiplier', 1.3)
        ELSE jsonb_build_object('fee_multiplier', 1.0)
      END,

    'pvp_rule',
      CASE
        WHEN (pvp_node.input_data->>'pvp_volume')::int > 120
        THEN jsonb_build_object('elo_decay', 1.2)
        ELSE jsonb_build_object('elo_decay', 1.0)
      END
  );


  INSERT INTO economy_compiled_modules(
    module_name,
    source_nodes,
    compiled_rules,
    risk_score,
    active
  )
  VALUES (
    'live_economy_core_v1',
    jsonb_build_object(
      'wallet', wallet_node.id,
      'market', market_node.id,
      'pvp', pvp_node.id
    ),
    compiled,
    random() * 100,
    true
  );

END;
$function$

-- public.complete_mission(p_player_id uuid, p_mission_id uuid, p_vex_ingame numeric, p_xp integer) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.complete_mission(p_player_id uuid, p_mission_id uuid, p_vex_ingame numeric, p_xp integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_balance numeric;
BEGIN

    -- Insert reward into ledger (INGAME currency)
    INSERT INTO economy_ledger (
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    VALUES (
        p_player_id,
        'credit',
        'vex_ingame',
        p_vex_ingame,
        0,
        0,
        'mission_runs',
        p_mission_id,
        jsonb_build_object('type', 'mission_reward', 'xp', p_xp),
        now(),
        true
    );

    -- Update mission run state
    UPDATE mission_runs
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{completed}',
        'true'::jsonb
    )
    WHERE mission_id = p_mission_id
    AND player_id = p_player_id;

END;
$function$

-- public.compute_ledger_hash(p_player_id uuid, p_currency text, p_amount numeric, p_reference_id text, p_prev_hash text) | SECURITY INVOKER | RETURNS text
CREATE OR REPLACE FUNCTION public.compute_ledger_hash(p_player_id uuid, p_currency text, p_amount numeric, p_reference_id text, p_prev_hash text)
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT encode(
    digest(
      concat(
        coalesce(p_player_id::text,''),
        '|',
        coalesce(p_currency,''),
        '|',
        coalesce(p_amount::text,''),
        '|',
        coalesce(p_reference_id,''),
        '|',
        coalesce(p_prev_hash,'')
      ),
      'sha256'
    ),
    'hex'
  );
$function$

-- public.create_listing(p_player_id uuid, p_player_card_id uuid, p_price numeric, p_reference_id text, p_fee numeric, p_expires_at timestamp with time zone, p_metadata jsonb) | SECURITY DEFINER | RETURNS uuid
CREATE OR REPLACE FUNCTION public.create_listing(p_player_id uuid, p_player_card_id uuid, p_price numeric, p_reference_id text, p_fee numeric DEFAULT 0, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_player_card record;
    v_listing_id uuid;
begin
    perform public.assert_caller_is_player(p_player_id);

    if p_price is null or p_price <= 0 then
        raise exception 'invalid_price';
    end if;

    select *
    into v_player_card
    from public.player_cards
    where id = p_player_card_id
      and player_id = p_player_id
    for update;

    if not found then
        raise exception 'player_card_not_found';
    end if;

    if v_player_card.locked = true or v_player_card.listed = true then
        raise exception 'card_not_available';
    end if;

    update public.player_cards
    set locked = true,
        listed = true,
        updated_at = now()
    where id = p_player_card_id;

    insert into public.market_listings (
        reference_id,
        player_id,
        player_card_id,
        price,
        fee,
        status,
        expires_at,
        locked,
        metadata
    )
    values (
        p_reference_id,
        p_player_id,
        p_player_card_id,
        p_price,
        coalesce(p_fee, 0),
        'active',
        p_expires_at,
        true,
        p_metadata
    )
    returning id into v_listing_id;

    return v_listing_id;
end;
$function$

-- public.create_listing_quarantine_legacy_4arg_nolock(p_player_id uuid, p_player_card_id uuid, p_price numeric, p_reference_id text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.create_listing_quarantine_legacy_4arg_nolock(p_player_id uuid, p_player_card_id uuid, p_price numeric, p_reference_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            BEGIN

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              INSERT INTO market_listings (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  reference_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          player_card_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              price,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  status
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      VALUES (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          p_reference_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              p_player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  p_player_card_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      p_price,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          'active'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              UPDATE player_cards
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                SET locked = true,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      listed = true
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        WHERE id = p_player_card_id;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          RETURN jsonb_build_object('status','listed');

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          $function$

-- public.detect_economic_drift() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.detect_economic_drift()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_wallet numeric;
  market_volume int;
  pvp_activity int;
BEGIN

  SELECT AVG(vex_tradeable + vex_ingame)
  INTO avg_wallet
  FROM player_wallet;

  SELECT COUNT(*) INTO market_volume
  FROM market_listings
  WHERE status = 'active';

  SELECT COUNT(*) INTO pvp_activity
  FROM pvp_matches
  WHERE created_at > now() - interval '1 hour';

  RETURN jsonb_build_object(
    'avg_wallet', avg_wallet,
    'market_volume', market_volume,
    'pvp_activity', pvp_activity
  );

END;
$function$

-- public.detect_market_anomaly() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.detect_market_anomaly()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  IF NEW.price > 10000 THEN

    PERFORM emit_economy_alert(
      'market_price_spike',
      'medium',
      NEW.player_id,
      'market_listings',
      NEW.id::text,
      jsonb_build_object('price', NEW.price)
    );

  END IF;

  RETURN NEW;
END;
$function$

-- public.detect_mission_reward_anomaly() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.detect_mission_reward_anomaly()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  IF NEW.ingame_reward > 1000 OR NEW.tradeable_reward > 500 THEN

    PERFORM emit_economy_alert(
      'mission_reward_spike',
      'medium',
      NEW.player_id,
      'mission_runs',
      NEW.id::text,
      to_jsonb(NEW)
    );

  END IF;

  RETURN NEW;
END;
$function$

-- public.detect_player_meta() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.detect_player_meta()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_wallet numeric;
  fast_farmers int;
  market_volume int;
  pvp_intensity int;
BEGIN

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_wallet
  FROM player_wallet;

  SELECT COUNT(*)
  INTO fast_farmers
  FROM mission_runs
  WHERE created_at > now() - interval '1 hour'
  AND ingame_reward > 200;

  SELECT COUNT(*)
  INTO market_volume
  FROM market_listings
  WHERE status = 'active';

  SELECT COUNT(*)
  INTO pvp_intensity
  FROM pvp_matches
  WHERE created_at > now() - interval '1 hour';


  RETURN jsonb_build_object(
    'avg_wallet', avg_wallet,
    'fast_farmers', fast_farmers,
    'market_volume', market_volume,
    'pvp_intensity', pvp_intensity
  );

END;
$function$

-- public.detect_wallet_anomaly() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.detect_wallet_anomaly()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_balance numeric;
BEGIN

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_balance
  FROM player_wallet;

  IF NEW.vex_ingame + NEW.vex_tradeable > avg_balance * 10 THEN

    PERFORM emit_economy_alert(
      'wallet_overflow',
      'high',
      NEW.player_id,
      'player_wallet',
      NEW.player_id::text,
      jsonb_build_object(
        'balance', NEW.vex_ingame + NEW.vex_tradeable,
        'avg', avg_balance
      )
    );

  END IF;

  RETURN NEW;
END;
$function$

-- public.economy_autoresolve() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.economy_autoresolve()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  health jsonb;
  risk numeric;
BEGIN
  SELECT evaluate_economy_health()
  INTO health;

  risk := (health->>'risk')::numeric;

  IF risk >= 30 THEN
    INSERT INTO economy_alerts(alert_type, severity, details)
    VALUES ('auto_warning', 'low', health);
  END IF;

  IF risk >= 50 THEN
    UPDATE economy_system_state
    SET mode = 'stabilizing',
        freeze_rewards = true,
        emergency_level = 1,
        last_action = now()
    WHERE id = (
      SELECT ess.id
      FROM economy_system_state AS ess
      ORDER BY ess.id
      LIMIT 1
    );
  END IF;

  IF risk >= 75 THEN
    UPDATE economy_system_state
    SET mode = 'emergency',
        freeze_market = true,
        freeze_rewards = true,
        freeze_pvp = true,
        emergency_level = 2,
        last_action = now()
    WHERE id = (
      SELECT ess.id
      FROM economy_system_state AS ess
      ORDER BY ess.id
      LIMIT 1
    );
  END IF;

  IF risk >= 90 THEN
    UPDATE economy_system_state
    SET mode = 'lockdown',
        freeze_market = true,
        freeze_rewards = true,
        freeze_pvp = true,
        emergency_level = 3,
        last_action = now()
    WHERE id = (
      SELECT ess.id
      FROM economy_system_state AS ess
      ORDER BY ess.id
      LIMIT 1
    );

    INSERT INTO economy_alerts(alert_type, severity, details)
    VALUES ('economic_lockdown', 'critical', health);
  END IF;
END;
$function$

-- public.economy_gateway(p_player_id uuid, p_currency text, p_amount numeric, p_direction text, p_action_scope text, p_reference_id text, p_idempotency_key text, p_source_table text, p_source_id uuid, p_metadata jsonb) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.economy_gateway(p_player_id uuid, p_currency text, p_amount numeric, p_direction text, p_action_scope text, p_reference_id text, p_idempotency_key text, p_source_table text DEFAULT NULL::text, p_source_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_lock_ok boolean;
  v_idem_ok boolean;
  v_result jsonb;
BEGIN

  /* =====================================================
     1. IDEMPOTENCY CHECK
     ===================================================== */

  SELECT check_idempotency(
    p_idempotency_key,
    p_action_scope,
    p_player_id,
    p_reference_id
  )
  INTO v_idem_ok;

  IF NOT v_idem_ok THEN
    RETURN jsonb_build_object(
      'status', 'ignored',
      'reason', 'duplicate_idempotency'
    );
  END IF;


  /* =====================================================
     2. LOCK PLAYER ACTION
     ===================================================== */

  SELECT acquire_action_lock(
    p_player_id,
    p_action_scope,
    10
  )
  INTO v_lock_ok;

  IF NOT v_lock_ok THEN
    RETURN jsonb_build_object(
      'status', 'rejected',
      'reason', 'player_locked'
    );
  END IF;


  /* =====================================================
     3. EXECUTE MONEY FLOW (ONLY CORE FUNCTION)
     ===================================================== */

  SELECT safe_wallet_transaction(
    p_player_id,
    p_currency,
    p_amount,
    p_direction,
    p_reference_id,
    p_source_table,
    p_source_id,
    p_metadata
  )
  INTO v_result;


  /* =====================================================
     4. RETURN RESULT
     ===================================================== */

  RETURN jsonb_build_object(
    'status', 'success',
    'gateway_result', v_result
  );

END;
$function$

-- public.economy_integrity_check() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.economy_integrity_check()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    ingame_total numeric;
    trade_total numeric;
begin

    select sum(vex_ingame), sum(vex_tradeable)
    into ingame_total, trade_total
    from player_wallet;

    if trade_total > ingame_total * 5 then
        raise warning 'economy drift detected';
    end if;

end;
$function$

-- public.economy_kernel_guard() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.economy_kernel_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM spawn_economy_processes();
  PERFORM economy_os_orchestrator();

  RETURN NULL;
END;
$function$

-- public.economy_ledger_guard() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.economy_ledger_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                          BEGIN
                                                                                            -- prevent null currency
                                                                                              IF NEW.currency IS NULL THEN
                                                                                                  RAISE EXCEPTION 'currency cannot be null';
                                                                                                    END IF;

                                                                                                      -- enforce balance logic consistency
                                                                                                        IF NEW.balance_after IS NULL THEN
                                                                                                            NEW.balance_after := NEW.balance_before + NEW.amount;
                                                                                                              END IF;

                                                                                                                RETURN NEW;
                                                                                                                END;
                                                                                                                $function$

-- public.economy_os_orchestrator() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.economy_os_orchestrator()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  load numeric;
BEGIN

  load := calculate_economy_load();

  /* REGISTRO DE PROCESOS ACTUALIZADOS */

  INSERT INTO economy_processes(process_type, cpu_cost, risk_score, priority)
  VALUES
    ('market', 2, random() * 100, 2),
    ('pvp', 3, random() * 100, 3),
    ('wallet', 1, random() * 100, 1),
    ('mission', 2, random() * 100, 2),
    ('compiler', 4, random() * 100, 4),
    ('meta', 5, random() * 100, 5);


  /* =====================================================
     CAMBIO DE MODO GLOBAL
     ===================================================== */

  UPDATE economy_kernel_state
  SET mode =
    CASE
      WHEN load < 800 THEN 'stable'
      WHEN load < 1500 THEN 'stress'
      WHEN load < 2500 THEN 'critical'
      ELSE 'lockdown'
    END
  WHERE id IS NOT NULL;

END;
$function$

-- public.economy_rebalance_tick() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.economy_rebalance_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_wallet numeric;
  total_alerts int;
  new_inflation numeric;
  new_reward_mult numeric;
  new_market_pressure numeric;
BEGIN

  /* =====================================================
     1. MÉTRICAS BASE
     ===================================================== */

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_wallet
  FROM player_wallet;

  SELECT COUNT(*)
  INTO total_alerts
  FROM economy_alerts
  WHERE created_at > now() - interval '1 hour';


  /* =====================================================
     2. CÁLCULO DE INFLACIÓN
     ===================================================== */

  new_inflation := 1.0;

  IF avg_wallet > 10000 THEN
    new_inflation := new_inflation + 0.15;
  END IF;

  IF total_alerts > 10 THEN
    new_inflation := new_inflation + 0.10;
  END IF;

  IF avg_wallet < 1000 THEN
    new_inflation := new_inflation - 0.05;
  END IF;


  /* =====================================================
     3. AJUSTE DE REWARDS
     ===================================================== */

  new_reward_mult := 1.0;

  IF new_inflation > 1.2 THEN
    new_reward_mult := 0.85; -- nerf automático
  ELSIF new_inflation < 0.9 THEN
    new_reward_mult := 1.10; -- boost controlado
  END IF;


  /* =====================================================
     4. PRESIÓN DE MERCADO
     ===================================================== */

  SELECT COUNT(*)
  INTO new_market_pressure
  FROM market_listings
  WHERE status = 'active';


  new_market_pressure := GREATEST(0.5, LEAST(2.0, new_market_pressure / 10.0));


  /* =====================================================
     5. GUARDAR ESTADO GLOBAL
     ===================================================== */

  INSERT INTO economy_balance_state (
    id,
    inflation_rate,
    reward_multiplier,
    market_pressure,
    pvp_tension,
    last_update
  )
  VALUES (
    'global',
    new_inflation,
    new_reward_mult,
    new_market_pressure,
    1.0,
    now()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    inflation_rate = EXCLUDED.inflation_rate,
    reward_multiplier = EXCLUDED.reward_multiplier,
    market_pressure = EXCLUDED.market_pressure,
    pvp_tension = EXCLUDED.pvp_tension,
    last_update = now();


END;
$function$

-- public.economy_self_rewrite() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.economy_self_rewrite()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  drift jsonb;
  rule record;
BEGIN

  drift := detect_economic_drift();

  /* ================================
     EJEMPLO: SOBREINFLACIÓN
     ================================ */

  IF (drift->>'avg_wallet')::numeric > 10000 THEN

    FOR rule IN
      SELECT * FROM economy_dynamic_rules
      WHERE rule_type = 'reward'
    LOOP

      PERFORM rewrite_rule(
        rule.id,
        jsonb_build_object(
          'reward_multiplier', 0.8
        ),
        'inflation_control'
      );

    END LOOP;

  END IF;


  /* ================================
     EJEMPLO: MERCADO SOBRECALENTADO
     ================================ */

  IF (drift->>'market_volume')::int > 500 THEN

    FOR rule IN
      SELECT * FROM economy_dynamic_rules
      WHERE rule_type = 'market'
    LOOP

      PERFORM rewrite_rule(
        rule.id,
        jsonb_build_object(
          'market_fee_multiplier', 1.4
        ),
        'market_cooling'
      );

    END LOOP;

  END IF;


END;
$function$

-- public.economy_state_rebalance() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.economy_state_rebalance()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_total_ingame numeric := 0;
    v_total_tradeable numeric := 0;
    v_active_listings int := 0;
    v_active_missions int := 0;
    v_pvp_matches int := 0;

    v_result jsonb;
begin

    -- 1. TOTAL INGAME WALLET
    select coalesce(sum(amount),0)
    into v_total_ingame
    from public.wallet_transactions
    where currency = 'vex_ingame';

    -- 2. TOTAL TRADEABLE WALLET
    select coalesce(sum(amount),0)
    into v_total_tradeable
    from public.wallet_transactions
    where currency = 'vex_tradeable';

    -- 3. ACTIVE MARKET
    select count(*)
    into v_active_listings
    from public.market_listings
    where status = 'active';

    -- 4. ACTIVE MISSIONS
    select count(*)
    into v_active_missions
    from public.mission_runs
    where status = 'active';

    -- 5. ACTIVE PVP
    select count(*)
    into v_pvp_matches
    from public.pvp_matches
    where status = 'pending';

    -- 6. RETURN ECONOMY SNAPSHOT
    v_result := jsonb_build_object(
        'total_ingame', v_total_ingame,
        'total_tradeable', v_total_tradeable,
        'active_listings', v_active_listings,
        'active_missions', v_active_missions,
        'active_pvp_matches', v_pvp_matches,
        'economy_health', case
            when v_total_ingame < 0 then 'BROKEN'
            when v_active_listings = 0 then 'LOW_LIQUIDITY'
            else 'STABLE'
        end
    );

    return v_result;

end;
$function$

-- public.emit_economy_alert(p_type text, p_severity text, p_player_id uuid, p_table text, p_ref_id text, p_details jsonb) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.emit_economy_alert(p_type text, p_severity text, p_player_id uuid, p_table text, p_ref_id text, p_details jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  INSERT INTO economy_alerts (
    alert_type,
    severity,
    player_id,
    reference_table,
    reference_id,
    details
  )
  VALUES (
    p_type,
    p_severity,
    p_player_id,
    p_table,
    p_ref_id,
    p_details
  );

END;
$function$

-- public.enforce_kernel_ledger_integrity() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.enforce_kernel_ledger_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'LEDGER IS IMMUTABLE - KERNEL ENFORCER ACTIVE';
    END IF;

    RETURN NEW;
END;
$function$

-- public.evaluate_economy_health() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.evaluate_economy_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  risk numeric;
  alert_count int;
  avg_wallet numeric;
  sim jsonb;
BEGIN

  SELECT COUNT(*) INTO alert_count
  FROM economy_alerts
  WHERE created_at > now() - interval '1 hour';

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_wallet
  FROM player_wallet;

  SELECT run_economy_simulation()
  INTO sim;

  risk := COALESCE((sim->>'risk_score')::numeric, 0);

  RETURN jsonb_build_object(
    'risk', risk,
    'alerts', alert_count,
    'avg_wallet', avg_wallet,
    'simulation', sim
  );

END;
$function$

-- public.fn_check_and_grant_achievements(p_player_id uuid) | SECURITY DEFINER | RETURNS void
CREATE OR REPLACE FUNCTION public.fn_check_and_grant_achievements(p_player_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_missions_done   bigint := 0;
  v_distinct_cards  bigint := 0;
  v_rare_count      bigint := 0;
  v_epic_count      bigint := 0;
  v_legendary_count bigint := 0;
  v_mythic_count    bigint := 0;
  v_boss_total      bigint := 0;
  v_boss_distinct   bigint := 0;
  v_market_sold     bigint := 0;
  v_pvp_wins        bigint := 0;
  v_pack_opens      bigint := 0;
  v_fusion_count    bigint := 0;
  v_daily_streak    bigint := 0;
  v_is_clan_founder boolean := false;
  v_is_clan_member  boolean := false;
BEGIN
  -- === Misiones completadas ===
  SELECT COUNT(*) INTO v_missions_done
  FROM mission_runs WHERE player_id=p_player_id AND status='completed';

  -- === Colección de cartas ===
  SELECT COUNT(DISTINCT pc.card_id) INTO v_distinct_cards
  FROM player_cards pc WHERE pc.player_id=p_player_id;

  SELECT COUNT(DISTINCT pc.card_id) INTO v_rare_count
  FROM player_cards pc JOIN cards c ON c.id=pc.card_id
  WHERE pc.player_id=p_player_id AND c.rarity::text ILIKE 'rare';

  SELECT COUNT(DISTINCT pc.card_id) INTO v_epic_count
  FROM player_cards pc JOIN cards c ON c.id=pc.card_id
  WHERE pc.player_id=p_player_id AND c.rarity::text ILIKE 'epic';

  SELECT COUNT(DISTINCT pc.card_id) INTO v_legendary_count
  FROM player_cards pc JOIN cards c ON c.id=pc.card_id
  WHERE pc.player_id=p_player_id AND (c.rarity::text ILIKE 'legendary' OR c.is_legendary=true);

  SELECT COUNT(DISTINCT pc.card_id) INTO v_mythic_count
  FROM player_cards pc JOIN cards c ON c.id=pc.card_id
  WHERE pc.player_id=p_player_id AND c.rarity::text ILIKE 'mythic';

  -- === World Bosses ===
  SELECT COUNT(*), COUNT(DISTINCT world_boss_id) INTO v_boss_total, v_boss_distinct
  FROM world_boss_encounters
  WHERE player_id=p_player_id AND status IN ('victory','completed','killed','rewarded');

  -- === Mercado ===
  SELECT COUNT(*) INTO v_market_sold
  FROM market_listings WHERE player_id=p_player_id AND status::text IN ('sold','completed');

  -- === PvP ===
  SELECT COUNT(*) INTO v_pvp_wins
  FROM pvp_matches
  WHERE winner=p_player_id AND status::text IN ('completed','resolved','finished');

  -- === Packs ===
  SELECT COUNT(*) INTO v_pack_opens
  FROM vexforge_pack_orders WHERE player_id=p_player_id AND status IN ('completed','delivered','fulfilled');

  -- === Fusiones (via economy_ledger entry_type='fusion') ===
  SELECT COUNT(*) INTO v_fusion_count
  FROM economy_ledger WHERE player_id=p_player_id AND entry_type='fusion';

  -- === Streak diario (días consecutivos con al menos 1 quest completada) ===
  WITH completed_dates AS (
    SELECT DISTINCT assigned_date::date AS d
    FROM player_daily_quests
    WHERE player_id=p_player_id AND status IN ('completed','claimed')
    AND assigned_date >= CURRENT_DATE - 31
  ),
  streak_numbered AS (
    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::integer AS grp
    FROM completed_dates
  ),
  current_grp AS (
    SELECT grp FROM streak_numbered
    WHERE d >= CURRENT_DATE - 1
    ORDER BY d DESC LIMIT 1
  )
  SELECT COALESCE(
    (SELECT COUNT(*) FROM streak_numbered
     WHERE grp = (SELECT grp FROM current_grp LIMIT 1)),
    0
  ) INTO v_daily_streak;

  -- === Social: Clan ===
  SELECT EXISTS(SELECT 1 FROM clans WHERE leader_player_id=p_player_id) INTO v_is_clan_founder;
  SELECT EXISTS(
    SELECT 1 FROM clan_members
    WHERE player_id=p_player_id AND joined_at <= now() - interval '7 days'
  ) INTO v_is_clan_member;

  -- ═══ GRANT ACHIEVEMENTS ═══════════════════════════════════════════════════

  -- Misiones
  IF v_missions_done >= 10  THEN PERFORM grant_achievement(p_player_id,'missions_10'); END IF;
  IF v_missions_done >= 50  THEN PERFORM grant_achievement(p_player_id,'missions_50'); END IF;

  -- Colección
  IF v_rare_count >= 1       THEN PERFORM grant_achievement(p_player_id,'first_rare'); END IF;
  IF v_epic_count >= 1       THEN PERFORM grant_achievement(p_player_id,'first_epic'); END IF;
  IF v_legendary_count >= 1  THEN PERFORM grant_achievement(p_player_id,'first_legendary'); END IF;
  IF v_mythic_count >= 1     THEN PERFORM grant_achievement(p_player_id,'first_mythic'); END IF;
  IF v_distinct_cards >= 25  THEN PERFORM grant_achievement(p_player_id,'collector_25'); END IF;
  IF v_distinct_cards >= 50  THEN PERFORM grant_achievement(p_player_id,'collector_50'); END IF;
  IF v_distinct_cards >= 127 THEN PERFORM grant_achievement(p_player_id,'collector_127'); END IF;

  -- World Bosses
  IF v_boss_total >= 1       THEN PERFORM grant_achievement(p_player_id,'boss_slayer_1'); END IF;
  IF v_boss_distinct >= 5    THEN PERFORM grant_achievement(p_player_id,'boss_slayer_5'); END IF;

  -- Economía / Mercado
  IF v_market_sold >= 5      THEN PERFORM grant_achievement(p_player_id,'merchant_5'); END IF;
  IF v_market_sold >= 25     THEN PERFORM grant_achievement(p_player_id,'merchant_25'); END IF;

  -- PvP (FIXED chat81: añadidos pvp_50 y pvp_100)
  IF v_pvp_wins >= 1         THEN PERFORM grant_achievement(p_player_id,'first_win'); END IF;
  IF v_pvp_wins >= 10        THEN PERFORM grant_achievement(p_player_id,'pvp_10'); END IF;
  IF v_pvp_wins >= 50        THEN PERFORM grant_achievement(p_player_id,'pvp_50'); END IF;
  IF v_pvp_wins >= 100       THEN PERFORM grant_achievement(p_player_id,'pvp_100'); END IF;

  -- Packs
  IF v_pack_opens >= 10      THEN PERFORM grant_achievement(p_player_id,'pack_opener_10'); END IF;

  -- Fusión
  IF v_fusion_count >= 5     THEN PERFORM grant_achievement(p_player_id,'forger_5'); END IF;
  IF v_fusion_count >= 25    THEN PERFORM grant_achievement(p_player_id,'forger_25'); END IF;
  IF v_fusion_count >= 100   THEN PERFORM grant_achievement(p_player_id,'forger_100'); END IF;

  -- Streak diario
  IF v_daily_streak >= 7     THEN PERFORM grant_achievement(p_player_id,'daily_streak_7'); END IF;
  IF v_daily_streak >= 30    THEN PERFORM grant_achievement(p_player_id,'daily_streak_30'); END IF;

  -- Social / Clan
  IF v_is_clan_founder        THEN PERFORM grant_achievement(p_player_id,'clan_founder'); END IF;
  IF v_is_clan_member         THEN PERFORM grant_achievement(p_player_id,'clan_veteran'); END IF;

EXCEPTION WHEN OTHERS THEN
  NULL; -- nunca bloquear la transacción principal
END;
$function$

-- public.generate_emergent_rules() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.generate_emergent_rules()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_wallet numeric;
  market_vol int;
  pvp_vol int;
BEGIN

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_wallet
  FROM player_wallet;

  SELECT COUNT(*) INTO market_vol
  FROM market_listings;

  SELECT COUNT(*) INTO pvp_vol
  FROM pvp_matches
  WHERE created_at > now() - interval '1 hour';


  /* =====================================================
     CASO 1: ECONOMÍA SOBRECARGADA
     ===================================================== */

  IF avg_wallet > 8000 THEN

    INSERT INTO economy_emergent_rules(
      name,
      rule_type,
      generated_from,
      condition,
      effect,
      risk_score
    )
    VALUES (
      'anti_inflation_decay_rule',
      'wallet',
      jsonb_build_object('trigger', 'high_average_wallet'),
      jsonb_build_object('avg_wallet', '>8000'),
      jsonb_build_object('wallet_decay_rate', 0.98),
      0.65
    );

  END IF;


  /* =====================================================
     CASO 2: MERCADO SATURADO
     ===================================================== */

  IF market_vol > 300 THEN

    INSERT INTO economy_emergent_rules(
      name,
      rule_type,
      generated_from,
      condition,
      effect,
      risk_score
    )
    VALUES (
      'market_saturation_cooling_rule',
      'market',
      jsonb_build_object('trigger', 'high_market_volume'),
      jsonb_build_object('market_volume', '>300'),
      jsonb_build_object('fee_multiplier', 1.25),
      0.55
    );

  END IF;


  /* =====================================================
     CASO 3: GUERRA PvP INTENSA
     ===================================================== */

  IF pvp_vol > 150 THEN

    INSERT INTO economy_emergent_rules(
      name,
      rule_type,
      generated_from,
      condition,
      effect,
      risk_score
    )
    VALUES (
      'pvp_stability_rule',
      'pvp',
      jsonb_build_object('trigger', 'high_pvp_activity'),
      jsonb_build_object('pvp_volume', '>150'),
      jsonb_build_object('elo_decay', 1.15),
      0.7
    );

  END IF;

END;
$function$

-- public.generate_reward(p_player_id uuid, p_base numeric, p_type text) | SECURITY INVOKER | RETURNS numeric
CREATE OR REPLACE FUNCTION public.generate_reward(p_player_id uuid, p_base numeric, p_type text)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pes numeric;
  v_decay numeric;
  v_reward numeric;
BEGIN

  SELECT pes_value INTO v_pes
  FROM player_pes_snapshot
  WHERE player_id = p_player_id;

  IF v_pes IS NULL THEN
    v_pes := calculate_pes(p_player_id);
  END IF;

  -- decay por repetición (simplificado)
  v_decay := exp(-0.05 * (
    SELECT COUNT(*)
    FROM mission_runs
    WHERE player_id = p_player_id
    AND created_at > now() - interval '1 day'
  ));

  v_reward := p_base * v_pes * v_decay;

  RETURN v_reward;

END;
$function$

-- public.get_dynamic_liquidity_factor() | SECURITY INVOKER | RETURNS numeric
CREATE OR REPLACE FUNCTION public.get_dynamic_liquidity_factor()
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  total_trade numeric;
BEGIN

  SELECT COALESCE(SUM(vex_tradeable),0)
  INTO total_trade
  FROM player_wallet;

  IF total_trade = 0 THEN
    RETURN 1;
  END IF;

  RETURN 1 / (1 + LOG(1 + total_trade / 1000));

END;
$function$

-- public.get_economy_snapshot() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.get_economy_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  total_in numeric;
  total_trade numeric;
  pending_wd int;
BEGIN

  SELECT COALESCE(SUM(vex_ingame),0)
  INTO total_in
  FROM player_wallet;

  SELECT COALESCE(SUM(vex_tradeable),0)
  INTO total_trade
  FROM player_wallet;

  SELECT COUNT(*)
  INTO pending_wd
  FROM withdrawal_requests
  WHERE status = 'pending';

  RETURN jsonb_build_object(
    'total_ingame', total_in,
    'total_tradeable', total_trade,
    'pending_withdrawals', pending_wd,
    'timestamp', now()
  );

END;
$function$

-- public.get_home_stats() | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.get_home_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
      DECLARE
        v_result jsonb;
        v_season record;
        v_event record;
        v_top3 jsonb;
      BEGIN
        SELECT id, season_key, name, starts_at, ends_at
        INTO v_season
        FROM pvp_seasons
        WHERE active = true
        LIMIT 1;

        SELECT id, name, type, start_time, end_time, global_progress
        INTO v_event
        FROM events
        WHERE end_time > now()
        ORDER BY start_time DESC
        LIMIT 1;

        SELECT jsonb_agg(
          jsonb_build_object(
            'rank', rank_position,
            'display_name', display_name,
            'mmr', mmr,
            'wins', wins
          )
        ) INTO v_top3
        FROM (
          SELECT
            ROW_NUMBER() OVER (ORDER BY pr.mmr DESC, pr.wins DESC)::INTEGER as rank_position,
            COALESCE(p.display_name, 'Guerrero #' || left(pr.player_id::text,6)) as display_name,
            pr.mmr, pr.wins
          FROM pvp_rankings pr
          LEFT JOIN players p ON p.id = pr.player_id
          ORDER BY pr.mmr DESC
          LIMIT 3
        ) sub;

        SELECT jsonb_build_object(
          'active_players', (SELECT COUNT(*) FROM players WHERE status = 'active'),
          'total_battles', (SELECT COALESCE(SUM(wins + losses + draws), 0) FROM pvp_rankings),
          'total_cards', (SELECT COUNT(*) FROM cards WHERE active = true),
          'packs_opened', (SELECT COUNT(*) FROM vexforge_pack_orders WHERE status = 'fulfilled'),
          'season', CASE WHEN v_season.id IS NOT NULL THEN
            jsonb_build_object('name', v_season.name, 'ends_at', v_season.ends_at)
            ELSE NULL END,
          'active_event', CASE WHEN v_event.id IS NOT NULL THEN
            jsonb_build_object(
              'id', v_event.id,
              'name', v_event.name,
              'type', v_event.type,
              'ends_at', v_event.end_time,
              'progress', v_event.global_progress
            )
            ELSE NULL END,
          'top3', COALESCE(v_top3, '[]'::jsonb)
        ) INTO v_result;

        RETURN v_result;
      END;
      $function$

-- public.get_leaderboard(p_limit integer) | SECURITY DEFINER | RETURNS TABLE(rank_position integer, player_id uuid, display_name text, mmr integer, wins integer, losses integer, draws integer, win_rate numeric, updated_at timestamp with time zone, avg_dps_score integer, champion_card_id uuid, champion_faction text, champion_name text)
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit integer DEFAULT 50)
 RETURNS TABLE(rank_position integer, player_id uuid, display_name text, mmr integer, wins integer, losses integer, draws integer, win_rate numeric, updated_at timestamp with time zone, avg_dps_score integer, champion_card_id uuid, champion_faction text, champion_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY pr.mmr DESC, pr.wins DESC)::INTEGER,
    pr.player_id,
    COALESCE(p.display_name, 'Guerrero #' || left(pr.player_id::text,6))::text,
    pr.mmr, pr.wins, pr.losses, pr.draws,
    CASE WHEN (pr.wins+pr.losses+pr.draws) > 0
      THEN ROUND(pr.wins::NUMERIC/(pr.wins+pr.losses+pr.draws)*100,1)
      ELSE 0::numeric END,
    pr.updated_at,
    COALESCE(pr.avg_dps_score,0)::integer,
    pr.champion_card_id,
    c.faction::text,
    c.name::text
  FROM pvp_rankings pr
  LEFT JOIN players p ON p.id = pr.player_id
  LEFT JOIN cards c ON c.id = pr.champion_card_id
  ORDER BY pr.mmr DESC, pr.wins DESC
  LIMIT p_limit;
END;
$function$

-- public.get_player_stats(p_player_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.get_player_stats(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_stats JSONB;
BEGIN
  PERFORM public.assert_caller_is_player(p_player_id);
  SELECT jsonb_build_object(
    'pvp_wins',           (SELECT count(*) FROM pvp_matches
                           WHERE (player_a = p_player_id OR player_b = p_player_id)
                             AND winner = p_player_id),
    'missions_completed', (SELECT count(*) FROM mission_runs
                           WHERE player_id = p_player_id AND status = 'claimed'),
    'cards_owned',        (SELECT count(DISTINCT card_id) FROM player_cards
                           WHERE player_id = p_player_id AND quantity > 0),
    'market_sales',       (SELECT count(*) FROM market_listings
                           WHERE player_id = p_player_id AND status = 'sold'),
    'boss_kills',         (SELECT count(*) FROM world_boss_encounters
                           WHERE player_id = p_player_id AND status = 'completed'),
    'packs_opened',       (SELECT count(*) FROM vexforge_pack_orders
                           WHERE player_id = p_player_id AND status = 'fulfilled')
  ) INTO v_stats;
  RETURN v_stats;
END;
$function$

-- public.grant_achievement(p_player_id uuid, p_achievement_code text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.grant_achievement(p_player_id uuid, p_achievement_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE v_ach RECORD; v_already BOOLEAN;
    BEGIN
    SELECT * INTO v_ach FROM achievements WHERE code=p_achievement_code;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','Achievement not found'); END IF;
    SELECT EXISTS(SELECT 1 FROM player_achievements WHERE player_id=p_player_id AND achievement_id=v_ach.id) INTO v_already;
    IF v_already THEN RETURN jsonb_build_object('ok',true,'already_unlocked',true); END IF;
    INSERT INTO player_achievements(player_id,achievement_id) VALUES(p_player_id,v_ach.id) ON CONFLICT DO NOTHING;
    INSERT INTO player_wallet(player_id,vex_ingame,vex_tradeable,created_at,updated_at)
    VALUES(p_player_id,v_ach.reward_vex_ingame,0,now(),now())
    ON CONFLICT(player_id) DO UPDATE SET vex_ingame=player_wallet.vex_ingame+v_ach.reward_vex_ingame,updated_at=now();
    INSERT INTO player_progress(player_id,level,xp,xp_to_next,energy,max_energy,created_at,updated_at)
    VALUES(p_player_id,1,v_ach.reward_xp,1000,100,100,now(),now())
    ON CONFLICT(player_id) DO UPDATE SET xp=player_progress.xp+v_ach.reward_xp,updated_at=now();
    RETURN jsonb_build_object('ok',true,'achievement',v_ach.title,'points',v_ach.points,
      'vex_reward',v_ach.reward_vex_ingame,'xp_reward',v_ach.reward_xp,'newly_unlocked',true);
    END; $function$

-- public.handle_new_auth_user() | SECURITY DEFINER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_display_name text;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Player'
  );

  INSERT INTO public.players (auth_user_id, email, display_name, role, status, source_system)
  VALUES (NEW.id, NEW.email, v_display_name, 'player', 'active', 'web')
  ON CONFLICT (auth_user_id) DO NOTHING
  RETURNING id INTO v_player_id;

  IF v_player_id IS NULL THEN
    SELECT id INTO v_player_id FROM public.players WHERE auth_user_id = NEW.id;
  END IF;

  IF v_player_id IS NOT NULL THEN
    INSERT INTO public.player_progress (
      player_id, level, xp, xp_to_next, energy, max_energy, tutorial_step
    )
    VALUES (v_player_id, 1, 0, 100, 100, 100, 1)
    ON CONFLICT (player_id) DO NOTHING;

    INSERT INTO public.player_wallet (
      player_id, vex_ingame, vex_tradeable, reserved_ingame, reserved_tradeable
    )
    VALUES (v_player_id, 0, 0, 0, 0)
    ON CONFLICT (player_id) DO NOTHING;

    INSERT INTO public.player_settings (
      player_id, telegram_enabled, notifications_enabled, language, timezone, ui_mode
    )
    VALUES (v_player_id, false, true, 'es', 'UTC', 'dark')
    ON CONFLICT (player_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$

-- public.hook_market_event() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.hook_market_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  begin

      if NEW.status = 'sold' then

          perform emit_game_event(
              NEW.player_id,
              'market_sold',
              'market_listings',
              NEW.id::text,
              jsonb_build_object(
                  'price', NEW.price
              )
          );

      end if;

      return NEW;
  end;
  $function$

-- public.initialize_player_full(p_auth_id text, p_email text, p_display_name text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.initialize_player_full(p_auth_id text, p_email text, p_display_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
BEGIN

  -- prevent duplicates
  SELECT id INTO v_player_id
  FROM players
  WHERE auth_user_id = p_auth_id;

  IF v_player_id IS NULL THEN

    INSERT INTO players(auth_user_id, email, display_name)
    VALUES (p_auth_id, p_email, p_display_name)
    RETURNING id INTO v_player_id;

    INSERT INTO player_progress(player_id)
    VALUES (v_player_id);

    INSERT INTO player_wallet(player_id)
    VALUES (v_player_id);

    -- starter deck default (empty safe state)
    INSERT INTO player_deck(player_id, slot_number)
    SELECT v_player_id, generate_series(1,8);

  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'player_id', v_player_id
  );

END;
$function$

-- public.initialize_player_full(p_auth_id uuid, p_email text, p_display_name text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.initialize_player_full(p_auth_id uuid, p_email text, p_display_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      DECLARE
        v_player_id uuid;
      BEGIN
        -- Prevent duplicate players
        SELECT id INTO v_player_id FROM players WHERE auth_user_id = p_auth_id;

        IF v_player_id IS NULL THEN
          INSERT INTO players(auth_user_id, email, display_name)
          VALUES (p_auth_id, p_email, p_display_name)
          RETURNING id INTO v_player_id;

          -- Core progress record
          INSERT INTO player_progress(player_id, starter_region)
          VALUES (v_player_id, 'Reino del Acero');

          INSERT INTO player_wallet(player_id) VALUES (v_player_id);

          -- 8 deck slots
          INSERT INTO player_deck(player_id, slot_number)
          SELECT v_player_id, generate_series(1, 8);

          -- 16 starter cards (4 per faction: Guerrero / Mago / Paladín / Pícaro)
          INSERT INTO player_cards(player_id, card_id, quantity, locked, listed, source_tracking) VALUES
            (v_player_id,'8aa583e2-0ee2-4f42-ac7a-9c0ef48744bc',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'19e208c4-0119-4a7f-80cc-128ed6b05e81',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'b8b9fe07-95f9-4c06-9a01-a2e452137fef',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'4e5abdff-b179-4007-958b-c21c8cb3f876',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'67d0ed57-8b31-4485-a38d-c35a9ed54706',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'7222f6e4-cf81-46e4-84d2-9c584d1dd851',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'b341979a-a470-4bd0-a090-2dfa001bec8b',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'4c6b83d5-9925-4ffa-a54a-b6f1bcef0274',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'40307327-9345-4c10-95be-f339afbe676c',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'6e2122b8-330f-4759-94df-f8c6675da285',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'ddff3d12-35ba-4175-8f30-a17022fcd91b',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'14b4fafd-c0ba-4723-b251-6cc708535a08',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'79f6f19b-d7d4-4695-ade2-a901ec7efd99',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'7d133dd4-22f7-4e1b-bf41-796b596b45fc',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'d5da17e7-1b1b-4e75-b089-76a85e18abee',1,false,false,'{"source":"starter_deck"}'::jsonb),
            (v_player_id,'c5ccb4c1-93af-4508-b312-17a3d11c0085',1,false,false,'{"source":"starter_deck"}'::jsonb);
        END IF;

        RETURN jsonb_build_object('status','ok','player_id',v_player_id);
      END;
      $function$

-- public.is_admin(user_id uuid) | SECURITY DEFINER | RETURNS boolean
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from players
    where id = user_id
      and is_admin = true
  );
$function$

-- public.is_super_admin(p_player_id uuid) | SECURITY DEFINER | RETURNS boolean
CREATE OR REPLACE FUNCTION public.is_super_admin(p_player_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v boolean;
begin
  select is_super_admin into v
  from players
  where id = p_player_id;

  return coalesce(v, false);
end;
$function$

-- public.kernel_execute_event(p_player_id uuid, p_context_key text, p_event_type text, p_currency text, p_amount numeric, p_metadata jsonb) | SECURITY INVOKER | RETURNS TABLE(success boolean, message text, ledger_id uuid)
CREATE OR REPLACE FUNCTION public.kernel_execute_event(p_player_id uuid, p_context_key text, p_event_type text, p_currency text, p_amount numeric, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, message text, ledger_id uuid)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$

declare
    v_balance_before numeric;
    v_balance_after numeric;
    v_entry_id uuid;
begin

    -- 1. VALIDATION SAFE GUARD
    if p_amount is null or p_amount = 0 then
        return query select false, 'INVALID_AMOUNT', null::uuid;
        return;
    end if;

    if p_player_id is null then
        return query select false, 'INVALID_PLAYER', null::uuid;
        return;
    end if;

    -- 2. GET CURRENT BALANCE (SAFE DEFAULT)
    select coalesce(sum(amount), 0)
    into v_balance_before
    from economy_ledger
    where player_id = p_player_id
    and currency = p_currency;

    -- 3. CALCULATE NEW BALANCE
    v_balance_after := v_balance_before + p_amount;

    -- 4. INSERT LEDGER ENTRY (ONLY WRITER)
    insert into economy_ledger (
        id,
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        gen_random_uuid(),
        p_context_key || ':' || p_event_type,
        p_player_id,
        p_event_type,
        p_currency,
        p_amount,
        v_balance_before,
        v_balance_after,
        'kernel',
        p_context_key,
        p_metadata,
        now(),
        true
    )
    returning id into v_entry_id;

    -- 5. RETURN SAFE RESPONSE
    return query select true, 'OK', v_entry_id;

exception when others then
    return query select false, SQLERRM, null::uuid;
end;

$function$

-- public.ledger_auto_fix() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.ledger_auto_fix()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := public.safe_reference_id();
  END IF;

  RETURN NEW;
END;
$function$

-- public.ledger_hash_chain() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.ledger_hash_chain()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  last_hash text;
BEGIN

  /* obtener último hash del mismo jugador */
  SELECT row_hash
  INTO last_hash
  FROM economy_ledger
  WHERE player_id = NEW.player_id
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.prev_hash := last_hash;

  NEW.row_hash := compute_ledger_hash(
    NEW.player_id,
    NEW.currency,
    NEW.amount,
    NEW.reference_id,
    NEW.prev_hash
  );

  RETURN NEW;
END;
$function$

-- public.log_admin_action(p_admin uuid, p_action text, p_table text, p_target text, p_payload jsonb) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.log_admin_action(p_admin uuid, p_action text, p_table text DEFAULT NULL::text, p_target text DEFAULT NULL::text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO admin_actions(
    admin_id,
    action_type,
    target_table,
    target_id,
    payload,
    created_at
  )
  VALUES (
    p_admin,
    p_action,
    p_table,
    p_target,
    p_payload,
    now()
  );
END;
$function$

-- public.market_trade_finalize_quarantine_novalidation_direct(p_seller uuid, p_buyer uuid, p_price numeric, p_listing_id text) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.market_trade_finalize_quarantine_novalidation_direct(p_seller uuid, p_buyer uuid, p_price numeric, p_listing_id text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    fee numeric := p_price * 0.1;
    net numeric := p_price - fee;
begin

    -- buyer debit
    insert into economy_ledger(
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        created_at,
        is_final
    )
    values (
        p_buyer,
        'debit',
        'vex_tradeable',
        p_price,
        'market',
        p_listing_id,
        now(),
        true
    );

    -- seller credit
    insert into economy_ledger(
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        created_at,
        is_final
    )
    values (
        p_seller,
        'credit',
        'vex_tradeable',
        net,
        'market',
        p_listing_id,
        now(),
        true
    );

    -- sink fee
    insert into economy_ledger(
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        created_at,
        is_final
    )
    values (
        null,
        'fee',
        'vex_tradeable',
        fee,
        'market_fee',
        p_listing_id,
        now(),
        true
    );

end;
$function$

-- public.meta_system_tick() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.meta_system_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total_in numeric;
  v_total_trade numeric;
  v_inflation numeric;
  v_active_players int;
  v_reward_pressure numeric;
  v_extraction_pressure numeric;
BEGIN

  -- =========================
  -- GLOBAL SNAPSHOT
  -- =========================
  SELECT
    COALESCE(SUM(vex_ingame),0),
    COALESCE(SUM(vex_tradeable),0),
    COUNT(*)
  INTO v_total_in, v_total_trade, v_active_players
  FROM player_wallet;

  -- =========================
  -- INFLATION RATE
  -- =========================
  v_inflation := v_total_trade / NULLIF(v_total_in + 1, 0);

  -- =========================
  -- PRESSURE METRICS
  -- =========================
  v_reward_pressure := v_active_players * v_inflation;
  v_extraction_pressure := v_total_trade * 0.001;

  -- =========================
  -- UPDATE GLOBAL STATE
  -- =========================
  UPDATE economy_global_metrics
  SET
    total_vex_in = v_total_in,
    total_vex_trade = v_total_trade,
    inflation_rate = v_inflation,
    active_players = v_active_players,
    reward_pressure = v_reward_pressure,
    computed_at = now()
  WHERE id IS NOT NULL;

END;
$function$

-- public.prevent_ledger_mutation() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.prevent_ledger_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    raise exception 'LEDGER IS IMMUTABLE - INSERT ONLY ALLOWED';
end;
$function$

-- public.prevent_wallet_direct_update() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.prevent_wallet_direct_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RAISE EXCEPTION 'Direct wallet updates not allowed. Use economy_ledger.';
END;
$function$

-- public.process_combat_result(p_winner uuid, p_loser uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.process_combat_result(p_winner uuid, p_loser uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

    -- WINNER
    INSERT INTO economy_ledger (
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    VALUES (
        p_winner,
        'credit',
        'vex_ingame',
        25,
        'combat',
        gen_random_uuid()::text,
        jsonb_build_object('event','combat_win'),
        NOW(),
        true
    );

    -- LOSER (soft sink)
    INSERT INTO economy_ledger (
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    VALUES (
        p_loser,
        'debit',
        'vex_ingame',
        10,
        'combat',
        gen_random_uuid()::text,
        jsonb_build_object('event','combat_loss'),
        NOW(),
        true
    );

END;
$function$

-- public.process_event_batch() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.process_event_batch()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_pve_count int;
  v_pvp_count int;
  v_market_count int;
  v_withdraw_pressure numeric;
BEGIN

  -- AGRUPAR PvE
  SELECT count(*) INTO v_pve_count
  FROM event_buffer
  WHERE event_type = 'mission_runs'
  AND processed = false;

  -- AGRUPAR PvP
  SELECT count(*) INTO v_pvp_count
  FROM event_buffer
  WHERE event_type = 'pvp_matches'
  AND processed = false;

  -- AGRUPAR MARKET
  SELECT count(*) INTO v_market_count
  FROM event_buffer
  WHERE event_type = 'market_listings'
  AND processed = false;

  -- PRESIÓN ECONÓMICA
  v_withdraw_pressure := v_market_count * 0.01;

  -- SIMULAR META TICK (LIGHTWEIGHT)
  PERFORM vexforge_meta_tick(
    v_pve_count,
    v_pvp_count,
    v_market_count,
    v_withdraw_pressure
  );

  -- MARCAR COMO PROCESADO
  UPDATE event_buffer
  SET processed = true
  WHERE processed = false;

END;
$function$

-- public.process_first_pack_referral_reward(p_buyer_auth_id uuid, p_pack_price_vex numeric) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.process_first_pack_referral_reward(p_buyer_auth_id uuid, p_pack_price_vex numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_row record;
  v_referrer_player uuid;
  v_bonus numeric;
BEGIN
  SELECT r.id, r.referrer_auth_id
    INTO v_referral_row
  FROM public.vexforge_referrals r
  WHERE r.referred_auth_id = p_buyer_auth_id
    AND r.status = 'completed'
    AND r.first_pack_rewarded = false
  ORDER BY r.created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_referral_row IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'no_pending_pack_reward');
  END IF;

  SELECT p.id
    INTO v_referrer_player
  FROM public.players p
  WHERE p.auth_user_id = v_referral_row.referrer_auth_id
  LIMIT 1;

  IF v_referrer_player IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'referrer_player_not_found');
  END IF;

  v_bonus := GREATEST(floor(COALESCE(p_pack_price_vex, 0) * 0.05), 1);

  UPDATE public.vexforge_referrals
  SET first_pack_rewarded = true, updated_at = now()
  WHERE id = v_referral_row.id AND first_pack_rewarded = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_processed', 'referral_id', v_referral_row.id);
  END IF;

  INSERT INTO public.economy_ledger (
    reference_id, player_id, entry_type, currency, amount,
    source_table, source_id, metadata, is_final
  ) VALUES (
    'referral:' || v_referral_row.id::text || ':first_pack',
    v_referrer_player, 'reward'::ledger_entry_type, 'vex_ingame', v_bonus,
    'vexforge_referrals', v_referral_row.id::text,
    jsonb_build_object('reward', 'referral_first_pack', 'pack_price_vex', p_pack_price_vex, 'pct', 5), true
  ) ON CONFLICT (reference_id) DO NOTHING;

  PERFORM public.reconcile_player_wallet(v_referrer_player);

  RETURN jsonb_build_object(
    'ok', true,
    'bonus_vex', v_bonus,
    'referral_id', v_referral_row.id
  );
END;
$function$

-- public.process_mission_completion(p_player_id uuid, p_mission_id uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.process_mission_completion(p_player_id uuid, p_mission_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_reward numeric;
BEGIN

    SELECT reward_vex INTO v_reward
    FROM missions
    WHERE id = p_mission_id;

    INSERT INTO economy_ledger (
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    VALUES (
        p_player_id,
        'credit',
        'vex_ingame',
        v_reward,
        0,
        v_reward,
        'missions',
        p_mission_id,
        jsonb_build_object('event','mission_complete'),
        NOW(),
        true
    );

END;
$function$

-- public.process_referral_first_pack_reward_trigger() | SECURITY DEFINER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.process_referral_first_pack_reward_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_buyer_auth_id uuid;
  v_is_paid boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_is_paid := NEW.status IN ('paid', 'completed', 'delivered', 'fulfilled');
  ELSE
    v_is_paid := NEW.status IN ('paid', 'completed', 'delivered', 'fulfilled')
      AND OLD.status NOT IN ('paid', 'completed', 'delivered', 'fulfilled');
  END IF;

  IF v_is_paid THEN
    SELECT p.auth_user_id INTO v_buyer_auth_id
    FROM public.players p
    WHERE p.id = NEW.player_id;

    IF v_buyer_auth_id IS NOT NULL THEN
      PERFORM public.process_first_pack_referral_reward(
        v_buyer_auth_id,
        COALESCE(NEW.price_usdt, 0) * 100
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$

-- public.process_referral_on_register(p_referral_code text, p_referred_auth_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.process_referral_on_register(p_referral_code text, p_referred_auth_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_player_id uuid;
  v_referrer_auth_id uuid;
  v_referred_player_id uuid;
  v_existing_ref_id uuid;
  v_ref_row_id uuid;
  v_referred_name text;
BEGIN
  IF p_referral_code IS NULL
     OR btrim(p_referral_code) = ''
     OR p_referred_auth_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_referral_input');
  END IF;

  IF auth.uid() IS NULL OR p_referred_auth_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'identity_mismatch');
  END IF;

  SELECT p.id, p.auth_user_id
    INTO v_referrer_player_id, v_referrer_auth_id
  FROM public.players p
  WHERE p.referral_code = p_referral_code
    AND p.auth_user_id <> p_referred_auth_id
  LIMIT 1;

  IF v_referrer_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_or_self_code');
  END IF;

  SELECT r.id
    INTO v_existing_ref_id
  FROM public.vexforge_referrals r
  WHERE r.referrer_auth_id = v_referrer_auth_id
    AND r.referred_auth_id = p_referred_auth_id
  LIMIT 1;

  IF v_existing_ref_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_processed', 'referral_id', v_existing_ref_id);
  END IF;

  SELECT p.id, p.display_name
    INTO v_referred_player_id, v_referred_name
  FROM public.players p
  WHERE p.auth_user_id = p_referred_auth_id
  LIMIT 1;

  IF v_referred_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'referred_player_not_found');
  END IF;

  IF (
    SELECT count(*)
    FROM public.vexforge_referrals
    WHERE referrer_auth_id = v_referrer_auth_id
  ) >= 50 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'referrer_limit_reached');
  END IF;

  INSERT INTO public.vexforge_referrals
    (referrer_auth_id, referred_auth_id, referred_display_name, status, reward_granted)
  VALUES
    (v_referrer_auth_id, p_referred_auth_id, v_referred_name, 'completed', true)
  RETURNING id INTO v_ref_row_id;

  INSERT INTO public.economy_ledger (
    reference_id, player_id, entry_type, currency, amount,
    source_table, source_id, metadata, is_final
  ) VALUES (
    'referral:' || v_ref_row_id::text || ':welcome',
    v_referred_player_id, 'reward'::ledger_entry_type, 'vex_ingame', 50,
    'vexforge_referrals', v_ref_row_id::text,
    jsonb_build_object('reward', 'referral_welcome', 'referral_code', p_referral_code), true
  ) ON CONFLICT (reference_id) DO NOTHING;

  INSERT INTO public.economy_ledger (
    reference_id, player_id, entry_type, currency, amount,
    source_table, source_id, metadata, is_final
  ) VALUES (
    'referral:' || v_ref_row_id::text || ':referrer',
    v_referrer_player_id, 'reward'::ledger_entry_type, 'vex_ingame', 100,
    'vexforge_referrals', v_ref_row_id::text,
    jsonb_build_object('reward', 'referral_signup', 'referred_display_name', v_referred_name), true
  ) ON CONFLICT (reference_id) DO NOTHING;

  PERFORM public.reconcile_player_wallet(v_referred_player_id);
  PERFORM public.reconcile_player_wallet(v_referrer_player_id);

  RETURN jsonb_build_object(
    'ok', true,
    'referral_id', v_ref_row_id,
    'referred_bonus_vex', 50,
    'referrer_bonus_vex', 100
  );
END;
$function$

-- public.reconcile_player_economy(p_player_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.reconcile_player_economy(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  w_ingame numeric;
  w_trade numeric;
  l_ingame numeric;
  l_trade numeric;
  d_ingame numeric;
  d_trade numeric;
  v_status text := 'ok';
BEGIN

  /* WALLET */
  SELECT vex_ingame, vex_tradeable
  INTO w_ingame, w_trade
  FROM player_wallet
  WHERE player_id = p_player_id;

  /* LEDGER */
  SELECT
    COALESCE(SUM(CASE WHEN currency = 'vex_ingame' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN currency = 'vex_tradeable' THEN amount ELSE 0 END), 0)
  INTO l_ingame, l_trade
  FROM economy_ledger
  WHERE player_id = p_player_id;


  /* DIFF */
  d_ingame := w_ingame - l_ingame;
  d_trade  := w_trade - l_trade;


  /* DECISION */
  IF d_ingame <> 0 OR d_trade <> 0 THEN
    v_status := 'mismatch';

    /* AUTO FIX (FORCE SYNC WALLET → LEDGER) */
    UPDATE player_wallet
    SET
      vex_ingame = l_ingame,
      vex_tradeable = l_trade
    WHERE player_id = p_player_id;

    v_status := 'fixed';
  END IF;


  /* LOG */
  INSERT INTO economy_reconciliation_log(
    player_id,
    wallet_ingame,
    wallet_tradeable,
    ledger_ingame,
    ledger_tradeable,
    diff_ingame,
    diff_tradeable,
    status
  )
  VALUES (
    p_player_id,
    w_ingame,
    w_trade,
    l_ingame,
    l_trade,
    d_ingame,
    d_trade,
    v_status
  );


  RETURN jsonb_build_object(
    'status', v_status,
    'diff_ingame', d_ingame,
    'diff_trade', d_trade
  );

END;
$function$

-- public.reconcile_player_wallet(p_player_id uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.reconcile_player_wallet(p_player_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  total_in_game numeric;
  total_trade numeric;
BEGIN

  SELECT
    COALESCE(SUM(CASE WHEN currency = 'vex_ingame' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN currency = 'vex_tradeable' THEN amount ELSE 0 END), 0)
  INTO total_in_game, total_trade
  FROM economy_ledger
  WHERE player_id = p_player_id;

  UPDATE player_wallet
  SET
    vex_ingame = total_in_game,
    vex_tradeable = total_trade,
    updated_at = now(),
    last_synced_from_ledger = now()
  WHERE player_id = p_player_id;

END;
$function$

-- public.refresh_meta_feedback() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.refresh_meta_feedback()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  infl numeric;
  eng numeric;
  wd numeric;
BEGIN

  SELECT COALESCE(SUM(vex_ingame),0)/1000 INTO infl FROM player_wallet;
  SELECT COUNT(*) INTO eng FROM players;
  SELECT COUNT(*) INTO wd FROM withdrawal_requests WHERE status='pending';

  UPDATE meta_state
  SET
    inflation = infl,
    engagement = eng,
    withdrawal_pressure = wd,
    k_multiplier = GREATEST(
      k_multiplier * (1 - infl*0.01 + eng*0.001 - wd*0.005),
      0.1
    ),
    updated_at = now()
  WHERE state_key = 'global';

END;
$function$

-- public.refresh_vex_canon_registry() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.refresh_vex_canon_registry()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    perform sync_vex_table_to_canon('tg_card', 'tg_cards');
    perform sync_vex_table_to_canon('tg_mission', 'tg_missions');
    perform sync_vex_table_to_canon('tg_player', 'tg_players');
    perform sync_vex_table_to_canon('tg_clan', 'tg_clans');
    perform sync_vex_table_to_canon('tg_clan_member', 'tg_clan_members');
    perform sync_vex_table_to_canon('tg_inventory_item', 'tg_inventory');
    perform sync_vex_table_to_canon('tg_player_card', 'tg_player_cards');
    perform sync_vex_table_to_canon('tg_player_mission', 'tg_player_missions');
    perform sync_vex_table_to_canon('tg_event', 'tg_events');
    perform sync_vex_table_to_canon('tg_event_participant', 'tg_event_participants');
    perform sync_vex_table_to_canon('tg_reward', 'tg_rewards');
    perform sync_vex_table_to_canon('tg_setting', 'tg_settings');
    perform sync_vex_table_to_canon('tg_transaction', 'tg_transactions');
    perform sync_vex_table_to_canon('tg_wallet_row', 'tg_wallet');
end;
$function$

-- public.reject_withdrawal_quarantine_legacy_duplicate_path(p_request_id uuid, p_admin uuid, p_note text) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.reject_withdrawal_quarantine_legacy_duplicate_path(p_request_id uuid, p_admin uuid, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  IF NOT is_super_admin(p_admin) THEN
    RAISE EXCEPTION 'NOT AUTHORIZED';
  END IF;

  UPDATE withdrawal_requests
  SET status = 'rejected',
      admin_note = p_note,
      reviewed_by = p_admin,
      reviewed_at = now()
  WHERE id = p_request_id;

END;
$function$

-- public.request_withdrawal_quarantine_legacy_duplicate_path(p_player uuid, p_amount numeric) | SECURITY INVOKER | RETURNS uuid
CREATE OR REPLACE FUNCTION public.request_withdrawal_quarantine_legacy_duplicate_path(p_player uuid, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id uuid;
BEGIN

  INSERT INTO withdrawal_requests(
    player_id,
    amount,
    status
  )
  VALUES (
    p_player,
    p_amount,
    'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$

-- public.require_admin() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.require_admin()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM players
    WHERE auth_user_id = auth.uid()
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'ACCESS DENIED: ADMIN ONLY';
  END IF;

END;
$function$

-- public.resolve_pvp_economy(p_match_id uuid, p_winner uuid, p_reward numeric, p_currency text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.resolve_pvp_economy(p_match_id uuid, p_winner uuid, p_reward numeric, p_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_ref text;
BEGIN

  v_ref := 'pvp_' || p_match_id::text;

  -- ledger entry (canon compliance)
  INSERT INTO economy_ledger(
    reference_id,
    player_id,
    entry_type,
    currency,
    amount,
    source_table,
    source_id
  )
  VALUES (
    v_ref,
    p_winner,
    'reward',
    p_currency,
    p_reward,
    'pvp_matches',
    p_match_id::text
  )
  ON CONFLICT DO NOTHING;

  -- wallet update safety should be handled in RPC safe_wallet_transaction
  RETURN jsonb_build_object(
    'status', 'ok',
    'match_id', p_match_id,
    'winner', p_winner
  );

END;
$function$

-- public.run_economy_simulation() | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.run_economy_simulation()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_wallet numeric;
  total_ingame numeric;
  total_tradeable numeric;
  risk_score numeric;
BEGIN
  SELECT COALESCE(AVG(vex_ingame + vex_tradeable), 0) INTO avg_wallet FROM player_wallet;
  SELECT COALESCE(SUM(vex_ingame), 0) INTO total_ingame FROM player_wallet;
  SELECT COALESCE(SUM(vex_tradeable), 0) INTO total_tradeable FROM player_wallet;
  risk_score := CASE
    WHEN avg_wallet > 10000 THEN 60
    WHEN avg_wallet > 1000  THEN 30
    ELSE 5
  END;
  RETURN jsonb_build_object(
    'risk_score', risk_score,
    'avg_wallet', avg_wallet,
    'total_ingame', total_ingame,
    'total_tradeable', total_tradeable,
    'status', 'simulation_ok',
    'simulated_at', now()
  );
END;
$function$

-- public.run_gameplay_loop(p_player_id uuid, p_mission_id uuid, p_card_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.run_gameplay_loop(p_player_id uuid, p_mission_id uuid, p_card_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_energy integer;
    v_cost integer;
    v_reward integer;
    v_power integer;
    v_success boolean;
    v_xp integer;
BEGIN

    -- =========================
    -- 1. LOAD MISSION
    -- =========================
    SELECT energy_cost, reward_vex, reward_xp
    INTO v_cost, v_reward, v_xp
    FROM missions
    WHERE id = p_mission_id
    AND active = true;

    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'mission_not_found');
    END IF;

    -- =========================
    -- 2. CHECK PLAYER ENERGY
    -- =========================
    SELECT energy INTO v_energy
    FROM players
    WHERE id = p_player_id;

    IF v_energy < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_energy');
    END IF;

    -- =========================
    -- 3. LOAD CARD POWER
    -- =========================
    SELECT power INTO v_power
    FROM player_cards
    WHERE player_id = p_player_id
    AND card_id = p_card_id;

    IF v_power IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'card_not_found');
    END IF;

    -- =========================
    -- 4. COMBAT SIMULATION (MINIMAL VIABLE)
    -- =========================
    -- éxito basado en energía + power vs costo (simple pero estable)
    v_success := (v_power * 2 + random() * 10) > v_cost * 2;

    -- =========================
    -- 5. APPLY ENERGY COST
    -- =========================
    UPDATE players
    SET energy = energy - v_cost
    WHERE id = p_player_id;

    -- =========================
    -- 6. WRITE MISSION RUN
    -- =========================
    INSERT INTO mission_runs (
        player_id,
        mission_id,
        status,
        created_at
    ) VALUES (
        p_player_id,
        p_mission_id,
        CASE WHEN v_success THEN 'success' ELSE 'fail' END,
        now()
    );

    -- =========================
    -- 7. REWARD FLOW (ONLY IF SUCCESS)
    -- =========================
    IF v_success THEN

        -- VEX REWARD
        INSERT INTO economy_ledger (
            player_id,
            entry_type,
            currency,
            amount,
            metadata
        ) VALUES (
            p_player_id,
            'reward',
            'vex_ingame',
            v_reward,
            jsonb_build_object('type','mission_reward','mission_id',p_mission_id)
        );

        -- XP (no ledger necesario si lo guardas directo)
        UPDATE players
        SET level = level + (v_xp / 100)
        WHERE id = p_player_id;

    END IF;

    -- =========================
    -- 8. CARD PROGRESSION (soft growth)
    -- =========================
    UPDATE player_cards
    SET power = power + CASE WHEN v_success THEN 1 ELSE 0 END
    WHERE player_id = p_player_id
    AND card_id = p_card_id;

    -- =========================
    -- 9. RETURN RESULT
    -- =========================
    RETURN jsonb_build_object(
        'success', true,
        'mission_success', v_success,
        'reward_vex', CASE WHEN v_success THEN v_reward ELSE 0 END,
        'xp', v_xp,
        'energy_spent', v_cost
    );

END;
$function$

-- public.safe_economy_rebalance() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.safe_economy_rebalance()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_last_run timestamptz;
begin

    select max(created_at)
    into v_last_run
    from public.event_log
    where event_type = 'ECONOMY_REBALANCE';

    -- cooldown 30 seconds (anti spam loop)
    if v_last_run is not null and v_last_run > now() - interval '30 seconds' then
        return;
    end if;

    perform public.economy_state_rebalance();

    perform public.safe_log_event(
        null,
        'ECONOMY_REBALANCE',
        gen_random_uuid()::text,
        'system',
        'rebalance',
        jsonb_build_object('auto', true)
    );

exception when others then
    null;

end;
$function$

-- public.safe_ledger_write(p_player_id uuid, p_entry_type text, p_currency text, p_amount numeric, p_source_table text, p_source_id text, p_meta jsonb) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.safe_ledger_write(p_player_id uuid, p_entry_type text, p_currency text, p_amount numeric, p_source_table text, p_source_id text, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                                        begin

                                                                                                                                                                                                                                                                                                                                                                                                          insert into economy_ledger (
                                                                                                                                                                                                                                                                                                                                                                                                              reference_id,
                                                                                                                                                                                                                                                                                                                                                                                                                  player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                      entry_type,
                                                                                                                                                                                                                                                                                                                                                                                                                          currency,
                                                                                                                                                                                                                                                                                                                                                                                                                              amount,
                                                                                                                                                                                                                                                                                                                                                                                                                                  balance_before,
                                                                                                                                                                                                                                                                                                                                                                                                                                      balance_after,
                                                                                                                                                                                                                                                                                                                                                                                                                                          source_table,
                                                                                                                                                                                                                                                                                                                                                                                                                                              source_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                  metadata,
                                                                                                                                                                                                                                                                                                                                                                                                                                                      created_at,
                                                                                                                                                                                                                                                                                                                                                                                                                                                          is_final,
                                                                                                                                                                                                                                                                                                                                                                                                                                                              row_hash,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  prev_hash
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      values (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          gen_random_uuid()::text,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              p_player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  p_entry_type,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      p_currency,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          p_amount,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      p_source_table,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          p_source_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              p_meta,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  now(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      true,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          md5(random()::text),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              null
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                $function$

-- public.safe_wallet_transaction(p_player_id uuid, p_currency text, p_amount numeric, p_direction text, p_reference_id text, p_source_table text, p_source_id uuid, p_metadata jsonb) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.safe_wallet_transaction(p_player_id uuid, p_currency text, p_amount numeric, p_direction text, p_reference_id text, p_source_table text, p_source_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  DECLARE
    v_before numeric;
    v_after numeric;
  BEGIN

    IF p_amount <= 0 THEN
      RAISE EXCEPTION 'INVALID_AMOUNT';
    END IF;

    SELECT
      CASE
        WHEN p_currency = 'vex_ingame' THEN vex_ingame
        WHEN p_currency = 'vex_tradeable' THEN vex_tradeable
      END
    INTO v_before
    FROM player_wallet
    WHERE player_id = p_player_id
    FOR UPDATE;

    IF v_before IS NULL THEN
      RAISE EXCEPTION 'WALLET_NOT_FOUND';
    END IF;

    IF p_direction = 'debit' THEN
      v_after := v_before - p_amount;
    ELSE
      v_after := v_before + p_amount;
    END IF;

    IF v_after < 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
    END IF;

    IF p_currency = 'vex_ingame' THEN
      UPDATE player_wallet SET vex_ingame = v_after, updated_at = now() WHERE player_id = p_player_id;
    ELSIF p_currency = 'vex_tradeable' THEN
      UPDATE player_wallet SET vex_tradeable = v_after, updated_at = now() WHERE player_id = p_player_id;
    END IF;

    INSERT INTO economy_ledger(
      player_id,
      entry_type,
      currency,
      amount,
      balance_before,
      balance_after,
      reference_id,
      source_table,
      source_id,
      metadata,
      created_at
    )
    VALUES (
      p_player_id,
      p_direction::ledger_entry_type,
      p_currency,
      p_amount,
      v_before,
      v_after,
      p_reference_id,
      p_source_table,
      p_source_id,
      p_metadata,
      now()
    );

    RETURN jsonb_build_object(
      'status', 'ok',
      'before', v_before,
      'after', v_after,
      'currency', p_currency
    );

  END;
  $function$

-- public.save_deck(p_card_ids uuid[]) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.save_deck(p_card_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id UUID;
  v_card_id UUID;
  v_slot INT := 1;
  v_card_count INT := COALESCE(array_length(p_card_ids, 1), 0);
  v_mythic INT := 0;
  v_legendary INT := 0;
  v_rarity TEXT;
  v_faction TEXT;
  v_factions TEXT[] := '{}';
  v_card_counts JSONB := '{}'::jsonb;
  v_card_count_val INT;
BEGIN
  SELECT id
  INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  IF v_card_count < 5 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Deck must have at least 5 cards');
  END IF;
  IF v_card_count > 30 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Deck cannot exceed 30 cards');
  END IF;

  IF p_card_ids IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Deck cannot be null');
  END IF;

  FOREACH v_card_id IN ARRAY p_card_ids LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.player_cards
      WHERE player_id = v_player_id
        AND card_id = v_card_id
        AND quantity > 0
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Card not owned', 'card_id', v_card_id);
    END IF;

    SELECT rarity::text, faction::text
    INTO v_rarity, v_faction
    FROM public.cards
    WHERE id = v_card_id;

    v_card_count_val := COALESCE((v_card_counts ->> v_card_id::text)::INT, 0) + 1;
    v_card_counts := jsonb_set(
      v_card_counts,
      ARRAY[v_card_id::text],
      to_jsonb(v_card_count_val)
    );

    IF v_rarity = 'Mythic' THEN
      v_mythic := v_mythic + 1;
    END IF;
    IF v_rarity = 'Legendary' THEN
      v_legendary := v_legendary + 1;
    END IF;

    IF v_rarity IN ('Legendary', 'Mythic') AND v_card_count_val > 1 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Max 1 copy of Legendary/Mythic cards');
    END IF;
    IF v_card_count_val > 2 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Max 2 copies of any card per deck');
    END IF;

    IF v_faction IS NOT NULL AND NOT (v_faction = ANY(v_factions)) THEN
      v_factions := array_append(v_factions, v_faction);
    END IF;
  END LOOP;

  IF v_mythic > 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Max 1 Mythic per deck');
  END IF;
  IF v_legendary > 3 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Max 3 Legendary per deck');
  END IF;
  IF cardinality(v_factions) > 2 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Max 2 factions per deck');
  END IF;

  DELETE FROM public.player_deck
  WHERE player_id = v_player_id;

  FOREACH v_card_id IN ARRAY p_card_ids LOOP
    INSERT INTO public.player_deck (player_id, slot_number, card_id)
    VALUES (v_player_id, v_slot, v_card_id);
    v_slot := v_slot + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'slots_saved', v_card_count,
    'factions', v_factions,
    'mythic_count', v_mythic,
    'legendary_count', v_legendary
  );
END;
$function$

-- public.scale_reward(p_base numeric, p_level integer) | SECURITY INVOKER | RETURNS numeric
CREATE OR REPLACE FUNCTION public.scale_reward(p_base numeric, p_level integer)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin

    -- anti-farm dampening curve
    return p_base * (1 + (p_level * 0.03));

end;
$function$

-- public.settle_market_trade_quarantine_novalidation_direct(p_buyer uuid, p_seller uuid, p_price numeric, p_listing_id uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.settle_market_trade_quarantine_novalidation_direct(p_buyer uuid, p_seller uuid, p_price numeric, p_listing_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_fee numeric := p_price * 0.08;
    v_net numeric := p_price - v_fee;
BEGIN

    -- buyer
    INSERT INTO economy_ledger (
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    VALUES (
        p_buyer,
        'debit',
        'vex_tradeable',
        p_price,
        'market',
        p_listing_id,
        jsonb_build_object('event','market_buy'),
        NOW(),
        true
    );

    -- seller
    INSERT INTO economy_ledger (
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    VALUES (
        p_seller,
        'credit',
        'vex_tradeable',
        v_net,
        'market',
        p_listing_id,
        jsonb_build_object('event','market_sell'),
        NOW(),
        true
    );

    -- fee sink
    INSERT INTO economy_ledger (
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    VALUES (
        NULL,
        'fee',
        'vex_tradeable',
        v_fee,
        'market_fee',
        p_listing_id,
        jsonb_build_object('event','market_fee'),
        NOW(),
        true
    );

END;
$function$

-- public.snapshot_reality(p_branch uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.snapshot_reality(p_branch uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  wallet_total numeric;
  market_total int;
  pvp_total int;
BEGIN

  SELECT SUM(vex_ingame + vex_tradeable)
  INTO wallet_total
  FROM player_wallet;

  SELECT COUNT(*) INTO market_total FROM market_listings;

  SELECT COUNT(*) INTO pvp_total FROM pvp_matches;

  INSERT INTO reality_snapshots(
    branch_id,
    total_wallet,
    total_market_volume,
    total_pvp_matches,
    inflation_rate,
    stability
  )
  VALUES (
    p_branch,
    wallet_total,
    market_total,
    pvp_total,
    random() * 10,
    100 - random() * 30
  );

END;
$function$

-- public.social_mark_private_read(p_conversation_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.social_mark_private_read(p_conversation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_player uuid := private.social_current_player_id();
begin
    if v_player is null then return jsonb_build_object('ok', false, 'reason', 'AUTH_REQUIRED'); end if;
    if not exists (select 1 from public.social_private_conversations c where c.id = p_conversation_id and (c.player_low_id = v_player or c.player_high_id = v_player)) then
        return jsonb_build_object('ok', false, 'reason', 'CONVERSATION_FORBIDDEN');
    end if;
    if exists (
        select 1 from public.social_private_conversations c
        where c.id = p_conversation_id
          and private.social_is_blocked(v_player, case when c.player_low_id = v_player then c.player_high_id else c.player_low_id end)
    ) then
        return jsonb_build_object('ok', false, 'reason', 'BLOCKED');
    end if;
    insert into public.social_private_reads(conversation_id, player_id, last_read_at)
    values (p_conversation_id, v_player, now())
    on conflict (conversation_id, player_id) do update set last_read_at = excluded.last_read_at;
    return jsonb_build_object('ok', true);
end;
$function$

-- public.spawn_economy_processes() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.spawn_economy_processes()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  load numeric;
BEGIN

  load := calculate_economy_load();

  INSERT INTO economy_kernel_state(load_score, last_tick)
  VALUES (load, now())
  ON CONFLICT (id)
  DO UPDATE SET load_score = EXCLUDED.load_score,
                last_tick = now();


  /* =====================================================
     THROTTLE AUTOMÁTICO
     ===================================================== */

  IF load > 1000 THEN

    UPDATE economy_processes
    SET status = 'throttled'
    WHERE cpu_cost > 5;

  END IF;


  /* =====================================================
     SUSPENSIÓN DE EMERGENCIA
     ===================================================== */

  IF load > 2000 THEN

    UPDATE economy_processes
    SET status = 'suspended'
    WHERE risk_score > 60;

  END IF;


END;
$function$

-- public.start_battle_run(p_mode text, p_target_id uuid, p_formation_snapshot jsonb, p_seed bigint, p_idempotency_key text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.start_battle_run(p_mode text, p_target_id uuid, p_formation_snapshot jsonb, p_seed bigint DEFAULT NULL::bigint, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_existing public.battle_runs%ROWTYPE;
  v_battle_id uuid;
  v_mode text := lower(trim(COALESCE(p_mode, '')));
  v_snapshot jsonb := COALESCE(p_formation_snapshot, '{}'::jsonb);
  v_seed bigint := COALESCE(p_seed, floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint);
  v_key text := NULLIF(trim(p_idempotency_key), '');
  v_card_id text;
BEGIN
  SELECT id INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  PERFORM public.assert_caller_is_player(v_player_id);

  IF v_mode NOT IN ('boss', 'raid') OR p_target_id IS NULL OR v_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_battle_run_request');
  END IF;

  IF jsonb_typeof(v_snapshot) <> 'object'
     OR jsonb_typeof(v_snapshot->'champion_id') <> 'string'
     OR jsonb_typeof(v_snapshot->'card_ids') <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_formation_snapshot');
  END IF;

  SELECT * INTO v_existing
  FROM public.battle_runs
  WHERE idempotency_key = v_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.player_id <> v_player_id
       OR v_existing.mode <> v_mode THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'idempotency_key_conflict');
    END IF;
    RETURN jsonb_build_object(
      'ok', true,
      'battle_run_id', v_existing.id,
      'status', v_existing.status,
      'idempotent', true,
      'seed', v_existing.seed
    );
  END IF;

  FOR v_card_id IN
    SELECT value FROM jsonb_array_elements_text(v_snapshot->'card_ids')
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.player_cards
      WHERE player_id = v_player_id
        AND card_id = v_card_id::uuid
        AND quantity > 0
    ) THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason', 'formation_card_not_owned',
        'card_id', v_card_id
      );
    END IF;
  END LOOP;

  IF v_mode = 'boss' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.world_bosses
      WHERE id = p_target_id AND active = true
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'world_boss_not_active');
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM public.raid_runs r
      JOIN public.raid_participants p ON p.raid_run_id = r.id
      WHERE r.id = p_target_id
        AND r.status IN ('pending', 'active')
        AND p.player_id = v_player_id
        AND p.status = 'joined'
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'raid_participation_required');
    END IF;
  END IF;

  INSERT INTO public.battle_runs (
    player_id,
    mission_run_id,
    mission_id,
    world_boss_id,
    raid_run_id,
    idempotency_key,
    mode,
    rules_version,
    seed,
    status,
    formation_snapshot,
    started_at
  )
  VALUES (
    v_player_id,
    NULL,
    NULL,
    CASE WHEN v_mode = 'boss' THEN p_target_id ELSE NULL END,
    CASE WHEN v_mode = 'raid' THEN p_target_id ELSE NULL END,
    v_key,
    v_mode,
    'forge_formation_t5',
    v_seed,
    'started',
    v_snapshot,
    now()
  )
  RETURNING id INTO v_battle_id;

  RETURN jsonb_build_object(
    'ok', true,
    'battle_run_id', v_battle_id,
    'status', 'started',
    'idempotent', false,
    'seed', v_seed
  );
EXCEPTION
  WHEN invalid_text_representation OR foreign_key_violation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_formation_snapshot');
  WHEN unique_violation THEN
    SELECT * INTO v_existing
    FROM public.battle_runs
    WHERE idempotency_key = v_key;
    RETURN jsonb_build_object(
      'ok', true,
      'battle_run_id', v_existing.id,
      'status', v_existing.status,
      'idempotent', true,
      'seed', v_existing.seed
    );
END;
$function$

-- public.start_mission_battle_run(p_mission_run_id uuid, p_formation_snapshot jsonb, p_seed bigint) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.start_mission_battle_run(p_mission_run_id uuid, p_formation_snapshot jsonb, p_seed bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_mission_run public.mission_runs%ROWTYPE;
  v_battle public.battle_runs%ROWTYPE;
  v_battle_id uuid;
  v_snapshot jsonb := COALESCE(p_formation_snapshot, '{}'::jsonb);
  v_seed bigint := COALESCE(p_seed, floor(extract(epoch FROM clock_timestamp()))::bigint);
  v_card_id text;
BEGIN
  SELECT id INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  PERFORM public.assert_caller_is_player(v_player_id);

  SELECT *
  INTO v_mission_run
  FROM public.mission_runs
  WHERE id = p_mission_run_id
    AND player_id = v_player_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'mission_run_not_found');
  END IF;

  SELECT *
  INTO v_battle
  FROM public.battle_runs
  WHERE mission_run_id = p_mission_run_id
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'battle_run_id', v_battle.id,
      'mission_run_id', v_battle.mission_run_id,
      'status', v_battle.status,
      'idempotent', true,
      'seed', v_battle.seed
    );
  END IF;

  IF v_mission_run.status::text <> 'pending' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'mission_run_not_startable',
      'status', v_mission_run.status::text
    );
  END IF;

  IF jsonb_typeof(v_snapshot) <> 'object'
     OR jsonb_typeof(v_snapshot->'champion_id') <> 'string'
     OR jsonb_typeof(v_snapshot->'card_ids') <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_formation_snapshot');
  END IF;

  FOR v_card_id IN
    SELECT value
    FROM jsonb_array_elements_text(v_snapshot->'card_ids')
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.player_cards
      WHERE player_id = v_player_id
        AND card_id = v_card_id::uuid
        AND quantity > 0
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'formation_card_not_owned', 'card_id', v_card_id);
    END IF;
  END LOOP;

  INSERT INTO public.battle_runs (
    player_id,
    mission_run_id,
    mission_id,
    idempotency_key,
    mode,
    rules_version,
    seed,
    status,
    formation_snapshot,
    started_at
  )
  VALUES (
    v_player_id,
    v_mission_run.id,
    v_mission_run.mission_id,
    'mission-battle:' || v_mission_run.id::text,
    'mission',
    'forge_formation_t2',
    v_seed,
    'started',
    v_snapshot,
    now()
  )
  RETURNING id INTO v_battle_id;

  UPDATE public.mission_runs
  SET metadata = COALESCE(metadata, '{}'::jsonb)
    || jsonb_build_object('battle_run_id', v_battle_id, 'rules_version', 'forge_formation_t2'),
      updated_at = now()
  WHERE id = v_mission_run.id;

  RETURN jsonb_build_object(
    'ok', true,
    'battle_run_id', v_battle_id,
    'mission_run_id', v_mission_run.id,
    'status', 'started',
    'idempotent', false,
    'seed', v_seed
  );
EXCEPTION
  WHEN invalid_text_representation OR foreign_key_violation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_formation_snapshot');
END;
$function$

-- public.start_pvp_match(p_a uuid, p_b uuid) | SECURITY INVOKER | RETURNS uuid
CREATE OR REPLACE FUNCTION public.start_pvp_match(p_a uuid, p_b uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    match_id uuid;
    score_a int;
    score_b int;
begin

    insert into pvp_matches(player_a, player_b, status)
    values (p_a, p_b, 'resolved')
    returning id into match_id;

    select sum(power) into score_a from player_cards where player_id = p_a;
    select sum(power) into score_b from player_cards where player_id = p_b;

    if score_a >= score_b then
        update pvp_matches set winner = p_a where id = match_id;
    else
        update pvp_matches set winner = p_b where id = match_id;
    end if;

    return match_id;

end;
$function$

-- public.sync_wallet_from_ledger(p_player_id uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.sync_wallet_from_ledger(p_player_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_in numeric;
  v_trade numeric;
BEGIN

  SELECT
    COALESCE(SUM(CASE WHEN currency = 'vex_ingame' THEN amount ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN currency = 'vex_tradeable' THEN amount ELSE 0 END),0)
  INTO v_in, v_trade
  FROM economy_ledger
  WHERE player_id = p_player_id;

  UPDATE player_wallet
  SET
    vex_ingame = v_in,
    vex_tradeable = v_trade,
    updated_at = now(),
    last_synced_from_ledger = now()
  WHERE player_id = p_player_id;

END;
$function$

-- public.tg_add_vex(p_telegram_id bigint, p_amount numeric, p_source text, p_reference_id text, p_metadata jsonb) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.tg_add_vex(p_telegram_id bigint, p_amount numeric, p_source text DEFAULT 'system'::text, p_reference_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into tg_transactions (
    telegram_id, tx_type, currency, amount, source, reference_id, metadata
  )
  values (
    p_telegram_id, 'reward', 'vex', p_amount, p_source, p_reference_id, p_metadata
  );

  update tg_wallet
  set vex_balance = vex_balance + p_amount,
      updated_at = now()
  where telegram_id = p_telegram_id;
end;
$function$

-- public.tg_create_player_wallet() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.tg_create_player_wallet()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into tg_wallet (telegram_id, vex_balance, gold_balance, energy_current, energy_max, updated_at)
  values (new.telegram_id, 0, 0, 100, 100, now())
  on conflict (telegram_id) do nothing;

  insert into tg_settings (telegram_id)
  values (new.telegram_id)
  on conflict (telegram_id) do nothing;

  return new;
end;
$function$

-- public.tg_execute_kernel_action(p_player_id uuid, p_context text, p_action_type text, p_component_key text, p_payload jsonb) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.tg_execute_kernel_action(p_player_id uuid, p_context text, p_action_type text, p_component_key text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$

declare
    v_router record;
    v_rules jsonb;
    v_economy record;
    v_reward numeric := 0;
    v_xp numeric := 0;
    v_result jsonb;
begin

    -- =====================
    -- ROUTER CHECK
    -- =====================
    select * into v_router
    from tg_system_router
    where context_key = p_context
    and action_type = p_action_type
    and component_key = p_component_key
    and enabled = true
    limit 1;

    if v_router is null then
        return jsonb_build_object('status','blocked','reason','router_reject');
    end if;

    -- =====================
    -- ECONOMY STATE LOAD
    -- =====================
    select * into v_economy
    from tg_economy_state_machine
    where context_key = p_context
    limit 1;

    -- =====================
    -- RULES LOAD
    -- =====================
    select jsonb_agg(rule_value) into v_rules
    from tg_runtime_rules
    where active = true;

    -- =====================
    -- SIMPLE REWARD CALC (CORE FORMULA HOOK)
    -- =====================
    v_reward := coalesce((p_payload->>'base_reward')::numeric, 0)
                * coalesce(v_economy.inflation_rate, 1);

    v_xp := coalesce((p_payload->>'base_xp')::numeric, 0);

    -- =====================
    -- UPDATE WALLET (SIMPLE MODEL)
    -- =====================
    update player_wallet
    set vex_ingame = vex_ingame + v_reward
    where player_id = p_player_id;

    -- =====================
    -- LEDGER WRITE (IMMUTABLE)
    -- =====================
    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        is_final
    )
    values (
        gen_random_uuid()::text,
        p_player_id,
        'reward',
        'vex_ingame',
        v_reward,
        0,
        v_reward,
        p_component_key,
        p_action_type,
        p_payload,
        true
    );

    -- =====================
    -- EVENT LOG
    -- =====================
    insert into events (name, type, start_time)
    values (
        p_action_type,
        p_component_key,
        now()
    );

    -- =====================
    -- RESPONSE
    -- =====================
    v_result := jsonb_build_object(
        'status','success',
        'reward',v_reward,
        'xp',v_xp
    );

    return v_result;

end;

$function$

-- public.tg_mission_reward_bridge(p_player_id uuid, p_amount numeric, p_source_id text) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.tg_mission_reward_bridge(p_player_id uuid, p_amount numeric, p_source_id text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
      begin

        insert into economy_ledger (
            reference_id,
                player_id,
                    entry_type,
                        currency,
                            amount,
                                balance_before,
                                    balance_after,
                                        source_table,
                                            source_id,
                                                metadata,
                                                    created_at,
                                                        is_final,
                                                            row_hash,
                                                                prev_hash
                                                                  )
                                                                    values (
                                                                        gen_random_uuid()::text,
                                                                            p_player_id,
                                                                                'credit',
                                                                                    'VEX-IN',
                                                                                        p_amount,
                                                                                            0,
                                                                                                p_amount,
                                                                                                    'tg_missions',
                                                                                                        p_source_id,
                                                                                                            jsonb_build_object('bridge','tg_mission_reward'),
                                                                                                                now(),
                                                                                                                    true,
                                                                                                                        md5(random()::text),
                                                                                                                            null
                                                                                                                              );

                                                                                                                              end;
                                                                                                                              $function$

-- public.tg_update_leaderboard_snapshot() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.tg_update_leaderboard_snapshot()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  delete from tg_leaderboards
  where snapshot_at < now() - interval '7 days';
end;
$function$

-- public.tg_wallet_debit_bridge(p_player_id uuid, p_amount numeric, p_source_id text) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.tg_wallet_debit_bridge(p_player_id uuid, p_amount numeric, p_source_id text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                                                                    begin

                                                                                                                                      insert into economy_ledger (
                                                                                                                                          reference_id,
                                                                                                                                              player_id,
                                                                                                                                                  entry_type,
                                                                                                                                                      currency,
                                                                                                                                                          amount,
                                                                                                                                                              balance_before,
                                                                                                                                                                  balance_after,
                                                                                                                                                                      source_table,
                                                                                                                                                                          source_id,
                                                                                                                                                                              metadata,
                                                                                                                                                                                  created_at,
                                                                                                                                                                                      is_final,
                                                                                                                                                                                          row_hash,
                                                                                                                                                                                              prev_hash
                                                                                                                                                                                                )
                                                                                                                                                                                                  values (
                                                                                                                                                                                                      gen_random_uuid()::text,
                                                                                                                                                                                                          p_player_id,
                                                                                                                                                                                                              'debit',
                                                                                                                                                                                                                  'VEX-IN',
                                                                                                                                                                                                                      p_amount,
                                                                                                                                                                                                                          0,
                                                                                                                                                                                                                              0,
                                                                                                                                                                                                                                  'tg_wallet',
                                                                                                                                                                                                                                      p_source_id,
                                                                                                                                                                                                                                          jsonb_build_object('bridge','tg_wallet_debit'),
                                                                                                                                                                                                                                              now(),
                                                                                                                                                                                                                                                  true,
                                                                                                                                                                                                                                                      md5(random()::text),
                                                                                                                                                                                                                                                          null
                                                                                                                                                                                                                                                            );

                                                                                                                                                                                                                                                            end;
                                                                                                                                                                                                                                                            $function$

-- public.trg_fn_achievements_on_market() | SECURITY DEFINER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.trg_fn_achievements_on_market()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status::text IN ('sold','completed') AND (OLD IS NULL OR OLD.status::text NOT IN ('sold','completed')) THEN
    PERFORM fn_check_and_grant_achievements(NEW.player_id);
  END IF;
  RETURN NEW;
END;
$function$

-- public.trg_fn_achievements_on_packs() | SECURITY DEFINER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.trg_fn_achievements_on_packs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status IN ('completed','delivered','fulfilled') AND (OLD IS NULL OR OLD.status NOT IN ('completed','delivered','fulfilled')) THEN
    PERFORM fn_check_and_grant_achievements(NEW.player_id);
  END IF;
  RETURN NEW;
END;
$function$

-- public.trigger_economy_guardian() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.trigger_economy_guardian()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM economy_autoresolve();

  RETURN NULL;
END;
$function$

-- public.trigger_economy_rebalance() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.trigger_economy_rebalance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM economy_rebalance_tick();

  RETURN NULL;
END;
$function$

-- public.update_economy_global() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.update_economy_global()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  total_in numeric;
  total_trade numeric;
  infl numeric;
BEGIN

  SELECT
    COALESCE(SUM(vex_ingame),0),
    COALESCE(SUM(vex_tradeable),0)
  INTO total_in, total_trade
  FROM player_wallet;

  infl := total_trade / NULLIF(total_in + 1, 0);

  INSERT INTO economy_global_metrics(
    total_vex_in,
    total_vex_trade,
    inflation_rate,
    computed_at
  )
  VALUES (
    total_in,
    total_trade,
    infl,
    now()
  );

END;
$function$

-- public.update_market_stability() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.update_market_stability()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trade numeric;
  v_volatility numeric;
BEGIN

  SELECT total_vex_trade
  INTO v_trade
  FROM economy_global_metrics
  ORDER BY computed_at DESC
  LIMIT 1;

  v_volatility := v_trade / 1000000.0;

  UPDATE market_dynamic_state
  SET
    volatility_index = v_volatility,
    global_floor_multiplier = GREATEST(0.5, 1.0 - v_volatility),
    dump_pressure = v_volatility * 0.8,
    last_updated = now()
  WHERE id IS NOT NULL;

END;
$function$

-- public.update_reward_scaling() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.update_reward_scaling()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_inflation numeric;
  v_k numeric;
BEGIN

  SELECT inflation_rate
  INTO v_inflation
  FROM economy_global_metrics
  ORDER BY computed_at DESC
  LIMIT 1;

  IF v_inflation IS NULL THEN
    v_inflation := 0;
  END IF;

  -- =========================
  -- CORE FORMULA (TU CANON)
  -- k_new = k_old * (1 - αI + βE - γW)
  -- =========================

  SELECT inflation_dampener
  INTO v_k
  FROM meta_system_state
  LIMIT 1;

  IF v_k IS NULL THEN
    v_k := 1.0;
  END IF;

  v_k := v_k * (1 - (0.4 * v_inflation));

  UPDATE meta_system_state
  SET
    inflation_dampener = GREATEST(0.2, LEAST(2.0, v_k)),
    updated_at = now()
  WHERE id IS NOT NULL;

END;
$function$

-- public.use_card(p_player_id uuid, p_card_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.use_card(p_player_id uuid, p_card_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    result jsonb;
BEGIN
    -- lógica mínima segura base
    UPDATE player_cards
    SET updated_at = now()
    WHERE player_id = p_player_id
      AND card_id = p_card_id;

    INSERT INTO event_log(player_id, event_type, source_table, created_at)
    VALUES (p_player_id, 'card_used', 'player_cards', now());

    result := jsonb_build_object(
        'status', 'ok',
        'player_id', p_player_id,
        'card_id', p_card_id
    );

    RETURN result;
END;
$function$

-- public.validate_deck(p_card_ids uuid[]) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.validate_deck(p_card_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id UUID;
  v_card_id UUID;
  v_card_count INT := COALESCE(array_length(p_card_ids, 1), 0);
  v_mythic INT := 0;
  v_legendary INT := 0;
  v_rarity TEXT;
  v_faction TEXT;
  v_factions TEXT[] := '{}';
  v_card_counts JSONB := '{}'::jsonb;
  v_card_count_val INT;
  v_errors TEXT[] := '{}';
BEGIN
  SELECT id
  INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', ARRAY['Not authenticated'],
      'card_count', v_card_count,
      'mythic_count', 0,
      'legendary_count', 0
    );
  END IF;

  IF v_card_count < 5 THEN
    v_errors := v_errors || 'Min 5 cards required';
  ELSIF v_card_count > 30 THEN
    v_errors := v_errors || 'Max 30 cards allowed';
  END IF;

  IF p_card_ids IS NOT NULL THEN
    FOREACH v_card_id IN ARRAY p_card_ids LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM public.player_cards
        WHERE player_id = v_player_id
          AND card_id = v_card_id
          AND quantity > 0
      ) THEN
        v_errors := v_errors || ('Not owned: ' || v_card_id::text);
        CONTINUE;
      END IF;

      SELECT rarity::text, faction::text
      INTO v_rarity, v_faction
      FROM public.cards
      WHERE id = v_card_id;

      v_card_count_val := COALESCE((v_card_counts ->> v_card_id::text)::INT, 0) + 1;
      v_card_counts := jsonb_set(
        v_card_counts,
        ARRAY[v_card_id::text],
        to_jsonb(v_card_count_val)
      );

      IF v_rarity = 'Mythic' THEN
        v_mythic := v_mythic + 1;
      END IF;
      IF v_rarity = 'Legendary' THEN
        v_legendary := v_legendary + 1;
      END IF;

      IF v_rarity IN ('Legendary', 'Mythic') AND v_card_count_val > 1 THEN
        v_errors := v_errors || 'Max 1 copy of Legendary/Mythic cards';
      ELSIF v_card_count_val > 2 THEN
        v_errors := v_errors || 'Max 2 copies of any card per deck';
      END IF;

      IF v_faction IS NOT NULL AND NOT (v_faction = ANY(v_factions)) THEN
        v_factions := array_append(v_factions, v_faction);
      END IF;
    END LOOP;
  END IF;

  IF v_mythic > 1 THEN
    v_errors := v_errors || 'Max 1 Mythic per deck';
  END IF;
  IF v_legendary > 3 THEN
    v_errors := v_errors || 'Max 3 Legendary per deck';
  END IF;
  IF cardinality(v_factions) > 2 THEN
    v_errors := v_errors || 'Max 2 factions per deck';
  END IF;

  RETURN jsonb_build_object(
    'valid', cardinality(v_errors) = 0,
    'errors', v_errors,
    'card_count', v_card_count,
    'mythic_count', v_mythic,
    'legendary_count', v_legendary
  );
END;
$function$

-- public.validate_economy_health() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.validate_economy_health()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    total_in numeric;
    total_trade numeric;
begin

    select sum(vex_ingame), sum(vex_tradeable)
    into total_in, total_trade
    from player_wallet;

    if total_trade > total_in * 3 then
        raise warning 'economy imbalance detected';
    end if;

end;
$function$

-- public.validate_market_listing() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.validate_market_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

    -- basic anomaly detection
    IF NEW.price <= 0 THEN
        NEW.blocked := true;
        NEW.reason := 'invalid_price';
        NEW.anomaly_score := 1;
    END IF;

    IF NEW.price > 1000000 THEN
        NEW.blocked := true;
        NEW.reason := 'price_outlier';
        NEW.anomaly_score := 0.95;
    END IF;

    RETURN NEW;
END;
$function$

-- public.verify_ledger_integrity(p_player_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.verify_ledger_integrity(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  r RECORD;
  expected_hash text;
  last_hash text := NULL;
  tampered_count int := 0;
BEGIN

  FOR r IN
    SELECT *
    FROM economy_ledger
    WHERE player_id = p_player_id
    ORDER BY created_at ASC
  LOOP

    expected_hash := compute_ledger_hash(
      r.player_id,
      r.currency,
      r.amount,
      r.reference_id,
      last_hash
    );

    IF r.row_hash IS DISTINCT FROM expected_hash THEN
      tampered_count := tampered_count + 1;
    END IF;

    last_hash := r.row_hash;

  END LOOP;

  RETURN jsonb_build_object(
    'player_id', p_player_id,
    'tampered_entries', tampered_count,
    'status', CASE WHEN tampered_count = 0 THEN 'clean' ELSE 'corrupted' END
  );

END;
$function$

-- public.vexf_buy_listing_quarantine_deadcode_missingtables(p_listing_id uuid, p_buyer_id uuid, p_metadata jsonb) | SECURITY INVOKER | RETURNS boolean
CREATE OR REPLACE FUNCTION public.vexf_buy_listing_quarantine_deadcode_missingtables(p_listing_id uuid, p_buyer_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_price numeric;
  v_seller uuid;
  v_card_code text;
  v_status text;
  v_fee numeric;
begin
  select price, seller_player_id, card_code, status, fee
    into v_price, v_seller, v_card_code, v_status, v_fee
  from public.vexf_market_listings
  where id = p_listing_id
  for update;

  if v_status is distinct from 'active' then
    return false;
  end if;

  if v_seller = p_buyer_id then
    return false;
  end if;

  if not public.vexf_debit_vex(p_buyer_id, v_price, 'vex_ingame', 'market_buy', p_listing_id::text, p_metadata) then
    return false;
  end if;

  perform public.vexf_credit_vex(
    v_seller,
    greatest(v_price - coalesce(v_fee, 0), 0),
    'vex_ingame',
    'market_sale',
    p_listing_id::text,
    p_metadata
  );

  update public.vexf_market_listings
     set status = 'sold',
         buyer_player_id = p_buyer_id,
         sold_at = now()
   where id = p_listing_id;

  insert into public.vexf_ledger (
    player_id, entry_type, currency, amount, reference_type, reference_id, metadata
  )
  values (
    p_buyer_id, 'debit', 'vex_ingame', v_price, 'market_buy', p_listing_id::text, p_metadata
  );

  return true;
end;
$function$

-- public.vexforge_adjust_trade_balance_quarantine_parallel_econstate(p_player_id uuid, p_delta numeric) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_adjust_trade_balance_quarantine_parallel_econstate(p_player_id uuid, p_delta numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_before numeric;
    v_after numeric;
begin
    select coalesce(trade_balance, 0)
    into v_before
    from player_economy_state
    where player_id = p_player_id
    for update;

    if not found then
        v_before := 0;
        v_after := p_delta;

        insert into player_economy_state (
            player_id,
            vex_balance,
            trade_balance,
            energy,
            last_activity,
            decision_energy,
            participation_score,
            updated_at
        )
        values (
            p_player_id,
            0,
            p_delta,
            100,
            now(),
            0,
            0,
            now()
        );
    else
        v_after := v_before + p_delta;

        update player_economy_state
        set trade_balance = v_after,
            updated_at = now()
        where player_id = p_player_id;
    end if;

    return jsonb_build_object(
        'player_id', p_player_id,
        'before', v_before,
        'after', v_after,
        'delta', p_delta
    );
end;
$function$

-- public.vexforge_admin_get_deposits(p_status text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_admin_get_deposits(p_status text DEFAULT 'pending'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_result jsonb;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('error','unauthorized'); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',d.id,'player_id',d.player_id,'player_username',pl.display_name,'amount_usdt',d.amount_usdt,'chain',d.chain,'token_symbol',d.token_symbol,'tx_hash',d.tx_hash,'payer_wallet_address',d.payer_wallet_address,'vex_credited',coalesce(d.vex_credited,floor(d.amount_usdt*100)),'status',d.status,'notes',d.notes,'created_at',d.created_at) ORDER BY d.created_at DESC),'[]'::jsonb) INTO v_result FROM vexforge_project_deposits d LEFT JOIN players pl ON pl.id=d.player_id WHERE p_status='all' OR d.status=p_status;
 RETURN v_result;
END;$function$

-- public.vexforge_admin_get_ledger(p_limit integer, p_offset integer) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_admin_get_ledger(p_limit integer DEFAULT 60, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_result jsonb; v_total int;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('ok',false,'reason','not_authorized'); END IF;
 SELECT count(*)::int INTO v_total FROM economy_ledger;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',e.id,'reference_id',e.reference_id,'player_id',e.player_id,'entry_type',e.entry_type,'currency',e.currency,'amount',e.amount,'source_table',e.source_table,'source_id',e.source_id,'metadata',e.metadata,'created_at',e.created_at) ORDER BY e.created_at DESC),'[]'::jsonb) INTO v_result FROM (SELECT * FROM economy_ledger ORDER BY created_at DESC LIMIT greatest(p_limit,0) OFFSET greatest(p_offset,0)) e;
 RETURN jsonb_build_object('ok',true,'entries',v_result,'total',v_total);
END;$function$

-- public.vexforge_admin_get_overview() | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_admin_get_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('ok',false,'reason','not_authorized'); END IF;
 RETURN jsonb_build_object('ok',true,'total_players',(SELECT COUNT(*)::int FROM players),'active_players',(SELECT COUNT(*)::int FROM players WHERE status='active'),'total_vex_tradeable',(SELECT COALESCE(SUM(vex_tradeable),0)::bigint FROM player_wallet),'total_vex_ingame',(SELECT COALESCE(SUM(vex_ingame),0)::bigint FROM player_wallet),'total_cards_distributed',(SELECT COALESCE(SUM(quantity),0)::bigint FROM player_cards),'unique_player_card_slots',(SELECT COUNT(*)::int FROM player_cards),'total_packs_opened',(SELECT COUNT(*)::int FROM vexforge_pack_orders WHERE status='fulfilled'),'total_packs_pending',(SELECT COUNT(*)::int FROM vexforge_pack_orders WHERE status='pending'),'deposits_pending',(SELECT COUNT(*)::int FROM vexforge_project_deposits WHERE status='pending'),'deposits_approved',(SELECT COUNT(*)::int FROM vexforge_project_deposits WHERE status='approved'),'deposits_rejected',(SELECT COUNT(*)::int FROM vexforge_project_deposits WHERE status='rejected'),'total_usdt_received',(SELECT COALESCE(SUM(amount_usdt),0)::numeric FROM vexforge_project_deposits WHERE status='approved'),'total_vex_from_deposits',(SELECT COALESCE(SUM(vex_credited),0)::bigint FROM vexforge_project_deposits WHERE status='approved'),'ledger_entries',(SELECT COUNT(*)::int FROM economy_ledger));
END;$function$

-- public.vexforge_admin_get_players() | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_admin_get_players()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_result jsonb;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('ok',false,'reason','not_authorized'); END IF;
 SELECT jsonb_agg(jsonb_build_object('player_id',p.id,'display_name',p.display_name,'email',p.email,'telegram_username',p.telegram_username,'role',p.role,'status',p.status,'is_admin',coalesce(p.is_admin,false),'is_super_admin',coalesce(p.is_super_admin,false),'vex_tradeable',coalesce(w.vex_tradeable,0),'vex_ingame',coalesce(w.vex_ingame,0),'total_cards',coalesce(pc.total_cards,0),'unique_cards',coalesce(pc.unique_cards,0),'created_at',p.created_at) ORDER BY p.created_at DESC) INTO v_result FROM players p LEFT JOIN player_wallet w ON w.player_id=p.id LEFT JOIN (SELECT player_id,SUM(quantity)::int total_cards,COUNT(DISTINCT card_id)::int unique_cards FROM player_cards GROUP BY player_id) pc ON pc.player_id=p.id;
 RETURN jsonb_build_object('ok',true,'players',coalesce(v_result,'[]'::jsonb));
END;$function$

-- public.vexforge_admin_get_shop_orders(p_status text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_admin_get_shop_orders(p_status text DEFAULT 'pending_payment'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_result jsonb;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('error','unauthorized'); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',o.id,'player_id',o.player_id,'player_username',p.display_name,'item_key',o.item_key,'item_name',c.name,'price_usdt',o.price_usdt,'status',o.status,'fulfillment_status',o.fulfillment_status,'client_reference',o.client_reference,'payment_reference',o.payment_reference,'tx_hash',o.tx_hash,'treasury_wallet_address',o.treasury_wallet_address,'payer_wallet_address',o.payer_wallet_address,'metadata',o.metadata,'notes',o.notes,'created_at',o.created_at,'approved_at',o.approved_at,'fulfilled_at',o.fulfilled_at) ORDER BY o.created_at DESC),'[]'::jsonb) INTO v_result FROM vexforge_shop_orders o JOIN vexforge_shop_catalog c ON c.item_key=o.item_key LEFT JOIN players p ON p.id=o.player_id WHERE p_status='all' OR o.status=p_status;
 RETURN v_result;
END;$function$

-- public.vexforge_admin_get_withdrawals(p_status text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_admin_get_withdrawals(p_status text DEFAULT 'pending_review'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_result jsonb;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('error','unauthorized'); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',w.id,'player_id',w.player_id,'tradeable_amount',w.tradeable_amount,'usdt_gross',w.usdt_gross,'fee_usdt',w.fee_usdt,'usdt_net',w.usdt_net,'status',w.status,'reviewed',w.reviewed,'approved_by',w.approved_by,'rejected_reason',w.rejected_reason,'payout_tx_hash',w.payout_tx_hash,'created_at',w.created_at,'processed_at',w.processed_at) ORDER BY w.created_at DESC),'[]'::jsonb) INTO v_result FROM vexforge_withdrawal_requests_official w WHERE p_status='all' OR w.status=p_status;
 RETURN v_result;
END;$function$

-- public.vexforge_apply_fusion(p_player_id uuid, p_source_card_id uuid, p_target_card_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_apply_fusion(p_player_id uuid, p_source_card_id uuid, p_target_card_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    source_card record;
    target_card record;
    player_source record;
    player_state record;
    player_shards record;
    policy record;
begin
    perform public.assert_caller_is_player(p_player_id);

    select * into source_card from cards where id = p_source_card_id limit 1;
    select * into target_card from cards where id = p_target_card_id limit 1;

    if source_card is null or target_card is null then
        return jsonb_build_object('ok', false, 'reason', 'card_not_found');
    end if;

    if coalesce(source_card.fusion_enabled, false) = false or coalesce(target_card.fusion_enabled, false) = false then
        return jsonb_build_object('ok', false, 'reason', 'fusion_disabled_for_card');
    end if;

    select * into policy from public.vexforge_fusion_policy(source_card.rarity::text);

    if policy is null or policy.needed_cards <= 0 or policy.ingame_cost <= 0 then
        return jsonb_build_object('ok', false, 'reason', 'fusion_not_allowed');
    end if;

    if target_card.rarity::text <> policy.target_rarity then
        return jsonb_build_object('ok', false, 'reason', 'invalid_target_rarity');
    end if;

    select * into player_source
    from player_cards
    where player_id = p_player_id and card_id = p_source_card_id and quantity >= policy.needed_cards
    for update;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'insufficient_source_cards');
    end if;

    if coalesce(policy.required_shards, 0) > 0 then
        select * into player_shards
        from public.vexforge_player_shards
        where player_id = p_player_id and shard_rarity = source_card.rarity::text
        for update;

        if not found or player_shards.quantity < policy.required_shards then
            return jsonb_build_object('ok', false, 'reason', 'insufficient_shards');
        end if;
    end if;

    perform vexforge_ensure_player_state(p_player_id);

    select * into player_state from player_economy_state where player_id = p_player_id for update;

    if coalesce(player_state.vex_balance, 0) < policy.ingame_cost then
        return jsonb_build_object('ok', false, 'reason', 'insufficient_vex_balance');
    end if;

    update player_cards set quantity = quantity - policy.needed_cards
    where player_id = p_player_id and card_id = p_source_card_id;

    insert into player_cards (player_id, card_id, quantity)
    values (p_player_id, p_target_card_id, 1)
    on conflict (player_id, card_id) do update set quantity = player_cards.quantity + 1;

    if coalesce(policy.required_shards, 0) > 0 then
        update public.vexforge_player_shards
        set quantity = quantity - policy.required_shards, updated_at = now()
        where player_id = p_player_id and shard_rarity = source_card.rarity::text;
    end if;

    update player_economy_state
    set vex_balance = vex_balance - policy.ingame_cost,
        daily_fusion_burn = daily_fusion_burn + policy.ingame_cost,
        updated_at = now()
    where player_id = p_player_id;

    insert into economy_ledger (
        reference_id, player_id, entry_type, currency, amount,
        balance_before, balance_after, source_table, source_id, metadata, created_at, is_final
    ) values (
        gen_random_uuid()::text, p_player_id, 'fusion', 'vex_ingame', policy.ingame_cost,
        player_state.vex_balance, player_state.vex_balance - policy.ingame_cost,
        'player_cards', p_source_card_id::text,
        jsonb_build_object('source_card', p_source_card_id, 'target_card', p_target_card_id,
                            'needed_cards', policy.needed_cards, 'required_shards', policy.required_shards,
                            'source_rarity', source_card.rarity, 'target_rarity', target_card.rarity),
        now(), true
    );

    insert into public.vexforge_card_fusion_log (
        player_id, source_card_id, target_card_id, source_rarity, target_rarity,
        source_cards_burned, shards_burned, vex_ingame_spent, source_card_name, target_card_name, created_at
    )
    values (
        p_player_id, p_source_card_id, p_target_card_id, source_card.rarity::text, target_card.rarity::text,
        policy.needed_cards, coalesce(policy.required_shards,0), policy.ingame_cost,
        source_card.name, target_card.name, now()
    );

    return jsonb_build_object('ok', true, 'source_rarity', source_card.rarity,
                               'target_rarity', target_card.rarity,
                               'needed_cards', policy.needed_cards,
                               'required_shards', policy.required_shards,
                               'ingame_cost', policy.ingame_cost);
end;
$function$

-- public.vexforge_apply_market_trade_quarantine_parallelmodel_p2p(p_seller_id uuid, p_buyer_id uuid, p_card_id uuid, p_quantity integer, p_price numeric, p_buyer_archetype text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_apply_market_trade_quarantine_parallelmodel_p2p(p_seller_id uuid, p_buyer_id uuid, p_card_id uuid, p_quantity integer, p_price numeric, p_buyer_archetype text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    seller_state record;
    buyer_state record;
    seller_card record;
    band_ok boolean;
    fee_pct numeric;
    fee_amount numeric;
    seller_net numeric;
    v_min_balance numeric;
    v_daily_cap numeric;
    v_entry_balance numeric;
    v_exit_balance numeric;
begin
    if p_quantity <= 0 then
        return jsonb_build_object('ok', false, 'reason', 'invalid_quantity');
    end if;

    select *
    into seller_card
    from player_cards
    where player_id = p_seller_id
      and card_id = p_card_id
      and quantity >= p_quantity
    for update;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'seller_insufficient_cards');
    end if;

    band_ok := vexforge_market_price_allowed(
        coalesce((select rarity from vexforge_official_cards_bridge where card_key = p_card_id::text limit 1), 'Common'),
        p_buyer_archetype,
        p_price
    );

    if not band_ok then
        return jsonb_build_object('ok', false, 'reason', 'price_out_of_band');
    end if;

    select *
    into buyer_state
    from player_economy_state
    where player_id = p_buyer_id
    for update;

    select *
    into seller_state
    from player_economy_state
    where player_id = p_seller_id
    for update;

    v_min_balance := coalesce((select max_single_purchase from vexforge_archetype_market_policy where archetype = p_buyer_archetype), 0);
    v_daily_cap := coalesce((select max_daily_market_volume from vexforge_archetype_market_policy where archetype = p_buyer_archetype), 0);

    if coalesce(buyer_state.trade_balance, 0) < p_price then
        return jsonb_build_object('ok', false, 'reason', 'buyer_insufficient_balance');
    end if;

    if coalesce(buyer_state.daily_market_volume, 0) + p_price > v_daily_cap then
        return jsonb_build_object('ok', false, 'reason', 'buyer_daily_market_cap_exceeded');
    end if;

    if p_price > v_min_balance and p_buyer_archetype = 'casual' then
        return jsonb_build_object('ok', false, 'reason', 'casual_over_single_purchase_limit');
    end if;

    fee_pct := vexforge_get_policy_numeric('market_fee_pct', 0.08);
    fee_amount := round(p_price * fee_pct, 8);
    seller_net := greatest(round(p_price - fee_amount, 8), 0);

    v_entry_balance := coalesce(buyer_state.trade_balance, 0);
    v_exit_balance := coalesce(seller_state.trade_balance, 0);

    update player_economy_state
    set
        trade_balance = trade_balance - p_price,
        daily_market_volume = daily_market_volume + p_price,
        updated_at = now()
    where player_id = p_buyer_id;

    update player_economy_state
    set
        trade_balance = trade_balance + seller_net,
        daily_market_volume = daily_market_volume + p_price,
        updated_at = now()
    where player_id = p_seller_id;

    update player_cards
    set quantity = quantity - p_quantity
    where player_id = p_seller_id and card_id = p_card_id;

    insert into player_cards (player_id, card_id, quantity)
    values (p_buyer_id, p_card_id, p_quantity)
    on conflict (player_id, card_id) do update set
        quantity = player_cards.quantity + excluded.quantity;

    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values
        (
            gen_random_uuid()::text,
            p_buyer_id,
            'market_buy',
            'vex_tradeable',
            p_price,
            v_entry_balance,
            v_entry_balance - p_price,
            'player_cards',
            p_card_id::text,
            jsonb_build_object('seller_id', p_seller_id, 'quantity', p_quantity, 'fee_pct', fee_pct),
            now(),
            true
        ),
        (
            gen_random_uuid()::text,
            p_seller_id,
            'market_sell',
            'vex_tradeable',
            seller_net,
            v_exit_balance,
            v_exit_balance + seller_net,
            'player_cards',
            p_card_id::text,
            jsonb_build_object('buyer_id', p_buyer_id, 'quantity', p_quantity, 'fee_pct', fee_pct),
            now(),
            true
        ),
        (
            gen_random_uuid()::text,
            null,
            'market_fee',
            'vex_tradeable',
            fee_amount,
            null,
            null,
            'player_cards',
            p_card_id::text,
            jsonb_build_object('seller_id', p_seller_id, 'buyer_id', p_buyer_id, 'quantity', p_quantity),
            now(),
            true
        );

    return jsonb_build_object(
        'ok', true,
        'fee_pct', fee_pct,
        'fee_amount', fee_amount,
        'seller_net', seller_net
    );
end;
$function$

-- public.vexforge_apply_official_mission_reward_quarantine_shadow_econom(p_player_id uuid, p_archetype text, p_mission_code text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_apply_official_mission_reward_quarantine_shadow_econom(p_player_id uuid, p_archetype text, p_mission_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    m record;
    s record;
    v_ingame_mult numeric;
    v_trade_mult numeric;
    v_ingame_cap numeric;
    v_trade_cap numeric;
    v_ingame_reward numeric;
    v_trade_reward numeric;
    v_ingame_before numeric;
    v_trade_before numeric;
    v_ingame_after numeric;
    v_trade_after numeric;
begin
    perform vexforge_ensure_player_state(p_player_id);
    perform vexforge_reset_daily_economy();

    select *
    into m
    from vexforge_official_missions_bridge
    where mission_key = p_mission_code
      and active = true
    limit 1;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'mission_not_found');
    end if;

    select *
    into v_ingame_mult, v_trade_mult, v_ingame_cap, v_trade_cap
    from vexforge_mission_reward_policy(m.mission_type, p_archetype);

    select *
    into s
    from player_economy_state
    where player_id = p_player_id
    for update;

    v_ingame_reward := round((m.reward_ingame * v_ingame_mult)::numeric, 8);
    v_trade_reward := round((m.reward_tradeable * v_trade_mult)::numeric, 8);

    if p_archetype = 'f2p' then
        v_trade_reward := 0;
    end if;

    if s.daily_ingame_minted + v_ingame_reward > v_ingame_cap then
        v_ingame_reward := greatest(v_ingame_cap - s.daily_ingame_minted, 0);
    end if;

    if s.daily_tradeable_minted + v_trade_reward > v_trade_cap then
        v_trade_reward := greatest(v_trade_cap - s.daily_tradeable_minted, 0);
    end if;

    v_ingame_before := coalesce(s.vex_balance, 0);
    v_trade_before := coalesce(s.trade_balance, 0);
    v_ingame_after := v_ingame_before + v_ingame_reward;
    v_trade_after := v_trade_before + v_trade_reward;

    update player_economy_state
    set
        vex_balance = v_ingame_after,
        trade_balance = v_trade_after,
        energy = greatest(coalesce(energy, 0) - coalesce(m.energy_cost, 0), 0),
        last_activity = now(),
        daily_ingame_minted = daily_ingame_minted + v_ingame_reward,
        daily_tradeable_minted = daily_tradeable_minted + v_trade_reward,
        updated_at = now()
    where player_id = p_player_id;

    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values
        (
            gen_random_uuid()::text,
            p_player_id,
            'mission_reward',
            'vex_ingame',
            v_ingame_reward,
            v_ingame_before,
            v_ingame_after,
            'missions',
            m.mission_key,
            jsonb_build_object('mission_type', m.mission_type, 'title', m.title, 'archetype', p_archetype),
            now(),
            true
        );

    if v_trade_reward > 0 then
        insert into economy_ledger (
            reference_id,
            player_id,
            entry_type,
            currency,
            amount,
            balance_before,
            balance_after,
            source_table,
            source_id,
            metadata,
            created_at,
            is_final
        )
        values
            (
                gen_random_uuid()::text,
                p_player_id,
                'mission_reward',
                'vex_tradeable',
                v_trade_reward,
                v_trade_before,
                v_trade_after,
                'missions',
                m.mission_key,
                jsonb_build_object('mission_type', m.mission_type, 'title', m.title, 'archetype', p_archetype),
                now(),
                true
            );
    end if;

    return jsonb_build_object(
        'ok', true,
        'mission_key', m.mission_key,
        'mission_type', m.mission_type,
        'ingame_reward', v_ingame_reward,
        'tradeable_reward', v_trade_reward,
        'energy_cost', m.energy_cost
    );
end;
$function$

-- public.vexforge_approve_deposit(p_deposit_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_approve_deposit(p_deposit_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_dep record; v_vex numeric;
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('ok',false,'reason','unauthorized'); END IF;
 SELECT * INTO v_dep FROM vexforge_project_deposits WHERE id=p_deposit_id FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','deposit_not_found'); END IF;
 IF v_dep.status<>'pending' THEN RETURN jsonb_build_object('ok',false,'reason','already_processed','current_status',v_dep.status); END IF;
 v_vex:=floor(v_dep.amount_usdt*100);
 UPDATE vexforge_project_deposits SET status='approved',vex_credited=v_vex,approved_at=now(),updated_at=now() WHERE id=p_deposit_id;
 INSERT INTO economy_ledger(reference_id,player_id,entry_type,currency,amount,source_table,source_id,metadata,is_final) VALUES('deposit:'||p_deposit_id::text,v_dep.player_id,'reward'::ledger_entry_type,'vex_tradeable',v_vex,'vexforge_project_deposits',p_deposit_id::text,jsonb_build_object('reward','deposit_approved','amount_usdt',v_dep.amount_usdt,'tx_hash',v_dep.tx_hash),true) ON CONFLICT(reference_id) DO NOTHING;
 PERFORM reconcile_player_wallet(v_dep.player_id);
 RETURN jsonb_build_object('ok',true,'deposit_id',p_deposit_id,'player_id',v_dep.player_id,'vex_credited',v_vex,'amount_usdt',v_dep.amount_usdt);
EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('ok',false,'reason',SQLERRM); END;$function$

-- public.vexforge_approve_shop_order(p_order_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_approve_shop_order(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order       record;
  v_season      record;
  v_cosmetic_id uuid;
  v_fs          text;
  v_notes       text;
BEGIN
  -- Guard: solo el admin propietario puede aprobar
  IF NOT public.vexforge_is_control_admin() THEN
    RETURN jsonb_build_object('ok',false,'reason','unauthorized');
  END IF;

  -- Bloquear fila y cargar orden
  SELECT * INTO v_order FROM vexforge_shop_orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'reason','order_not_found');
  END IF;
  IF v_order.status<>'pending_payment' THEN
    RETURN jsonb_build_object('ok',false,'reason','already_processed',
      'current_status',v_order.status,'fulfillment_status',v_order.fulfillment_status);
  END IF;
  IF v_order.tx_hash IS NULL OR nullif(trim(v_order.tx_hash),'') IS NULL
  OR v_order.payer_wallet_address IS NULL OR nullif(trim(v_order.payer_wallet_address),'') IS NULL THEN
    RETURN jsonb_build_object('ok',false,'reason','payment_details_required');
  END IF;

  -- FULFILMENT por item_key
  CASE v_order.item_key

    WHEN 'season_pass_premium' THEN
      SELECT * INTO v_season FROM season_passes WHERE active=true ORDER BY season_number DESC LIMIT 1;
      IF NOT FOUND THEN
        RETURN jsonb_build_object('ok',false,'reason','no_active_season');
      END IF;
      INSERT INTO player_season_pass(player_id,season_pass_id,xp,current_tier,is_premium)
        VALUES(v_order.player_id,v_season.id,0,0,true)
        ON CONFLICT(player_id,season_pass_id) DO UPDATE SET is_premium=true,updated_at=now();
      v_fs:='fulfilled'; v_notes:='season_pass_premium activated for season '||v_season.id::text;

    WHEN 'xp_boost_24h' THEN
      INSERT INTO player_active_boosts(player_id,boost_type,multiplier,expires_at,shop_order_id)
        VALUES(v_order.player_id,'xp_boost_24h',1.5,now()+interval'24 hours',p_order_id);
      v_fs:='fulfilled'; v_notes:='xp_boost_24h activated — expires 24h';

    WHEN 'xp_boost_7d' THEN
      INSERT INTO player_active_boosts(player_id,boost_type,multiplier,expires_at,shop_order_id)
        VALUES(v_order.player_id,'xp_boost_7d',1.5,now()+interval'7 days',p_order_id);
      v_fs:='fulfilled'; v_notes:='xp_boost_7d activated — expires 7 days';

    WHEN 'charm_common' THEN
      SELECT id INTO v_cosmetic_id FROM cosmetics WHERE code='CHARM-COMMON';
      IF v_cosmetic_id IS NULL THEN v_fs:='blocked'; v_notes:='CHARM-COMMON missing in cosmetics';
      ELSE
        INSERT INTO player_cosmetics(player_id,cosmetic_id,equipped,obtained_via)
          VALUES(v_order.player_id,v_cosmetic_id,false,'shop')
          ON CONFLICT(player_id,cosmetic_id) DO NOTHING;
        v_fs:='fulfilled'; v_notes:='charm_common granted';
      END IF;

    WHEN 'charm_rare' THEN
      SELECT id INTO v_cosmetic_id FROM cosmetics WHERE code='CHARM-RARE';
      IF v_cosmetic_id IS NULL THEN v_fs:='blocked'; v_notes:='CHARM-RARE missing in cosmetics';
      ELSE
        INSERT INTO player_cosmetics(player_id,cosmetic_id,equipped,obtained_via)
          VALUES(v_order.player_id,v_cosmetic_id,false,'shop')
          ON CONFLICT(player_id,cosmetic_id) DO NOTHING;
        v_fs:='fulfilled'; v_notes:='charm_rare granted';
      END IF;

    WHEN 'charm_epic' THEN
      SELECT id INTO v_cosmetic_id FROM cosmetics WHERE code='CHARM-EPIC';
      IF v_cosmetic_id IS NULL THEN v_fs:='blocked'; v_notes:='CHARM-EPIC missing in cosmetics';
      ELSE
        INSERT INTO player_cosmetics(player_id,cosmetic_id,equipped,obtained_via)
          VALUES(v_order.player_id,v_cosmetic_id,false,'shop')
          ON CONFLICT(player_id,cosmetic_id) DO NOTHING;
        v_fs:='fulfilled'; v_notes:='charm_epic granted';
      END IF;

    WHEN 'battle_skin' THEN
      SELECT id INTO v_cosmetic_id FROM cosmetics WHERE code='BATTLE-SKIN';
      IF v_cosmetic_id IS NULL THEN v_fs:='blocked'; v_notes:='BATTLE-SKIN missing in cosmetics';
      ELSE
        INSERT INTO player_cosmetics(player_id,cosmetic_id,equipped,obtained_via)
          VALUES(v_order.player_id,v_cosmetic_id,false,'shop')
          ON CONFLICT(player_id,cosmetic_id) DO NOTHING;
        v_fs:='fulfilled'; v_notes:='battle_skin granted';
      END IF;

    WHEN 'raid_key' THEN
      INSERT INTO player_consumables(player_id,item_key,quantity,shop_order_id)
        VALUES(v_order.player_id,'raid_key',1,p_order_id);
      v_fs:='fulfilled'; v_notes:='raid_key added to player_consumables';

    WHEN 'vex_conversion_token' THEN
      UPDATE player_wallet
        SET vex_tradeable=vex_tradeable+100, updated_at=now()
        WHERE player_id=v_order.player_id;
      IF NOT FOUND THEN
        v_fs:='blocked'; v_notes:='player_wallet not found';
      ELSE
        INSERT INTO economy_ledger(reference_id,player_id,entry_type,currency,amount,metadata)
          VALUES(p_order_id::text,v_order.player_id,'purchase'::ledger_entry_type,'vex_tradeable',100,
            jsonb_build_object('source','shop','item_key','vex_conversion_token','order_id',p_order_id));
        v_fs:='fulfilled'; v_notes:='+100 vex_tradeable credited to player_wallet';
      END IF;

    ELSE
      v_fs:='blocked';
      v_notes:='unknown item_key: '||coalesce(v_order.item_key,'NULL');

  END CASE;

  -- Actualizar orden
  UPDATE vexforge_shop_orders SET
    status='approved',
    fulfillment_status=v_fs,
    approved_at=now(),
    fulfilled_at=CASE WHEN v_fs='fulfilled' THEN now() ELSE NULL END,
    notes=v_notes,
    updated_at=now()
  WHERE id=p_order_id;

  RETURN jsonb_build_object(
    'ok',true,'order_id',p_order_id,'player_id',v_order.player_id,
    'item_key',v_order.item_key,'status','approved',
    'fulfillment_status',v_fs,'notes',v_notes
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok',false,'reason',SQLERRM);
END;
$function$

-- public.vexforge_approve_withdrawal_quarantine_legacy_table(p_request_id uuid, p_admin_ref text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_approve_withdrawal_quarantine_legacy_table(p_request_id uuid, p_admin_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    r record;
    s record;
begin
    select *
    into r
    from withdrawal_requests
    where id = p_request_id
    for update;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'request_not_found');
    end if;

    if r.status <> 'pending_review' then
        return jsonb_build_object('ok', false, 'reason', 'invalid_status');
    end if;

    select *
    into s
    from player_economy_state
    where player_id = r.player_id
    for update;

    update player_economy_state
    set
        trade_balance_locked = greatest(trade_balance_locked - coalesce(r.amount * 100, 0), 0),
        withdrawal_pending = case when greatest(trade_balance_locked - coalesce(r.amount * 100, 0), 0) > 0 then true else false end,
        updated_at = now()
    where player_id = r.player_id;

    update withdrawal_requests
    set
        status = 'approved',
        reviewed = true
    where id = p_request_id;

    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        gen_random_uuid()::text,
        r.player_id,
        'withdrawal_approved',
        'usdt',
        r.amount,
        null,
        null,
        'withdrawal_requests',
        p_request_id::text,
        jsonb_build_object('admin_ref', p_admin_ref),
        now(),
        true
    );

    return jsonb_build_object('ok', true, 'status', 'approved');
end;
$function$

-- public.vexforge_approve_withdrawal_quarantine_no_admin_check(p_request_id uuid, p_approved_by text, p_payout_tx_hash text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_approve_withdrawal_quarantine_no_admin_check(p_request_id uuid, p_approved_by text DEFAULT NULL::text, p_payout_tx_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_req record;
    v_locked_before numeric;
    v_locked_after numeric;
begin
    select *
    into v_req
    from vexforge_withdrawal_requests_official
    where id = p_request_id
    for update;

    if not found then
        raise exception 'Withdrawal request not found';
    end if;

    if v_req.status <> 'pending_review' then
        raise exception 'Withdrawal request is not pending review';
    end if;

    select coalesce(trade_balance_locked, 0)
    into v_locked_before
    from player_economy_state
    where player_id = v_req.player_id
    for update;

    v_locked_after := greatest(v_locked_before - v_req.tradeable_amount, 0);

    update player_economy_state
    set trade_balance_locked = v_locked_after,
        withdrawal_pending = (v_locked_after > 0),
        updated_at = now()
    where player_id = v_req.player_id;

    update vexforge_withdrawal_requests_official
    set status = 'approved',
        reviewed = true,
        approved_by = p_approved_by,
        payout_tx_hash = p_payout_tx_hash,
        processed_at = now(),
        updated_at = now()
    where id = p_request_id;

    return jsonb_build_object(
        'ok', true,
        'request_id', p_request_id,
        'status', 'approved',
        'player_id', v_req.player_id,
        'tradeable_amount', v_req.tradeable_amount,
        'usdt_net', v_req.usdt_net
    );
end;
$function$

-- public.vexforge_assign_starter_deck() | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_assign_starter_deck()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      DECLARE
        v_player_id  uuid;
        v_card_count int;
        v_cards      jsonb;
      BEGIN
        -- Resolve player_id from auth.uid()
        SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
        IF v_player_id IS NULL THEN
          RETURN jsonb_build_object('status','error','message','Player not found');
        END IF;

        -- Idempotent: if player already has cards just fix starter_region and return
        SELECT COUNT(*) INTO v_card_count FROM player_cards WHERE player_id = v_player_id;
        IF v_card_count > 0 THEN
          UPDATE player_progress
            SET starter_region = 'Reino del Acero', updated_at = now()
          WHERE player_id = v_player_id AND starter_region IS NULL;

          SELECT jsonb_agg(jsonb_build_object(
            'id', c.id, 'name', c.name, 'faction', c.faction::text,
            'rarity', c.rarity::text, 'power', c.power,
            'affinity', c.affinity, 'prestige', c.prestige, 'image_url', c.image_url
          ) ORDER BY c.faction, c.power)
          INTO v_cards
          FROM player_cards pc JOIN cards c ON c.id = pc.card_id
          WHERE pc.player_id = v_player_id;

          RETURN jsonb_build_object('status','already_assigned','count',v_card_count,'cards',v_cards);
        END IF;

        -- Insert 16 starter cards: 4 per faction
        INSERT INTO player_cards(player_id, card_id, quantity, locked, listed, source_tracking) VALUES
          -- Guerrero
          (v_player_id,'8aa583e2-0ee2-4f42-ac7a-9c0ef48744bc',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'19e208c4-0119-4a7f-80cc-128ed6b05e81',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'b8b9fe07-95f9-4c06-9a01-a2e452137fef',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'4e5abdff-b179-4007-958b-c21c8cb3f876',1,false,false,'{"source":"starter_deck"}'::jsonb),
          -- Mago
          (v_player_id,'67d0ed57-8b31-4485-a38d-c35a9ed54706',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'7222f6e4-cf81-46e4-84d2-9c584d1dd851',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'b341979a-a470-4bd0-a090-2dfa001bec8b',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'4c6b83d5-9925-4ffa-a54a-b6f1bcef0274',1,false,false,'{"source":"starter_deck"}'::jsonb),
          -- Paladín
          (v_player_id,'40307327-9345-4c10-95be-f339afbe676c',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'6e2122b8-330f-4759-94df-f8c6675da285',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'ddff3d12-35ba-4175-8f30-a17022fcd91b',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'14b4fafd-c0ba-4723-b251-6cc708535a08',1,false,false,'{"source":"starter_deck"}'::jsonb),
          -- Pícaro
          (v_player_id,'79f6f19b-d7d4-4695-ade2-a901ec7efd99',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'7d133dd4-22f7-4e1b-bf41-796b596b45fc',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'d5da17e7-1b1b-4e75-b089-76a85e18abee',1,false,false,'{"source":"starter_deck"}'::jsonb),
          (v_player_id,'c5ccb4c1-93af-4508-b312-17a3d11c0085',1,false,false,'{"source":"starter_deck"}'::jsonb);

        -- Set starter_region
        UPDATE player_progress
          SET starter_region = 'Reino del Acero', updated_at = now()
        WHERE player_id = v_player_id AND starter_region IS NULL;

        -- Return card list with details
        SELECT jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'faction', c.faction::text,
          'rarity', c.rarity::text, 'power', c.power,
          'affinity', c.affinity, 'prestige', c.prestige, 'image_url', c.image_url
        ) ORDER BY c.faction, c.power)
        INTO v_cards
        FROM player_cards pc JOIN cards c ON c.id = pc.card_id
        WHERE pc.player_id = v_player_id;

        RETURN jsonb_build_object('status','ok','count',16,'cards',v_cards);
      END;
      $function$

-- public.vexforge_atomic_game_engine(p_player_id uuid, p_mission_run_id uuid, p_reference_id text, p_run_market boolean, p_listing_price numeric) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_atomic_game_engine(p_player_id uuid, p_mission_run_id uuid, p_reference_id text, p_run_market boolean DEFAULT false, p_listing_price numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_mission record;
    v_listing_id uuid;
    v_reward numeric := 0;
    v_result jsonb;
begin

    -- 1. LOAD MISSION
    select *
    into v_mission
    from public.mission_runs
    where id = p_mission_run_id
    and player_id = p_player_id;

    if v_mission is null then
        raise exception 'mission_run_not_found';
    end if;

    if v_mission.status = 'claimed' then
        raise exception 'already_claimed';
    end if;

    v_reward := coalesce(v_mission.ingame_reward, 0);

    -- 2. CLAIM MISSION
    update public.mission_runs
    set status = 'claimed',
        claimed_at = now(),
        updated_at = now()
    where id = p_mission_run_id;

    -- 3. WALLET UPDATE
    perform public.safe_wallet_transaction(
        p_player_id,
        'vex_ingame',
        v_reward,
        'credit',
        p_reference_id,
        'mission_runs',
        p_mission_run_id,
        jsonb_build_object('engine', 'atomic_core')
    );

    -- 4. EVENT LOG
    perform public.log_event(
        p_player_id,
        'MISSION_COMPLETED_ATOMIC',
        p_reference_id,
        'mission_runs',
        p_mission_run_id,
        jsonb_build_object('reward', v_reward)
    );

    -- 5. OPTIONAL MARKET FLOW
    if p_run_market = true and p_listing_price is not null then

        insert into public.market_listings (
            id,
            reference_id,
            player_id,
            player_card_id,
            price,
            fee,
            status,
            locked,
            metadata,
            created_at,
            updated_at
        )
        select
            gen_random_uuid(),
            p_reference_id,
            p_player_id,
            pc.id,
            p_listing_price,
            round(p_listing_price * 0.08, 2),
            'active',
            true,
            jsonb_build_object('auto', true),
            now(),
            now()
        from public.player_cards pc
        where pc.player_id = p_player_id
        limit 1
        returning id into v_listing_id;

        perform public.log_event(
            p_player_id,
            'LISTING_CREATED_ATOMIC',
            p_reference_id,
            'market_listings',
            v_listing_id::text,
            jsonb_build_object('price', p_listing_price)
        );

    end if;

    -- 6. REBALANCE TRIGGER (LIGHT)
    perform public.economy_state_rebalance();

    -- 7. RESPONSE
    v_result := jsonb_build_object(
        'ok', true,
        'mission_run_id', p_mission_run_id,
        'reward', v_reward,
        'listing_id', v_listing_id
    );

    return v_result;

end;
$function$

-- public.vexforge_attack_world_boss(p_world_boss_id uuid, p_damage bigint) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_attack_world_boss(p_world_boss_id uuid, p_damage bigint DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_boss record;
  v_encounter_id uuid;
  v_damage_dealt bigint := 0;
  v_remaining_hp bigint;
  v_reward_vex numeric;
  v_reward_shards numeric;
  v_reward_json jsonb;
  v_reference_id text;
  v_brake boolean;
BEGIN
  IF p_damage IS NULL OR p_damage <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Invalid damage');
  END IF;

  SELECT emergency_brake
    INTO v_brake
    FROM public.meta_system_state
   LIMIT 1;

  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  SELECT id
    INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  -- Serialize attacks for this boss so shared HP cannot be overspent.
  SELECT *
    INTO v_boss
    FROM public.world_bosses
   WHERE id = p_world_boss_id
     AND active = true
   FOR UPDATE;

  IF v_boss.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'World boss not found or not active');
  END IF;

  SELECT COALESCE(SUM(damage) FILTER (WHERE status = 'completed'), 0)
    INTO v_damage_dealt
    FROM public.world_boss_encounters
   WHERE world_boss_id = p_world_boss_id;

  v_remaining_hp := GREATEST(0, v_boss.hp - v_damage_dealt);

  IF v_remaining_hp <= 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Boss already defeated',
      'max_hp', v_boss.hp,
      'damage_dealt_total', v_damage_dealt,
      'remaining_hp', 0
    );
  END IF;

  p_damage := LEAST(p_damage, v_boss.power_level::bigint * 100, v_remaining_hp);

  v_reward_vex := ROUND(
    (p_damage::numeric / v_boss.hp)
    * COALESCE((v_boss.reward_pool->>'vex_ingame')::numeric, 100),
    2
  );
  v_reward_shards := ROUND(
    (p_damage::numeric / v_boss.hp)
    * COALESCE((v_boss.reward_pool->>'shards')::numeric, 0),
    0
  );
  v_reward_vex := GREATEST(
    v_reward_vex,
    public.vexforge_get_policy_numeric('boss_attack_min_reward', 1)
  );
  v_reward_json := jsonb_build_object(
    'vex_ingame', v_reward_vex,
    'shards', v_reward_shards,
    'damage', p_damage
  );

  INSERT INTO public.world_boss_encounters (
    world_boss_id, player_id, damage, reward_json, status
  ) VALUES (
    p_world_boss_id, v_player_id, p_damage, v_reward_json, 'completed'
  )
  RETURNING id INTO v_encounter_id;

  v_reference_id := 'boss_attack_' || v_encounter_id::text || '_' ||
    extract(epoch FROM now())::bigint::text;

  IF v_reward_vex > 0 THEN
    PERFORM public.wallet_tx(
      v_player_id,
      'vex_ingame',
      v_reward_vex,
      'in',
      v_reference_id,
      'world_boss_encounters',
      v_encounter_id,
      jsonb_build_object('boss_id', p_world_boss_id, 'damage', p_damage)
    );
  END IF;

  IF v_reward_shards > 0 THEN
    PERFORM public.wallet_tx(
      v_player_id,
      'shards',
      v_reward_shards,
      'in',
      v_reference_id || '_shards',
      'world_boss_encounters',
      v_encounter_id,
      jsonb_build_object('boss_id', p_world_boss_id, 'damage', p_damage)
    );
  END IF;

  PERFORM public.emit_game_event(
    v_player_id,
    'world_boss_attack',
    p_world_boss_id::text,
    jsonb_build_object(
      'damage', p_damage,
      'reward_vex', v_reward_vex,
      'reward_shards', v_reward_shards,
      'boss_name', v_boss.name,
      'boss_tier', v_boss.tier
    )
  );

  v_damage_dealt := v_damage_dealt + p_damage;

  RETURN jsonb_build_object(
    'ok', true,
    'encounter_id', v_encounter_id,
    'boss_name', v_boss.name,
    'boss_tier', v_boss.tier,
    'damage_dealt', p_damage,
    'damage_dealt_total', v_damage_dealt,
    'max_hp', v_boss.hp,
    'remaining_hp', GREATEST(0, v_boss.hp - v_damage_dealt),
    'reward', jsonb_build_object(
      'vex_ingame', v_reward_vex,
      'shards', v_reward_shards
    )
  );
END;
$function$

-- public.vexforge_attack_world_boss(p_world_boss_id uuid, p_damage bigint, p_battle_run_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_attack_world_boss(p_world_boss_id uuid, p_damage bigint, p_battle_run_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_battle public.battle_runs%ROWTYPE;
  v_boss record;
  v_existing record;
  v_encounter_id uuid;
  v_damage_dealt bigint := 0;
  v_remaining_hp bigint;
  v_reward_vex numeric;
  v_reward_shards numeric;
  v_reward_json jsonb;
  v_reference_id text;
  v_brake boolean;
  v_recorded_damage bigint;
BEGIN
  IF p_damage IS NULL OR p_damage <= 0 OR p_battle_run_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Invalid battle run or damage');
  END IF;

  SELECT emergency_brake INTO v_brake
  FROM public.meta_system_state
  LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  SELECT id INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  SELECT * INTO v_battle
  FROM public.battle_runs
  WHERE id = p_battle_run_id
    AND player_id = v_player_id
  FOR UPDATE;
  IF NOT FOUND
     OR v_battle.mode <> 'boss'
     OR v_battle.world_boss_id <> p_world_boss_id
     OR v_battle.status <> 'completed'
     OR v_battle.outcome IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Winning boss battle run required');
  END IF;

  v_recorded_damage := NULLIF(v_battle.result_snapshot->>'damage', '')::bigint;
  IF v_recorded_damage IS NULL OR p_damage > v_recorded_damage THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Damage exceeds battle result');
  END IF;

  SELECT * INTO v_existing
  FROM public.world_boss_encounters
  WHERE battle_run_id = p_battle_run_id;
  IF FOUND THEN
    SELECT COALESCE(SUM(damage) FILTER (WHERE status = 'completed'), 0)
      INTO v_damage_dealt
    FROM public.world_boss_encounters
    WHERE world_boss_id = p_world_boss_id;
    SELECT hp, name, tier INTO v_boss
    FROM public.world_bosses WHERE id = p_world_boss_id;
    RETURN jsonb_build_object(
      'ok', true, 'idempotent', true,
      'battle_run_id', p_battle_run_id,
      'encounter_id', v_existing.id,
      'boss_name', v_boss.name,
      'boss_tier', v_boss.tier,
      'damage_dealt', v_existing.damage,
      'damage_dealt_total', v_damage_dealt,
      'max_hp', v_boss.hp,
      'remaining_hp', GREATEST(0, v_boss.hp - v_damage_dealt)
    );
  END IF;

  SELECT * INTO v_boss
  FROM public.world_bosses
  WHERE id = p_world_boss_id AND active = true
  FOR UPDATE;
  IF v_boss.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'World boss not found or not active');
  END IF;

  SELECT COALESCE(SUM(damage) FILTER (WHERE status = 'completed'), 0)
    INTO v_damage_dealt
  FROM public.world_boss_encounters
  WHERE world_boss_id = p_world_boss_id;
  v_remaining_hp := GREATEST(0, v_boss.hp - v_damage_dealt);
  IF v_remaining_hp <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Boss already defeated', 'remaining_hp', 0);
  END IF;

  p_damage := LEAST(p_damage, v_boss.power_level::bigint * 100, v_remaining_hp);
  v_reward_vex := ROUND(
    (p_damage::numeric / v_boss.hp)
    * COALESCE((v_boss.reward_pool->>'vex_ingame')::numeric, 100), 2
  );
  v_reward_shards := ROUND(
    (p_damage::numeric / v_boss.hp)
    * COALESCE((v_boss.reward_pool->>'shards')::numeric, 0), 0
  );
  v_reward_vex := GREATEST(
    v_reward_vex,
    public.vexforge_get_policy_numeric('boss_attack_min_reward', 1)
  );
  v_reward_json := jsonb_build_object(
    'vex_ingame', v_reward_vex,
    'shards', v_reward_shards,
    'damage', p_damage,
    'battle_run_id', p_battle_run_id
  );

  INSERT INTO public.world_boss_encounters (
    world_boss_id, player_id, battle_run_id, damage, reward_json, status
  )
  VALUES (
    p_world_boss_id, v_player_id, p_battle_run_id, p_damage, v_reward_json, 'completed'
  )
  RETURNING id INTO v_encounter_id;

  v_reference_id := 'boss_attack_' || p_battle_run_id::text;
  IF v_reward_vex > 0 THEN
    PERFORM public.wallet_tx(
      v_player_id, 'vex_ingame', v_reward_vex, 'in', v_reference_id,
      'world_boss_encounters', v_encounter_id,
      jsonb_build_object('boss_id', p_world_boss_id, 'damage', p_damage)
    );
  END IF;
  IF v_reward_shards > 0 THEN
    PERFORM public.wallet_tx(
      v_player_id, 'shards', v_reward_shards, 'in', v_reference_id || '_shards',
      'world_boss_encounters', v_encounter_id,
      jsonb_build_object('boss_id', p_world_boss_id, 'damage', p_damage)
    );
  END IF;

  PERFORM public.emit_game_event(
    v_player_id, 'world_boss_attack', p_world_boss_id::text,
    jsonb_build_object(
      'damage', p_damage,
      'reward_vex', v_reward_vex,
      'reward_shards', v_reward_shards,
      'boss_name', v_boss.name,
      'boss_tier', v_boss.tier,
      'battle_run_id', p_battle_run_id
    )
  );

  v_damage_dealt := v_damage_dealt + p_damage;
  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'battle_run_id', p_battle_run_id,
    'encounter_id', v_encounter_id,
    'boss_name', v_boss.name,
    'boss_tier', v_boss.tier,
    'damage_dealt', p_damage,
    'damage_dealt_total', v_damage_dealt,
    'max_hp', v_boss.hp,
    'remaining_hp', GREATEST(0, v_boss.hp - v_damage_dealt),
    'reward', jsonb_build_object('vex_ingame', v_reward_vex, 'shards', v_reward_shards)
  );
END;
$function$

-- public.vexforge_battle_resolve(p_challenger_id uuid, p_opponent_id uuid, p_idempotency_key text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_battle_resolve(p_challenger_id uuid, p_opponent_id uuid, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$

DECLARE
  v_err_context text;
  -- Auth
  v_auth_player_id  uuid;
  v_challenger_name text;
  v_opponent_name   text;

  -- System state
  v_brake boolean := false;

  -- Idempotency
  v_existing record;

  -- Active season
  v_season_id uuid;

  -- MMR
  v_mmr_a   numeric := 1000;
  v_mmr_b   numeric := 1000;

  -- Deck state as JSONB arrays of unit objects
  v_units_a jsonb := '[]'::jsonb;
  v_units_b jsonb := '[]'::jsonb;

  -- Card iteration
  v_card            record;
  v_keywords        text[];
  v_guard           bool;
  v_lifesteal       bool;
  v_shielded        bool;
  v_rush            bool;
  v_hp              int;
  v_atk             int;
  v_def             int;
  v_spd             int;

  -- ForgeFormation
  v_champ_a_idx     int := -1;
  v_champ_b_idx     int := -1;
  v_vanguard_a_idx  int := -1;
  v_vanguard_b_idx  int := -1;
  v_sentinel_a_idx  int := -1;
  v_sentinel_b_idx  int := -1;
  v_reserve_a_count int := 0;
  v_reserve_b_count int := 0;
  v_same_faction_a  bool := false;
  v_same_faction_b  bool := false;
  v_faction_a       text;
  v_faction_b       text;

  -- Combat simulation
  v_turns           jsonb := '[]'::jsonb;
  v_turn_num        int   := 0;
  v_max_rounds      int   := 30;
  v_round           int;
  v_side            text;
  v_attacker        jsonb;
  v_defender        jsonb;
  v_attk_idx        int;
  v_def_idx         int;
  v_damage          int;
  v_is_crit         bool;
  v_is_kill         bool;
  v_heal_amount     int;
  v_new_hp          int;
  v_alive_a         int;
  v_alive_b         int;
  v_champ_a_alive   bool := true;
  v_champ_b_alive   bool := true;
  v_champ_a_hp      int;
  v_champ_b_hp      int;
  v_events          jsonb;
  v_i               int;
  v_j               int;
  v_best_spd        int;
  v_best_idx        int;
  v_tmp_unit        jsonb;
  v_tmp_hp          int;
  v_tmp_atk         int;
  v_tmp_def         int;
  v_tmp_spd         int;
  v_tmp_alive       bool;
  v_tmp_guard       bool;
  v_tmp_lifesteal   bool;
  v_tmp_shielded    bool;
  v_replacement_idx int := -1;
  v_replacement_score int := -1;
  v_replacement_slot text;

  -- Winner resolution
  v_winner_id uuid;
  v_you_won   bool;

  -- ELO
  v_k        numeric := 32;
  v_exp_a    numeric;
  v_elo_a    int;
  v_elo_b    int;

  -- Rewards
  v_vex_winner int := 50;
  v_vex_loser  int := 5;
  v_xp_winner  int := 100;
  v_xp_loser   int := 20;

  -- DB writes
  v_match_id  uuid;
  v_ref_a     text;
  v_ref_b     text;
  v_level_a   int;
  v_xp_a      int;
  v_xp_req_a  int;
  v_level_b   int;
  v_xp_b      int;
  v_xp_req_b  int;

  -- Power snapshots
  v_power_a   int := 0;
  v_power_b   int := 0;

  -- Final units for response
  v_final_units jsonb := '[]'::jsonb;

  -- Synthetic deck generation
  v_syn_power   int;
  v_syn_name    text;
  v_syn_rarity  text;
  v_syn_faction text;

BEGIN

  --------------------------------------------------------------------------
  -- 0. Emergency brake
  --------------------------------------------------------------------------
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Emergency brake active');
  END IF;

  --------------------------------------------------------------------------
  -- 1. Auth validation — challenger must be the authenticated user
  --------------------------------------------------------------------------
  SELECT p.id, p.display_name
    INTO v_auth_player_id, v_challenger_name
    FROM public.players p
   WHERE p.auth_user_id = auth.uid()
   LIMIT 1;

  IF v_auth_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  IF v_auth_player_id != p_challenger_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Identity mismatch: p_challenger_id does not match authenticated user');
  END IF;

  IF p_challenger_id = p_opponent_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cannot battle yourself');
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Idempotency key required');
  END IF;

  --------------------------------------------------------------------------
  -- 2. Idempotency: return cached result if same key was already resolved
  --------------------------------------------------------------------------
  SELECT id, winner, elo_change_a, elo_change_b, player_a, player_b, metadata
    INTO v_existing
    FROM public.pvp_matches
   WHERE reference_id = p_idempotency_key
   LIMIT 1;

  IF FOUND THEN
    v_you_won := (v_existing.winner = p_challenger_id);
    RETURN jsonb_build_object(
      'ok',          true,
      'match_id',    v_existing.id,
      'winner_id',   v_existing.winner,
      'you_won',     v_you_won,
      'elo_change',  CASE WHEN (v_existing.player_a = p_challenger_id)
                          THEN v_existing.elo_change_a
                          ELSE v_existing.elo_change_b END,
      'total_turns', COALESCE((v_existing.metadata->>'total_turns')::int, 10),
      'turns',       COALESCE(v_existing.metadata->'turns', '[]'::jsonb),
      'final_units', COALESCE(v_existing.metadata->'final_units', '[]'::jsonb),
      'engine',      'vexforge_battle_resolve_v1',
      'idempotent',  true
    );
  END IF;

  --------------------------------------------------------------------------
  -- 3. Get opponent name
  --------------------------------------------------------------------------
  SELECT display_name INTO v_opponent_name
    FROM public.players WHERE id = p_opponent_id LIMIT 1;
  v_opponent_name := COALESCE(v_opponent_name, 'Oponente');
  v_challenger_name := COALESCE(v_challenger_name, 'Forjador');

  --------------------------------------------------------------------------
  -- 4. Active season
  --------------------------------------------------------------------------
  SELECT id INTO v_season_id
    FROM public.pvp_seasons
   WHERE active = true
   ORDER BY starts_at DESC
   LIMIT 1;

  --------------------------------------------------------------------------
  -- 5. Load MMR for both players
  --------------------------------------------------------------------------
  IF v_season_id IS NOT NULL THEN
    SELECT COALESCE(mmr, 1000) INTO v_mmr_a
      FROM public.pvp_rankings
     WHERE player_id = p_challenger_id
       AND season_id = v_season_id
     ORDER BY updated_at DESC LIMIT 1;

    SELECT COALESCE(mmr, 1000) INTO v_mmr_b
      FROM public.pvp_rankings
     WHERE player_id = p_opponent_id
       AND season_id = v_season_id
     ORDER BY updated_at DESC LIMIT 1;
  END IF;
  v_mmr_a := COALESCE(v_mmr_a, 1000);
  v_mmr_b := COALESCE(v_mmr_b, 1000);

  --------------------------------------------------------------------------
  -- 6. Load challenger deck (player_deck JOIN cards, max 8 cards)
  --------------------------------------------------------------------------
  FOR v_card IN
    SELECT c.id, c.name, c.faction, c.rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10)     AS power,
           COALESCE(c.affinity, 2)   AS affinity,
           COALESCE(c.prestige, 1)   AS prestige,
           COALESCE(c.charge, 1)     AS charge,
           COALESCE(c.synergy_json, '{}') AS synergy_json,
           pd.is_champion
      FROM public.player_deck pd
      JOIN public.cards c ON c.id = pd.card_id
     WHERE pd.player_id = p_challenger_id
       AND c.active = true
     ORDER BY pd.is_champion DESC, c.power DESC
     LIMIT 8
  LOOP
    v_keywords  := ARRAY(SELECT jsonb_array_elements_text(
                           COALESCE(v_card.synergy_json->'keywords', '[]')));
    v_guard     := 'Guard'  = ANY(v_keywords);
    v_lifesteal := 'Drain'  = ANY(v_keywords);
    v_shielded  := 'Veil'   = ANY(v_keywords);
    v_rush      := 'Surge'  = ANY(v_keywords);
    -- Stat derivation from canonical card columns
    v_hp  := v_card.power * 4 + v_card.affinity;
    v_atk := v_card.power + v_card.affinity / 4;
    v_def := v_card.prestige * 2 + v_card.affinity / 8;
    v_spd := v_card.charge * 4 + v_card.affinity / 10;
    IF v_rush    THEN v_spd := v_spd + 20; END IF;
    IF v_guard   THEN v_def := v_def + 5;  END IF;
    v_power_a   := v_power_a + v_card.power;

    v_units_a := v_units_a || jsonb_build_array(jsonb_build_object(
      'id',         v_card.id,
      'name',       v_card.name,
      'faction',    COALESCE(v_card.faction, 'Guerrero'),
      'rarity',     COALESCE(v_card.rarity, 'Common'),
      'image_url',  v_card.image_url,
      'hp',         v_hp,
      'max_hp',     v_hp,
      'atk',        v_atk,
      'def',        v_def,
      'spd',        v_spd,
      'power',      v_card.power,
      'keywords',   to_jsonb(v_keywords),
      'alive',      true,
      'in_reserve', false,
      'guard',      v_guard,
      'lifesteal',  v_lifesteal,
      'shielded',   v_shielded,
      'side',       'a',
      'is_champion',v_card.is_champion
    ));
  END LOOP;

  --------------------------------------------------------------------------
  -- 7. Load opponent deck (same logic)
  --------------------------------------------------------------------------
  FOR v_card IN
    SELECT c.id, c.name, c.faction, c.rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10)     AS power,
           COALESCE(c.affinity, 2)   AS affinity,
           COALESCE(c.prestige, 1)   AS prestige,
           COALESCE(c.charge, 1)     AS charge,
           COALESCE(c.synergy_json, '{}') AS synergy_json,
           pd.is_champion
      FROM public.player_deck pd
      JOIN public.cards c ON c.id = pd.card_id
     WHERE pd.player_id = p_opponent_id
       AND c.active = true
     ORDER BY pd.is_champion DESC, c.power DESC
     LIMIT 8
  LOOP
    v_keywords  := ARRAY(SELECT jsonb_array_elements_text(
                           COALESCE(v_card.synergy_json->'keywords', '[]')));
    v_guard     := 'Guard'  = ANY(v_keywords);
    v_lifesteal := 'Drain'  = ANY(v_keywords);
    v_shielded  := 'Veil'   = ANY(v_keywords);
    v_rush      := 'Surge'  = ANY(v_keywords);
    v_hp  := v_card.power * 4 + v_card.affinity;
    v_atk := v_card.power + v_card.affinity / 4;
    v_def := v_card.prestige * 2 + v_card.affinity / 8;
    v_spd := v_card.charge * 4 + v_card.affinity / 10;
    IF v_rush  THEN v_spd := v_spd + 20; END IF;
    IF v_guard THEN v_def := v_def + 5;  END IF;
    v_power_b := v_power_b + v_card.power;

    v_units_b := v_units_b || jsonb_build_array(jsonb_build_object(
      'id',         v_card.id,
      'name',       v_card.name,
      'faction',    COALESCE(v_card.faction, 'Guerrero'),
      'rarity',     COALESCE(v_card.rarity, 'Common'),
      'image_url',  v_card.image_url,
      'hp',         v_hp,
      'max_hp',     v_hp,
      'atk',        v_atk,
      'def',        v_def,
      'spd',        v_spd,
      'power',      v_card.power,
      'keywords',   to_jsonb(v_keywords),
      'alive',      true,
      'in_reserve', false,
      'guard',      v_guard,
      'lifesteal',  v_lifesteal,
      'shielded',   v_shielded,
      'side',       'b',
      'is_champion', v_card.is_champion
    ));
  END LOOP;

  --------------------------------------------------------------------------
  -- 8. Synthetic deck for players with no deck (scaled to MMR)
  --------------------------------------------------------------------------
  IF jsonb_array_length(v_units_a) = 0 THEN
    v_units_a := public._vexforge_gen_synthetic_deck(v_mmr_a, 'a');
    v_power_a  := (v_mmr_a / 1000.0 * 25 + 10)::int * 4;
  END IF;
  IF jsonb_array_length(v_units_b) = 0 THEN
    v_units_b := public._vexforge_gen_synthetic_deck(v_mmr_b, 'b');
    v_power_b  := (v_mmr_b / 1000.0 * 25 + 10)::int * 4;
  END IF;

  --------------------------------------------------------------------------
  -- 9. Apply ForgeFormation: identify champions + reserve bonus
  --------------------------------------------------------------------------
  -- Find champion index for side A
  v_champ_a_idx := -1;
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    IF (v_units_a->v_i->>'is_champion')::bool THEN
      v_champ_a_idx := v_i;
      EXIT;
    END IF;
  END LOOP;
  -- If no explicit champion, use highest power card (index 0, already sorted)
  IF v_champ_a_idx = -1 THEN v_champ_a_idx := 0; END IF;

  -- Find champion index for side B
  v_champ_b_idx := -1;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    IF (v_units_b->v_i->>'is_champion')::bool THEN
      v_champ_b_idx := v_i;
      EXIT;
    END IF;
  END LOOP;
  IF v_champ_b_idx = -1 THEN v_champ_b_idx := 0; END IF;

  -- Formation slots are Champion + first two non-Champion cards. The
  -- remaining cards are reserve-only until an active support unit dies.
  v_vanguard_a_idx := -1;
  v_sentinel_a_idx := -1;
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    IF v_i <> v_champ_a_idx THEN
      IF v_vanguard_a_idx = -1 THEN
        v_vanguard_a_idx := v_i;
      ELSIF v_sentinel_a_idx = -1 THEN
        v_sentinel_a_idx := v_i;
      END IF;
    END IF;
  END LOOP;
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    v_units_a := jsonb_set(
      v_units_a,
      ARRAY[v_i::text, 'in_reserve'],
      to_jsonb(v_i <> v_champ_a_idx AND v_i <> v_vanguard_a_idx AND v_i <> v_sentinel_a_idx)
    );
  END LOOP;
  IF v_vanguard_a_idx >= 0 THEN
    v_units_a := jsonb_set(v_units_a, ARRAY[v_vanguard_a_idx::text, 'guard'], 'true'::jsonb);
  END IF;

  -- VE-PVP-02: publica el rol de formacion resuelto por el motor para que el
  -- cliente pueda representar CAMPEON / VANGUARDIA / CENTINELA sin recalcular
  -- ninguna regla. No altera stats, dano, bonificaciones ni resultados.
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'slot'],
      to_jsonb(CASE
        WHEN v_i = v_champ_a_idx    THEN 'champion'
        WHEN v_i = v_vanguard_a_idx THEN 'vanguard'
        WHEN v_i = v_sentinel_a_idx THEN 'sentinel'
        ELSE 'reserve' END));
    v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'is_champion'],
      to_jsonb(v_i = v_champ_a_idx));
  END LOOP;

  v_vanguard_b_idx := -1;
  v_sentinel_b_idx := -1;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    IF v_i <> v_champ_b_idx THEN
      IF v_vanguard_b_idx = -1 THEN
        v_vanguard_b_idx := v_i;
      ELSIF v_sentinel_b_idx = -1 THEN
        v_sentinel_b_idx := v_i;
      END IF;
    END IF;
  END LOOP;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    v_units_b := jsonb_set(
      v_units_b,
      ARRAY[v_i::text, 'in_reserve'],
      to_jsonb(v_i <> v_champ_b_idx AND v_i <> v_vanguard_b_idx AND v_i <> v_sentinel_b_idx)
    );
  END LOOP;
  IF v_vanguard_b_idx >= 0 THEN
    v_units_b := jsonb_set(v_units_b, ARRAY[v_vanguard_b_idx::text, 'guard'], 'true'::jsonb);
  END IF;

  -- VE-PVP-02: publica el rol de formacion resuelto por el motor para que el
  -- cliente pueda representar CAMPEON / VANGUARDIA / CENTINELA sin recalcular
  -- ninguna regla. No altera stats, dano, bonificaciones ni resultados.
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'slot'],
      to_jsonb(CASE
        WHEN v_i = v_champ_b_idx    THEN 'champion'
        WHEN v_i = v_vanguard_b_idx THEN 'vanguard'
        WHEN v_i = v_sentinel_b_idx THEN 'sentinel'
        ELSE 'reserve' END));
    v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'is_champion'],
      to_jsonb(v_i = v_champ_b_idx));
  END LOOP;

  v_reserve_a_count := 0;
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    IF COALESCE((v_units_a->v_i->>'in_reserve')::bool, false) THEN
      v_reserve_a_count := v_reserve_a_count + 1;
    END IF;
  END LOOP;
  v_reserve_b_count := 0;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    IF COALESCE((v_units_b->v_i->>'in_reserve')::bool, false) THEN
      v_reserve_b_count := v_reserve_b_count + 1;
    END IF;
  END LOOP;

  -- Apply champion deck bonus: ATK +1.2/reserve, DEF +0.8/reserve, HP +5/reserve
  IF v_reserve_a_count > 0 THEN
    v_tmp_hp  := (v_units_a->v_champ_a_idx->>'hp')::int  + v_reserve_a_count * 5;
    v_tmp_atk := (v_units_a->v_champ_a_idx->>'atk')::int + FLOOR(v_reserve_a_count * 1.2);
    v_tmp_def := (v_units_a->v_champ_a_idx->>'def')::int + FLOOR(v_reserve_a_count * 0.8);
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'hp'],  to_jsonb(v_tmp_hp));
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'max_hp'], to_jsonb(v_tmp_hp));
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'atk'], to_jsonb(v_tmp_atk));
    v_units_a := jsonb_set(v_units_a, ARRAY[v_champ_a_idx::text, 'def'], to_jsonb(v_tmp_def));
  END IF;
  IF v_reserve_b_count > 0 THEN
    v_tmp_hp  := (v_units_b->v_champ_b_idx->>'hp')::int  + v_reserve_b_count * 5;
    v_tmp_atk := (v_units_b->v_champ_b_idx->>'atk')::int + FLOOR(v_reserve_b_count * 1.2);
    v_tmp_def := (v_units_b->v_champ_b_idx->>'def')::int + FLOOR(v_reserve_b_count * 0.8);
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'hp'],  to_jsonb(v_tmp_hp));
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'max_hp'], to_jsonb(v_tmp_hp));
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'atk'], to_jsonb(v_tmp_atk));
    v_units_b := jsonb_set(v_units_b, ARRAY[v_champ_b_idx::text, 'def'], to_jsonb(v_tmp_def));
  END IF;

  -- Formation Pure Bonus: +15% to all 3 active cards if same faction
  IF jsonb_array_length(v_units_a) >= 2 THEN
    v_faction_a      := v_units_a->v_champ_a_idx->>'faction';
    v_same_faction_a := true;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false)
         AND (v_units_a->v_i->>'faction') != v_faction_a THEN
        v_same_faction_a := false;
        EXIT;
      END IF;
    END LOOP;
    IF v_same_faction_a THEN
      FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
        CONTINUE WHEN COALESCE((v_units_a->v_i->>'in_reserve')::bool, false);
        v_tmp_hp  := ROUND((v_units_a->v_i->>'hp')::numeric  * 1.15);
        v_tmp_atk := ROUND((v_units_a->v_i->>'atk')::numeric * 1.15);
        v_tmp_def := ROUND((v_units_a->v_i->>'def')::numeric * 1.15);
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'hp'],  to_jsonb(v_tmp_hp));
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'max_hp'], to_jsonb(v_tmp_hp));
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'atk'], to_jsonb(v_tmp_atk));
        v_units_a := jsonb_set(v_units_a, ARRAY[v_i::text, 'def'], to_jsonb(v_tmp_def));
      END LOOP;
    END IF;
  END IF;
  IF jsonb_array_length(v_units_b) >= 2 THEN
    v_faction_b      := v_units_b->v_champ_b_idx->>'faction';
    v_same_faction_b := true;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false)
         AND (v_units_b->v_i->>'faction') != v_faction_b THEN
        v_same_faction_b := false;
        EXIT;
      END IF;
    END LOOP;
    IF v_same_faction_b THEN
      FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
        CONTINUE WHEN COALESCE((v_units_b->v_i->>'in_reserve')::bool, false);
        v_tmp_hp  := ROUND((v_units_b->v_i->>'hp')::numeric  * 1.15);
        v_tmp_atk := ROUND((v_units_b->v_i->>'atk')::numeric * 1.15);
        v_tmp_def := ROUND((v_units_b->v_i->>'def')::numeric * 1.15);
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'hp'],  to_jsonb(v_tmp_hp));
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'max_hp'], to_jsonb(v_tmp_hp));
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'atk'], to_jsonb(v_tmp_atk));
        v_units_b := jsonb_set(v_units_b, ARRAY[v_i::text, 'def'], to_jsonb(v_tmp_def));
      END LOOP;
    END IF;
  END IF;

  --------------------------------------------------------------------------
  -- 10. Combat simulation (ForgeFormation rules)
  -- Turn order: fastest unit attacks. Guard units on the defending side
  -- absorb hits before the champion.
  -- Champion death = immediate loss.
  -- Max 30 rounds to prevent infinite loops.
  --------------------------------------------------------------------------
  v_alive_a    := jsonb_array_length(v_units_a);
  v_alive_b    := jsonb_array_length(v_units_b);
  v_turn_num   := 0;

  -- Track champion HP separately for efficiency
  v_champ_a_hp := (v_units_a->v_champ_a_idx->>'hp')::int;
  v_champ_b_hp := (v_units_b->v_champ_b_idx->>'hp')::int;

  FOR v_round IN 1 .. v_max_rounds LOOP
    EXIT WHEN NOT v_champ_a_alive OR NOT v_champ_b_alive;

    -- Count alive units on each side
    v_alive_a := 0;
    v_alive_b := 0;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false)
      THEN v_alive_a := v_alive_a + 1; END IF;
    END LOOP;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false)
      THEN v_alive_b := v_alive_b + 1; END IF;
    END LOOP;
    EXIT WHEN v_alive_a = 0 OR v_alive_b = 0;

    -- ── Side A attacks (pick fastest alive unit on side A) ──
    v_best_spd := -1;
    v_best_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false) THEN
        v_tmp_spd := (v_units_a->v_i->>'spd')::int;
        IF v_tmp_spd > v_best_spd THEN
          v_best_spd := v_tmp_spd;
          v_best_idx := v_i;
        END IF;
      END IF;
    END LOOP;
    v_attk_idx := v_best_idx;
    v_attacker  := v_units_a->v_attk_idx;

    -- Target: prefer Guard units on side B, then lowest HP alive unit
    v_def_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false)
         AND (v_units_b->v_i->>'guard')::bool THEN
        v_def_idx := v_i;
        EXIT;
      END IF;
    END LOOP;
    -- If no guard, pick lowest HP alive (but never champion until last)
    IF v_def_idx = -1 THEN
      v_tmp_hp := 99999;
      FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
        IF (v_units_b->v_i->>'alive')::bool
           AND NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false)
           AND v_i != v_champ_b_idx THEN
          IF (v_units_b->v_i->>'hp')::int < v_tmp_hp THEN
            v_tmp_hp  := (v_units_b->v_i->>'hp')::int;
            v_def_idx := v_i;
          END IF;
        END IF;
      END LOOP;
    END IF;
    -- If only champion alive on B, target champion
    IF v_def_idx = -1 THEN v_def_idx := v_champ_b_idx; END IF;
    v_defender := v_units_b->v_def_idx;

    -- Calculate damage
    v_tmp_atk := (v_attacker->>'atk')::int;
    v_tmp_def := (v_defender->>'def')::int;
    -- Crit: 20% chance, seeded from round + attacker power
    v_is_crit := ((v_round * 7 + (v_attacker->>'power')::int * 3) % 10) >= 8;
    IF v_is_crit THEN v_tmp_atk := ROUND(v_tmp_atk * 1.5); END IF;
    -- Veil/Shield absorbs first hit then is removed
    IF (v_defender->>'shielded')::bool THEN
      v_damage := 0;
      v_units_b := jsonb_set(v_units_b, ARRAY[v_def_idx::text, 'shielded'], 'false'::jsonb);
    ELSE
      v_damage := GREATEST(1, v_tmp_atk - v_tmp_def);
    END IF;
    -- Lifesteal (Drain keyword): heal 30% of damage
    v_heal_amount := 0;
    IF (v_attacker->>'lifesteal')::bool AND v_damage > 0 THEN
      v_heal_amount := GREATEST(1, ROUND(v_damage * 0.3));
      v_new_hp      := LEAST((v_attacker->>'max_hp')::int,
                             (v_attacker->>'hp')::int + v_heal_amount);
      v_units_a := jsonb_set(v_units_a, ARRAY[v_attk_idx::text, 'hp'], to_jsonb(v_new_hp));
    END IF;
    -- Apply damage to defender
    v_new_hp   := GREATEST(0, (v_defender->>'hp')::int - v_damage);
    v_is_kill  := (v_new_hp = 0);
    v_units_b  := jsonb_set(v_units_b, ARRAY[v_def_idx::text, 'hp'], to_jsonb(v_new_hp));
    IF v_is_kill THEN
      v_units_b := jsonb_set(v_units_b, ARRAY[v_def_idx::text, 'alive'], 'false'::jsonb);
      IF v_def_idx = v_champ_b_idx THEN
        v_champ_b_alive := false;
        v_champ_b_hp    := 0;
      END IF;
    ELSE
      IF v_def_idx = v_champ_b_idx THEN
        v_champ_b_hp := v_new_hp;
      END IF;
    END IF;

    -- Build turn data (BattleTurnData shape)
    v_turn_num := v_turn_num + 1;
    v_events   := '[]'::jsonb;
    IF v_heal_amount > 0 THEN
      v_events := jsonb_build_array(jsonb_build_object('type', 'lifesteal', 'side', 'a', 'heal', v_heal_amount));
    END IF;
    -- Promote the best reserve unit immediately when an active support dies.
    IF v_is_kill AND v_def_idx <> v_champ_b_idx THEN
      v_replacement_slot := CASE WHEN v_def_idx = v_vanguard_b_idx THEN 'vanguard' ELSE 'sentinel' END;
      v_replacement_idx := -1;
      v_replacement_score := -1;
      FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
        IF COALESCE((v_units_b->v_i->>'in_reserve')::bool, false)
           AND (v_units_b->v_i->>'alive')::bool THEN
          IF v_def_idx = v_vanguard_b_idx THEN
            v_tmp_atk := (v_units_b->v_i->>'def')::int * 100
              + CASE WHEN (v_units_b->v_i->>'guard')::bool THEN 10 ELSE 0 END;
          ELSE
            v_tmp_atk := (v_units_b->v_i->>'atk')::int * 100
              + (v_units_b->v_i->>'spd')::int;
          END IF;
          IF v_tmp_atk > v_replacement_score THEN
            v_replacement_score := v_tmp_atk;
            v_replacement_idx := v_i;
          END IF;
        END IF;
      END LOOP;
      IF v_replacement_idx >= 0 THEN
        v_units_b := jsonb_set(v_units_b, ARRAY[v_replacement_idx::text, 'in_reserve'], 'false'::jsonb);
        v_units_b := jsonb_set(v_units_b, ARRAY[v_replacement_idx::text, 'slot'], to_jsonb(v_replacement_slot));
        v_units_b := jsonb_set(v_units_b, ARRAY[v_def_idx::text, 'slot'], to_jsonb('fallen'::text));
        IF v_replacement_slot = 'vanguard' THEN
          v_units_b := jsonb_set(v_units_b, ARRAY[v_replacement_idx::text, 'guard'], 'true'::jsonb);
          v_vanguard_b_idx := v_replacement_idx;
        ELSE
          v_sentinel_b_idx := v_replacement_idx;
        END IF;
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'reserve_activation',
          'id', v_units_b->v_replacement_idx->>'id',
          'unit', v_units_b->v_replacement_idx->>'name',
          'side', 'b',
          'slot', v_replacement_slot
        ));
      END IF;
    END IF;
    -- Count alive after damage
    v_alive_a := 0;
    v_alive_b := 0;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false)
      THEN v_alive_a := v_alive_a + 1; END IF;
    END LOOP;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false)
      THEN v_alive_b := v_alive_b + 1; END IF;
    END LOOP;

    v_turns := v_turns || jsonb_build_array(jsonb_build_object(
      'turn',          v_turn_num,
      'atk_side',      'a',
      'attacker',      jsonb_build_object(
        'id',        v_attacker->>'id',
        'slot',      v_attacker->>'slot',
        'name',      v_attacker->>'name',
        'faction',   v_attacker->>'faction',
        'rarity',    v_attacker->>'rarity',
        'image_url', v_attacker->>'image_url',
        'hp',        (v_units_a->v_attk_idx->>'hp')::int,
        'max_hp',    (v_attacker->>'max_hp')::int,
        'atk',       (v_attacker->>'atk')::int,
        'def',       (v_attacker->>'def')::int,
        'spd',       (v_attacker->>'spd')::int,
        'keywords',  v_attacker->'keywords'
      ),
      'defender',      jsonb_build_object(
        'id',        v_defender->>'id',
        'slot',      v_defender->>'slot',
        'name',      v_defender->>'name',
        'faction',   v_defender->>'faction',
        'rarity',    v_defender->>'rarity',
        'image_url', v_defender->>'image_url',
        'hp',        v_new_hp,
        'max_hp',    (v_defender->>'max_hp')::int
      ),
      'damage',        v_damage,
      'is_crit',       v_is_crit,
      'is_kill',       v_is_kill,
      'lifesteal_heal',v_heal_amount,
      'events',        v_events,
      'alive_a',       v_alive_a,
      'alive_b',       v_alive_b
    ));

    EXIT WHEN NOT v_champ_b_alive;

    --------------------------------------------------------------------------
    -- Side B attacks (same logic, mirrored)
    --------------------------------------------------------------------------
    EXIT WHEN v_alive_b = 0;

    v_best_spd := -1;
    v_best_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false) THEN
        v_tmp_spd := (v_units_b->v_i->>'spd')::int;
        IF v_tmp_spd > v_best_spd THEN
          v_best_spd := v_tmp_spd;
          v_best_idx := v_i;
        END IF;
      END IF;
    END LOOP;
    v_attk_idx := v_best_idx;
    v_attacker  := v_units_b->v_attk_idx;

    -- Target on side A: guard first, then lowest HP non-champion, then champion
    v_def_idx := -1;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false)
         AND (v_units_a->v_i->>'guard')::bool THEN
        v_def_idx := v_i;
        EXIT;
      END IF;
    END LOOP;
    IF v_def_idx = -1 THEN
      v_tmp_hp := 99999;
      FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
        IF (v_units_a->v_i->>'alive')::bool
           AND NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false)
           AND v_i != v_champ_a_idx THEN
          IF (v_units_a->v_i->>'hp')::int < v_tmp_hp THEN
            v_tmp_hp  := (v_units_a->v_i->>'hp')::int;
            v_def_idx := v_i;
          END IF;
        END IF;
      END LOOP;
    END IF;
    IF v_def_idx = -1 THEN v_def_idx := v_champ_a_idx; END IF;
    v_defender := v_units_a->v_def_idx;

    v_tmp_atk := (v_attacker->>'atk')::int;
    v_tmp_def := (v_defender->>'def')::int;
    v_is_crit := ((v_round * 11 + (v_attacker->>'power')::int * 5) % 10) >= 8;
    IF v_is_crit THEN v_tmp_atk := ROUND(v_tmp_atk * 1.5); END IF;
    IF (v_defender->>'shielded')::bool THEN
      v_damage := 0;
      v_units_a := jsonb_set(v_units_a, ARRAY[v_def_idx::text, 'shielded'], 'false'::jsonb);
    ELSE
      v_damage := GREATEST(1, v_tmp_atk - v_tmp_def);
    END IF;
    v_heal_amount := 0;
    IF (v_attacker->>'lifesteal')::bool AND v_damage > 0 THEN
      v_heal_amount := GREATEST(1, ROUND(v_damage * 0.3));
      v_new_hp      := LEAST((v_attacker->>'max_hp')::int,
                             (v_attacker->>'hp')::int + v_heal_amount);
      v_units_b := jsonb_set(v_units_b, ARRAY[v_attk_idx::text, 'hp'], to_jsonb(v_new_hp));
    END IF;
    v_new_hp  := GREATEST(0, (v_defender->>'hp')::int - v_damage);
    v_is_kill := (v_new_hp = 0);
    v_units_a := jsonb_set(v_units_a, ARRAY[v_def_idx::text, 'hp'], to_jsonb(v_new_hp));
    IF v_is_kill THEN
      v_units_a := jsonb_set(v_units_a, ARRAY[v_def_idx::text, 'alive'], 'false'::jsonb);
      IF v_def_idx = v_champ_a_idx THEN
        v_champ_a_alive := false;
        v_champ_a_hp    := 0;
      END IF;
    ELSE
      IF v_def_idx = v_champ_a_idx THEN
        v_champ_a_hp := v_new_hp;
      END IF;
    END IF;

    v_turn_num := v_turn_num + 1;
    v_events   := '[]'::jsonb;
    IF v_heal_amount > 0 THEN
      v_events := jsonb_build_array(jsonb_build_object('type', 'lifesteal', 'side', 'b', 'heal', v_heal_amount));
    END IF;
    -- Promote the best reserve unit immediately when an active support dies.
    IF v_is_kill AND v_def_idx <> v_champ_a_idx THEN
      v_replacement_slot := CASE WHEN v_def_idx = v_vanguard_a_idx THEN 'vanguard' ELSE 'sentinel' END;
      v_replacement_idx := -1;
      v_replacement_score := -1;
      FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
        IF COALESCE((v_units_a->v_i->>'in_reserve')::bool, false)
           AND (v_units_a->v_i->>'alive')::bool THEN
          IF v_def_idx = v_vanguard_a_idx THEN
            v_tmp_atk := (v_units_a->v_i->>'def')::int * 100
              + CASE WHEN (v_units_a->v_i->>'guard')::bool THEN 10 ELSE 0 END;
          ELSE
            v_tmp_atk := (v_units_a->v_i->>'atk')::int * 100
              + (v_units_a->v_i->>'spd')::int;
          END IF;
          IF v_tmp_atk > v_replacement_score THEN
            v_replacement_score := v_tmp_atk;
            v_replacement_idx := v_i;
          END IF;
        END IF;
      END LOOP;
      IF v_replacement_idx >= 0 THEN
        v_units_a := jsonb_set(v_units_a, ARRAY[v_replacement_idx::text, 'in_reserve'], 'false'::jsonb);
        v_units_a := jsonb_set(v_units_a, ARRAY[v_replacement_idx::text, 'slot'], to_jsonb(v_replacement_slot));
        v_units_a := jsonb_set(v_units_a, ARRAY[v_def_idx::text, 'slot'], to_jsonb('fallen'::text));
        IF v_replacement_slot = 'vanguard' THEN
          v_units_a := jsonb_set(v_units_a, ARRAY[v_replacement_idx::text, 'guard'], 'true'::jsonb);
          v_vanguard_a_idx := v_replacement_idx;
        ELSE
          v_sentinel_a_idx := v_replacement_idx;
        END IF;
        v_events := v_events || jsonb_build_array(jsonb_build_object(
          'type', 'reserve_activation',
          'id', v_units_a->v_replacement_idx->>'id',
          'unit', v_units_a->v_replacement_idx->>'name',
          'side', 'a',
          'slot', v_replacement_slot
        ));
      END IF;
    END IF;
    v_alive_a := 0;
    v_alive_b := 0;
    FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
      IF (v_units_a->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false)
      THEN v_alive_a := v_alive_a + 1; END IF;
    END LOOP;
    FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
      IF (v_units_b->v_i->>'alive')::bool
         AND NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false)
      THEN v_alive_b := v_alive_b + 1; END IF;
    END LOOP;

    v_turns := v_turns || jsonb_build_array(jsonb_build_object(
      'turn',          v_turn_num,
      'atk_side',      'b',
      'attacker',      jsonb_build_object(
        'id',        v_attacker->>'id',
        'slot',      v_attacker->>'slot',
        'name',      v_attacker->>'name',
        'faction',   v_attacker->>'faction',
        'rarity',    v_attacker->>'rarity',
        'image_url', v_attacker->>'image_url',
        'hp',        (v_units_b->v_attk_idx->>'hp')::int,
        'max_hp',    (v_attacker->>'max_hp')::int,
        'atk',       (v_attacker->>'atk')::int,
        'def',       (v_attacker->>'def')::int,
        'spd',       (v_attacker->>'spd')::int,
        'keywords',  v_attacker->'keywords'
      ),
      'defender',      jsonb_build_object(
        'id',        v_defender->>'id',
        'slot',      v_defender->>'slot',
        'name',      v_defender->>'name',
        'faction',   v_defender->>'faction',
        'rarity',    v_defender->>'rarity',
        'image_url', v_defender->>'image_url',
        'hp',        v_new_hp,
        'max_hp',    (v_defender->>'max_hp')::int
      ),
      'damage',        v_damage,
      'is_crit',       v_is_crit,
      'is_kill',       v_is_kill,
      'lifesteal_heal',v_heal_amount,
      'events',        v_events,
      'alive_a',       v_alive_a,
      'alive_b',       v_alive_b
    ));

    EXIT WHEN NOT v_champ_a_alive;
  END LOOP;

  --------------------------------------------------------------------------
  -- 11. Determine winner
  -- Primary: champion death. Secondary: remaining total HP.
  --------------------------------------------------------------------------
  v_alive_a := 0;
  v_alive_b := 0;
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    IF (v_units_a->v_i->>'alive')::bool THEN v_alive_a := v_alive_a + 1; END IF;
  END LOOP;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    IF (v_units_b->v_i->>'alive')::bool THEN v_alive_b := v_alive_b + 1; END IF;
  END LOOP;

  IF NOT v_champ_b_alive AND v_champ_a_alive THEN
    v_winner_id := p_challenger_id;
  ELSIF NOT v_champ_a_alive AND v_champ_b_alive THEN
    v_winner_id := p_opponent_id;
  ELSIF NOT v_champ_a_alive AND NOT v_champ_b_alive THEN
    -- Simultaneous death: highest remaining HP total wins
    IF v_champ_a_hp >= v_champ_b_hp THEN
      v_winner_id := p_challenger_id;
    ELSE
      v_winner_id := p_opponent_id;
    END IF;
  ELSE
    -- Max rounds reached: winner by total HP remaining
    DECLARE v_hp_sum_a int := 0; v_hp_sum_b int := 0;
    BEGIN
      FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
        IF (v_units_a->v_i->>'alive')::bool
           AND NOT COALESCE((v_units_a->v_i->>'in_reserve')::bool, false) THEN
          v_hp_sum_a := v_hp_sum_a + (v_units_a->v_i->>'hp')::int;
        END IF;
      END LOOP;
      FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
        IF (v_units_b->v_i->>'alive')::bool
           AND NOT COALESCE((v_units_b->v_i->>'in_reserve')::bool, false) THEN
          v_hp_sum_b := v_hp_sum_b + (v_units_b->v_i->>'hp')::int;
        END IF;
      END LOOP;
      IF v_hp_sum_a >= v_hp_sum_b THEN
        v_winner_id := p_challenger_id;
      ELSE
        v_winner_id := p_opponent_id;
      END IF;
    END;
  END IF;

  v_you_won := (v_winner_id = p_challenger_id);

  --------------------------------------------------------------------------
  -- 12. ELO calculation (K=32, standard Elo formula)
  --------------------------------------------------------------------------
  v_exp_a   := 1.0 / (1.0 + power(10.0, (v_mmr_b - v_mmr_a) / 400.0));
  IF v_you_won THEN
    v_elo_a := ROUND(v_k * (1.0 - v_exp_a));
    v_elo_b := -ROUND(v_k * v_exp_a);
  ELSE
    v_elo_a := -ROUND(v_k * (1.0 - v_exp_a));
    v_elo_b := ROUND(v_k * v_exp_a);
  END IF;
  -- Minimum ELO floor: never drop below 100 MMR
  v_elo_a := GREATEST(v_elo_a, -(v_mmr_a - 100)::int);
  v_elo_b := GREATEST(v_elo_b, -(v_mmr_b - 100)::int);

  --------------------------------------------------------------------------
  -- 13. Build final_units for response
  --------------------------------------------------------------------------
  FOR v_i IN 0 .. jsonb_array_length(v_units_a) - 1 LOOP
    v_final_units := v_final_units || jsonb_build_array(v_units_a->v_i);
  END LOOP;
  FOR v_i IN 0 .. jsonb_array_length(v_units_b) - 1 LOOP
    v_final_units := v_final_units || jsonb_build_array(v_units_b->v_i);
  END LOOP;

  --------------------------------------------------------------------------
  -- 14. Insert pvp_match (authoritative record)
  --------------------------------------------------------------------------
  INSERT INTO public.pvp_matches (
    reference_id,
    player_a,
    player_b,
    winner,
    status,
    elo_change_a,
    elo_change_b,
    power_snapshot_a,
    power_snapshot_b,
    rewards_json,
    metadata,
    resolved_at
  ) VALUES (
    p_idempotency_key,
    p_challenger_id,
    p_opponent_id,
    v_winner_id,
    'resolved',
    v_elo_a,
    v_elo_b,
    jsonb_build_object('total_power', v_power_a),
    jsonb_build_object('total_power', v_power_b),
    jsonb_build_object(
      'winner_vex', CASE WHEN v_you_won THEN v_vex_winner ELSE v_vex_loser END,
      'loser_vex',  CASE WHEN v_you_won THEN v_vex_loser  ELSE v_vex_winner END
    ),
    jsonb_build_object(
      'total_turns',  v_turn_num,
      'turns',        v_turns,
      'final_units',  v_final_units,
      'engine',       'vexforge_battle_resolve_v1',
      'pure_bonus_a', v_same_faction_a,
      'pure_bonus_b', v_same_faction_b,
      'reserve_a',    v_reserve_a_count,
      'reserve_b',    v_reserve_b_count
    ),
    now()
  )
  RETURNING id INTO v_match_id;

  --------------------------------------------------------------------------
  -- 15. Upsert pvp_rankings for both players
  --------------------------------------------------------------------------
  IF v_season_id IS NOT NULL THEN
    INSERT INTO public.pvp_rankings (season_id, player_id, mmr, wins, losses, draws, updated_at)
    VALUES (
      v_season_id, p_challenger_id,
      GREATEST(100, v_mmr_a + v_elo_a),
      CASE WHEN v_you_won THEN 1 ELSE 0 END,
      CASE WHEN v_you_won THEN 0 ELSE 1 END,
      0,
      now()
    )
    ON CONFLICT (season_id, player_id) DO UPDATE
      SET mmr     = GREATEST(100, pvp_rankings.mmr + v_elo_a),
          wins    = pvp_rankings.wins    + CASE WHEN v_you_won THEN 1 ELSE 0 END,
          losses  = pvp_rankings.losses  + CASE WHEN v_you_won THEN 0 ELSE 1 END,
          updated_at = now();

    INSERT INTO public.pvp_rankings (season_id, player_id, mmr, wins, losses, draws, updated_at)
    VALUES (
      v_season_id, p_opponent_id,
      GREATEST(100, v_mmr_b + v_elo_b),
      CASE WHEN NOT v_you_won THEN 1 ELSE 0 END,
      CASE WHEN NOT v_you_won THEN 0 ELSE 1 END,
      0,
      now()
    )
    ON CONFLICT (season_id, player_id) DO UPDATE
      SET mmr     = GREATEST(100, pvp_rankings.mmr + v_elo_b),
          wins    = pvp_rankings.wins    + CASE WHEN NOT v_you_won THEN 1 ELSE 0 END,
          losses  = pvp_rankings.losses  + CASE WHEN NOT v_you_won THEN 0 ELSE 1 END,
          updated_at = now();
  END IF;

  --------------------------------------------------------------------------
  -- 16. Wallet rewards via wallet_tx helper (same pattern as T1-F, T1-G)
  --------------------------------------------------------------------------
  v_ref_a := 'pvp_' || p_idempotency_key || '_challenger';
  v_ref_b := 'pvp_' || p_idempotency_key || '_opponent';

  PERFORM public.wallet_tx(
    p_challenger_id,
    'vex_ingame',
    CASE WHEN v_you_won THEN v_vex_winner ELSE v_vex_loser END,
    'combat_reward',
    v_ref_a,
    'pvp_matches',
    v_match_id,
    jsonb_build_object(
      'match_id',  v_match_id,
      'outcome',   CASE WHEN v_you_won THEN 'win' ELSE 'loss' END,
      'elo_delta', v_elo_a
    )
  );

  PERFORM public.wallet_tx(
    p_opponent_id,
    'vex_ingame',
    CASE WHEN NOT v_you_won THEN v_vex_winner ELSE v_vex_loser END,
    'combat_reward',
    v_ref_b,
    'pvp_matches',
    v_match_id,
    jsonb_build_object(
      'match_id',  v_match_id,
      'outcome',   CASE WHEN NOT v_you_won THEN 'win' ELSE 'loss' END,
      'elo_delta', v_elo_b
    )
  );

  --------------------------------------------------------------------------
  -- 17. XP reward via player_progress update
  --------------------------------------------------------------------------
  -- Challenger XP
  INSERT INTO public.player_progress (
    player_id, level, xp, xp_to_next, energy, max_energy, created_at, updated_at
  ) VALUES (
    p_challenger_id, 1, 0, public.get_xp_required(1), 100, 100, now(), now()
  )
  ON CONFLICT (player_id) DO NOTHING;

  SELECT level, xp INTO v_level_a, v_xp_a
    FROM public.player_progress
   WHERE player_id = p_challenger_id FOR UPDATE;
  v_xp_a   := v_xp_a + CASE WHEN v_you_won THEN v_xp_winner ELSE v_xp_loser END;
  v_xp_req_a := public.get_xp_required(v_level_a);
  WHILE v_xp_a >= v_xp_req_a LOOP
    v_xp_a   := v_xp_a - v_xp_req_a;
    v_level_a := v_level_a + 1;
    v_xp_req_a := public.get_xp_required(v_level_a);
  END LOOP;
  UPDATE public.player_progress
     SET level = v_level_a, xp = v_xp_a, xp_to_next = v_xp_req_a, updated_at = now()
   WHERE player_id = p_challenger_id;

  -- Opponent XP
  INSERT INTO public.player_progress (
    player_id, level, xp, xp_to_next, energy, max_energy, created_at, updated_at
  ) VALUES (
    p_opponent_id, 1, 0, public.get_xp_required(1), 100, 100, now(), now()
  )
  ON CONFLICT (player_id) DO NOTHING;

  SELECT level, xp INTO v_level_b, v_xp_b
    FROM public.player_progress
   WHERE player_id = p_opponent_id FOR UPDATE;
  v_xp_b   := v_xp_b + CASE WHEN NOT v_you_won THEN v_xp_winner ELSE v_xp_loser END;
  v_xp_req_b := public.get_xp_required(v_level_b);
  WHILE v_xp_b >= v_xp_req_b LOOP
    v_xp_b   := v_xp_b - v_xp_req_b;
    v_level_b := v_level_b + 1;
    v_xp_req_b := public.get_xp_required(v_level_b);
  END LOOP;
  UPDATE public.player_progress
     SET level = v_level_b, xp = v_xp_b, xp_to_next = v_xp_req_b, updated_at = now()
   WHERE player_id = p_opponent_id;

  --------------------------------------------------------------------------
  -- 18. Achievements check for challenger
  --------------------------------------------------------------------------
  PERFORM public.fn_check_and_grant_achievements(p_challenger_id);

  --------------------------------------------------------------------------
  -- 19. Return RealBattleResult-compatible JSON
  --------------------------------------------------------------------------
  RETURN jsonb_build_object(
    'ok',           true,
    'match_id',     v_match_id,
    'winner_id',    v_winner_id,
    'you_won',      v_you_won,
    'elo_change',   v_elo_a,
    'total_turns',  v_turn_num,
    'turns',        v_turns,
    'final_units',  v_final_units,
    'engine',       'vexforge_battle_resolve_v1',
    'challenger_name', v_challenger_name,
    'opponent_name',   v_opponent_name,
    'mmr_before_a',    v_mmr_a,
    'mmr_after_a',     GREATEST(100, v_mmr_a + v_elo_a),
    'mmr_before_b',    v_mmr_b,
    'mmr_after_b',     GREATEST(100, v_mmr_b + v_elo_b),
    'pure_bonus_a',    v_same_faction_a,
    'pure_bonus_b',    v_same_faction_b
  );

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err_context = PG_EXCEPTION_CONTEXT;
  RETURN jsonb_build_object(
    'ok',       false,
    'error',    SQLERRM,
    'sqlstate', SQLSTATE,
    'context',  v_err_context
  );
END;

$function$

-- public.vexforge_buy_market_listing_quarantine_parallel_econstate(p_buyer_id uuid, p_listing_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_buy_market_listing_quarantine_parallel_econstate(p_buyer_id uuid, p_listing_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_listing record;
    v_buyer_before numeric;
    v_buyer_after numeric;
    v_seller_before numeric;
    v_seller_after numeric;
    v_fee numeric;
    v_net numeric;
    v_card_id uuid;
    v_temp_player_card_id uuid;
begin
    select *
    into v_listing
    from market_listings
    where id = p_listing_id
    for update;

    if not found then
        raise exception 'Listing not found';
    end if;

    if v_listing.status::text <> 'active' then
        raise exception 'Listing is not active';
    end if;

    if v_listing.player_id = p_buyer_id then
        raise exception 'Buyer cannot be seller';
    end if;

    if v_listing.expires_at is not null and v_listing.expires_at < now() then
        raise exception 'Listing expired';
    end if;

    select pc.card_id
    into v_card_id
    from player_cards pc
    where pc.id = v_listing.player_card_id
    for update;

    if v_card_id is null then
        raise exception 'Listing card not found';
    end if;

    v_fee := coalesce(v_listing.fee, vexforge_market_fee(v_listing.price));
    v_net := greatest(coalesce(v_listing.price, 0) - v_fee, 0);

    -- Buyer balance check and debit
    select coalesce(trade_balance, 0)
    into v_buyer_before
    from player_economy_state
    where player_id = p_buyer_id
    for update;

    if v_buyer_before < v_listing.price then
        raise exception 'Buyer has insufficient trade balance';
    end if;

    v_buyer_after := v_buyer_before - v_listing.price;

    update player_economy_state
    set trade_balance = v_buyer_after,
        updated_at = now()
    where player_id = p_buyer_id;

    -- Seller credit
    select coalesce(trade_balance, 0)
    into v_seller_before
    from player_economy_state
    where player_id = v_listing.player_id
    for update;

    if not found then
        v_seller_before := 0;
    end if;

    v_seller_after := v_seller_before + v_net;

    if exists (
        select 1 from player_economy_state where player_id = v_listing.player_id
    ) then
        update player_economy_state
        set trade_balance = v_seller_after,
            updated_at = now()
        where player_id = v_listing.player_id;
    else
        insert into player_economy_state (
            player_id,
            vex_balance,
            trade_balance,
            energy,
            last_activity,
            decision_energy,
            participation_score,
            updated_at
        )
        values (
            v_listing.player_id,
            0,
            v_seller_after,
            100,
            now(),
            0,
            0,
            now()
        );
    end if;

    -- Ledger: buyer debit
    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        concat('market_buy_', p_listing_id::text),
        p_buyer_id,
        'debit',
        'vex_tradeable',
        v_listing.price,
        v_buyer_before,
        v_buyer_after,
        'market_listings',
        p_listing_id::text,
        jsonb_build_object(
            'type', 'market_purchase',
            'card_id', v_card_id,
            'seller_id', v_listing.player_id
        ),
        now(),
        true
    );

    -- Ledger: seller credit
    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        concat('market_sell_', p_listing_id::text),
        v_listing.player_id,
        'credit',
        'vex_tradeable',
        v_net,
        v_seller_before,
        v_seller_after,
        'market_listings',
        p_listing_id::text,
        jsonb_build_object(
            'type', 'market_sale',
            'card_id', v_card_id,
            'buyer_id', p_buyer_id,
            'fee', v_fee
        ),
        now(),
        true
    );

    -- Ledger: fee sink
    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        concat('market_fee_', p_listing_id::text),
        null,
        'fee',
        'vex_tradeable',
        v_fee,
        null,
        null,
        'market_fee',
        p_listing_id::text,
        jsonb_build_object(
            'type', 'market_fee',
            'buyer_id', p_buyer_id,
            'seller_id', v_listing.player_id,
            'listing_price', v_listing.price
        ),
        now(),
        true
    );

    -- Transfer listed card unit to buyer
    update player_cards
    set player_id = p_buyer_id,
        locked = false,
        listed = false,
        updated_at = now()
    where id = v_listing.player_card_id;

    -- Mark listing sold
    update market_listings
    set status = 'sold',
        locked = false,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'sold_at', now(),
            'buyer_id', p_buyer_id,
            'seller_net', v_net,
            'fee', v_fee
        ),
        updated_at = now()
    where id = p_listing_id;

    return jsonb_build_object(
        'ok', true,
        'listing_id', p_listing_id,
        'buyer_id', p_buyer_id,
        'seller_id', v_listing.player_id,
        'price', v_listing.price,
        'fee', v_fee,
        'seller_net', v_net,
        'card_id', v_card_id
    );
end;
$function$

-- public.vexforge_buy_pack_with_vex(p_pack_key text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_buy_pack_with_vex(p_pack_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_pack record;
  v_order_id uuid;
  v_price_vex numeric;
  v_before numeric;
  v_after numeric;
BEGIN
  SELECT id
    INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'player_not_found');
  END IF;

  SELECT *
    INTO v_pack
    FROM public.vexforge_pack_catalog
   WHERE pack_key = p_pack_key
     AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'pack_not_found');
  END IF;

  v_price_vex := COALESCE(v_pack.price_vex, floor(v_pack.price_usdt * 100));
  IF v_price_vex <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_pack_price');
  END IF;

  -- Lock the wallet before checking and changing the balance.
  SELECT vex_tradeable
    INTO v_before
    FROM public.player_wallet
   WHERE player_id = v_player_id
   FOR UPDATE;

  IF v_before IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'wallet_not_found');
  END IF;

  IF v_before < v_price_vex THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'insufficient_vex',
      'needed', v_price_vex,
      'balance', v_before
    );
  END IF;

  v_after := v_before - v_price_vex;

  INSERT INTO public.vexforge_pack_orders (
    player_id,
    pack_key,
    price_usdt,
    status,
    payment_method,
    metadata
  )
  VALUES (
    v_player_id,
    p_pack_key,
    v_pack.price_usdt,
    'paid',
    'vex_tradeable',
    jsonb_build_object('purchase_currency', 'vex_tradeable')
  )
  RETURNING id INTO v_order_id;

  UPDATE public.player_wallet
     SET vex_tradeable = v_after,
         updated_at = now()
   WHERE player_id = v_player_id;

  INSERT INTO public.economy_ledger (
    player_id,
    entry_type,
    currency,
    amount,
    balance_before,
    balance_after,
    reference_id,
    source_table,
    source_id,
    metadata,
    created_at,
    is_final
  )
  VALUES (
    v_player_id,
    'pack_purchase'::public.ledger_entry_type,
    'vex_tradeable',
    v_price_vex,
    v_before,
    v_after,
    'pack:' || v_order_id::text,
    'vexforge_pack_orders',
    v_order_id::text,
    jsonb_build_object(
      'pack_key', p_pack_key,
      'order_id', v_order_id,
      'purchase_currency', 'vex_tradeable'
    ),
    now(),
    true
  );

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'pack_key', p_pack_key,
    'vex_spent', v_price_vex,
    'balance_after', v_after
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'reason', SQLERRM);
END;
$function$

-- public.vexforge_cancel_market_listing_quarantine_duplicate_path(p_player_id uuid, p_listing_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_cancel_market_listing_quarantine_duplicate_path(p_player_id uuid, p_listing_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_listing record;
    v_card_id uuid;
begin
    select *
    into v_listing
    from market_listings
    where id = p_listing_id
    for update;

    if not found then
        raise exception 'Listing not found';
    end if;

    if v_listing.player_id <> p_player_id then
        raise exception 'Only the seller can cancel this listing';
    end if;

    if v_listing.status::text <> 'active' then
        raise exception 'Listing is not active';
    end if;

    select pc.card_id
    into v_card_id
    from player_cards pc
    where pc.id = v_listing.player_card_id
    for update;

    if v_card_id is null then
        raise exception 'Listed card row not found';
    end if;

    -- Return the unit to seller
    update player_cards
    set player_id = p_player_id,
        locked = false,
        listed = false,
        updated_at = now()
    where id = v_listing.player_card_id;

    update market_listings
    set status = 'cancelled',
        locked = false,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'cancelled_at', now()
        ),
        updated_at = now()
    where id = p_listing_id;

    return jsonb_build_object(
        'ok', true,
        'listing_id', p_listing_id,
        'seller_id', p_player_id,
        'card_id', v_card_id
    );
end;
$function$

-- public.vexforge_check_channel_join(p_telegram_id bigint, p_channel_handle text, p_joined boolean) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_check_channel_join(p_telegram_id bigint, p_channel_handle text, p_joined boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id   uuid;
  v_check_id    uuid;
  v_campaign    record;
  v_reward_val  numeric := 0;
  v_reference   text;
  v_already     boolean := false;
  v_brake       boolean;
BEGIN
  SELECT emergency_brake INTO v_brake FROM meta_system_state LIMIT 1;
  IF v_brake THEN RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active'); END IF;

  -- Idempotency: already rewarded for this channel?
  SELECT EXISTS(
    SELECT 1 FROM telegram_join_checks
    WHERE telegram_id = p_telegram_id AND channel_handle = p_channel_handle AND joined = true
  ) INTO v_already;

  -- Upsert join check record
  INSERT INTO telegram_join_checks (telegram_id, channel_handle, joined, metadata)
  VALUES (p_telegram_id, p_channel_handle, p_joined, jsonb_build_object('checked_at', now()))
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_check_id;

  -- Resolve player
  SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id AND status = 'active' LIMIT 1;

  -- Award channel join reward (once per channel, per user)
  IF p_joined AND NOT v_already AND v_player_id IS NOT NULL THEN
    SELECT reward_type, reward_value INTO v_campaign.reward_type, v_campaign.reward_value
    FROM telegram_campaigns WHERE campaign_key = 'channel_join_reward' AND active = true LIMIT 1;

    v_reward_val := COALESCE(v_campaign.reward_value, vexforge_get_policy_numeric('channel_join_reward', 25));
    v_reference  := 'tg_join_' || p_telegram_id::text || '_' || md5(p_channel_handle);

    PERFORM wallet_tx(v_player_id, COALESCE(v_campaign.reward_type, 'vex_ingame'), v_reward_val, 'in',
      v_reference, 'telegram_join_checks', COALESCE(v_check_id, gen_random_uuid()),
      jsonb_build_object('channel', p_channel_handle));

    INSERT INTO telegram_rewards_log (telegram_id, telegram_player_id, reward_type, amount, source_campaign, metadata)
    VALUES (p_telegram_id, v_player_id, COALESCE(v_campaign.reward_type, 'vex_ingame'), v_reward_val, 'channel_join_reward',
      jsonb_build_object('channel', p_channel_handle));

    PERFORM emit_game_event(v_player_id, 'channel_join_reward', v_reference,
      jsonb_build_object('channel', p_channel_handle, 'reward', v_reward_val));
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'joined', p_joined,
    'already_rewarded', v_already,
    'reward', CASE WHEN p_joined AND NOT v_already THEN v_reward_val ELSE 0 END,
    'player_linked', v_player_id IS NOT NULL
  );
END;
$function$

-- public.vexforge_column_doc_coverage(_tables text[]) | SECURITY DEFINER | RETURNS TABLE(total_columns integer, undocumented integer, missing text[])
CREATE OR REPLACE FUNCTION public.vexforge_column_doc_coverage(_tables text[])
 RETURNS TABLE(total_columns integer, undocumented integer, missing text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  with c as (
    select cl.relname || '.' || a.attname as ref,
           col_description(a.attrelid, a.attnum) as cmt
    from pg_attribute a
    join pg_class cl on cl.oid = a.attrelid
    join pg_namespace n on n.oid = cl.relnamespace
    where n.nspname = 'public'
      and cl.relkind = 'r'
      and a.attnum > 0
      and not a.attisdropped
      and cl.relname = any(_tables)
  )
  select
    count(*)::integer,
    count(*) filter (where cmt is null)::integer,
    coalesce(array_agg(ref order by ref) filter (where cmt is null), '{}'::text[])
  from c;
$function$

-- public.vexforge_complete_raid(p_raid_run_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_complete_raid(p_raid_run_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_caller_id uuid;
  v_is_admin boolean;
  v_raid record;
  v_participant record;
  v_reward_vex numeric;
  v_reward_xp numeric;
  v_reference_id text;
  v_rewarded integer := 0;
  v_total_contrib bigint;
  v_total_vex_distributed numeric := 0;
  v_total_xp_distributed bigint := 0;
  v_brake boolean;
BEGIN
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state
   LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  -- Manual completion is an admin operation. service_role is allowed for
  -- trusted automation; browser users must be an admin player.
  IF auth.role() <> 'service_role' THEN
    SELECT id, (is_admin OR is_super_admin)
      INTO v_caller_id, v_is_admin
      FROM public.players
     WHERE auth_user_id = auth.uid()
     LIMIT 1;
    IF v_caller_id IS NULL OR NOT COALESCE(v_is_admin, false) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Admin access required');
    END IF;
  END IF;

  -- The row lock makes completion a single transaction. A retry after the
  -- first completion returns success without issuing rewards again.
  SELECT * INTO v_raid
    FROM public.raid_runs
   WHERE id = p_raid_run_id
   FOR UPDATE;
  IF v_raid.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Raid not found');
  END IF;
  IF v_raid.status = 'completed' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_completed', true,
      'raid_code', v_raid.raid_code,
      'players_rewarded', 0,
      'status', 'completed'
    );
  END IF;
  IF v_raid.status <> 'active' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Raid is not active',
      'status', v_raid.status
    );
  END IF;

  SELECT COALESCE(SUM(contribution), 1)
    INTO v_total_contrib
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND status = 'joined';

  v_reward_vex := public.vexforge_get_policy_numeric('raid_completion_vex_reward', 100);
  v_reward_xp := public.vexforge_get_policy_numeric('raid_completion_xp_reward', 50);

  FOR v_participant IN
    SELECT id, player_id, contribution
      FROM public.raid_participants
     WHERE raid_run_id = p_raid_run_id
       AND status = 'joined'
     FOR UPDATE
  LOOP
    DECLARE
      v_share numeric := GREATEST(0.1, v_participant.contribution::numeric / v_total_contrib);
      v_player_reward_vex numeric := ROUND(v_reward_vex * v_share, 2);
      v_player_reward_xp integer := GREATEST(0, ROUND(v_reward_xp * v_share)::integer);
      v_level integer;
      v_xp bigint;
      v_xp_required integer;
    BEGIN
      v_player_reward_vex := GREATEST(
        v_player_reward_vex,
        public.vexforge_get_policy_numeric('boss_attack_min_reward', 1)
      );
      v_reference_id := 'raid_reward_' || p_raid_run_id::text || '_' ||
        v_participant.player_id::text;

      PERFORM public.wallet_tx(
        v_participant.player_id,
        'vex_ingame',
        v_player_reward_vex,
        'in',
        v_reference_id,
        'raid_participants',
        v_participant.id,
        jsonb_build_object(
          'raid_code', v_raid.raid_code,
          'contribution_share', v_share,
          'contribution', v_participant.contribution
        )
      );

      INSERT INTO public.raid_rewards (
        raid_run_id, player_id, reward_type, reward_currency, amount, metadata
      ) VALUES (
        p_raid_run_id,
        v_participant.player_id,
        'completion',
        'vex_ingame',
        v_player_reward_vex,
        jsonb_build_object(
          'share', v_share,
          'contribution', v_participant.contribution
        )
      );

      -- Apply XP atomically without using the legacy add_player_xp helper,
      -- whose live event-log call has an incompatible signature.
      INSERT INTO public.player_progress (
        player_id, level, xp, xp_to_next, energy, max_energy, created_at, updated_at
      ) VALUES (
        v_participant.player_id,
        1,
        0,
        public.get_xp_required(1),
        100,
        100,
        now(),
        now()
      )
      ON CONFLICT (player_id) DO NOTHING;

      SELECT level, xp
        INTO v_level, v_xp
        FROM public.player_progress
       WHERE player_id = v_participant.player_id
       FOR UPDATE;

      v_xp := v_xp + v_player_reward_xp;
      v_xp_required := public.get_xp_required(v_level);
      WHILE v_xp >= v_xp_required LOOP
        v_xp := v_xp - v_xp_required;
        v_level := v_level + 1;
        v_xp_required := public.get_xp_required(v_level);
      END LOOP;

      UPDATE public.player_progress
         SET level = v_level,
             xp = v_xp,
             xp_to_next = v_xp_required,
             updated_at = now()
       WHERE player_id = v_participant.player_id;

      INSERT INTO public.raid_rewards (
        raid_run_id, player_id, reward_type, reward_currency, amount, metadata
      ) VALUES (
        p_raid_run_id,
        v_participant.player_id,
        'completion',
        'xp',
        v_player_reward_xp,
        jsonb_build_object(
          'share', v_share,
          'contribution', v_participant.contribution,
          'level_after', v_level,
          'xp_after', v_xp
        )
      );

      UPDATE public.raid_participants
         SET status = 'rewarded', updated_at = now()
       WHERE id = v_participant.id;

      PERFORM public.emit_game_event(
        v_participant.player_id,
        'raid_completed',
        p_raid_run_id::text,
        jsonb_build_object(
          'reward_vex', v_player_reward_vex,
          'reward_xp', v_player_reward_xp,
          'share', v_share,
          'raid_code', v_raid.raid_code
        )
      );

      v_rewarded := v_rewarded + 1;
      v_total_vex_distributed := v_total_vex_distributed + v_player_reward_vex;
      v_total_xp_distributed := v_total_xp_distributed + v_player_reward_xp;
    END;
  END LOOP;

  UPDATE public.raid_runs
     SET status = 'completed', ended_at = now(), updated_at = now()
   WHERE id = p_raid_run_id;

  RETURN jsonb_build_object(
    'ok', true,
    'raid_code', v_raid.raid_code,
    'players_rewarded', v_rewarded,
    'total_vex_distributed', v_total_vex_distributed,
    'total_xp_distributed', v_total_xp_distributed,
    'status', 'completed'
  );
END;
$function$

-- public.vexforge_contribute_raid(p_raid_run_id uuid, p_contribution bigint) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_contribute_raid(p_raid_run_id uuid, p_contribution bigint DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_participant record;
  v_raid record;
  v_total_contrib bigint;
  v_brake boolean;
BEGIN
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state
   LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  IF p_contribution IS NULL OR p_contribution <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Invalid contribution');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  -- Lock the raid and participant so completion or another contribution
  -- cannot interleave with this update.
  SELECT * INTO v_raid
    FROM public.raid_runs
   WHERE id = p_raid_run_id
   FOR UPDATE;
  IF v_raid.id IS NULL OR v_raid.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Raid is not active');
  END IF;

  SELECT * INTO v_participant
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND player_id = v_player_id
     AND status = 'joined'
   FOR UPDATE;
  IF v_participant.id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Not a participant in this raid. Join first.'
    );
  END IF;

  p_contribution := LEAST(p_contribution, 10000);

  UPDATE public.raid_participants
     SET contribution = contribution + p_contribution,
         metadata = metadata || jsonb_build_object('last_contribution_at', now()),
         updated_at = now()
   WHERE id = v_participant.id
  RETURNING contribution INTO v_total_contrib;

  PERFORM public.emit_game_event(
    v_player_id,
    'raid_contribution',
    p_raid_run_id::text,
    jsonb_build_object(
      'contribution', p_contribution,
      'total', v_total_contrib
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'contribution_added', p_contribution,
    'total_contribution', v_total_contrib,
    'raid_code', v_raid.raid_code
  );
END;
$function$

-- public.vexforge_contribute_raid(p_raid_run_id uuid, p_contribution bigint, p_battle_run_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_contribute_raid(p_raid_run_id uuid, p_contribution bigint, p_battle_run_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_battle public.battle_runs%ROWTYPE;
  v_participant record;
  v_raid record;
  v_total_contrib bigint;
  v_existing record;
  v_snapshot_contribution bigint;
  v_brake boolean;
BEGIN
  SELECT emergency_brake INTO v_brake
  FROM public.meta_system_state
  LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;
  IF p_contribution IS NULL OR p_contribution <= 0 OR p_battle_run_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Invalid battle run or contribution');
  END IF;

  SELECT id INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  SELECT * INTO v_battle
  FROM public.battle_runs
  WHERE id = p_battle_run_id
    AND player_id = v_player_id
  FOR UPDATE;
  IF NOT FOUND
     OR v_battle.mode <> 'raid'
     OR v_battle.raid_run_id <> p_raid_run_id
     OR v_battle.status <> 'completed'
     OR v_battle.outcome IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Winning raid battle run required');
  END IF;

  v_snapshot_contribution := NULLIF(v_battle.result_snapshot->>'contribution', '')::bigint;
  IF v_snapshot_contribution IS NULL OR p_contribution <> v_snapshot_contribution THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Contribution does not match battle result');
  END IF;
  p_contribution := LEAST(p_contribution, 10000);

  SELECT * INTO v_existing
  FROM public.raid_contributions
  WHERE battle_run_id = p_battle_run_id;
  IF FOUND THEN
    SELECT contribution INTO v_total_contrib FROM public.raid_participants
    WHERE raid_run_id = p_raid_run_id AND player_id = v_player_id;
    RETURN jsonb_build_object(
      'ok', true, 'idempotent', true,
      'battle_run_id', p_battle_run_id,
      'contribution_added', v_existing.contribution,
      'total_contribution', v_total_contrib
    );
  END IF;

  SELECT * INTO v_raid
  FROM public.raid_runs
  WHERE id = p_raid_run_id
  FOR UPDATE;
  IF v_raid.id IS NULL OR v_raid.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Raid is not active');
  END IF;

  SELECT * INTO v_participant
  FROM public.raid_participants
  WHERE raid_run_id = p_raid_run_id
    AND player_id = v_player_id
    AND status = 'joined'
  FOR UPDATE;
  IF v_participant.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not a participant in this raid. Join first.');
  END IF;

  INSERT INTO public.raid_contributions (
    raid_run_id, player_id, battle_run_id, contribution
  ) VALUES (
    p_raid_run_id, v_player_id, p_battle_run_id, p_contribution
  );

  UPDATE public.raid_participants
  SET contribution = contribution + p_contribution,
      metadata = metadata || jsonb_build_object(
        'last_contribution_at', now(),
        'last_battle_run_id', p_battle_run_id
      ),
      updated_at = now()
  WHERE id = v_participant.id
  RETURNING contribution INTO v_total_contrib;

  PERFORM public.emit_game_event(
    v_player_id, 'raid_contribution', p_raid_run_id::text,
    jsonb_build_object(
      'contribution', p_contribution,
      'total', v_total_contrib,
      'battle_run_id', p_battle_run_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'battle_run_id', p_battle_run_id,
    'contribution_added', p_contribution,
    'total_contribution', v_total_contrib,
    'raid_code', v_raid.raid_code
  );
END;
$function$

-- public.vexforge_core_game_loop_quarantine_duplicate_path_crossdomain(p_player_id uuid, p_mission_run_id uuid, p_listing_reference_id text, p_market_price numeric) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_core_game_loop_quarantine_duplicate_path_crossdomain(p_player_id uuid, p_mission_run_id uuid, p_listing_reference_id text DEFAULT NULL::text, p_market_price numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                  declare
                      v_mission record;
                          v_reward numeric := 0;
                              v_card record;
                                  v_listing_id uuid;
                                      v_result jsonb;
                                      begin

                                          -- 1. VALIDATE MISSION RUN
                                              select *
                                                  into v_mission
                                                      from public.mission_runs
                                                          where id = p_mission_run_id
                                                              and player_id = p_player_id;

                                                                  if v_mission is null then
                                                                          raise exception 'mission_run_not_found';
                                                                              end if;

                                                                                  if v_mission.status = 'claimed' then
                                                                                          raise exception 'mission_already_claimed';
                                                                                              end if;

                                                                                                  -- 2. CALCULATE REWARD
                                                                                                      v_reward := coalesce(v_mission.ingame_reward, 0);

                                                                                                          -- 3. CLAIM MISSION
                                                                                                              update public.mission_runs
                                                                                                                  set status = 'claimed',
                                                                                                                          claimed_at = now(),
                                                                                                                                  updated_at = now()
                                                                                                                                      where id = p_mission_run_id;

                                                                                                                                          -- 4. WALLET CREDIT
                                                                                                                                              perform public.safe_wallet_transaction(
                                                                                                                                                      p_player_id,
                                                                                                                                                              'vex_ingame',
                                                                                                                                                                      v_reward,
                                                                                                                                                                              'credit',
                                                                                                                                                                                      'mission_' || p_mission_run_id::text,
                                                                                                                                                                                              'mission_runs',
                                                                                                                                                                                                      p_mission_run_id::text,
                                                                                                                                                                                                              jsonb_build_object('type', 'mission_reward')
                                                                                                                                                                                                                  );

                                                                                                                                                                                                                      -- 5. OPTIONAL MARKET LISTING CREATION
                                                                                                                                                                                                                          if p_listing_reference_id is not null and p_market_price is not null then

                                                                                                                                                                                                                                  select pc.*
                                                                                                                                                                                                                                          into v_card
                                                                                                                                                                                                                                                  from public.player_cards pc
                                                                                                                                                                                                                                                          where pc.player_id = p_player_id
                                                                                                                                                                                                                                                                  limit 1;

                                                                                                                                                                                                                                                                          insert into public.market_listings (
                                                                                                                                                                                                                                                                                      id,
                                                                                                                                                                                                                                                                                                  reference_id,
                                                                                                                                                                                                                                                                                                              player_id,
                                                                                                                                                                                                                                                                                                                          player_card_id,
                                                                                                                                                                                                                                                                                                                                      price,
                                                                                                                                                                                                                                                                                                                                                  fee,
                                                                                                                                                                                                                                                                                                                                                              status,
                                                                                                                                                                                                                                                                                                                                                                          locked,
                                                                                                                                                                                                                                                                                                                                                                                      metadata,
                                                                                                                                                                                                                                                                                                                                                                                                  created_at,
                                                                                                                                                                                                                                                                                                                                                                                                              updated_at
                                                                                                                                                                                                                                                                                                                                                                                                                      )
                                                                                                                                                                                                                                                                                                                                                                                                                              values (
                                                                                                                                                                                                                                                                                                                                                                                                                                          gen_random_uuid(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                      p_listing_reference_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  p_player_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              v_card.id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          p_market_price,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      round(p_market_price * 0.08, 2),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  'active',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              true,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          jsonb_build_object('auto', true),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      now(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  now()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  returning id into v_listing_id;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          -- 6. FINAL STATE RETURN
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              v_result := jsonb_build_object(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'ok', true,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              'mission_run_id', p_mission_run_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'reward', v_reward,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              'listing_created', v_listing_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'player_id', p_player_id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              return v_result;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              $function$

-- public.vexforge_create_market_listing_quarantine_duplicate_path(p_player_id uuid, p_player_card_id uuid, p_price numeric, p_duration_hours integer) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_create_market_listing_quarantine_duplicate_path(p_player_id uuid, p_player_card_id uuid, p_price numeric, p_duration_hours integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_card_id uuid;
    v_card_name text;
    v_card_code text;
    v_card_marketable boolean;
    v_card_market_fee_override numeric;
    v_src_qty integer;
    v_new_player_card_id uuid;
    v_listing_id uuid;
    v_fee numeric;
    v_listing_hours integer;
    v_expires_at timestamptz;
begin
    if coalesce(p_price, 0) <= 0 then
        raise exception 'Listing price must be greater than 0';
    end if;

    if p_duration_hours is null then
        select coalesce(policy_value_numeric::integer, 72)
        into v_listing_hours
        from vexforge_market_policy
        where policy_key = 'market_listing_hours';
    else
        v_listing_hours := p_duration_hours;
    end if;

    if v_listing_hours <= 0 then
        v_listing_hours := 72;
    end if;

    if v_listing_hours > (
        select coalesce(policy_value_numeric::integer, 168)
        from vexforge_market_policy
        where policy_key = 'market_max_listing_hours'
    ) then
        v_listing_hours := (
            select coalesce(policy_value_numeric::integer, 168)
            from vexforge_market_policy
            where policy_key = 'market_max_listing_hours'
        );
    end if;

    select pc.card_id, c.name, c.code, coalesce(c.marketable, true), c.market_fee_override, pc.quantity
    into v_card_id, v_card_name, v_card_code, v_card_marketable, v_card_market_fee_override, v_src_qty
    from player_cards pc
    join cards c on c.id = pc.card_id
    where pc.id = p_player_card_id
      and pc.player_id = p_player_id
    for update;

    if v_card_id is null then
        raise exception 'Player card not found or not owned by player';
    end if;

    if v_card_marketable is not true then
        raise exception 'This card is not marketable';
    end if;

    if v_src_qty is null or v_src_qty <= 0 then
        raise exception 'Not enough quantity to list';
    end if;

    select coalesce(policy_value_numeric, 1)
    into strict v_fee
    from vexforge_market_policy
    where policy_key = 'market_fee_pct';

    if v_card_market_fee_override is not null then
        v_fee := greatest(round(p_price * v_card_market_fee_override, 0), 0);
    else
        v_fee := vexforge_market_fee(p_price);
    end if;

    -- Move 1 unit from the source stack into a dedicated listed row
    update player_cards
    set quantity = quantity - 1,
        updated_at = now()
    where id = p_player_card_id;

    delete from player_cards
    where id = p_player_card_id
      and quantity <= 0;

    insert into player_cards (
        id,
        player_id,
        card_id,
        quantity,
        locked,
        listed,
        source_tracking,
        created_at,
        updated_at
    )
    values (
        gen_random_uuid(),
        p_player_id,
        v_card_id,
        1,
        true,
        true,
        jsonb_build_object(
            'type', 'market_listing',
            'origin_player_card_id', p_player_card_id,
            'origin_card_code', v_card_code,
            'origin_card_name', v_card_name
        ),
        now(),
        now()
    )
    returning id into v_new_player_card_id;

    v_expires_at := now() + make_interval(hours => v_listing_hours);

    insert into market_listings (
        id,
        player_id,
        player_card_id,
        price,
        fee,
        status,
        expires_at,
        locked,
        metadata,
        created_at,
        updated_at
    )
    values (
        gen_random_uuid(),
        p_player_id,
        v_new_player_card_id,
        p_price,
        v_fee,
        'active',
        v_expires_at,
        false,
        jsonb_build_object(
            'card_id', v_card_id,
            'card_code', v_card_code,
            'card_name', v_card_name,
            'fee_pct', coalesce(v_card_market_fee_override, (select policy_value_numeric from vexforge_market_policy where policy_key = 'market_fee_pct'))
        ),
        now(),
        now()
    )
    returning id into v_listing_id;

    return jsonb_build_object(
        'ok', true,
        'listing_id', v_listing_id,
        'player_card_id', v_new_player_card_id,
        'card_id', v_card_id,
        'price', p_price,
        'fee', v_fee,
        'expires_at', v_expires_at
    );
end;
$function$

-- public.vexforge_create_pack_order(p_player_id uuid, p_pack_key text, p_payment_reference text, p_player_wallet_address text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_create_pack_order(p_player_id uuid, p_pack_key text, p_payment_reference text DEFAULT NULL::text, p_player_wallet_address text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_pack record;
    v_treasury_wallet text;
    v_order_id uuid;
    v_auth_uid uuid;
BEGIN
    -- AUTH BINDING: si hay sesión autenticada, validar que p_player_id pertenece a auth.uid()
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM players
            WHERE id = p_player_id
              AND auth_user_id = v_auth_uid
        ) THEN
            RAISE EXCEPTION 'UNAUTHORIZED: player_id does not correspond to authenticated user';
        END IF;
    END IF;

    -- Verificar que el pack existe y está activo
    SELECT * INTO v_pack
    FROM vexforge_pack_catalog
    WHERE pack_key = p_pack_key AND active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pack not found or inactive: %', p_pack_key;
    END IF;

    -- Obtener wallet de tesorería activa
    SELECT wallet_address INTO v_treasury_wallet
    FROM vexforge_treasury
    WHERE active = true
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_treasury_wallet IS NULL THEN
        RAISE EXCEPTION 'No active treasury wallet configured';
    END IF;

    -- Crear la orden
    INSERT INTO vexforge_pack_orders (
        id, player_id, pack_key, price_usdt, status,
        payment_reference, treasury_wallet_address, metadata,
        created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        p_player_id,
        p_pack_key,
        v_pack.price_usdt,
        'pending_payment',
        p_payment_reference,
        v_treasury_wallet,
        jsonb_build_object(
            'player_wallet_address', p_player_wallet_address,
            'pack_name', v_pack.pack_name
        ),
        now(), now()
    )
    RETURNING id INTO v_order_id;

    RETURN jsonb_build_object(
        'ok', true,
        'order_id', v_order_id,
        'pack_key', p_pack_key,
        'pack_name', v_pack.pack_name,
        'price_usdt', v_pack.price_usdt,
        'treasury_wallet_address', v_treasury_wallet,
        'status', 'pending_payment'
    );
END;
$function$

-- public.vexforge_create_pack_order_quarantine_no_wallet_validation(p_player_id uuid, p_pack_key text, p_payment_reference text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_create_pack_order_quarantine_no_wallet_validation(p_player_id uuid, p_pack_key text, p_payment_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RAISE EXCEPTION 'QUARANTINED: This function is disabled. Use vexforge_create_pack_order instead.';
END;
$function$

-- public.vexforge_create_shop_order(p_item_key text, p_client_reference text, p_payment_reference text, p_tx_hash text, p_payer_wallet_address text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_create_shop_order(p_item_key text, p_client_reference text, p_payment_reference text DEFAULT NULL::text, p_tx_hash text DEFAULT NULL::text, p_payer_wallet_address text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_player_id uuid;
  v_item record;
  v_treasury record;
  v_existing record;
  v_order_id uuid;
BEGIN
  IF v_auth_uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','unauthorized'); END IF;
  IF nullif(trim(p_client_reference),'') IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','client_reference_required'); END IF;
  SELECT id INTO v_player_id FROM public.players WHERE auth_user_id=v_auth_uid;
  IF v_player_id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','player_not_found'); END IF;
  SELECT * INTO v_item FROM public.vexforge_shop_catalog WHERE item_key=p_item_key AND active=true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','item_not_found_or_inactive'); END IF;
  IF p_item_key <> 'season_pass_premium' THEN
    RETURN jsonb_build_object('ok',false,'reason','fulfillment_not_available','item_key',p_item_key);
  END IF;
  SELECT * INTO v_existing FROM public.vexforge_shop_orders WHERE player_id=v_player_id AND client_reference=trim(p_client_reference);
  IF FOUND THEN
    RETURN jsonb_build_object('ok',true,'idempotent_replay',true,'order_id',v_existing.id,'item_key',v_existing.item_key,'price_usdt',v_existing.price_usdt,'status',v_existing.status,'fulfillment_status',v_existing.fulfillment_status,'treasury_wallet_address',v_existing.treasury_wallet_address);
  END IF;
  SELECT * INTO v_treasury FROM public.vexforge_treasury WHERE active=true AND purpose='project_treasury' AND chain='BSC' AND token_symbol='USDT' ORDER BY created_at ASC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','no_active_usdt_treasury'); END IF;
  INSERT INTO public.vexforge_shop_orders(player_id,item_key,price_usdt,client_reference,payment_reference,tx_hash,treasury_wallet_address,payer_wallet_address,metadata)
  VALUES(v_player_id,p_item_key,v_item.price_usdt,trim(p_client_reference),nullif(trim(p_payment_reference),''),nullif(trim(p_tx_hash),''),v_treasury.wallet_address,nullif(trim(p_payer_wallet_address),''),jsonb_build_object('catalog_name',v_item.name,'catalog_category',v_item.category,'chain',v_treasury.chain,'token_symbol',v_treasury.token_symbol,'token_standard',v_treasury.token_standard))
  RETURNING id INTO v_order_id;
  RETURN jsonb_build_object('ok',true,'idempotent_replay',false,'order_id',v_order_id,'item_key',p_item_key,'item_name',v_item.name,'price_usdt',v_item.price_usdt,'status','pending_payment','fulfillment_status','pending','treasury_wallet_address',v_treasury.wallet_address,'chain',v_treasury.chain,'token_symbol',v_treasury.token_symbol,'token_standard',v_treasury.token_standard);
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing FROM public.vexforge_shop_orders WHERE player_id=v_player_id AND client_reference=trim(p_client_reference);
  IF FOUND THEN RETURN jsonb_build_object('ok',true,'idempotent_replay',true,'order_id',v_existing.id,'item_key',v_existing.item_key,'price_usdt',v_existing.price_usdt,'status',v_existing.status,'fulfillment_status',v_existing.fulfillment_status,'treasury_wallet_address',v_existing.treasury_wallet_address); END IF;
  RETURN jsonb_build_object('ok',false,'reason','order_conflict');
END;
$function$

-- public.vexforge_doc_coverage() | SECURITY DEFINER | RETURNS TABLE(total_tables integer, undocumented integer, missing text[])
CREATE OR REPLACE FUNCTION public.vexforge_doc_coverage()
 RETURNS TABLE(total_tables integer, undocumented integer, missing text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  with t as (
    select c.oid, c.relname, obj_description(c.oid) as cmt
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  )
  select
    count(*)::integer,
    count(*) filter (where cmt is null)::integer,
    coalesce(array_agg(relname order by relname) filter (where cmt is null), '{}'::text[])
  from t;
$function$

-- public.vexforge_enforce_card_supply_guard() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.vexforge_enforce_card_supply_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    if new.supply is not null and new.supply > 0 then
        if coalesce(new.minted, 0) > new.supply then
            new.minted := new.supply;
        end if;
    end if;

    if new.marketable is null then
        new.marketable := true;
    end if;

    if new.fusion_enabled is null then
        new.fusion_enabled := true;
    end if;

    if new.release_status is null then
        new.release_status := 'reserve';
    end if;

    return new;
end;
$function$

-- public.vexforge_enforce_player_shards_guard() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.vexforge_enforce_player_shards_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    if new.quantity is null then
        new.quantity := 0;
    end if;

    if new.quantity < 0 then
        new.quantity := 0;
    end if;

    return new;
end;
$function$

-- public.vexforge_ensure_player_state(p_player_id uuid) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.vexforge_ensure_player_state(p_player_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    insert into player_economy_state (
        player_id,
        vex_balance,
        trade_balance,
        energy,
        last_activity,
        decision_energy,
        participation_score,
        updated_at
    )
    values (
        p_player_id,
        0,
        0,
        100,
        now(),
        0,
        0,
        now()
    )
    on conflict (player_id) do nothing;
end;
$function$

-- public.vexforge_equip_relic(p_relic_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_equip_relic(p_relic_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_row public.player_relics%ROWTYPE;
  v_slot text;
  v_relic_name text;
BEGIN
  SELECT id INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  SELECT pr
    INTO v_row
  FROM public.player_relics pr
  JOIN public.relics r ON r.id = pr.relic_id
  WHERE pr.player_id = v_player_id
    AND pr.relic_id = p_relic_id
    AND pr.quantity > 0
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Relic is not owned');
  END IF;

  SELECT r.name, COALESCE(r.metadata->>'slot', 'relic')
    INTO v_relic_name, v_slot
  FROM public.relics r
  WHERE r.id = p_relic_id;

  UPDATE public.player_relics
     SET is_equipped = false,
         equipped_slot = NULL,
         updated_at = now()
   WHERE player_id = v_player_id
     AND equipped_slot = v_slot
     AND is_equipped = true
     AND relic_id <> p_relic_id;

  UPDATE public.player_relics
     SET is_equipped = true,
         equipped_slot = v_slot,
         updated_at = now()
   WHERE id = v_row.id;

  RETURN jsonb_build_object(
    'ok', true,
    'relic_id', p_relic_id,
    'slot', v_slot,
    'name', v_relic_name
  );
END;
$function$

-- public.vexforge_event_driver() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.vexforge_event_driver()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM validate_game_state('{}'::jsonb);
  RETURN NEW;
END;
$function$

-- public.vexforge_event_router() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.vexforge_event_router()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_event_player_id uuid;
BEGIN
  IF NEW IS NULL THEN
    RETURN NULL;
  END IF;

  IF TG_TABLE_NAME = 'pvp_matches' THEN
    v_event_player_id := NEW.player_a;
  ELSE
    v_event_player_id := NEW.player_id;
  END IF;

  INSERT INTO public.event_log (
    id,
    player_id,
    event_type,
    reference_id,
    source_table,
    source_id,
    payload,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_event_player_id,
    TG_OP,
    COALESCE(NEW.id::text, gen_random_uuid()::text),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, NULL),
    to_jsonb(NEW),
    now()
  );

  RETURN NEW;
END;
$function$

-- public.vexforge_evolve_card(p_card_id uuid, p_player_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_evolve_card(p_card_id uuid, p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_path RECORD; v_pp RECORD; v_wallet RECORD;
  v_copies_owned INTEGER; v_new_card_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = p_player_id AND auth_user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('ok',false,'reason','identity_mismatch');
  END IF;

  SELECT * INTO v_path FROM card_evolution_paths WHERE card_id=p_card_id LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','No hay camino de evolución'); END IF;

  SELECT count(*) INTO v_copies_owned FROM player_cards WHERE player_id=p_player_id AND card_id=p_card_id;
  IF v_copies_owned<(v_path.cost_json->>'copies_required')::INTEGER THEN
    RETURN jsonb_build_object('ok',false,'reason',format('Necesitas %s copias (tienes %s)',(v_path.cost_json->>'copies_required'),v_copies_owned));
  END IF;

  SELECT * INTO v_wallet FROM player_wallet WHERE player_id=p_player_id;
  IF (v_path.cost_json->>'vex_ingame')::NUMERIC>0 AND v_wallet.vex_ingame<(v_path.cost_json->>'vex_ingame')::NUMERIC THEN
    RETURN jsonb_build_object('ok',false,'reason','VEX insuficiente para la evolución');
  END IF;

  SELECT * INTO v_pp FROM player_progress WHERE player_id=p_player_id;
  IF v_pp.level<COALESCE((v_path.requirements_json->>'level_required')::INTEGER,1) THEN
    RETURN jsonb_build_object('ok',false,'reason',format('Nivel %s requerido (tienes nivel %s)',(v_path.requirements_json->>'level_required'),v_pp.level));
  END IF;

  v_new_card_id:=v_path.evolves_to_card_id;

  IF (v_path.cost_json->>'vex_ingame')::NUMERIC>0 THEN
    UPDATE player_wallet SET vex_ingame=vex_ingame-(v_path.cost_json->>'vex_ingame')::NUMERIC,updated_at=now() WHERE player_id=p_player_id;
  END IF;

  DELETE FROM player_cards WHERE id IN(
    SELECT id FROM player_cards WHERE player_id=p_player_id AND card_id=p_card_id
    LIMIT (v_path.cost_json->>'copies_required')::INTEGER
  );

  INSERT INTO player_cards(player_id,card_id,obtained_via,obtained_at) VALUES(p_player_id,v_new_card_id,'evolution',now());

  RETURN jsonb_build_object('ok',true,'evolved_to_card_id',v_new_card_id,
    'vex_spent',(v_path.cost_json->>'vex_ingame')::INTEGER,
    'copies_consumed',(v_path.cost_json->>'copies_required')::INTEGER);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok',false,'reason',SQLERRM);
END;
$function$

-- public.vexforge_find_opponents() | SECURITY DEFINER | RETURNS TABLE(player_id uuid, display_name text, level integer, deck_size integer, total_power bigint)
CREATE OR REPLACE FUNCTION public.vexforge_find_opponents()
 RETURNS TABLE(player_id uuid, display_name text, level integer, deck_size integer, total_power bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE v_player_id UUID;
    BEGIN
    SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
    RETURN QUERY
    SELECT p.id, COALESCE(p.display_name,'Unnamed Warrior'), COALESCE(p.level,1),
      (SELECT COUNT(*)::INT FROM player_deck pd WHERE pd.player_id=p.id),
      COALESCE((SELECT SUM(c.power) FROM player_deck pd JOIN cards c ON c.id=pd.card_id WHERE pd.player_id=p.id),0)
    FROM players p
    WHERE p.id != COALESCE(v_player_id, gen_random_uuid())
      AND EXISTS (SELECT 1 FROM player_cards pc WHERE pc.player_id=p.id AND pc.quantity>0)
    ORDER BY random() LIMIT 20;
    END; $function$

-- public.vexforge_full_system_tick() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.vexforge_full_system_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  -- ORDER IS IMPORTANT (DEPENDENCY FLOW)

  PERFORM meta_system_tick();
  PERFORM update_reward_scaling();
  PERFORM economic_brake_check();
  PERFORM update_market_stability();

END;
$function$

-- public.vexforge_fuse_cards(p_player_id uuid, p_source_card_id uuid, p_target_card_id uuid) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_fuse_cards(p_player_id uuid, p_source_card_id uuid, p_target_card_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_source_rarity text;
    v_target_rarity text;
    v_required_cards integer;
    v_required_shards integer;
    v_vex_cost numeric;
    v_source_qty integer;
    v_shard_qty integer;
    v_balance_before numeric;
    v_balance_after numeric;
    v_target_supply integer;
    v_target_minted integer;
    v_source_name text;
    v_target_name text;
    v_log_id uuid;
begin
    -- Source card
    select c.rarity::text, c.name
    into v_source_rarity, v_source_name
    from cards c
    where c.id = p_source_card_id
      and c.active = true
      and coalesce(c.fusion_enabled, true) = true;

    if v_source_rarity is null then
        raise exception 'Source card not found or fusion not enabled';
    end if;

    -- Target card
    select c.rarity::text, c.name, coalesce(c.supply, 0), coalesce(c.minted, 0)
    into v_target_rarity, v_target_name, v_target_supply, v_target_minted
    from cards c
    where c.id = p_target_card_id
      and c.active = true
      and coalesce(c.fusion_enabled, true) = true;

    if v_target_rarity is null then
        raise exception 'Target card not found or fusion not enabled';
    end if;

    -- Policy lookup
    select p.required_cards, p.required_shards, p.vex_ingame_cost
    into v_required_cards, v_required_shards, v_vex_cost
    from vexforge_card_fusion_policy p
    where p.source_rarity = v_source_rarity
      and p.target_rarity = v_target_rarity
      and p.active = true;

    if not found then
        raise exception 'No fusion policy for % -> %', v_source_rarity, v_target_rarity;
    end if;

    -- Source quantity
    select coalesce(pc.quantity, 0)
    into v_source_qty
    from player_cards pc
    where pc.player_id = p_player_id
      and pc.card_id = p_source_card_id
    for update;

    if coalesce(v_source_qty, 0) < v_required_cards then
        raise exception 'Not enough source cards to fuse';
    end if;

    -- Shards quantity
    select coalesce(ps.quantity, 0)
    into v_shard_qty
    from vexforge_player_shards ps
    where ps.player_id = p_player_id
      and ps.shard_rarity = v_source_rarity
    for update;

    if coalesce(v_shard_qty, 0) < v_required_shards then
        raise exception 'Not enough shards to fuse';
    end if;

    -- Balance check
    select coalesce(pe.vex_balance, 0)
    into v_balance_before
    from player_economy_state pe
    where pe.player_id = p_player_id
    for update;

    if coalesce(v_balance_before, 0) < v_vex_cost then
        raise exception 'Not enough VEX balance to fuse';
    end if;

    -- Supply guard for target card
    if v_target_supply > 0 and (v_target_minted + 1) > v_target_supply then
        raise exception 'Target card supply exhausted';
    end if;

    -- Burn source cards
    update player_cards
    set quantity = quantity - v_required_cards,
        updated_at = now()
    where player_id = p_player_id
      and card_id = p_source_card_id;

    delete from player_cards
    where player_id = p_player_id
      and card_id = p_source_card_id
      and quantity <= 0;

    -- Burn shards
    update vexforge_player_shards
    set quantity = quantity - v_required_shards,
        updated_at = now()
    where player_id = p_player_id
      and shard_rarity = v_source_rarity;

    delete from vexforge_player_shards
    where player_id = p_player_id
      and shard_rarity = v_source_rarity
      and quantity <= 0;

    -- Deduct VEX Ingame
    update player_economy_state
    set vex_balance = vex_balance - v_vex_cost,
        updated_at = now()
    where player_id = p_player_id;

    select coalesce(pe.vex_balance, 0)
    into v_balance_after
    from player_economy_state pe
    where pe.player_id = p_player_id;

    -- Mint target card to player inventory
    update player_cards
    set quantity = quantity + 1,
        updated_at = now()
    where player_id = p_player_id
      and card_id = p_target_card_id;

    if not found then
        insert into player_cards (
            id,
            player_id,
            card_id,
            quantity,
            locked,
            listed,
            source_tracking,
            created_at,
            updated_at
        )
        values (
            gen_random_uuid(),
            p_player_id,
            p_target_card_id,
            1,
            false,
            false,
            jsonb_build_object(
                'source', 'fusion',
                'source_card_id', p_source_card_id,
                'source_rarity', v_source_rarity
            ),
            now(),
            now()
        );
    end if;

    update cards
    set minted = coalesce(minted, 0) + 1,
        updated_at = now()
    where id = p_target_card_id;

    -- Log fusion in economy ledger
    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        concat('fusion_', p_player_id::text, '_', p_source_card_id::text, '_', p_target_card_id::text, '_', replace(now()::text, ' ', '_')),
        p_player_id,
        'fee',
        'vex_ingame',
        v_vex_cost,
        v_balance_before,
        v_balance_after,
        'vexforge_card_fusion',
        p_source_card_id::text,
        jsonb_build_object(
            'source_rarity', v_source_rarity,
            'target_rarity', v_target_rarity,
            'source_cards_burned', v_required_cards,
            'shards_burned', v_required_shards,
            'target_card_id', p_target_card_id
        ),
        now(),
        true
    )
    returning id into v_log_id;

    -- Fusion event log
    insert into vexforge_card_fusion_log (
        id,
        player_id,
        source_card_id,
        target_card_id,
        source_rarity,
        target_rarity,
        source_cards_burned,
        shards_burned,
        vex_ingame_spent,
        source_card_name,
        target_card_name,
        metadata,
        created_at
    )
    values (
        gen_random_uuid(),
        p_player_id,
        p_source_card_id,
        p_target_card_id,
        v_source_rarity,
        v_target_rarity,
        v_required_cards,
        v_required_shards,
        v_vex_cost,
        v_source_name,
        v_target_name,
        jsonb_build_object(
            'ledger_id', v_log_id,
            'balance_before', v_balance_before,
            'balance_after', v_balance_after
        ),
        now()
    );

    return jsonb_build_object(
        'ok', true,
        'player_id', p_player_id,
        'source_card_id', p_source_card_id,
        'target_card_id', p_target_card_id,
        'source_rarity', v_source_rarity,
        'target_rarity', v_target_rarity,
        'source_cards_burned', v_required_cards,
        'shards_burned', v_required_shards,
        'vex_ingame_spent', v_vex_cost,
        'balance_before', v_balance_before,
        'balance_after', v_balance_after
    );
end;
$function$

-- public.vexforge_fusion_policy(p_source_rarity text) | SECURITY DEFINER | RETURNS TABLE(needed_cards integer, ingame_cost numeric, target_rarity text, required_shards integer)
CREATE OR REPLACE FUNCTION public.vexforge_fusion_policy(p_source_rarity text)
 RETURNS TABLE(needed_cards integer, ingame_cost numeric, target_rarity text, required_shards integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT required_cards, vex_ingame_cost, target_rarity, required_shards
  FROM public.vexforge_card_fusion_policy
  WHERE source_rarity = p_source_rarity AND active = true
  ORDER BY updated_at DESC
  LIMIT 1;
$function$

-- public.vexforge_get_my_deposits() | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_get_my_deposits()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id',           d.id,
        'amount_usdt',  d.amount_usdt,
        'vex_credited', d.amount_usdt * 100,
        'chain',        d.chain,
        'token_symbol', d.token_symbol,
        'tx_hash',      d.tx_hash,
        'status',       d.status,
        'created_at',   d.created_at
      ) ORDER BY d.created_at DESC
    ), '[]'::jsonb)
    FROM vexforge_project_deposits d
    JOIN players p ON p.id = d.player_id
    WHERE p.auth_user_id = auth.uid()
    $function$

-- public.vexforge_get_my_economy_stats() | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_get_my_economy_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE
    v_player_id uuid;
    v_result    jsonb;
    BEGIN
    SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
    IF v_player_id IS NULL THEN
      RETURN jsonb_build_object('ok',false,'reason','player_not_found');
    END IF;

    SELECT jsonb_build_object(
      'ok',            true,
      'entry_count',   COUNT(*)::int,
      'total_credited', COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0)::numeric,
      'total_debited',  COALESCE(SUM(ABS(amount)) FILTER (WHERE amount < 0), 0)::numeric,
      'net_ingame',     COALESCE(SUM(amount) FILTER (WHERE currency = 'vex_ingame'), 0)::numeric,
      'net_tradeable',  COALESCE(SUM(amount) FILTER (WHERE currency = 'vex_tradeable'), 0)::numeric,
      'largest_credit', COALESCE(MAX(amount) FILTER (WHERE amount > 0), 0)::numeric,
      'by_type', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'entry_type',   et,
            'currency',     cur,
            'count',        cnt::int,
            'total_amount', tot::numeric
          ) ORDER BY cnt DESC
        ),'[]'::jsonb)
        FROM (
          SELECT entry_type::text AS et, currency AS cur,
                 COUNT(*) AS cnt, SUM(amount) AS tot
          FROM economy_ledger
          WHERE player_id = v_player_id
          GROUP BY et, cur
        ) sub
      )
    )
    INTO v_result
    FROM economy_ledger
    WHERE player_id = v_player_id;

    RETURN COALESCE(v_result, jsonb_build_object('ok',true,'entry_count',0,
      'total_credited',0,'total_debited',0,'net_ingame',0,'net_tradeable',0,
      'largest_credit',0,'by_type','[]'::jsonb));
    END;$function$

-- public.vexforge_get_my_shop_orders(p_limit integer) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_get_my_shop_orders(p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_player_id uuid; v_result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','unauthorized'); END IF;
 SELECT id INTO v_player_id FROM public.players WHERE auth_user_id=auth.uid();
 IF v_player_id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','player_not_found'); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',o.id,'item_key',o.item_key,'price_usdt',o.price_usdt,'status',o.status,'fulfillment_status',o.fulfillment_status,'client_reference',o.client_reference,'payment_reference',o.payment_reference,'tx_hash',o.tx_hash,'treasury_wallet_address',o.treasury_wallet_address,'payer_wallet_address',o.payer_wallet_address,'metadata',o.metadata,'notes',o.notes,'created_at',o.created_at,'approved_at',o.approved_at,'fulfilled_at',o.fulfilled_at) ORDER BY o.created_at DESC),'[]'::jsonb) INTO v_result FROM (SELECT * FROM public.vexforge_shop_orders WHERE player_id=v_player_id ORDER BY created_at DESC LIMIT greatest(p_limit,1)) o;
 RETURN v_result;
END;$function$

-- public.vexforge_get_policy_numeric(p_key text, p_default numeric) | SECURITY INVOKER | RETURNS numeric
CREATE OR REPLACE FUNCTION public.vexforge_get_policy_numeric(p_key text, p_default numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_val numeric;
begin
    select policy_value_numeric
    into v_val
    from vexforge_economy_policy
    where policy_key = p_key;

    return coalesce(v_val, p_default);
end;
$function$

-- public.vexforge_grant_relic(p_player_id uuid, p_relic_id uuid, p_quantity integer, p_source text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_grant_relic(p_player_id uuid, p_relic_id uuid, p_quantity integer DEFAULT 1, p_source text DEFAULT 'system'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_admin boolean := false;
  v_quantity integer;
BEGIN
  BEGIN
    v_admin := public.vexforge_is_control_admin();
  EXCEPTION WHEN undefined_function THEN
    v_admin := false;
  END;

  IF NOT v_admin THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Control admin required');
  END IF;

  v_quantity := GREATEST(1, p_quantity);
  IF NOT EXISTS (SELECT 1 FROM public.players WHERE id = p_player_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Player not found');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.relics WHERE id = p_relic_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Relic not found');
  END IF;

  INSERT INTO public.player_relics (player_id, relic_id, quantity, acquired_from)
  VALUES (p_player_id, p_relic_id, v_quantity, COALESCE(NULLIF(trim(p_source), ''), 'system'))
  ON CONFLICT (player_id, relic_id)
  DO UPDATE SET
    quantity = public.player_relics.quantity + EXCLUDED.quantity,
    updated_at = now();

  RETURN jsonb_build_object('ok', true, 'player_id', p_player_id, 'relic_id', p_relic_id, 'quantity_added', v_quantity);
END;
$function$

-- public.vexforge_heartbeat_tick() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.vexforge_heartbeat_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  -- procesa batch de eventos
    PERFORM process_event_batch();

      -- actualiza estado global
        UPDATE economy_state
          SET metrics = jsonb_build_object(
              'last_tick', now(),
                  'status', 'alive'
                    )
                      WHERE snapshot_key = 'global';

                      END;
                      $function$

-- public.vexforge_is_control_admin() | SECURITY DEFINER | RETURNS boolean
CREATE OR REPLACE FUNCTION public.vexforge_is_control_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.players
    WHERE auth_user_id = auth.uid()
      AND status = 'active'
      AND (is_admin = true OR is_super_admin = true)
      AND role IN ('admin', 'owner')
  );
$function$

-- public.vexforge_join_raid(p_raid_run_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_join_raid(p_raid_run_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_raid record;
  v_participant_id uuid;
  v_max_players integer;
  v_current_count integer;
  v_brake boolean;
BEGIN
  SELECT emergency_brake INTO v_brake
    FROM public.meta_system_state
   LIMIT 1;
  IF COALESCE(v_brake, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  -- Lock the raid before checking capacity so concurrent joins cannot
  -- exceed max_participants.
  SELECT * INTO v_raid
    FROM public.raid_runs
   WHERE id = p_raid_run_id
   FOR UPDATE;
  IF v_raid.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Raid not found');
  END IF;
  IF v_raid.status NOT IN ('pending', 'active') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Raid is not open for joining',
      'status', v_raid.status
    );
  END IF;

  SELECT id INTO v_participant_id
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND player_id = v_player_id
     AND status != 'left'
   LIMIT 1;
  IF v_participant_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_joined', true,
      'participant_id', v_participant_id
    );
  END IF;

  v_max_players := COALESCE(
    (v_raid.metadata->>'max_participants')::integer,
    public.vexforge_get_policy_numeric('raid_max_participants', 20)::integer
  );
  SELECT count(*) INTO v_current_count
    FROM public.raid_participants
   WHERE raid_run_id = p_raid_run_id
     AND status != 'left';

  IF v_current_count >= v_max_players THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'Raid is full',
      'max', v_max_players,
      'current', v_current_count
    );
  END IF;

  INSERT INTO public.raid_participants (
    raid_run_id, player_id, contribution, status, metadata
  ) VALUES (
    p_raid_run_id, v_player_id, 0, 'joined',
    jsonb_build_object('joined_at', now())
  )
  ON CONFLICT (raid_run_id, player_id) DO UPDATE
    SET status = CASE
      WHEN public.raid_participants.status = 'left' THEN 'joined'
      ELSE public.raid_participants.status
    END,
    updated_at = now()
  RETURNING id INTO v_participant_id;

  IF v_raid.status = 'pending' THEN
    UPDATE public.raid_runs
       SET status = 'active', started_at = COALESCE(started_at, now()), updated_at = now()
     WHERE id = p_raid_run_id;
  END IF;

  PERFORM public.emit_game_event(
    v_player_id,
    'raid_joined',
    p_raid_run_id::text,
    jsonb_build_object(
      'raid_code', v_raid.raid_code,
      'participant_id', v_participant_id
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'participant_id', v_participant_id,
    'raid_code', v_raid.raid_code,
    'raid_status', CASE WHEN v_raid.status = 'pending' THEN 'active' ELSE v_raid.status END,
    'participants', v_current_count + 1
  );
END;
$function$

-- public.vexforge_mark_pack_paid(p_order_id uuid, p_tx_hash text, p_player_wallet_address text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_mark_pack_paid(p_order_id uuid, p_tx_hash text, p_player_wallet_address text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_order record;
    v_ledger_ref text;
BEGIN
    -- Solo service_role (auth.uid() = NULL) o admins pueden confirmar pagos
    IF auth.uid() IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM players
            WHERE auth_user_id = auth.uid()
              AND (is_admin = true OR is_super_admin = true OR role = 'owner')
        ) THEN
            RAISE EXCEPTION 'UNAUTHORIZED: only service_role or admin can confirm pack payments';
        END IF;
    END IF;

    -- Obtener y bloquear la orden
    SELECT * INTO v_order
    FROM vexforge_pack_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pack order not found: %', p_order_id;
    END IF;

    IF v_order.status <> 'pending_payment' THEN
        RAISE EXCEPTION 'Pack order is not in pending_payment status. Current: %', v_order.status;
    END IF;

    -- Marcar orden como pagada
    UPDATE vexforge_pack_orders
    SET status = 'paid',
        tx_hash = p_tx_hash,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'paid_at', now(),
            'player_wallet_address', p_player_wallet_address
        ),
        updated_at = now()
    WHERE id = p_order_id;

    -- Registrar en vexforge_project_deposits
    INSERT INTO vexforge_project_deposits (
        source, chain, token_symbol, token_standard,
        treasury_wallet_address, payer_wallet_address,
        player_id, amount_usdt, tx_hash,
        reference_type, reference_id, status, metadata,
        created_at, updated_at
    ) VALUES (
        'pack_purchase', 'BSC', 'USDT', 'BEP20',
        v_order.treasury_wallet_address,
        p_player_wallet_address,
        v_order.player_id,
        v_order.price_usdt,
        p_tx_hash,
        'pack_order', p_order_id::text,
        'confirmed',
        jsonb_build_object(
            'pack_key', v_order.pack_key,
            'pack_order_id', p_order_id
        ),
        now(), now()
    );

    -- LEDGER: asiento contable obligatorio — todo ingreso real debe quedar registrado
    v_ledger_ref := 'pack_order:' || p_order_id::text;
    INSERT INTO economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        source_table,
        source_id,
        metadata,
        is_final,
        created_at
    ) VALUES (
        v_ledger_ref,
        v_order.player_id,
        'pack_purchase'::ledger_entry_type,
        'USDT',
        v_order.price_usdt,
        'vexforge_pack_orders',
        p_order_id::text,
        jsonb_build_object(
            'pack_key', v_order.pack_key,
            'tx_hash', p_tx_hash,
            'treasury_wallet', v_order.treasury_wallet_address,
            'payer_wallet', p_player_wallet_address,
            'confirmed_at', now()
        ),
        true,
        now()
    );

    RETURN jsonb_build_object(
        'ok', true,
        'order_id', p_order_id,
        'status', 'paid',
        'tx_hash', p_tx_hash,
        'ledger_ref', v_ledger_ref
    );
END;
$function$

-- public.vexforge_market_fee(p_price numeric) | SECURITY INVOKER | RETURNS numeric
CREATE OR REPLACE FUNCTION public.vexforge_market_fee(p_price numeric)
 RETURNS numeric
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
    select greatest(
        round(coalesce(p_price, 0) * coalesce(
            (select policy_value_numeric
             from vexforge_market_policy
             where policy_key = 'market_fee_pct'), 0.08
        ), 0),
        0
    );
$function$

-- public.vexforge_meta_tick() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.vexforge_meta_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  -- placeholder control logic hook
  -- aquí después conectamos inflation / PES / rewards

  UPDATE meta_system_state
  SET updated_at = now()
  WHERE id IS NOT NULL;

END;
$function$

-- public.vexforge_normalize_mission_type(p_raw text) | SECURITY INVOKER | RETURNS text
CREATE OR REPLACE FUNCTION public.vexforge_normalize_mission_type(p_raw text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v text;
begin
    v := trim(coalesce(p_raw, ''));

    if v = '' then
        return 'Tutorial';
    end if;

    -- Canonical aliases
    if upper(v) in ('PVP', 'PVE', 'COMBAT', 'BATTLE') then
        return 'PvE';
    elsif upper(v) in ('DUNGEON', 'DUNGEONS', 'DUNGEONS') then
        return 'Dungeon';
    elsif upper(v) in ('CLAN', 'CLANS', 'GUILD') then
        return 'Clan';
    elsif upper(v) in ('EVENT', 'EVENTS') then
        return 'Event';
    elsif upper(v) in ('TUTORIAL', 'TUT', 'INTRO') then
        return 'Tutorial';
    elsif upper(v) in ('EXPEDITION', 'EXPEDITIONS', 'EXP') then
        return 'Expedition';
    end if;

    -- Already canonical values
    if v in ('PvE', 'Dungeon', 'Clan', 'Event', 'Tutorial', 'Expedition') then
        return v;
    end if;

    -- Safe fallback
    return 'Tutorial';
end;
$function$

-- public.vexforge_open_pack(p_order_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_open_pack(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_pack_key text;
  v_card_count integer;
  v_weights jsonb;
  v_order_status text;
  v_order_metadata jsonb;
  v_card_id uuid;
  v_rarity text;
  v_random double precision;
  v_cumulative double precision;
  v_previous_quantity integer;
  v_cards jsonb := '[]'::jsonb;
  v_card record;
  v_rarities text[] := ARRAY[
    'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'
  ];
  i integer;
  j integer;
BEGIN
  SELECT id
    INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  SELECT status, pack_key, metadata
    INTO v_order_status, v_pack_key, v_order_metadata
    FROM public.vexforge_pack_orders
   WHERE id = p_order_id
     AND player_id = v_player_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;

  -- Opening is a settlement operation: retries must never grant again.
  IF v_order_status = 'fulfilled' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'cards', COALESCE(v_order_metadata->'cards', '[]'::jsonb),
      'pack_key', v_pack_key,
      'card_count', jsonb_array_length(COALESCE(v_order_metadata->'cards', '[]'::jsonb)),
      'idempotent', true
    );
  END IF;

  IF v_order_status <> 'paid' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'order_not_paid',
      'current_status', v_order_status
    );
  END IF;

  SELECT
    COALESCE(card_count, 5),
    COALESCE(metadata->'rarity_weights', '{}'::jsonb)
    INTO v_card_count, v_weights
    FROM public.vexforge_pack_catalog
   WHERE pack_key = v_pack_key
     AND active = true;

  IF v_card_count IS NULL OR v_card_count < 1 THEN
    v_card_count := 5;
  END IF;

  FOR i IN 1..v_card_count LOOP
    v_random := random();
    v_cumulative := 0;
    v_rarity := 'Common';

    FOR j IN 1..array_length(v_rarities, 1) LOOP
      v_cumulative := v_cumulative
        + COALESCE((v_weights->>v_rarities[j])::double precision, 0);
      IF v_random <= v_cumulative THEN
        v_rarity := v_rarities[j];
        EXIT;
      END IF;
    END LOOP;

    SELECT id
      INTO v_card_id
      FROM public.cards
     WHERE rarity::text = v_rarity
       AND active = true
     ORDER BY random()
     LIMIT 1;

    IF v_card_id IS NULL THEN
      SELECT id
        INTO v_card_id
        FROM public.cards
       WHERE rarity::text = 'Common'
         AND active = true
       ORDER BY random()
       LIMIT 1;
    END IF;

    IF v_card_id IS NULL THEN
      RAISE EXCEPTION 'no_active_cards';
    END IF;

    SELECT quantity
      INTO v_previous_quantity
      FROM public.player_cards
     WHERE player_id = v_player_id
       AND card_id = v_card_id
     FOR UPDATE;

    INSERT INTO public.player_cards (
      player_id,
      card_id,
      quantity,
      locked,
      listed,
      source_tracking
    )
    VALUES (
      v_player_id,
      v_card_id,
      1,
      false,
      false,
      jsonb_build_object(
        'source', 'pack_open',
        'pack_key', v_pack_key,
        'order_id', p_order_id::text
      )
    )
    ON CONFLICT (player_id, card_id)
    DO UPDATE SET
      quantity = public.player_cards.quantity + 1,
      updated_at = now(),
      source_tracking = public.player_cards.source_tracking
        || jsonb_build_object(
          'last_source', 'pack_open',
          'last_order_id', p_order_id::text
        );

    SELECT
      id,
      name,
      rarity::text AS rarity,
      faction::text AS faction,
      power,
      image_url
      INTO v_card
      FROM public.cards
     WHERE id = v_card_id;

    v_cards := v_cards || jsonb_build_array(jsonb_build_object(
      'id', v_card.id,
      'card_id', v_card.id,
      'name', v_card.name,
      'rarity', v_card.rarity,
      'faction', v_card.faction,
      'power', v_card.power,
      'image_url', v_card.image_url,
      'quantity_change', COALESCE(v_previous_quantity, 0) + 1
    ));
  END LOOP;

  UPDATE public.vexforge_pack_orders
     SET status = 'fulfilled',
         metadata = COALESCE(metadata, '{}'::jsonb)
           || jsonb_build_object(
             'cards', v_cards,
             'pack_key', v_pack_key,
             'opened_at', now()
           ),
         updated_at = now()
   WHERE id = p_order_id
     AND player_id = v_player_id;

  RETURN jsonb_build_object(
    'ok', true,
    'cards', v_cards,
    'pack_key', v_pack_key,
    'card_count', jsonb_array_length(v_cards)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'reason', SQLERRM);
END;
$function$

-- public.vexforge_process_referral(p_referrer_telegram_id bigint, p_referred_telegram_id bigint) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_process_referral(p_referrer_telegram_id bigint, p_referred_telegram_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_referrer_player_id  uuid;
  v_referred_player_id  uuid;
  v_referral_id         uuid;
  v_reward_type         text;
  v_reward_value        numeric;
  v_reference_id        text;
  v_brake               boolean;
  v_existing            uuid;
BEGIN
  -- Safety
  SELECT emergency_brake INTO v_brake FROM meta_system_state LIMIT 1;
  IF v_brake THEN RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active'); END IF;

  -- No self-referral
  IF p_referrer_telegram_id = p_referred_telegram_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Self-referral not allowed');
  END IF;

  -- Idempotency: check existing referral for this referred user
  SELECT id INTO v_existing FROM telegram_referrals WHERE referred_telegram_id = p_referred_telegram_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Referral already recorded', 'referral_id', v_existing);
  END IF;

  -- Resolve players
  SELECT id INTO v_referrer_player_id FROM players WHERE telegram_id = p_referrer_telegram_id AND status = 'active' LIMIT 1;
  SELECT id INTO v_referred_player_id  FROM players WHERE telegram_id = p_referred_telegram_id  LIMIT 1;

  -- Referral reward from campaign
  SELECT reward_type, reward_value INTO v_reward_type, v_reward_value
  FROM telegram_campaigns WHERE campaign_key = 'vexforge_launch' AND active = true LIMIT 1;
  v_reward_type  := COALESCE(v_reward_type,  'vex_ingame');
  v_reward_value := COALESCE(v_reward_value, vexforge_get_policy_numeric('referral_reward', 50));

  -- Insert referral
  INSERT INTO telegram_referrals (referrer_telegram_id, referrer_player_id, referred_telegram_id, referred_player_id, reward_state, metadata)
  VALUES (p_referrer_telegram_id, v_referrer_player_id, p_referred_telegram_id, v_referred_player_id, 'pending',
    jsonb_build_object('reward_type', v_reward_type, 'reward_value', v_reward_value))
  RETURNING id INTO v_referral_id;

  -- Award referrer immediately if linked
  v_reference_id := 'tg_referral_' || v_referral_id::text;
  IF v_referrer_player_id IS NOT NULL AND v_reward_value > 0 THEN
    PERFORM wallet_tx(v_referrer_player_id, v_reward_type, v_reward_value, 'in', v_reference_id,
      'telegram_referrals', v_referral_id, jsonb_build_object('referred_telegram_id', p_referred_telegram_id));

    INSERT INTO telegram_rewards_log (telegram_id, telegram_player_id, reward_type, amount, source_campaign, metadata)
    VALUES (p_referrer_telegram_id, v_referrer_player_id, v_reward_type, v_reward_value, 'vexforge_launch',
      jsonb_build_object('referral_id', v_referral_id, 'referred', p_referred_telegram_id));

    PERFORM emit_game_event(v_referrer_player_id, 'referral_reward', v_reference_id,
      jsonb_build_object('referred_telegram_id', p_referred_telegram_id, 'reward_value', v_reward_value));

    UPDATE telegram_referrals SET reward_state = 'rewarded' WHERE id = v_referral_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'referral_id', v_referral_id,
    'reward_type', v_reward_type,
    'reward_value', v_reward_value,
    'referrer_linked', v_referrer_player_id IS NOT NULL
  );
END;
$function$

-- public.vexforge_process_telegram_action(p_telegram_id bigint, p_action_type text, p_campaign_key text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_process_telegram_action(p_telegram_id bigint, p_action_type text, p_campaign_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id      uuid;
  v_campaign       record;
  v_reward_type    text;
  v_reward_value   numeric;
  v_action_id      uuid;
  v_reference_id   text;
  v_brake          boolean;
BEGIN
  -- Safety: emergency brake
  SELECT emergency_brake INTO v_brake FROM meta_system_state LIMIT 1;
  IF v_brake THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'System emergency brake active');
  END IF;

  -- Resolve player
  SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id AND status = 'active' LIMIT 1;

  -- Resolve campaign reward
  IF p_campaign_key IS NOT NULL THEN
    SELECT reward_type, reward_value INTO v_reward_type, v_reward_value
    FROM telegram_campaigns WHERE campaign_key = p_campaign_key AND active = true LIMIT 1;
  END IF;

  -- Default to small reward if no campaign
  v_reward_type  := COALESCE(v_reward_type,  'vex_ingame');
  v_reward_value := COALESCE(v_reward_value, vexforge_get_policy_numeric('telegram_action_base_reward', 5));

  -- Insert action record
  v_reference_id := 'tg_action_' || p_telegram_id::text || '_' || extract(epoch from now())::bigint::text;
  INSERT INTO telegram_actions (telegram_id, telegram_player_id, action_type, source_campaign, reward_type, reward_value, status, metadata)
  VALUES (p_telegram_id, v_player_id, p_action_type, p_campaign_key, v_reward_type, v_reward_value, 'completed',
    jsonb_build_object('reference_id', v_reference_id, 'processed_at', now()))
  RETURNING id INTO v_action_id;

  -- Award reward if player is linked
  IF v_player_id IS NOT NULL AND v_reward_value > 0 THEN
    PERFORM wallet_tx(v_player_id, v_reward_type, v_reward_value, 'in', v_reference_id, 'telegram_actions', v_action_id, 
      jsonb_build_object('action_type', p_action_type, 'campaign', p_campaign_key));

    -- Log reward
    INSERT INTO telegram_rewards_log (telegram_id, telegram_player_id, reward_type, amount, source_campaign, source_action_id, metadata)
    VALUES (p_telegram_id, v_player_id, v_reward_type, v_reward_value, p_campaign_key, v_action_id,
      jsonb_build_object('action_type', p_action_type));

    -- Emit event
    PERFORM emit_game_event(v_player_id, 'telegram_action_reward', v_reference_id,
      jsonb_build_object('action_type', p_action_type, 'reward_type', v_reward_type, 'amount', v_reward_value));
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'action_id', v_action_id,
    'reward_type', v_reward_type,
    'reward_value', v_reward_value,
    'player_linked', v_player_id IS NOT NULL
  );
END;
$function$

-- public.vexforge_pvp_forfeit(p_opponent_id uuid, p_idempotency_key text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_pvp_forfeit(p_opponent_id uuid, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_season_id    CONSTANT UUID := '87f315cd-5a14-4803-8b0f-9532dbfd6447';
  c_elo_floor    CONSTANT INT  := 100;

  v_challenger_id UUID;
  v_challenger_mmr INT;
  v_opponent_mmr   INT;
  v_elo_loss       INT := 15;
  v_elo_gain       INT := 10;
  v_match_id       UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT p.id INTO v_challenger_id
  FROM players p
  WHERE p.auth_user_id = auth.uid();

  IF v_challenger_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  IF v_challenger_id = p_opponent_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_forfeit_self');
  END IF;

  SELECT id INTO v_match_id
  FROM pvp_matches
  WHERE reference_id = p_idempotency_key
  LIMIT 1;

  IF v_match_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'forfeit', true,
      'match_id', v_match_id::text,
      'cached', true,
      'elo_change', -v_elo_loss
    );
  END IF;

  SELECT COALESCE(r.mmr, 1000) INTO v_challenger_mmr
  FROM pvp_rankings r
  WHERE r.player_id = v_challenger_id
    AND r.season_id = c_season_id
  LIMIT 1;

  SELECT COALESCE(r.mmr, 1000) INTO v_opponent_mmr
  FROM pvp_rankings r
  WHERE r.player_id = p_opponent_id
    AND r.season_id = c_season_id
  LIMIT 1;

  IF v_opponent_mmr > v_challenger_mmr + 200 THEN
    v_elo_loss := 8;
    v_elo_gain := 5;
  ELSIF v_challenger_mmr > v_opponent_mmr + 200 THEN
    v_elo_loss := 25;
    v_elo_gain := 15;
  END IF;

  INSERT INTO pvp_matches (
    reference_id, player_a, player_b, winner, status,
    elo_change_a, elo_change_b,
    power_snapshot_a, power_snapshot_b,
    rewards_json, forfeit_by, resolved_at
  ) VALUES (
    p_idempotency_key,
    v_challenger_id, p_opponent_id,
    p_opponent_id, 'resolved',
    -v_elo_loss, v_elo_gain,
    jsonb_build_object('total_power', v_challenger_mmr),
    jsonb_build_object('total_power', v_opponent_mmr),
    jsonb_build_object('forfeit', true, 'walkover_winner', p_opponent_id::text),
    v_challenger_id, NOW()
  )
  RETURNING id INTO v_match_id;

  INSERT INTO pvp_rankings (season_id, player_id, mmr, wins, losses, rank_position)
  VALUES (
    c_season_id,
    v_challenger_id,
    GREATEST(c_elo_floor, v_challenger_mmr - v_elo_loss),
    0,
    1,
    0
  )
  ON CONFLICT ON CONSTRAINT pvp_rankings_season_player_unique
  DO UPDATE SET
    mmr = GREATEST(c_elo_floor, pvp_rankings.mmr - v_elo_loss),
    losses = pvp_rankings.losses + 1,
    updated_at = NOW()
  WHERE pvp_rankings.season_id = c_season_id
    AND pvp_rankings.player_id = v_challenger_id;

  INSERT INTO pvp_rankings (season_id, player_id, mmr, wins, losses, rank_position)
  VALUES (
    c_season_id,
    p_opponent_id,
    v_opponent_mmr + v_elo_gain,
    1,
    0,
    0
  )
  ON CONFLICT ON CONSTRAINT pvp_rankings_season_player_unique
  DO UPDATE SET
    mmr = pvp_rankings.mmr + v_elo_gain,
    wins = pvp_rankings.wins + 1,
    updated_at = NOW()
  WHERE pvp_rankings.season_id = c_season_id
    AND pvp_rankings.player_id = p_opponent_id;

  RETURN jsonb_build_object(
    'ok', true,
    'forfeit', true,
    'match_id', v_match_id::text,
    'elo_change', -v_elo_loss
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$function$

-- public.vexforge_pvp_store_formation(p_match_id uuid, p_formation jsonb) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_pvp_store_formation(p_match_id uuid, p_formation jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_player_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT p.id INTO v_player_id
  FROM players p WHERE p.auth_user_id = auth.uid();

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'player_not_found');
  END IF;

  -- Only challenger (player_a) may write their own snapshot
  UPDATE pvp_matches
  SET formation_snapshot_a = p_formation
  WHERE id = p_match_id
    AND player_a = v_player_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'match_not_found_or_not_owner');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$

-- public.vexforge_record_ad_event(p_telegram_id bigint, p_ad_id uuid, p_event_type text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_record_ad_event(p_telegram_id bigint, p_ad_id uuid, p_event_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id   uuid;
  v_ad          record;
  v_event_id    uuid;
  v_reward_val  numeric := 0;
  v_reference   text;
  v_brake       boolean;
BEGIN
  SELECT emergency_brake INTO v_brake FROM meta_system_state LIMIT 1;
  IF v_brake THEN RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active'); END IF;

  -- Validate ad
  SELECT id, reward_type, reward_value, active INTO v_ad FROM telegram_ads WHERE id = p_ad_id LIMIT 1;
  IF v_ad.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'Ad not found'); END IF;
  IF NOT v_ad.active THEN RETURN jsonb_build_object('ok', false, 'reason', 'Ad not active'); END IF;

  -- Resolve player
  SELECT id INTO v_player_id FROM players WHERE telegram_id = p_telegram_id AND status = 'active' LIMIT 1;

  -- Reward only on 'complete' events
  IF p_event_type = 'complete' THEN
    v_reward_val := COALESCE(v_ad.reward_value, 0);
  END IF;

  -- Insert ad event
  INSERT INTO telegram_ad_events (telegram_id, telegram_player_id, ad_id, event_type, event_value, metadata)
  VALUES (p_telegram_id, v_player_id, p_ad_id, p_event_type, v_reward_val,
    jsonb_build_object('ad_id', p_ad_id, 'processed_at', now()))
  RETURNING id INTO v_event_id;

  -- Award if applicable
  v_reference := 'tg_ad_' || v_event_id::text;
  IF v_player_id IS NOT NULL AND v_reward_val > 0 THEN
    PERFORM wallet_tx(v_player_id, v_ad.reward_type, v_reward_val, 'in', v_reference,
      'telegram_ad_events', v_event_id, jsonb_build_object('ad_id', p_ad_id, 'event_type', p_event_type));

    INSERT INTO telegram_rewards_log (telegram_id, telegram_player_id, reward_type, amount, metadata)
    VALUES (p_telegram_id, v_player_id, v_ad.reward_type, v_reward_val,
      jsonb_build_object('ad_event_id', v_event_id, 'event_type', p_event_type));

    PERFORM emit_game_event(v_player_id, 'ad_reward', v_reference,
      jsonb_build_object('ad_id', p_ad_id, 'reward', v_reward_val));
  END IF;

  RETURN jsonb_build_object('ok', true, 'event_id', v_event_id, 'reward', v_reward_val);
END;
$function$

-- public.vexforge_reject_deposit(p_deposit_id uuid, p_reason text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_reject_deposit(p_deposit_id uuid, p_reason text DEFAULT 'invalid_transaction'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('ok',false,'reason','unauthorized'); END IF;
 UPDATE vexforge_project_deposits SET status='rejected',notes=p_reason,updated_at=now() WHERE id=p_deposit_id AND status='pending';
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','not_found_or_already_processed'); END IF;
 RETURN jsonb_build_object('ok',true,'deposit_id',p_deposit_id,'reason',p_reason);
END;$function$

-- public.vexforge_reject_shop_order(p_order_id uuid, p_reason text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_reject_shop_order(p_order_id uuid, p_reason text DEFAULT 'invalid_transaction'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
 IF NOT public.vexforge_is_control_admin() THEN RETURN jsonb_build_object('ok',false,'reason','unauthorized'); END IF;
 UPDATE vexforge_shop_orders SET status='rejected',notes=p_reason,updated_at=now() WHERE id=p_order_id AND status='pending_payment';
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','not_found_or_already_processed'); END IF;
 RETURN jsonb_build_object('ok',true,'order_id',p_order_id,'status','rejected');
END;$function$

-- public.vexforge_reject_withdrawal_quarantine_legacy_table(p_request_id uuid, p_admin_ref text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_reject_withdrawal_quarantine_legacy_table(p_request_id uuid, p_admin_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    r record;
    s record;
begin
    select *
    into r
    from withdrawal_requests
    where id = p_request_id
    for update;

    if not found then
        return jsonb_build_object('ok', false, 'reason', 'request_not_found');
    end if;

    if r.status <> 'pending_review' then
        return jsonb_build_object('ok', false, 'reason', 'invalid_status');
    end if;

    select *
    into s
    from player_economy_state
    where player_id = r.player_id
    for update;

    update player_economy_state
    set
        trade_balance = trade_balance + coalesce(r.amount * 100, 0),
        trade_balance_locked = greatest(trade_balance_locked - coalesce(r.amount * 100, 0), 0),
        withdrawal_pending = case when greatest(trade_balance_locked - coalesce(r.amount * 100, 0), 0) > 0 then true else false end,
        updated_at = now()
    where player_id = r.player_id;

    update withdrawal_requests
    set
        status = 'rejected',
        reviewed = true
    where id = p_request_id;

    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        gen_random_uuid()::text,
        r.player_id,
        'withdrawal_rejected',
        'usdt',
        r.amount,
        null,
        null,
        'withdrawal_requests',
        p_request_id::text,
        jsonb_build_object('admin_ref', p_admin_ref),
        now(),
        true
    );

    return jsonb_build_object('ok', true, 'status', 'rejected');
end;
$function$

-- public.vexforge_reject_withdrawal_quarantine_no_admin_check(p_request_id uuid, p_rejected_by text, p_reason text) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_reject_withdrawal_quarantine_no_admin_check(p_request_id uuid, p_rejected_by text DEFAULT NULL::text, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_req record;
    v_trade_before numeric;
    v_trade_after numeric;
    v_locked_before numeric;
    v_locked_after numeric;
begin
    select *
    into v_req
    from vexforge_withdrawal_requests_official
    where id = p_request_id
    for update;

    if not found then
        raise exception 'Withdrawal request not found';
    end if;

    if v_req.status <> 'pending_review' then
        raise exception 'Withdrawal request is not pending review';
    end if;

    select coalesce(trade_balance, 0), coalesce(trade_balance_locked, 0)
    into v_trade_before, v_locked_before
    from player_economy_state
    where player_id = v_req.player_id
    for update;

    v_trade_after := v_trade_before + v_req.tradeable_amount;
    v_locked_after := greatest(v_locked_before - v_req.tradeable_amount, 0);

    update player_economy_state
    set trade_balance = v_trade_after,
        trade_balance_locked = v_locked_after,
        withdrawal_pending = (v_locked_after > 0),
        updated_at = now()
    where player_id = v_req.player_id;

    update vexforge_withdrawal_requests_official
    set status = 'rejected',
        reviewed = true,
        approved_by = p_rejected_by,
        rejected_reason = p_reason,
        processed_at = now(),
        updated_at = now()
    where id = p_request_id;

    return jsonb_build_object(
        'ok', true,
        'request_id', p_request_id,
        'status', 'rejected',
        'player_id', v_req.player_id,
        'returned_tradeable', v_req.tradeable_amount
    );
end;
$function$

-- public.vexforge_replit_functional_check() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_replit_functional_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_missions integer;
    v_cards integer;
    v_packs integer;
    v_players integer;
    v_state integer;
    v_policies integer;
    v_functions integer;
    v_enum_ok boolean;
    v_mission_types text[];
    v_missing_state integer;
    v_has_bridge boolean;
    v_has_policy boolean;
    v_has_ledger boolean;
begin
    select count(*) into v_missions from vexforge_replit_missions;
    select count(*) into v_cards from vexforge_replit_cards;
    select count(*) into v_packs from vexforge_replit_packs;
    select count(*) into v_players from players;
    select count(*) into v_state from player_economy_state;
    select count(*) into v_policies from pg_policies where schemaname = 'public';
    select count(*) into v_functions from information_schema.routines where routine_schema = 'public';

    select exists (
        select 1 from information_schema.views
        where table_schema = 'public'
          and table_name = 'vexforge_official_missions_bridge'
    ) into v_has_bridge;

    select exists (
        select 1 from information_schema.tables
        where table_schema = 'public'
          and table_name = 'vexforge_economy_policy'
    ) into v_has_policy;

    select exists (
        select 1 from information_schema.tables
        where table_schema = 'public'
          and table_name = 'economy_ledger'
    ) into v_has_ledger;

    select array_agg(enumlabel order by enumsortorder)
    into v_mission_types
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'mission_type';

    v_enum_ok := v_mission_types is not null and array[
        'PvE','Dungeon','Clan','Event','Tutorial','Expedition'
    ]::text[] <@ v_mission_types;

    select count(*)
    into v_missing_state
    from players p
    left join player_economy_state pes
        on pes.player_id = p.id
    where pes.player_id is null;

    return jsonb_build_object(
        'missions', v_missions,
        'cards', v_cards,
        'packs', v_packs,
        'players', v_players,
        'player_state_rows', v_state,
        'rls_policies', v_policies,
        'functions', v_functions,
        'bridge_exists', v_has_bridge,
        'policy_table_exists', v_has_policy,
        'ledger_exists', v_has_ledger,
        'mission_type_enum_ok', v_enum_ok,
        'players_missing_state', v_missing_state,
        'status',
            case
                when not v_has_bridge then 'BROKEN_BRIDGE'
                when not v_has_policy then 'BROKEN_POLICY'
                when not v_has_ledger then 'BROKEN_LEDGER'
                when not v_enum_ok then 'BROKEN_ENUM'
                when v_missing_state > 0 then 'MISSING_PLAYER_STATE'
                when v_missions = 0 or v_cards = 0 or v_packs = 0 then 'INCOMPLETE_CONTENT'
                else 'READY_FOR_REPLIT'
            end
    );
end;
$function$

-- public.vexforge_request_withdrawal(p_player_id uuid, p_tradeable_amount numeric) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_request_withdrawal(p_player_id uuid, p_tradeable_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    v_min_tradeable numeric;
    v_fee_pct numeric;
    v_trade_rate numeric;
    v_before numeric;
    v_locked_before numeric;
    v_after numeric;
    v_locked_after numeric;
    v_usdt_gross numeric;
    v_fee_usdt numeric;
    v_usdt_net numeric;
    v_treasury_wallet text;
    v_request_id uuid;
begin
    select coalesce(policy_value_numeric, 2500)
    into v_min_tradeable
    from vexforge_commercial_policy
    where policy_key = 'withdrawal_min_tradeable';

    select coalesce(policy_value_numeric, 0.08)
    into v_fee_pct
    from vexforge_commercial_policy
    where policy_key = 'withdrawal_fee_pct';

    select coalesce(policy_value_numeric, 100)
    into v_trade_rate
    from vexforge_commercial_policy
    where policy_key = 'usdt_to_tradeable_rate';

    if p_tradeable_amount < v_min_tradeable then
        raise exception 'Minimum withdrawal is % tradeable', v_min_tradeable;
    end if;

    select coalesce(trade_balance, 0), coalesce(trade_balance_locked, 0)
    into v_before, v_locked_before
    from player_economy_state
    where player_id = p_player_id
    for update;

    if v_before < p_tradeable_amount then
        raise exception 'Insufficient tradeable balance';
    end if;

    v_after := v_before - p_tradeable_amount;
    v_locked_after := v_locked_before + p_tradeable_amount;

    update player_economy_state
    set trade_balance = v_after,
        trade_balance_locked = v_locked_after,
        withdrawal_pending = true,
        updated_at = now()
    where player_id = p_player_id;

    select wallet_address
    into v_treasury_wallet
    from vexforge_treasury
    where active = true
    order by created_at asc
    limit 1;

    v_usdt_gross := round(p_tradeable_amount / v_trade_rate, 8);
    v_fee_usdt := round(v_usdt_gross * v_fee_pct, 8);
    v_usdt_net := greatest(round(v_usdt_gross - v_fee_usdt, 8), 0);

    insert into vexforge_withdrawal_requests_official (
        id,
        player_id,
        tradeable_amount,
        usdt_gross,
        fee_usdt,
        usdt_net,
        treasury_wallet_address,
        status,
        reviewed,
        metadata,
        created_at,
        updated_at
    )
    values (
        gen_random_uuid(),
        p_player_id,
        p_tradeable_amount,
        v_usdt_gross,
        v_fee_usdt,
        v_usdt_net,
        v_treasury_wallet,
        'pending_review',
        false,
        jsonb_build_object(
            'trade_rate', v_trade_rate,
            'fee_pct', v_fee_pct
        ),
        now(),
        now()
    )
    returning id into v_request_id;

    -- FASE 3: trazabilidad contable del paso "solicitud creada" (antes ausente)
    insert into economy_ledger (
        reference_id, player_id, entry_type, currency, amount,
        balance_before, balance_after, source_table, source_id, metadata, created_at, is_final
    ) values (
        v_request_id::text,
        p_player_id,
        'withdrawal_request',
        'vex_tradeable',
        p_tradeable_amount,
        v_before,
        v_after,
        'vexforge_withdrawal_requests_official',
        v_request_id::text,
        jsonb_build_object('usdt_gross', v_usdt_gross, 'fee_usdt', v_fee_usdt, 'usdt_net', v_usdt_net),
        now(),
        true
    );

    return jsonb_build_object(
        'ok', true,
        'request_id', v_request_id,
        'player_id', p_player_id,
        'tradeable_amount', p_tradeable_amount,
        'usdt_gross', v_usdt_gross,
        'fee_usdt', v_fee_usdt,
        'usdt_net', v_usdt_net,
        'status', 'pending_review'
    );
end;
$function$

-- public.vexforge_request_withdrawal_quarantine_broken_dependency(p_player_id uuid, p_archetype text, p_tradeable_amount numeric) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_request_withdrawal_quarantine_broken_dependency(p_player_id uuid, p_archetype text, p_tradeable_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    s record;
    v_min_tradeable numeric;
    v_fee_pct numeric;
    v_rate numeric;
    v_gross numeric;
    v_fee numeric;
    v_net numeric;
    v_req_id uuid;
begin
    perform vexforge_ensure_player_state(p_player_id);

    if not vexforge_withdrawal_allowed(p_tradeable_amount, p_archetype) then
        return jsonb_build_object('ok', false, 'reason', 'withdrawal_not_allowed');
    end if;

    v_min_tradeable := vexforge_get_policy_numeric('withdrawal_min_tradeable', 2500);
    v_fee_pct := vexforge_get_policy_numeric('withdrawal_fee_pct', 0.08);
    v_rate := vexforge_get_policy_numeric('withdrawal_rate_tradeable_to_usdt', 100);

    select *
    into s
    from player_economy_state
    where player_id = p_player_id
    for update;

    if coalesce(s.trade_balance, 0) < p_tradeable_amount then
        return jsonb_build_object('ok', false, 'reason', 'insufficient_trade_balance');
    end if;

    v_gross := round(p_tradeable_amount / v_rate, 8);
    v_fee := round(v_gross * v_fee_pct, 8);
    v_net := greatest(round(v_gross - v_fee, 8), 0);

    update player_economy_state
    set
        trade_balance = trade_balance - p_tradeable_amount,
        trade_balance_locked = trade_balance_locked + p_tradeable_amount,
        withdrawal_pending = true,
        updated_at = now()
    where player_id = p_player_id;

    insert into withdrawal_requests (
        player_id,
        amount,
        currency,
        status,
        reviewed,
        created_at
    )
    values (
        p_player_id,
        v_net,
        'USDT',
        'pending_review',
        false,
        now()
    )
    returning id into v_req_id;

    insert into economy_ledger (
        reference_id,
        player_id,
        entry_type,
        currency,
        amount,
        balance_before,
        balance_after,
        source_table,
        source_id,
        metadata,
        created_at,
        is_final
    )
    values (
        gen_random_uuid()::text,
        p_player_id,
        'withdrawal_request',
        'vex_tradeable',
        p_tradeable_amount,
        s.trade_balance,
        s.trade_balance - p_tradeable_amount,
        'withdrawal_requests',
        v_req_id::text,
        jsonb_build_object('gross_usdt', v_gross, 'fee_usdt', v_fee, 'net_usdt', v_net, 'min_tradeable', v_min_tradeable),
        now(),
        false
    );

    return jsonb_build_object(
        'ok', true,
        'request_id', v_req_id,
        'gross_usdt', v_gross,
        'fee_usdt', v_fee,
        'net_usdt', v_net
    );
end;
$function$

-- public.vexforge_reset_daily_economy() | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.vexforge_reset_daily_economy()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    update player_economy_state
    set
        daily_ingame_minted = 0,
        daily_tradeable_minted = 0,
        daily_market_volume = 0,
        daily_fusion_burn = 0,
        economy_day_marker = current_date,
        updated_at = now()
    where economy_day_marker <> current_date;
end;
$function$

-- public.vexforge_resolve_mission_run(p_player_id uuid, p_mission_run_id uuid, p_outcome text, p_battle_result jsonb) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_resolve_mission_run(p_player_id uuid, p_mission_run_id uuid, p_outcome text, p_battle_result jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_run public.mission_runs%rowtype;
  v_auth_player uuid;
  v_claim jsonb;
  v_status text;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'reason', 'authentication_required');
  end if;

  select p.id
    into v_auth_player
    from public.players p
   where p.id = p_player_id
     and p.auth_user_id = auth.uid()
   limit 1;

  if v_auth_player is null then
    return jsonb_build_object('success', false, 'reason', 'player_not_owned');
  end if;

  if p_outcome not in ('won', 'defeated', 'abandoned') then
    return jsonb_build_object('success', false, 'reason', 'invalid_outcome');
  end if;

  select *
    into v_run
    from public.mission_runs
   where id = p_mission_run_id
     and player_id = p_player_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'mission_run_not_found');
  end if;

  v_status := v_run.status::text;

  -- A retry after a completed settlement is safe and never pays twice.
  if v_status in ('claimed', 'completed', 'failed', 'cancelled') then
    return jsonb_build_object(
      'success', true,
      'idempotent', true,
      'claimed', v_status = 'claimed',
      'status', v_status,
      'outcome', case when v_status in ('claimed', 'completed') then 'won' else v_status end,
      'mission_run_id', v_run.id,
      'xp_reward', v_run.xp_reward,
      'ingame_reward', v_run.ingame_reward,
      'tradeable_reward', v_run.tradeable_reward
    );
  end if;

  if v_status not in ('pending', 'active') then
    return jsonb_build_object('success', false, 'reason', 'mission_run_not_settleable', 'status', v_status);
  end if;

  -- Store only bounded combat telemetry. Never trust it for economy values.
  update public.mission_runs
     set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
       'forge_formation', jsonb_build_object(
         'outcome', p_outcome,
         'battle_result', jsonb_build_object(
           'engine', p_battle_result->>'engine',
           'champion_died', p_battle_result->'champion_died',
           'total_turns', p_battle_result->'total_turns',
           'you_won', p_battle_result->'you_won'
         ),
         'resolved_at', now()
       )
     ),
         updated_at = now()
   where id = v_run.id;

  if p_outcome = 'won' then
    -- This is the only path that invokes the existing canonical payer.
    select public.claim_mission_reward(
      p_mission_run_id := v_run.id,
      p_player_id := p_player_id,
      p_reference_id := 'mission:' || v_run.id::text
    )
      into v_claim;
    return coalesce(v_claim, jsonb_build_object(
      'success', false,
      'reason', 'mission_settlement_failed',
      'mission_run_id', v_run.id
    ));
  end if;

  update public.mission_runs
     set status = case when p_outcome = 'defeated' then 'failed'::run_status else 'cancelled'::run_status end,
         completed_at = now(),
         updated_at = now()
   where id = v_run.id;

  return jsonb_build_object(
    'success', true,
    'claimed', false,
    'status', case when p_outcome = 'defeated' then 'failed' else 'cancelled' end,
    'outcome', p_outcome,
    'mission_run_id', v_run.id
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'reason', 'mission_settlement_failed',
      'detail', sqlerrm
    );
end;
$function$

-- public.vexforge_set_updated_at() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.vexforge_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$

-- public.vexforge_settle_pve_battle(p_player uuid, p_mission_run_id uuid, p_outcome text, p_battle_result jsonb, p_reference_id text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_settle_pve_battle(p_player uuid, p_mission_run_id uuid, p_outcome text, p_battle_result jsonb, p_reference_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_run public.mission_runs%ROWTYPE;
  v_reference text;
  v_claim jsonb;
  v_result jsonb;
  v_outcome text;
BEGIN
  PERFORM public.assert_caller_is_player(p_player);

  v_outcome := lower(NULLIF(btrim(COALESCE(p_outcome, '')), ''));
  IF v_outcome NOT IN ('victory', 'defeat', 'abandoned', 'error') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_outcome');
  END IF;

  IF p_battle_result IS NULL OR jsonb_typeof(p_battle_result) <> 'object' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_battle_result');
  END IF;

  v_reference := NULLIF(btrim(COALESCE(p_reference_id, '')), '');
  IF v_reference IS NULL THEN
    v_reference := 'mission:' || p_mission_run_id::text;
  END IF;

  SELECT *
  INTO v_run
  FROM public.mission_runs
  WHERE id = p_mission_run_id
    AND player_id = p_player
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'mission_run_not_found');
  END IF;

  IF v_run.status IN ('claimed', 'failed', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'outcome', COALESCE(v_run.metadata->>'settlement_outcome', v_run.status::text),
      'status', v_run.status::text,
      'run_id', v_run.id,
      'xp_applied', CASE WHEN v_run.status = 'claimed' THEN COALESCE(v_run.xp_reward, 0) ELSE 0 END,
      'ingame_applied', CASE WHEN v_run.status = 'claimed' THEN COALESCE(v_run.ingame_reward, 0) ELSE 0 END,
      'tradeable_applied', CASE WHEN v_run.status = 'claimed' THEN COALESCE(v_run.tradeable_reward, 0) ELSE 0 END
    );
  END IF;

  IF v_run.status NOT IN ('pending', 'active') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'mission_run_not_settleable');
  END IF;

  v_result := COALESCE(v_run.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'settlement_outcome', v_outcome,
      'settlement_reference', v_reference,
      'battle_result', p_battle_result,
      'settlement_rule_version', 'forge-formation-v1',
      'settled_at', now()
    );

  IF v_outcome = 'victory' THEN
    UPDATE public.mission_runs
    SET metadata = v_result,
        updated_at = now()
    WHERE id = v_run.id
      AND status IN ('pending', 'active');

    v_claim := public.claim_mission_reward(p_player, v_run.id, v_reference);
    IF COALESCE((v_claim->>'success')::boolean, false) = false THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', COALESCE(v_claim->>'reason', 'mission_settlement_failed'),
        'run_id', v_run.id
      );
    END IF;

    RETURN v_claim
      || jsonb_build_object(
        'success', true,
        'idempotent', COALESCE((v_claim->>'idempotent')::boolean, false),
        'outcome', 'victory',
        'status', 'claimed',
        'run_id', v_run.id
      );
  END IF;

  UPDATE public.mission_runs
  SET status = CASE WHEN v_outcome = 'defeat' THEN 'failed'::run_status ELSE 'cancelled'::run_status END,
      metadata = v_result,
      completed_at = now(),
      updated_at = now()
  WHERE id = v_run.id
    AND status IN ('pending', 'active');

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'outcome', v_outcome,
    'status', CASE WHEN v_outcome = 'defeat' THEN 'failed' ELSE 'cancelled' END,
    'run_id', v_run.id,
    'xp_applied', 0,
    'ingame_applied', 0,
    'tradeable_applied', 0
  );
END;
$function$

-- public.vexforge_snapshot() | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$

declare
  result jsonb := '{}'::jsonb;
  tbl text;
  rows_json jsonb;
  tables_list text[] := array[
    'vexforge_official_documents',
    'vexforge_official_modules',
    'vexforge_official_asset_manifest'
  ];

begin

  result := jsonb_build_object(
    'generated_at', now(),
    'schema', 'public'
  );

  foreach tbl in array tables_list loop

    if to_regclass('public.' || tbl) is not null then

      execute format(
        'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t',
        tbl
      )
      into rows_json;

      result := result || jsonb_build_object(tbl, rows_json);

    else
      result := result || jsonb_build_object(tbl, null);
    end if;

  end loop;

  return result;

end;

$function$

-- public.vexforge_start_battle(p_opponent_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_start_battle(p_opponent_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE
    v_player_id UUID; v_session_id UUID; v_match_id UUID;
    v_p_cards UUID[]; v_o_cards UUID[];
    v_player_hp INT := 100; v_opponent_hp INT := 100;
    v_turns JSONB := '[]'::jsonb;
    v_p_idx INT := 1; v_o_idx INT := 1; v_turn INT := 1;
    v_p_power INT := 0; v_o_power INT := 0;
    v_p_name TEXT; v_o_name TEXT; v_p_rarity TEXT; v_o_rarity TEXT;
    v_p_affinity INT := 0; v_o_affinity INT := 0;
    v_winner UUID; v_p_total_power INT := 0; v_o_total_power INT := 0;
    v_reference_id TEXT; v_elo_change INT := 25;
    v_p_name_player TEXT; v_o_name_player TEXT;
    BEGIN
    SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
    IF v_player_id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','Not authenticated'); END IF;
    IF v_player_id = p_opponent_id THEN RETURN jsonb_build_object('ok',false,'reason','Cannot battle yourself'); END IF;
    SELECT COALESCE(display_name, 'You') INTO v_p_name_player FROM players WHERE id = v_player_id;
    SELECT COALESCE(display_name, 'Opponent') INTO v_o_name_player FROM players WHERE id = p_opponent_id;

    -- Get player deck (player_deck first, fallback to top-5 power from player_cards)
    SELECT ARRAY_AGG(card_id ORDER BY slot_number) INTO v_p_cards
    FROM player_deck WHERE player_id = v_player_id;
    IF v_p_cards IS NULL OR array_length(v_p_cards,1) = 0 THEN
      SELECT ARRAY_AGG(c.card_id ORDER BY c.quantity DESC, c.created_at)
      INTO v_p_cards
      FROM (SELECT card_id, quantity, created_at FROM player_cards WHERE player_id=v_player_id AND quantity>0 LIMIT 5) c;
    END IF;
    IF v_p_cards IS NULL OR array_length(v_p_cards,1) = 0 THEN
      RETURN jsonb_build_object('ok',false,'reason','No cards available. Open packs or build a deck first.'); END IF;

    -- Get opponent deck
    SELECT ARRAY_AGG(card_id ORDER BY slot_number) INTO v_o_cards
    FROM player_deck WHERE player_id = p_opponent_id;
    IF v_o_cards IS NULL OR array_length(v_o_cards,1) = 0 THEN
      SELECT ARRAY_AGG(c.card_id ORDER BY c.quantity DESC, c.created_at)
      INTO v_o_cards
      FROM (SELECT card_id, quantity, created_at FROM player_cards WHERE player_id=p_opponent_id AND quantity>0 LIMIT 5) c;
    END IF;
    IF v_o_cards IS NULL OR array_length(v_o_cards,1) = 0 THEN
      RETURN jsonb_build_object('ok',false,'reason','Opponent has no cards yet.'); END IF;

    -- Compute total powers for ELO snapshot
    SELECT COALESCE(SUM(c.power),0) INTO v_p_total_power
    FROM cards c WHERE c.id = ANY(v_p_cards);
    SELECT COALESCE(SUM(c.power),0) INTO v_o_total_power
    FROM cards c WHERE c.id = ANY(v_o_cards);

    -- Create combat session
    INSERT INTO combat_sessions (combat_type, status, created_by, started_at)
    VALUES ('pvp','active',v_player_id,now()) RETURNING id INTO v_session_id;

    -- Simulate turns
    WHILE v_p_idx <= LEAST(array_length(v_p_cards,1), 10)
      AND v_o_idx <= LEAST(array_length(v_o_cards,1), 10)
      AND v_player_hp > 0 AND v_opponent_hp > 0 LOOP

      SELECT power, name, rarity::text, affinity
      INTO v_p_power, v_p_name, v_p_rarity, v_p_affinity
      FROM cards WHERE id = v_p_cards[v_p_idx];
      v_p_power := COALESCE(v_p_power, 10); v_p_affinity := COALESCE(v_p_affinity, 0);

      SELECT power, name, rarity::text, affinity
      INTO v_o_power, v_o_name, v_o_rarity, v_o_affinity
      FROM cards WHERE id = v_o_cards[v_o_idx];
      v_o_power := COALESCE(v_o_power, 10); v_o_affinity := COALESCE(v_o_affinity, 0);

      -- Damage formula: base damage + affinity bonus, min 1
      v_opponent_hp := v_opponent_hp - GREATEST(1, (v_p_power / 8) + (v_p_affinity / 20));
      IF v_opponent_hp > 0 THEN
        v_player_hp := v_player_hp - GREATEST(1, (v_o_power / 8) + (v_o_affinity / 20));
      END IF;

      INSERT INTO combat_turns (session_id, turn_index, actor_player_id, action_key, action_payload)
      VALUES (v_session_id, v_turn, v_player_id, 'card_vs_card', jsonb_build_object(
        'p_card',v_p_name,'p_rarity',v_p_rarity,'p_power',v_p_power,'p_affinity',v_p_affinity,
        'o_card',v_o_name,'o_rarity',v_o_rarity,'o_power',v_o_power,'o_affinity',v_o_affinity,
        'p_hp_after',GREATEST(0,v_player_hp),'o_hp_after',GREATEST(0,v_opponent_hp)));

      v_turns := v_turns || jsonb_build_array(jsonb_build_object(
        'turn',v_turn,
        'p_card',v_p_name,'p_rarity',v_p_rarity,'p_power',v_p_power,
        'o_card',v_o_name,'o_rarity',v_o_rarity,'o_power',v_o_power,
        'p_hp',GREATEST(0,v_player_hp),'o_hp',GREATEST(0,v_opponent_hp)));

      v_p_idx := v_p_idx + 1; v_o_idx := v_o_idx + 1; v_turn := v_turn + 1;
    END LOOP;

    -- Determine winner
    IF v_player_hp >= v_opponent_hp THEN v_winner := v_player_id; ELSE v_winner := p_opponent_id; END IF;

    -- Create pvp_match record + resolve ELO via existing RPC
    v_reference_id := gen_random_uuid()::text;
    INSERT INTO pvp_matches (reference_id, player_a, player_b, status, power_snapshot_a, power_snapshot_b,
      rewards_json, metadata)
    VALUES (v_reference_id, v_player_id, p_opponent_id, 'pending',
      jsonb_build_object('total_power', v_p_total_power),
      jsonb_build_object('total_power', v_o_total_power),
      jsonb_build_object('tradeable_reward', 0, 'elo_change', v_elo_change),
      jsonb_build_object('combat_session_id', v_session_id, 'battle_turns', v_turn-1))
    RETURNING id INTO v_match_id;

    -- Close combat session
    UPDATE combat_sessions SET status='completed', ended_at=now(),
      result_json=jsonb_build_object('winner',v_winner,'player_hp',GREATEST(0,v_player_hp),
        'opponent_hp',GREATEST(0,v_opponent_hp),'turns',v_turn-1,'pvp_match_id',v_match_id)
    WHERE id = v_session_id;

    -- Resolve pvp_match for ELO
    PERFORM resolve_pvp_match(v_match_id, v_reference_id);

    RETURN jsonb_build_object(
      'ok',true,'session_id',v_session_id,'match_id',v_match_id,
      'you_won',v_winner=v_player_id,'winner_id',v_winner,
      'player_name',v_p_name_player,'opponent_name',v_o_name_player,
      'player_final_hp',GREATEST(0,v_player_hp),'opponent_final_hp',GREATEST(0,v_opponent_hp),
      'total_turns',v_turn-1,'turns',v_turns,
      'elo_change',CASE WHEN v_winner=v_player_id THEN v_elo_change ELSE -v_elo_change END);
    END; $function$

-- public.vexforge_start_guild_war(p_clan_a_id uuid, p_clan_b_id uuid, p_metadata jsonb) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_start_guild_war(p_clan_a_id uuid, p_clan_b_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_caller_id   uuid;
  v_is_admin    boolean;
  v_war_id      uuid;
  v_clan_a      text;
  v_clan_b      text;
  v_existing    uuid;
  v_brake       boolean;
BEGIN
  SELECT emergency_brake INTO v_brake FROM meta_system_state LIMIT 1;
  IF v_brake THEN RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active'); END IF;

  -- Admin check
  SELECT id, is_admin OR is_super_admin INTO v_caller_id, v_is_admin
  FROM players WHERE auth_user_id = auth.uid() LIMIT 1;
  IF NOT COALESCE(v_is_admin, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Admin access required');
  END IF;

  -- Validate clans differ
  IF p_clan_a_id = p_clan_b_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Clans must be different');
  END IF;

  -- Validate clans exist
  SELECT name INTO v_clan_a FROM clans WHERE id = p_clan_a_id LIMIT 1;
  SELECT name INTO v_clan_b FROM clans WHERE id = p_clan_b_id LIMIT 1;
  IF v_clan_a IS NULL OR v_clan_b IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'One or both clans not found');
  END IF;

  -- Check no active war between these clans
  SELECT id INTO v_existing FROM guild_wars
  WHERE status IN ('pending','active')
    AND ((clan_a_id = p_clan_a_id AND clan_b_id = p_clan_b_id)
      OR (clan_a_id = p_clan_b_id AND clan_b_id = p_clan_a_id))
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'War already active between these clans', 'war_id', v_existing);
  END IF;

  -- Create guild war
  INSERT INTO guild_wars (clan_a_id, clan_b_id, status, started_at, metadata)
  VALUES (p_clan_a_id, p_clan_b_id, 'active', now(),
    p_metadata || jsonb_build_object('started_by', v_caller_id, 'clan_a_name', v_clan_a, 'clan_b_name', v_clan_b))
  RETURNING id INTO v_war_id;

  RETURN jsonb_build_object(
    'ok', true,
    'war_id', v_war_id,
    'clan_a', jsonb_build_object('id', p_clan_a_id, 'name', v_clan_a),
    'clan_b', jsonb_build_object('id', p_clan_b_id, 'name', v_clan_b),
    'status', 'active'
  );
END;
$function$

-- public.vexforge_start_pve_battle(p_player uuid, p_mission uuid, p_reference_id text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_start_pve_battle(p_player uuid, p_mission uuid, p_reference_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_mission public.missions%ROWTYPE;
  v_progress public.player_progress%ROWTYPE;
  v_existing public.mission_runs%ROWTYPE;
  v_cost integer;
  v_reference text;
  v_run_id uuid;
BEGIN
  PERFORM public.assert_caller_is_player(p_player);

  v_reference := NULLIF(btrim(COALESCE(p_reference_id, '')), '');
  IF v_reference IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'missing_reference_id');
  END IF;

  SELECT *
  INTO v_existing
  FROM public.mission_runs
  WHERE player_id = p_player
    AND idempotency_key = v_reference
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'run_id', v_existing.id,
      'status', v_existing.status::text,
      'energy_spent', COALESCE(v_existing.energy_spent, 0),
      'xp_reward', COALESCE(v_existing.xp_reward, 0),
      'ingame_reward', COALESCE(v_existing.ingame_reward, 0),
      'tradeable_reward', COALESCE(v_existing.tradeable_reward, 0)
    );
  END IF;

  SELECT *
  INTO v_mission
  FROM public.missions
  WHERE id = p_mission
    AND active = true
    AND production_ready = true
    AND COALESCE(system_locked, false) = false;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_mission');
  END IF;

  SELECT *
  INTO v_progress
  FROM public.player_progress
  WHERE player_id = p_player
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_progress');
  END IF;

  v_cost := GREATEST(COALESCE(v_mission.energy_cost, 0), 0);
  IF v_progress.energy < v_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'insufficient_energy',
      'energy', v_progress.energy,
      'required', v_cost
    );
  END IF;

  UPDATE public.player_progress
  SET energy = energy - v_cost,
      updated_at = now()
  WHERE player_id = p_player;

  INSERT INTO public.mission_runs (
    mission_id,
    player_id,
    idempotency_key,
    status,
    energy_spent,
    xp_reward,
    ingame_reward,
    tradeable_reward,
    metadata,
    started_at
  )
  VALUES (
    p_mission,
    p_player,
    v_reference,
    'pending',
    v_cost,
    COALESCE(v_mission.reward_xp, 0),
    COALESCE(v_mission.reward_vex_ingame, 0),
    COALESCE(v_mission.reward_vex_tradeable, 0),
    jsonb_build_object(
      'battle_mode', 'pve_mission',
      'rule_version', 'forge-formation-v1',
      'mission_code', v_mission.code,
      'mission_name', v_mission.name,
      'difficulty', COALESCE(v_mission.difficulty, 'normal'),
      'mission_rules', COALESCE(v_mission.rules_json, '{}'::jsonb),
      'requirements', COALESCE(v_mission.requirements_json, '{}'::jsonb)
    ),
    now()
  )
  RETURNING id INTO v_run_id;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'run_id', v_run_id,
    'status', 'pending',
    'energy_spent', v_cost,
    'xp_reward', COALESCE(v_mission.reward_xp, 0),
    'ingame_reward', COALESCE(v_mission.reward_vex_ingame, 0),
    'tradeable_reward', COALESCE(v_mission.reward_vex_tradeable, 0)
  );
END;
$function$

-- public.vexforge_submit_deposit(p_amount_usdt numeric, p_chain text, p_token_symbol text, p_tx_hash text, p_payer_wallet_address text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_submit_deposit(p_amount_usdt numeric, p_chain text, p_token_symbol text, p_tx_hash text, p_payer_wallet_address text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE
    v_player_id  uuid;
    v_deposit_id uuid;
    v_vex_amount numeric;
    BEGIN
    SELECT p.id INTO v_player_id
    FROM players p
    WHERE p.auth_user_id = auth.uid();

    IF v_player_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Player not found');
    END IF;

    IF p_amount_usdt < 1.99 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Monto minimo: $1.99 USDT');
    END IF;

    IF EXISTS (
      SELECT 1 FROM vexforge_project_deposits
      WHERE tx_hash = p_tx_hash AND status != 'rejected'
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'TX hash ya registrado');
    END IF;

    v_vex_amount := p_amount_usdt * 100;

    INSERT INTO vexforge_project_deposits (
      source, chain, token_symbol, token_standard,
      payer_wallet_address, player_id, amount_usdt,
      tx_hash, reference_type, status
    )
    VALUES (
      'web', p_chain, p_token_symbol,
      CASE
        WHEN p_chain = 'TON'  THEN 'TRC20'
        WHEN p_chain = 'ETH'  THEN 'ERC20'
        WHEN p_chain = 'BSC'  THEN 'BEP20'
        ELSE 'ERC20'
      END,
      p_payer_wallet_address, v_player_id, p_amount_usdt,
      p_tx_hash, 'manual_deposit', 'pending'
    )
    RETURNING id INTO v_deposit_id;

    RETURN jsonb_build_object(
      'ok',          true,
      'deposit_id',  v_deposit_id,
      'vex_pending', v_vex_amount,
      'status',      'pending'
    );
    END;
    $function$

-- public.vexforge_submit_shop_order_payment(p_order_id uuid, p_tx_hash text, p_payer_wallet_address text, p_payment_reference text) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_submit_shop_order_payment(p_order_id uuid, p_tx_hash text, p_payer_wallet_address text, p_payment_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_auth_uid uuid:=auth.uid(); v_player_id uuid; v_order record;
BEGIN
 IF v_auth_uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','unauthorized'); END IF;
 IF nullif(trim(p_tx_hash),'') IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','tx_hash_required'); END IF;
 IF nullif(trim(p_payer_wallet_address),'') IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','payer_wallet_required'); END IF;
 SELECT id INTO v_player_id FROM public.players WHERE auth_user_id=v_auth_uid;
 IF v_player_id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','player_not_found'); END IF;
 SELECT * INTO v_order FROM public.vexforge_shop_orders WHERE id=p_order_id AND player_id=v_player_id FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','order_not_found'); END IF;
 IF v_order.status <> 'pending_payment' THEN RETURN jsonb_build_object('ok',false,'reason','order_not_pending','current_status',v_order.status,'fulfillment_status',v_order.fulfillment_status); END IF;
 UPDATE public.vexforge_shop_orders SET tx_hash=trim(p_tx_hash),payer_wallet_address=trim(p_payer_wallet_address),payment_reference=nullif(trim(p_payment_reference),''),updated_at=now() WHERE id=p_order_id;
 RETURN jsonb_build_object('ok',true,'order_id',p_order_id,'status','pending_payment','payment_submitted',true);
EXCEPTION WHEN unique_violation THEN RETURN jsonb_build_object('ok',false,'reason','tx_hash_already_used');
END;$function$

-- public.vexforge_telemetry_coverage() | SECURITY DEFINER | RETURNS TABLE(event_key text, loop_phase text, display_order integer, event_count bigint, last_seen_at timestamp with time zone)
CREATE OR REPLACE FUNCTION public.vexforge_telemetry_coverage()
 RETURNS TABLE(event_key text, loop_phase text, display_order integer, event_count bigint, last_seen_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select
    c.event_key,
    c.loop_phase,
    c.display_order,
    count(e.id)::bigint as event_count,
    max(e.created_at) as last_seen_at
  from public.vexforge_telemetry_event_catalog c
  left join public.vexforge_telemetry_events e
    on e.event_key = c.event_key
  group by c.event_key, c.loop_phase, c.display_order
  order by c.display_order;
$function$

-- public.vexforge_tier1_require_evidence() | SECURITY DEFINER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.vexforge_tier1_require_evidence()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'MET' then
    if new.evidence is null
       or jsonb_typeof(new.evidence) <> 'array'
       or jsonb_array_length(new.evidence) = 0 then
      raise exception 'VE-TIER1-PLAN-HARDENING: criterio % no puede declararse MET sin evidence (jsonb array no vacio).', new.criterion_key;
    end if;
    if new.verify_command is null or length(btrim(new.verify_command)) = 0 then
      raise exception 'VE-TIER1-PLAN-HARDENING: criterio % no puede declararse MET sin verify_command reproducible.', new.criterion_key;
    end if;
    if new.verified_at is null then
      new.verified_at := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$function$

-- public.vexforge_tier1_sync_phases() | SECURITY DEFINER | RETURNS integer
CREATE OR REPLACE FUNCTION public.vexforge_tier1_sync_phases()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  changed integer;
begin
  update public.vexforge_tier1_phases p
  set status = s.derived_status,
      updated_at = now()
  from public.vexforge_tier1_phase_state s
  where s.phase = p.phase
    and p.status is distinct from s.derived_status;
  get diagnostics changed = row_count;
  return changed;
end;
$function$

-- public.vexforge_touch_android_release_updated_at() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.vexforge_touch_android_release_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  if new.status = 'PUBLISHED' and old.status is distinct from 'PUBLISHED' then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$function$

-- public.vexforge_unequip_relic(p_relic_id uuid) | SECURITY DEFINER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.vexforge_unequip_relic(p_relic_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_player_id uuid;
  v_updated integer;
BEGIN
  SELECT id INTO v_player_id
  FROM public.players
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  UPDATE public.player_relics
     SET is_equipped = false,
         equipped_slot = NULL,
         updated_at = now()
   WHERE player_id = v_player_id
     AND relic_id = p_relic_id
     AND is_equipped = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Relic is not equipped');
  END IF;

  RETURN jsonb_build_object('ok', true, 'relic_id', p_relic_id);
END;
$function$

-- public.wallet_tx(p_player_id uuid, p_currency text, p_amount numeric, p_direction text, p_reference_id text, p_source_table text, p_source_id uuid, p_metadata jsonb) | SECURITY INVOKER | RETURNS jsonb
CREATE OR REPLACE FUNCTION public.wallet_tx(p_player_id uuid, p_currency text, p_amount numeric, p_direction text, p_reference_id text, p_source_table text, p_source_id uuid, p_metadata jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                      select public.safe_wallet_transaction(
                                              p_player_id,
                                                      p_currency,
                                                              p_amount,
                                                                      p_direction,
                                                                              p_reference_id,
                                                                                      p_source_table,
                                                                                              p_source_id,
                                                                                                      p_metadata
                                                                                                          );
                                                                                                          $function$

-- public.wallet_tx_auto_ref() | SECURITY INVOKER | RETURNS trigger
CREATE OR REPLACE FUNCTION public.wallet_tx_auto_ref()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := public.safe_reference_id();
  END IF;

  RETURN NEW;
END;
$function$

-- public.web_market_fee_bridge_quarantine_arbitrary_ledger_write(p_player_id uuid, p_amount numeric, p_source_id text) | SECURITY INVOKER | RETURNS void
CREATE OR REPLACE FUNCTION public.web_market_fee_bridge_quarantine_arbitrary_ledger_write(p_player_id uuid, p_amount numeric, p_source_id text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                                                                                                                                                                                                  begin

                                                                                                                                                                                                                                                                    insert into economy_ledger (
                                                                                                                                                                                                                                                                        reference_id,
                                                                                                                                                                                                                                                                            player_id,
                                                                                                                                                                                                                                                                                entry_type,
                                                                                                                                                                                                                                                                                    currency,
                                                                                                                                                                                                                                                                                        amount,
                                                                                                                                                                                                                                                                                            balance_before,
                                                                                                                                                                                                                                                                                                balance_after,
                                                                                                                                                                                                                                                                                                    source_table,
                                                                                                                                                                                                                                                                                                        source_id,
                                                                                                                                                                                                                                                                                                            metadata,
                                                                                                                                                                                                                                                                                                                created_at,
                                                                                                                                                                                                                                                                                                                    is_final,
                                                                                                                                                                                                                                                                                                                        row_hash,
                                                                                                                                                                                                                                                                                                                            prev_hash
                                                                                                                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                                                                                                                values (
                                                                                                                                                                                                                                                                                                                                    gen_random_uuid()::text,
                                                                                                                                                                                                                                                                                                                                        p_player_id,
                                                                                                                                                                                                                                                                                                                                            'fee',
                                                                                                                                                                                                                                                                                                                                                'VEX-TRADE',
                                                                                                                                                                                                                                                                                                                                                    p_amount,
                                                                                                                                                                                                                                                                                                                                                        0,
                                                                                                                                                                                                                                                                                                                                                            0,
                                                                                                                                                                                                                                                                                                                                                                'market_listings',
                                                                                                                                                                                                                                                                                                                                                                    p_source_id,
                                                                                                                                                                                                                                                                                                                                                                        jsonb_build_object('bridge','web_market_fee'),
                                                                                                                                                                                                                                                                                                                                                                            now(),
                                                                                                                                                                                                                                                                                                                                                                                true,
                                                                                                                                                                                                                                                                                                                                                                                    md5(random()::text),
                                                                                                                                                                                                                                                                                                                                                                                        null
                                                                                                                                                                                                                                                                                                                                                                                          );

                                                                                                                                                                                                                                                                                                                                                                                          end;
                                                                                                                                                                                                                                                                                                                                                                                          $function$
