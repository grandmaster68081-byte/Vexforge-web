-- T1-E: authoritative, idempotent relic ownership and equipment contract.
-- Uses the live player_relics schema: is_equipped, not equipped.

CREATE OR REPLACE FUNCTION public.grant_starter_relics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_player_id uuid;
BEGIN
  SELECT id
    INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;

  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  -- Serialize a first-time claim per player so concurrent requests cannot
  -- race through the existence check.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_player_id::text, 0));

  -- The starter kit is a one-time, idempotent grant.
  IF EXISTS (
    SELECT 1
      FROM public.player_relics
     WHERE player_id = v_player_id
     LIMIT 1
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.player_relics (player_id, relic_id, is_equipped, acquired_from)
  SELECT v_player_id, r.id, false, 'starter_kit'
    FROM public.relics AS r
   WHERE r.metadata->>'rarity' = 'Common'
   ORDER BY r.code
   LIMIT 3
  ON CONFLICT (player_id, relic_id) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.equip_relic(p_relic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_player_id uuid;
  v_is_equipped boolean;
  v_equipped_slot text;
  v_equipped_count integer;
BEGIN
  SELECT id
    INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Player not found');
  END IF;

  -- Serialize all equipment changes for this player before checking the
  -- three-relic limit. This prevents concurrent equips from exceeding it.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_player_id::text, 0));

  SELECT pr.is_equipped, r.metadata->>'slot'
    INTO v_is_equipped, v_equipped_slot
    FROM public.player_relics AS pr
    JOIN public.relics AS r ON r.id = pr.relic_id
   WHERE pr.player_id = v_player_id
     AND pr.relic_id = p_relic_id
   FOR UPDATE OF pr;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Relic not owned');
  END IF;

  -- Retrying an already successful equip is a no-op success.
  IF v_is_equipped THEN
    RETURN jsonb_build_object('ok', true, 'already_equipped', true);
  END IF;

  IF v_equipped_slot IS NULL OR btrim(v_equipped_slot) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Relic slot not configured');
  END IF;

  -- Lock the player's relic rows before counting them.
  PERFORM 1
    FROM public.player_relics
   WHERE player_id = v_player_id
   FOR UPDATE;

  SELECT count(*)
    INTO v_equipped_count
    FROM public.player_relics
   WHERE player_id = v_player_id
     AND is_equipped = true;

  IF v_equipped_count >= 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Maximo 3 reliquias equipadas');
  END IF;

  UPDATE public.player_relics
     SET is_equipped = true,
         equipped_slot = v_equipped_slot,
         updated_at = now()
   WHERE player_id = v_player_id
     AND relic_id = p_relic_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.unequip_relic(p_relic_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_player_id uuid;
  v_is_equipped boolean;
BEGIN
  SELECT id
    INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;

  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Player not found');
  END IF;

  SELECT is_equipped
    INTO v_is_equipped
    FROM public.player_relics
   WHERE player_id = v_player_id
     AND relic_id = p_relic_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Relic not owned');
  END IF;

  -- Retrying an already successful unequip is a no-op success.
  IF NOT v_is_equipped THEN
    RETURN jsonb_build_object('ok', true, 'already_unequipped', true);
  END IF;

  UPDATE public.player_relics
     SET is_equipped = false,
         equipped_slot = NULL,
         updated_at = now()
   WHERE player_id = v_player_id
     AND relic_id = p_relic_id;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.grant_starter_relics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_starter_relics() TO authenticated;

REVOKE ALL ON FUNCTION public.equip_relic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.equip_relic(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.unequip_relic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unequip_relic(uuid) TO authenticated;