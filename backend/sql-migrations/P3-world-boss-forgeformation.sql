-- P3: ForgeFormation victories are the only source of world-boss damage.
-- The existing RPC already owns rewards and wallet accounting; this keeps
-- those formulas intact while making shared HP updates atomic.
CREATE OR REPLACE FUNCTION public.vexforge_attack_world_boss(
  p_world_boss_id uuid,
  p_damage bigint DEFAULT 10
)
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
  SELECT emergency_brake INTO v_brake FROM meta_system_state LIMIT 1;
  IF v_brake THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Emergency brake active');
  END IF;

  SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authenticated');
  END IF;

  -- Serialize attacks for the same boss so two players cannot spend the same HP.
  SELECT * INTO v_boss
    FROM world_bosses
   WHERE id = p_world_boss_id AND active = true
   FOR UPDATE;
  IF v_boss.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'World boss not found or not active');
  END IF;

  SELECT COALESCE(SUM(damage) FILTER (WHERE status = 'completed'), 0)
    INTO v_damage_dealt
    FROM world_boss_encounters
   WHERE world_boss_id = p_world_boss_id;

  v_remaining_hp := GREATEST(0, v_boss.hp - v_damage_dealt);
  IF v_remaining_hp <= 0 THEN
    RETURN jsonb_build_object(
      'ok', false, 'reason', 'Boss already defeated',
      'max_hp', v_boss.hp, 'damage_dealt_total', v_damage_dealt, 'remaining_hp', 0
    );
  END IF;

  p_damage := GREATEST(1, LEAST(p_damage, v_boss.power_level * 100, v_remaining_hp));

  v_reward_vex := ROUND(
    (p_damage::numeric / v_boss.hp)
    * COALESCE((v_boss.reward_pool->>'vex_ingame')::numeric, 100), 2
  );
  v_reward_shards := ROUND(
    (p_damage::numeric / v_boss.hp)
    * COALESCE((v_boss.reward_pool->>'shards')::numeric, 0), 0
  );
  v_reward_vex := GREATEST(v_reward_vex, vexforge_get_policy_numeric('boss_attack_min_reward', 1));
  v_reward_json := jsonb_build_object(
    'vex_ingame', v_reward_vex, 'shards', v_reward_shards, 'damage', p_damage
  );

  INSERT INTO world_boss_encounters (
    world_boss_id, player_id, damage, reward_json, status
  ) VALUES (
    p_world_boss_id, v_player_id, p_damage, v_reward_json, 'completed'
  ) RETURNING id INTO v_encounter_id;

  v_reference_id := 'boss_attack_' || v_encounter_id::text || '_' ||
    extract(epoch from now())::bigint::text;
  IF v_reward_vex > 0 THEN
    PERFORM wallet_tx(
      v_player_id, 'vex_ingame', v_reward_vex, 'in', v_reference_id,
      'world_boss_encounters', v_encounter_id,
      jsonb_build_object('boss_id', p_world_boss_id, 'damage', p_damage)
    );
  END IF;
  IF v_reward_shards > 0 THEN
    PERFORM wallet_tx(
      v_player_id, 'shards', v_reward_shards, 'in', v_reference_id || '_shards',
      'world_boss_encounters', v_encounter_id,
      jsonb_build_object('boss_id', p_world_boss_id, 'damage', p_damage)
    );
  END IF;

  PERFORM emit_game_event(
    v_player_id, 'world_boss_attack', p_world_boss_id::text,
    jsonb_build_object(
      'damage', p_damage, 'reward_vex', v_reward_vex,
      'reward_shards', v_reward_shards, 'boss_name', v_boss.name,
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
    'reward', jsonb_build_object('vex_ingame', v_reward_vex, 'shards', v_reward_shards)
  );
END;
$function$;