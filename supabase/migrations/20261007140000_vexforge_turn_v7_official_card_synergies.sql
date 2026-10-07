-- Snapshot the official card-pair rules into each new V7 team. The live
-- card_synergy_rules catalog remains authoritative; combat never reads a
-- changing catalog midway through an existing session.
CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_attach_card_synergies(p_units jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_units jsonb := COALESCE(p_units, '[]'::jsonb);
  v_unit jsonb;
  v_card_id uuid;
  v_rules jsonb;
  v_i integer;
BEGIN
  IF jsonb_typeof(v_units) <> 'array' THEN
    RAISE EXCEPTION 'V7 card synergy snapshot requires a unit array';
  END IF;

  IF jsonb_array_length(v_units) = 0 THEN RETURN v_units; END IF;

  FOR v_i IN 0 .. jsonb_array_length(v_units) - 1 LOOP
    v_unit := v_units->v_i;
    v_card_id := NULLIF(v_unit->>'card_id', '')::uuid;
    v_rules := '[]'::jsonb;

    IF v_card_id IS NOT NULL THEN
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'source_card_id', r.source_card_id::text,
        'target_card_id', r.target_card_id::text,
        'partner_card_id', CASE
          WHEN r.source_card_id = v_card_id THEN r.target_card_id::text
          ELSE r.source_card_id::text
        END,
        'synergy_type', r.synergy_type,
        'modifier', r.modifier,
        'bonus_type', r.metadata->>'bonus_type',
        'trigger', r.metadata->>'trigger',
        'name', COALESCE(
          NULLIF(r.metadata->>'name', ''),
          NULLIF(r.metadata->>'combo_name', ''),
          NULLIF(r.metadata->>'label', ''),
          r.synergy_type
        )
      ) ORDER BY r.synergy_type), '[]'::jsonb)
        INTO v_rules
        FROM public.card_synergy_rules r
        JOIN public.cards source_card ON source_card.id = r.source_card_id
        JOIN public.cards target_card ON target_card.id = r.target_card_id
       WHERE source_card.active IS TRUE
         AND target_card.active IS TRUE
         AND (
           (r.source_card_id = v_card_id AND EXISTS (
             SELECT 1
               FROM jsonb_array_elements(v_units) AS candidate(unit)
              WHERE candidate.unit->>'card_id' = r.target_card_id::text
           ))
           OR
           (r.target_card_id = v_card_id AND EXISTS (
             SELECT 1
               FROM jsonb_array_elements(v_units) AS candidate(unit)
              WHERE candidate.unit->>'card_id' = r.source_card_id::text
           ))
         );

      IF EXISTS (
        SELECT 1
          FROM jsonb_array_elements(v_rules) AS item(rule)
         WHERE COALESCE(item.rule->>'bonus_type', '') <> 'power_pct'
            OR COALESCE(item.rule->>'trigger', '') <> 'passive'
      ) THEN
        RAISE EXCEPTION 'V7 unsupported official card synergy rule for card %', v_card_id;
      END IF;
    END IF;

    v_unit := jsonb_set(v_unit, '{synergy_rules_version}',
                        '"card_synergy_rules_v1"'::jsonb, true);
    v_unit := jsonb_set(v_unit, '{synergy_rules}', v_rules, true);
    v_units := jsonb_set(v_units, ARRAY[v_i::text], v_unit, true);
  END LOOP;
  RETURN v_units;
END;
$$;

REVOKE ALL ON FUNCTION public._vexforge_turn_v7_attach_card_synergies(jsonb)
  FROM PUBLIC, anon, authenticated;

