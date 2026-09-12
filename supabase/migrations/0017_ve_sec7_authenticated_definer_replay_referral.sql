-- VE-SEC-7-AUTHENTICATED-DEFINER-REPLAY-REFERRAL
-- Binds replay reads and referral rewards to the authenticated caller.
-- Idempotent and transactional. No schema changes.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_match_replay(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_session JSONB;
  v_turns JSONB;
  v_player_id UUID;
BEGIN
  SELECT p.id
    INTO v_player_id
  FROM public.players p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;

  SELECT to_jsonb(cs)
    INTO v_session
  FROM public.combat_sessions cs
  WHERE cs.id = p_session_id;

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Session not found');
  END IF;

  IF NOT (
    public.vexforge_is_control_admin()
    OR EXISTS (
      SELECT 1
      FROM public.combat_sessions cs
      WHERE cs.id = p_session_id
        AND cs.created_by = v_player_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.combat_turns ct
      WHERE ct.session_id = p_session_id
        AND ct.actor_player_id = v_player_id
    )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'Not authorized');
  END IF;

  SELECT jsonb_agg(ct ORDER BY ct.turn_index)
    INTO v_turns
  FROM public.combat_turns ct
  WHERE ct.session_id = p_session_id;

  RETURN jsonb_build_object(
    'ok', true,
    'session', v_session,
    'turns', COALESCE(v_turns, '[]'::jsonb)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_referral_on_register(
  p_referral_code text,
  p_referred_auth_id uuid
)
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
$function$;

COMMIT;
