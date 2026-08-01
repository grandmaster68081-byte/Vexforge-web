-- VEXFORGE: keep auth-user provisioning compatible with player_progress checks.
-- New accounts start at the first valid tutorial step.

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
$function$;