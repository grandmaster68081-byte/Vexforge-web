-- T1-A: keep deck validation and persistence on the canonical player_deck table.
-- The existing frontend contract accepts p_card_ids and the game rules allow
-- up to 30 cards. These functions intentionally do not create a parallel decks
-- table or change card/economy data.

CREATE OR REPLACE FUNCTION public.validate_deck(p_card_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
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
$function$;

CREATE OR REPLACE FUNCTION public.save_deck(p_card_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
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
$function$;