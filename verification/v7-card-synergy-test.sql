\set ON_ERROR_STOP on
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

DO $$
DECLARE
  v_start jsonb;
  v_result jsonb;
  v_action jsonb;
  v_champion jsonb;
  v_session_id uuid;
  v_seq bigint;
  v_reserve_id text;
  v_vanguard_id text;
BEGIN
  v_start := public.vexforge_turn_v7_start_training('local-synergy-start-0001');
  IF COALESCE((v_start->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'training start for card synergy test failed: %', v_start;
  END IF;

  SELECT unit INTO v_champion
    FROM jsonb_array_elements(v_start#>'{board,a}') AS units(unit)
   WHERE unit->>'slot' = 'champion';
  IF v_champion IS NULL
     OR v_champion->>'power' <> '24'
     OR (v_champion#>>'{stat_breakdown,card_synergy,active_rule_count}')::integer <> 1
     OR (v_champion#>>'{stat_breakdown,card_synergy,power_pct}')::numeric <> 0.20
     OR v_champion#>'{stat_breakdown,card_synergy,active_names}' <>
        '["Fixture Vanguard Pair"]'::jsonb THEN
    RAISE EXCEPTION 'active official pair was not applied to the Champion: %', v_champion;
  END IF;

  SELECT unit->>'unit_id' INTO v_reserve_id
    FROM jsonb_array_elements(v_start#>'{board,a}') AS units(unit)
   WHERE unit->>'card_id' = '10000000-0000-4000-8000-000000000004'
     AND unit->>'slot' = 'reserve';
  SELECT unit->>'unit_id' INTO v_vanguard_id
    FROM jsonb_array_elements(v_start#>'{board,a}') AS units(unit)
   WHERE unit->>'card_id' = '10000000-0000-4000-8000-000000000002'
     AND unit->>'slot' = 'vanguard';
  IF v_reserve_id IS NULL OR v_vanguard_id IS NULL THEN
    RAISE EXCEPTION 'synergy test formation did not contain the expected active and reserve cards';
  END IF;

  SELECT action INTO v_action
    FROM jsonb_array_elements(v_start->'legal_actions') AS items(action)
   WHERE action->>'kind' = 'replace'
     AND action->>'source_unit_id' = v_reserve_id
     AND action->>'target_unit_id' = v_vanguard_id;
  IF v_action IS NULL THEN
    RAISE EXCEPTION 'server did not offer the legal reserve replacement needed for the synergy test';
  END IF;

  v_session_id := (v_start->>'session_id')::uuid;
  v_seq := (v_start->>'event_seq')::bigint;
  v_result := public.vexforge_turn_v7_submit_action(
    v_session_id, v_seq, 'local-synergy-replace-0001', v_action
  );
  IF COALESCE((v_result->>'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'reserve replacement for card synergy test failed: %', v_result;
  END IF;

  SELECT unit INTO v_champion
    FROM jsonb_array_elements(v_result#>'{board,a}') AS units(unit)
   WHERE unit->>'slot' = 'champion';
  IF v_champion->>'power' <> '25'
     OR (v_champion#>>'{stat_breakdown,card_synergy,active_rule_count}')::integer <> 1
     OR (v_champion#>>'{stat_breakdown,card_synergy,power_pct}')::numeric <> 0.25
     OR v_champion#>'{stat_breakdown,card_synergy,active_names}' <>
        '["Fixture Reserve Pair"]'::jsonb THEN
    RAISE EXCEPTION 'synergy did not update when its reserve partner entered the board: %', v_champion;
  END IF;
END;
$$;