-- Apply each registered passive power percentage only while both official
-- cards are alive and on the active board. Reserve and fallen cards do not
-- satisfy the pairing rule; every formation change recalculates it.
CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_recompute_side(p_units jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_units jsonb := p_units;
  v_count integer := jsonb_array_length(p_units);
  v_champion jsonb;
  v_champion_index integer := -1;
  v_reserve_count integer := 0;
  v_active_count integer := 0;
  v_same_faction boolean := true;
  v_unit jsonb;
  v_base jsonb;
  v_keywords jsonb;
  v_synergy jsonb;
  v_partner_card_id text;
  v_slot text;
  v_base_hp integer;
  v_base_atk integer;
  v_base_def integer;
  v_base_spd integer;
  v_base_power integer;
  v_hp_bonus integer;
  v_atk_bonus integer;
  v_def_bonus integer;
  v_def_effect integer;
  v_spd_effect integer;
  v_hp_before_faction integer;
  v_atk_before_faction integer;
  v_def_before_faction integer;
  v_spd_after_effect integer;
  v_new_max_hp integer;
  v_new_hp integer;
  v_old_hp integer;
  v_old_max integer;
  v_missing_hp integer;
  v_effective_power integer;
  v_power_bonus integer;
  v_synergy_pct numeric;
  v_synergy_count integer;
  v_synergy_names jsonb;
  v_i integer;
  v_active boolean;
  v_partner_active boolean;
  v_guard_keyword boolean;
BEGIN
  IF v_count = 0 THEN RETURN '[]'::jsonb; END IF;

  FOR v_i IN 0 .. v_count - 1 LOOP
    v_unit := v_units->v_i;
    IF COALESCE((v_unit->>'is_champion')::boolean, false) THEN
      v_champion_index := v_i;
      v_champion := v_unit;
      EXIT;
    END IF;
  END LOOP;
  IF v_champion_index < 0 THEN
    RAISE EXCEPTION 'V7 formation has no resolved Champion';
  END IF;

  FOR v_i IN 0 .. v_count - 1 LOOP
    v_unit := v_units->v_i;
    v_slot := COALESCE(v_unit->>'slot', 'reserve');
    IF v_slot = 'reserve' AND COALESCE((v_unit->>'alive')::boolean, false) THEN
      v_reserve_count := v_reserve_count + 1;
    END IF;
    IF v_slot NOT IN ('reserve', 'fallen')
       AND COALESCE((v_unit->>'alive')::boolean, false) THEN
      v_active_count := v_active_count + 1;
      IF COALESCE(v_unit->>'faction', '') IS DISTINCT FROM
         COALESCE(v_champion->>'faction', '') THEN
        v_same_faction := false;
      END IF;
    END IF;
  END LOOP;
  v_same_faction := v_same_faction AND v_active_count >= 2;

  FOR v_i IN 0 .. v_count - 1 LOOP
    v_unit := v_units->v_i;
    v_base := v_unit->'base_stats';
    v_keywords := COALESCE(v_unit->'keywords', '[]'::jsonb);
    v_slot := COALESCE(v_unit->>'slot', 'reserve');
    v_base_hp := (v_base->>'hp')::integer;
    v_base_atk := (v_base->>'atk')::integer;
    v_base_def := (v_base->>'def')::integer;
    v_base_spd := (v_base->>'spd')::integer;
    v_base_power := COALESCE((v_base->>'power')::integer, (v_unit->>'power')::integer, 0);
    v_guard_keyword := v_keywords ? 'Guard';
    v_def_effect := CASE WHEN v_guard_keyword THEN 5 ELSE 0 END;
    v_spd_effect := CASE WHEN v_keywords ? 'Surge' THEN 20 ELSE 0 END;
    v_hp_bonus := 0;
    v_atk_bonus := 0;
    v_def_bonus := 0;
    v_synergy_pct := 0;
    v_synergy_count := 0;
    v_synergy_names := '[]'::jsonb;
    IF COALESCE((v_unit->>'is_champion')::boolean, false) THEN
      v_hp_bonus := v_reserve_count * 5;
      v_atk_bonus := floor(v_reserve_count * 1.2)::integer;
      v_def_bonus := floor(v_reserve_count * 0.8)::integer;
    END IF;

    v_active := v_slot NOT IN ('reserve', 'fallen')
      AND COALESCE((v_unit->>'alive')::boolean, false);
    IF v_active THEN
      FOR v_synergy IN
        SELECT item.rule
          FROM jsonb_array_elements(COALESCE(v_unit->'synergy_rules', '[]'::jsonb))
               AS item(rule)
      LOOP
        IF COALESCE(v_synergy->>'bonus_type', '') <> 'power_pct'
           OR COALESCE(v_synergy->>'trigger', '') <> 'passive' THEN
          RAISE EXCEPTION 'V7 unsupported official card synergy rule: %', v_synergy;
        END IF;
        v_partner_card_id := v_synergy->>'partner_card_id';
        SELECT EXISTS (
          SELECT 1
            FROM jsonb_array_elements(v_units) AS partner(unit)
           WHERE partner.unit->>'card_id' = v_partner_card_id
             AND COALESCE((partner.unit->>'alive')::boolean, false)
             AND COALESCE(partner.unit->>'slot', 'reserve') NOT IN ('reserve', 'fallen')
        ) INTO v_partner_active;
        IF v_partner_active THEN
          v_synergy_pct := v_synergy_pct + COALESCE((v_synergy->>'modifier')::numeric, 0);
          v_synergy_count := v_synergy_count + 1;
          v_synergy_names := v_synergy_names || jsonb_build_array(
            COALESCE(NULLIF(v_synergy->>'name', ''), v_synergy->>'synergy_type')
          );
        END IF;
      END LOOP;
    END IF;

    v_power_bonus := round(v_base_power * v_synergy_pct)::integer;
    v_effective_power := v_base_power + v_power_bonus;
    v_hp_before_faction := v_base_hp + v_hp_bonus;
    v_atk_before_faction := v_base_atk + v_atk_bonus + v_power_bonus;
    v_def_before_faction := v_base_def + v_def_effect + v_def_bonus;
    v_spd_after_effect := v_base_spd + v_spd_effect;
    IF v_same_faction AND v_active THEN
      v_new_max_hp := round(v_hp_before_faction * 1.15)::integer;
      v_atk_before_faction := round(v_atk_before_faction * 1.15)::integer;
      v_def_before_faction := round(v_def_before_faction * 1.15)::integer;
    ELSE
      v_new_max_hp := v_hp_before_faction;
    END IF;

    v_old_hp := COALESCE((v_unit->>'hp')::integer, v_new_max_hp);
    v_old_max := COALESCE((v_unit->>'max_hp')::integer, v_new_max_hp);
    v_missing_hp := greatest(0, v_old_max - v_old_hp);
    v_new_hp := greatest(0, least(v_new_max_hp, v_new_max_hp - v_missing_hp));

    v_unit := jsonb_set(v_unit, '{hp}', to_jsonb(v_new_hp), true);
    v_unit := jsonb_set(v_unit, '{max_hp}', to_jsonb(v_new_max_hp), true);
    v_unit := jsonb_set(v_unit, '{atk}', to_jsonb(v_atk_before_faction), true);
    v_unit := jsonb_set(v_unit, '{def}', to_jsonb(v_def_before_faction), true);
    v_unit := jsonb_set(v_unit, '{spd}', to_jsonb(v_spd_after_effect), true);
    v_unit := jsonb_set(v_unit, '{power}', to_jsonb(v_effective_power), true);
    v_unit := jsonb_set(v_unit, '{in_reserve}', to_jsonb(v_slot = 'reserve'), true);
    v_unit := jsonb_set(v_unit, '{guard}', to_jsonb(v_guard_keyword OR v_slot = 'vanguard'), true);
    v_unit := jsonb_set(v_unit, '{stat_breakdown}', jsonb_build_object(
      'base_stats', v_base,
      'formation', jsonb_build_object(
        'reserve_count', CASE WHEN COALESCE((v_unit->>'is_champion')::boolean, false)
                              THEN v_reserve_count ELSE 0 END,
        'reserve_hp', v_hp_bonus,
        'reserve_atk', v_atk_bonus,
        'reserve_def', v_def_bonus,
        'same_faction_percent', CASE WHEN v_same_faction AND v_active THEN 15 ELSE 0 END
      ),
      'card_synergy', jsonb_build_object(
        'rules_version', COALESCE(v_unit->>'synergy_rules_version', ''),
        'active_rule_count', v_synergy_count,
        'power_pct', v_synergy_pct,
        'power_bonus', v_power_bonus,
        'active_names', v_synergy_names
      ),
      'effects', jsonb_build_object(
        'guard_def', v_def_effect,
        'surge_speed', v_spd_effect,
        'guard_active', v_guard_keyword OR v_slot = 'vanguard',
        'drain', v_keywords ? 'Drain',
        'veil', v_keywords ? 'Veil'
      ),
      'effective', jsonb_build_object(
        'hp', v_new_hp, 'max_hp', v_new_max_hp,
        'atk', v_atk_before_faction, 'def', v_def_before_faction,
        'spd', v_spd_after_effect, 'power', v_effective_power
      )
    ), true);
    v_units := jsonb_set(v_units, ARRAY[v_i::text], v_unit, true);
  END LOOP;
  RETURN v_units;
END;
$$;

-- Player-controlled formations cover training and PvP. Capture pair rules
-- before the initial stat calculation; later moves preserve this snapshot.
CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_build_side(
  p_player_id uuid,
  p_side text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_units jsonb := '[]'::jsonb;
  v_card record;
  v_keywords text[];
  v_power integer;
  v_affinity integer;
  v_prestige integer;
  v_charge integer;
  v_hp integer;
  v_atk integer;
  v_def integer;
  v_spd integer;
  v_champion_index integer := -1;
  v_vanguard_index integer := -1;
  v_sentinel_index integer := -1;
  v_i integer;
  v_unit jsonb;
BEGIN
  IF p_side NOT IN ('a', 'b') THEN
    RAISE EXCEPTION 'invalid V7 side';
  END IF;

  FOR v_card IN
    SELECT c.id AS card_id, c.name, c.faction::text AS faction, c.rarity::text AS rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10) AS power,
           COALESCE(c.affinity, 2) AS affinity,
           COALESCE(c.prestige, 1) AS prestige,
           COALESCE(c.charge, 1) AS charge,
           COALESCE(c.synergy_json, '{}'::jsonb) AS synergy_json,
           pd.slot_number, pd.is_champion
      FROM public.player_deck pd
      JOIN public.cards c ON c.id = pd.card_id
     WHERE pd.player_id = p_player_id
       AND c.active = true
     ORDER BY pd.is_champion DESC, c.power DESC, pd.slot_number ASC
     LIMIT 8
  LOOP
    v_keywords := ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(v_card.synergy_json->'keywords', '[]'::jsonb))
    );
    v_power := v_card.power;
    v_affinity := v_card.affinity;
    v_prestige := v_card.prestige;
    v_charge := v_card.charge;
    v_hp := v_power * 4 + v_affinity;
    v_atk := v_power + v_affinity / 4;
    v_def := v_prestige * 2 + v_affinity / 8;
    v_spd := v_charge * 4 + v_affinity / 10;

    IF 'Guard' = ANY(v_keywords) THEN v_def := v_def + 5; END IF;
    IF 'Surge' = ANY(v_keywords) THEN v_spd := v_spd + 20; END IF;

    v_units := v_units || jsonb_build_array(jsonb_build_object(
      'unit_id', p_side || ':' || v_card.slot_number::text || ':' || v_card.card_id::text,
      'card_id', v_card.card_id,
      'slot_number', v_card.slot_number,
      'side', p_side,
      'name', v_card.name,
      'faction', v_card.faction,
      'rarity', v_card.rarity,
      'image_url', v_card.image_url,
      'slot', 'reserve',
      'is_champion', COALESCE(v_card.is_champion, false),
      'in_reserve', true,
      'alive', true,
      'hp', v_hp,
      'max_hp', v_hp,
      'atk', v_atk,
      'def', v_def,
      'spd', v_spd,
      'power', v_power,
      'guard', 'Guard' = ANY(v_keywords),
      'lifesteal', 'Drain' = ANY(v_keywords),
      'shielded', 'Veil' = ANY(v_keywords),
      'keywords', to_jsonb(v_keywords),
      'base_stats', jsonb_build_object('hp', v_hp, 'atk', v_power + v_affinity / 4,
                                       'def', v_prestige * 2 + v_affinity / 8,
                                       'spd', v_charge * 4 + v_affinity / 10,
                                       'power', v_power),
      'stat_breakdown', '{}'::jsonb
    ));
  END LOOP;

  IF jsonb_array_length(v_units) = 0 THEN RETURN v_units; END IF;
  FOR v_i IN 0 .. jsonb_array_length(v_units) - 1 LOOP
    IF COALESCE((v_units->v_i->>'is_champion')::boolean, false) THEN
      v_champion_index := v_i;
      EXIT;
    END IF;
  END LOOP;
  IF v_champion_index < 0 THEN v_champion_index := 0; END IF;

  FOR v_i IN 0 .. jsonb_array_length(v_units) - 1 LOOP
    v_unit := v_units->v_i;
    IF v_i = v_champion_index THEN
      v_unit := jsonb_set(v_unit, '{slot}', '"champion"'::jsonb, true);
      v_unit := jsonb_set(v_unit, '{is_champion}', 'true'::jsonb, true);
    ELSIF v_vanguard_index < 0 THEN
      v_vanguard_index := v_i;
      v_unit := jsonb_set(v_unit, '{slot}', '"vanguard"'::jsonb, true);
    ELSIF v_sentinel_index < 0 THEN
      v_sentinel_index := v_i;
      v_unit := jsonb_set(v_unit, '{slot}', '"sentinel"'::jsonb, true);
    ELSE
      v_unit := jsonb_set(v_unit, '{slot}', '"reserve"'::jsonb, true);
    END IF;
    v_units := jsonb_set(v_units, ARRAY[v_i::text], v_unit, true);
  END LOOP;

  RETURN public._vexforge_turn_v7_recompute_side(
    public._vexforge_turn_v7_attach_card_synergies(v_units)
  );
