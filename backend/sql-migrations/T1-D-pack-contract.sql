-- T1-D — authoritative, idempotent pack purchase and opening
--
-- The live catalog and order tables already exist. This migration only aligns
-- the two RPCs with those live contracts:
--   - purchases debit vex_tradeable and create a paid order atomically
--   - opening accepts paid orders and stores the reveal in order metadata
--   - retrying an already fulfilled order returns the stored reveal
--
-- No new tables, columns, cards, or economy values are introduced here.

CREATE OR REPLACE FUNCTION public.vexforge_buy_pack_with_vex(
  p_pack_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
$function$;


CREATE OR REPLACE FUNCTION public.vexforge_open_pack(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
$function$;

GRANT EXECUTE ON FUNCTION public.vexforge_buy_pack_with_vex(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_open_pack(uuid) TO authenticated;