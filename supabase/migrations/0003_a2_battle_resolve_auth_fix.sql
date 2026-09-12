
    CREATE OR REPLACE FUNCTION public.vexforge_battle_resolve(
    p_challenger_id    uuid,
    p_opponent_id      uuid,
    p_idempotency_key  text
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    DECLARE
    -- constants
    c_max_turns    constant int   := 60;
    c_elo_delta    constant int   := 25;
    c_vex_reward   constant int   := 15;
    c_crit_chance  constant float := 0.05;
    c_crit_mult    constant float := 1.5;
    c_lifesteal    constant float := 0.30;
    c_poison_dmg   constant float := 5.0;
    c_season_id    constant uuid  := '87f315cd-5a14-4803-8b0f-9532dbfd6447';

    v_units_a  jsonb[];
    v_units_b  jsonb[];
    v_unit     jsonb;

    v_turns      jsonb[]  := '{}';
    v_turn_num   int      := 0;
    v_alive_a    int;
    v_alive_b    int;
    v_total_hp_a float;
    v_total_hp_b float;

    v_winner_id  uuid;
    v_match_id   uuid;
    v_result     jsonb;

    v_i          int;
    v_atk_idx    int;
    v_def_idx    int;
    v_atk_side   text;
    v_atk_unit   jsonb;
    v_def_unit   jsonb;
    v_events     jsonb[];

    v_dmg        float;
    v_new_hp     float;
    v_heal       float;
    v_is_crit    bool;
    v_is_kill    bool;

    v_card          record;
    v_rarity_mult   float;
    v_hp            float;
    v_atk_s         float;
    v_def_s         float;
    v_spd_s         float;
    v_keywords      text[];
    v_unit_idx      int;
    BEGIN
    -- ── A2 FIX (2026-07-24): SERVER-SIDE IDENTITY VALIDATION ─────────────────
    -- Verify the caller IS the challenger. Prevents impersonation attacks.
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated', 'status', 'unauthorized');
    END IF;
    IF auth.uid() != p_challenger_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'identity_mismatch', 'status', 'forbidden',
        'detail', 'Caller identity does not match p_challenger_id');
    END IF;
    -- ─────────────────────────────────────────────────────────────────────────

    -- 0. IDEMPOTENCY
    IF EXISTS (
      SELECT 1 FROM idempotency_keys
      WHERE idempotency_key = p_idempotency_key
        AND player_id = p_challenger_id
        AND scope = 'pvp_battle'
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'duplicate_request', 'status', 'idempotent');
    END IF;

    -- 1. LOAD TOP-5 CARDS FOR EACH SIDE
    v_units_a  := '{}';
    v_unit_idx := 0;
    FOR v_card IN
      SELECT c.id, c.name, c.rarity, c.faction, c.image_url,
             c.power, c.affinity, c.prestige, c.charge, c.synergy_json
      FROM player_cards pc
      JOIN cards c ON c.id = pc.card_id
      WHERE pc.player_id = p_challenger_id
        AND pc.quantity > 0
        AND c.active = true
      ORDER BY c.power DESC
      LIMIT 5
    LOOP
      v_rarity_mult := CASE v_card.rarity
        WHEN 'Common'    THEN 1.0  WHEN 'Uncommon' THEN 1.2
        WHEN 'Rare'      THEN 1.5  WHEN 'Epic'     THEN 2.0
        WHEN 'Legendary' THEN 3.0  WHEN 'Mythic'   THEN 5.0
        WHEN 'Founder'   THEN 1.5  ELSE 1.0 END;
      v_hp    := GREATEST(10.0, (30.0 + COALESCE(v_card.power,10)*2.0 + COALESCE(v_card.prestige,0)*3.0) * v_rarity_mult);
      v_atk_s := GREATEST(1.0,  COALESCE(v_card.power,10) + COALESCE(v_card.affinity,0)*0.4);
      v_def_s := GREATEST(0.0,  COALESCE(v_card.prestige,0)*2.0 + COALESCE(v_card.charge,0));
      v_spd_s := GREATEST(1.0,  COALESCE(v_card.charge,0) + COALESCE(v_card.affinity,0)*0.3);
      v_keywords := ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(v_card.synergy_json->'keywords','[]'::jsonb))
      );
      v_unit_idx := v_unit_idx + 1;
      v_unit := jsonb_build_object(
        'idx', v_unit_idx, 'side', 'a',
        'id', v_card.id::text, 'name', v_card.name,
        'faction', COALESCE(v_card.faction,''), 'rarity', COALESCE(v_card.rarity,'Common'),
        'image_url', COALESCE(v_card.image_url,''),
        'keywords', to_jsonb(v_keywords),
        'hp', v_hp, 'max_hp', v_hp,
        'atk', v_atk_s, 'def', v_def_s, 'spd', v_spd_s,
        'power', COALESCE(v_card.power,10),
        'alive', true, 'poisoned', false,
        'shielded',      ('Veil' = ANY(v_keywords) OR 'Shield' = ANY(v_keywords)),
        'guard',         ('Guard' = ANY(v_keywords)),
        'lifesteal',     ('Drain' = ANY(v_keywords) OR 'Lifesteal' = ANY(v_keywords)),
        'poison_atk',    ('Poison' = ANY(v_keywords)),
        'rush',          ('Surge' = ANY(v_keywords)),
        'double_strike', ('DoubleStrike' = ANY(v_keywords))
      );
      v_units_a := array_append(v_units_a, v_unit);
    END LOOP;

    IF array_length(v_units_a, 1) IS NULL OR array_length(v_units_a, 1) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'no_cards', 'status', 'error',
        'detail', 'Challenger has no valid cards');
    END IF;

    -- 2. LOAD OPPONENT CARDS
    v_units_b  := '{}';
    v_unit_idx := 0;
    FOR v_card IN
      SELECT c.id, c.name, c.rarity, c.faction, c.image_url,
             c.power, c.affinity, c.prestige, c.charge, c.synergy_json
      FROM player_cards pc
      JOIN cards c ON c.id = pc.card_id
      WHERE pc.player_id = p_opponent_id
        AND pc.quantity > 0
        AND c.active = true
      ORDER BY c.power DESC
      LIMIT 5
    LOOP
      v_rarity_mult := CASE v_card.rarity
        WHEN 'Common'    THEN 1.0  WHEN 'Uncommon' THEN 1.2
        WHEN 'Rare'      THEN 1.5  WHEN 'Epic'     THEN 2.0
        WHEN 'Legendary' THEN 3.0  WHEN 'Mythic'   THEN 5.0
        WHEN 'Founder'   THEN 1.5  ELSE 1.0 END;
      v_hp    := GREATEST(10.0, (30.0 + COALESCE(v_card.power,10)*2.0 + COALESCE(v_card.prestige,0)*3.0) * v_rarity_mult);
      v_atk_s := GREATEST(1.0,  COALESCE(v_card.power,10) + COALESCE(v_card.affinity,0)*0.4);
      v_def_s := GREATEST(0.0,  COALESCE(v_card.prestige,0)*2.0 + COALESCE(v_card.charge,0));
      v_spd_s := GREATEST(1.0,  COALESCE(v_card.charge,0) + COALESCE(v_card.affinity,0)*0.3);
      v_keywords := ARRAY(
        SELECT jsonb_array_elements_text(COALESCE(v_card.synergy_json->'keywords','[]'::jsonb))
      );
      v_unit_idx := v_unit_idx + 1;
      v_unit := jsonb_build_object(
        'idx', v_unit_idx, 'side', 'b',
        'id', v_card.id::text, 'name', v_card.name,
        'faction', COALESCE(v_card.faction,''), 'rarity', COALESCE(v_card.rarity,'Common'),
        'image_url', COALESCE(v_card.image_url,''),
        'keywords', to_jsonb(v_keywords),
        'hp', v_hp, 'max_hp', v_hp,
        'atk', v_atk_s, 'def', v_def_s, 'spd', v_spd_s,
        'power', COALESCE(v_card.power,10),
        'alive', true, 'poisoned', false,
        'shielded',      ('Veil' = ANY(v_keywords) OR 'Shield' = ANY(v_keywords)),
        'guard',         ('Guard' = ANY(v_keywords)),
        'lifesteal',     ('Drain' = ANY(v_keywords) OR 'Lifesteal' = ANY(v_keywords)),
        'poison_atk',    ('Poison' = ANY(v_keywords)),
        'rush',          ('Surge' = ANY(v_keywords)),
        'double_strike', ('DoubleStrike' = ANY(v_keywords))
      );
      v_units_b := array_append(v_units_b, v_unit);
    END LOOP;

    IF array_length(v_units_b, 1) IS NULL OR array_length(v_units_b, 1) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'opponent_no_cards', 'status', 'error');
    END IF;

    -- 3. BATTLE SIMULATION
    v_alive_a := array_length(v_units_a, 1);
    v_alive_b := array_length(v_units_b, 1);
    v_turn_num := 0;

    WHILE v_alive_a > 0 AND v_alive_b > 0 AND v_turn_num < c_max_turns LOOP
      v_turn_num := v_turn_num + 1;
      v_atk_side := CASE WHEN v_turn_num % 2 = 1 THEN 'a' ELSE 'b' END;

      IF v_atk_side = 'a' THEN
        v_atk_idx := 1 + ((v_turn_num / 2) % GREATEST(1, array_length(v_units_a,1)));
        v_atk_idx := LEAST(v_atk_idx, array_length(v_units_a,1));
        v_atk_unit := v_units_a[v_atk_idx];
        v_def_idx  := 1 + ((v_turn_num / 3) % GREATEST(1, array_length(v_units_b,1)));
        v_def_idx  := LEAST(v_def_idx, array_length(v_units_b,1));
        v_def_unit := v_units_b[v_def_idx];
      ELSE
        v_atk_idx := 1 + ((v_turn_num / 2) % GREATEST(1, array_length(v_units_b,1)));
        v_atk_idx := LEAST(v_atk_idx, array_length(v_units_b,1));
        v_atk_unit := v_units_b[v_atk_idx];
        v_def_idx  := 1 + ((v_turn_num / 3) % GREATEST(1, array_length(v_units_a,1)));
        v_def_idx  := LEAST(v_def_idx, array_length(v_units_a,1));
        v_def_unit := v_units_a[v_def_idx];
      END IF;

      IF NOT (v_atk_unit->>'alive')::bool OR NOT (v_def_unit->>'alive')::bool THEN
        CONTINUE;
      END IF;

      v_events := '{}';
      v_is_crit := (random() < c_crit_chance);
      v_dmg := GREATEST(1.0, (v_atk_unit->>'atk')::float - (v_def_unit->>'def')::float);
      IF v_is_crit THEN v_dmg := v_dmg * c_crit_mult; END IF;
      v_dmg := floor(v_dmg);

      IF (v_def_unit->>'shielded')::bool THEN
        v_def_unit := jsonb_set(v_def_unit, '{shielded}', 'false');
        v_dmg := 0;
        v_events := array_append(v_events, jsonb_build_object('type','shield_block','unit',v_def_unit->>'name'));
      END IF;

      v_new_hp := GREATEST(0, (v_def_unit->>'hp')::float - v_dmg);
      v_is_kill := v_new_hp = 0;
      v_def_unit := jsonb_set(v_def_unit, '{hp}', to_jsonb(v_new_hp));
      IF v_is_kill THEN
        v_def_unit := jsonb_set(v_def_unit, '{alive}', 'false');
        IF v_atk_side = 'a' THEN v_alive_b := v_alive_b - 1; ELSE v_alive_a := v_alive_a - 1; END IF;
      END IF;

      v_heal := 0;
      IF (v_atk_unit->>'lifesteal')::bool AND v_dmg > 0 THEN
        v_heal := floor(v_dmg * c_lifesteal);
        v_atk_unit := jsonb_set(v_atk_unit, '{hp}',
          to_jsonb(LEAST((v_atk_unit->>'max_hp')::float, (v_atk_unit->>'hp')::float + v_heal)));
        v_events := array_append(v_events, jsonb_build_object('type','lifesteal','heal',v_heal,'side',v_atk_side));
      END IF;

      IF v_atk_side = 'a' THEN
        v_units_a[v_atk_idx] := v_atk_unit;
        v_units_b[v_def_idx] := v_def_unit;
      ELSE
        v_units_b[v_atk_idx] := v_atk_unit;
        v_units_a[v_def_idx] := v_def_unit;
      END IF;

      v_total_hp_a := 0; v_total_hp_b := 0;
      FOR v_i IN 1..array_length(v_units_a,1) LOOP
        IF (v_units_a[v_i]->>'alive')::bool THEN v_total_hp_a := v_total_hp_a + (v_units_a[v_i]->>'hp')::float; END IF;
      END LOOP;
      FOR v_i IN 1..array_length(v_units_b,1) LOOP
        IF (v_units_b[v_i]->>'alive')::bool THEN v_total_hp_b := v_total_hp_b + (v_units_b[v_i]->>'hp')::float; END IF;
      END LOOP;

      v_turns := array_append(v_turns, jsonb_build_object(
        'turn', v_turn_num, 'atk_side', v_atk_side,
        'attacker', jsonb_build_object('name',v_atk_unit->>'name','faction',v_atk_unit->>'faction',
          'rarity',v_atk_unit->>'rarity','hp',(v_atk_unit->>'hp')::float,'max_hp',(v_atk_unit->>'max_hp')::float,
          'atk',(v_atk_unit->>'atk')::float,'def',(v_atk_unit->>'def')::float,'image_url',v_atk_unit->>'image_url'),
        'defender', jsonb_build_object('name',v_def_unit->>'name','faction',v_def_unit->>'faction',
          'rarity',v_def_unit->>'rarity','hp',(v_def_unit->>'hp')::float,'max_hp',(v_def_unit->>'max_hp')::float,
          'atk',(v_def_unit->>'atk')::float,'def',(v_def_unit->>'def')::float,'image_url',v_def_unit->>'image_url'),
        'damage', v_dmg, 'is_crit', v_is_crit, 'is_kill', v_is_kill,
        'lifesteal_heal', v_heal, 'events', to_jsonb(v_events),
        'alive_a', v_alive_a, 'alive_b', v_alive_b
      ));
    END LOOP;

    -- 4. DETERMINE WINNER
    v_winner_id := CASE WHEN v_alive_a > 0 THEN p_challenger_id ELSE p_opponent_id END;
    v_match_id  := gen_random_uuid();

    -- 5. WRITE MATCH RESULT
    INSERT INTO pvp_matches(
      id, player_a, player_b, winner,
      player_a_wins, player_b_wins, draws, played_at
    ) VALUES (
      v_match_id, p_challenger_id, p_opponent_id, v_winner_id,
      CASE WHEN v_winner_id = p_challenger_id THEN 1 ELSE 0 END,
      CASE WHEN v_winner_id = p_opponent_id   THEN 1 ELSE 0 END,
      0, now()
    );

    -- 6. REWARD WINNER +15 VEX
    UPDATE player_wallet
    SET vex_ingame = vex_ingame + c_vex_reward,
        updated_at = now()
    WHERE player_id = v_winner_id;

    -- 7. STORE IDEMPOTENCY KEY
    INSERT INTO idempotency_keys(id, idempotency_key, player_id, scope, reference_id, created_at, expires_at)
    VALUES (gen_random_uuid(), p_idempotency_key, p_challenger_id, 'pvp_battle',
            v_match_id::text, now(), now() + interval '24 hours')
    ON CONFLICT DO NOTHING;

    -- 8. RETURN RESULT
    RETURN jsonb_build_object(
      'ok',          true,
      'status',      'completed',
      'engine',      'vexforge_battle_resolve_v2_a2fix',
      'match_id',    v_match_id::text,
      'winner_id',   v_winner_id::text,
      'you_won',     v_winner_id = p_challenger_id,
      'total_turns', v_turn_num,
      'elo_change',  CASE WHEN v_winner_id = p_challenger_id THEN c_elo_delta ELSE -c_elo_delta END,
      'turns',       to_jsonb(v_turns),
      'final_units', to_jsonb(v_units_a) || to_jsonb(v_units_b)
    );

    EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
    END;
    $function$;

    -- Revoke public/anon access — only authenticated players can call this
    REVOKE EXECUTE ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) FROM anon;
    GRANT EXECUTE ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.vexforge_battle_resolve(uuid, uuid, text) TO service_role;
    