END;
$$;

-- PvE opponents are also built only from active official cards. Their exact
-- pair rules are snapshotted with the same server-owned helper.
CREATE OR REPLACE FUNCTION public._vexforge_turn_v7_build_official_side(
  p_region text,
  p_seed text,
  p_unit_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_units jsonb := '[]'::jsonb;
  v_region_label text;
  v_card record;
  v_keywords text[];
  v_power integer;
  v_affinity integer;
  v_prestige integer;
  v_charge integer;
  v_hp integer;
  v_atk integer;
  v_def integer;
  v_spd integer;
  v_index integer := 0;
  v_vanguard_index integer := -1;
  v_sentinel_index integer := -1;
  v_unit jsonb;
BEGIN
  IF p_unit_count IS NULL OR p_unit_count < 1 OR p_unit_count > 8 THEN
    RAISE EXCEPTION 'invalid V7 official profile size';
  END IF;

  SELECT COALESCE(NULLIF(r.world_alignment, ''), NULLIF(r.name, ''), p_region)
    INTO v_region_label
    FROM public.regions r
   WHERE lower(r.code) = lower(COALESCE(p_region, ''))
   ORDER BY r.code
   LIMIT 1;
  v_region_label := COALESCE(NULLIF(v_region_label, ''), p_region);

  FOR v_card IN
    SELECT c.id AS card_id,
           c.name,
           c.faction::text AS faction,
           c.rarity::text AS rarity,
           COALESCE(c.image_url, '') AS image_url,
           COALESCE(c.power, 10) AS power,
           COALESCE(c.affinity, 2) AS affinity,
           COALESCE(c.prestige, 1) AS prestige,
           COALESCE(c.charge, 1) AS charge,
           COALESCE(c.synergy_json, '{}'::jsonb) AS synergy_json
      FROM public.cards c
     WHERE c.active IS TRUE
     ORDER BY
       CASE
         WHEN NULLIF(v_region_label, '') IS NOT NULL
          AND regexp_replace(lower(trim(COALESCE(c.region_id, ''))), '[^[:alnum:]]', '', 'g')
              = regexp_replace(lower(trim(v_region_label)), '[^[:alnum:]]', '', 'g')
         THEN 0 ELSE 1
       END,
       COALESCE(c.power, 0) DESC,
       md5(COALESCE(p_seed, '') || ':' || c.id::text),
       c.id
     LIMIT p_unit_count
  LOOP
    v_keywords := ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(v_card.synergy_json->'keywords', '[]'::jsonb))
    );
    v_power := v_card.power;
    v_affinity := v_card.affinity;
    v_prestige := v_card.prestige;
    v_charge := v_card.charge;
    v_hp := v_power * 4 + v_affinity;
    v_atk := v_power + v_affinity / 4;
    v_def := v_prestige * 2 + v_affinity / 8;
    v_spd := v_charge * 4 + v_affinity / 10;

    IF 'Guard' = ANY(v_keywords) THEN v_def := v_def + 5; END IF;
    IF 'Surge' = ANY(v_keywords) THEN v_spd := v_spd + 20; END IF;

    v_units := v_units || jsonb_build_array(jsonb_build_object(
      'unit_id', 'b:' || v_index::text || ':' || v_card.card_id::text,
      'card_id', v_card.card_id,
      'slot_number', v_index,
      'side', 'b',
      'name', v_card.name,
      'faction', v_card.faction,
      'rarity', v_card.rarity,
      'image_url', v_card.image_url,
      'slot', 'reserve',
      'is_champion', v_index = 0,
      'in_reserve', true,
      'alive', true,
      'hp', v_hp,
      'max_hp', v_hp,
      'atk', v_atk,
      'def', v_def,
      'spd', v_spd,
      'power', v_power,
      'guard', 'Guard' = ANY(v_keywords),
      'lifesteal', 'Drain' = ANY(v_keywords),
      'shielded', 'Veil' = ANY(v_keywords),
      'keywords', to_jsonb(v_keywords),
      'base_stats', jsonb_build_object(
        'hp', v_hp,
        'atk', v_power + v_affinity / 4,
        'def', v_prestige * 2 + v_affinity / 8,
        'spd', v_charge * 4 + v_affinity / 10,
        'power', v_power
      ),
      'stat_breakdown', '{}'::jsonb
    ));
    v_index := v_index + 1;
  END LOOP;

  IF jsonb_array_length(v_units) = 0 THEN RETURN v_units; END IF;
  FOR v_index IN 0 .. jsonb_array_length(v_units) - 1 LOOP
    v_unit := v_units->v_index;
    IF v_index = 0 THEN
      v_unit := jsonb_set(v_unit, '{slot}', '"champion"'::jsonb, true);
      v_unit := jsonb_set(v_unit, '{is_champion}', 'true'::jsonb, true);
    ELSIF v_vanguard_index < 0 THEN
      v_vanguard_index := v_index;
      v_unit := jsonb_set(v_unit, '{slot}', '"vanguard"'::jsonb, true);
    ELSIF v_sentinel_index < 0 THEN
      v_sentinel_index := v_index;
      v_unit := jsonb_set(v_unit, '{slot}', '"sentinel"'::jsonb, true);
    ELSE
      v_unit := jsonb_set(v_unit, '{slot}', '"reserve"'::jsonb, true);
    END IF;
    v_units := jsonb_set(v_units, ARRAY[v_index::text], v_unit, true);
  END LOOP;

  RETURN public._vexforge_turn_v7_recompute_side(
    public._vexforge_turn_v7_attach_card_synergies(v_units)
  );
END;
$$;

REVOKE ALL ON FUNCTION public._vexforge_turn_v7_build_side(uuid,text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._vexforge_turn_v7_build_official_side(text,text,integer)
  FROM PUBLIC, anon, authenticated;
