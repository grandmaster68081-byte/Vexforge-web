-- VE-SEC-6-AUTHENTICATED-DEFINER-IDENTITY-BINDING
-- Vincula la identidad del llamador en las funciones SECURITY DEFINER que aún
-- aceptaban un p_player_id libre bajo el rol `authenticated`, y recorta la
-- superficie de las que no tienen ningún consumidor (cliente ni base de datos).
-- Idempotente y transaccional. Sin cambios de esquema, datos ni contratos.

BEGIN;

-- 1. vexforge_evolve_card: destruye copias y debita wallet. Sin vínculo de identidad
--    cualquier jugador autenticado podía evolucionar cartas de otro jugador.
--    El bloque tiene EXCEPTION WHEN OTHERS, por lo que el rechazo se devuelve
--    explícitamente en el contrato jsonb existente (ok=false + reason).
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
$function$;

-- 2. get_season_progress: además de leer, INSERTA la fila de pase de temporada
--    del jugador indicado. Se vincula identidad con el helper canónico.
CREATE OR REPLACE FUNCTION public.get_season_progress(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE v_sp RECORD; v_psp RECORD; v_tiers JSONB;
    BEGIN
    PERFORM public.assert_caller_is_player(p_player_id);
    SELECT * INTO v_sp FROM season_passes WHERE active=true ORDER BY season_number DESC LIMIT 1;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','No active season'); END IF;
    SELECT * INTO v_psp FROM player_season_pass WHERE player_id=p_player_id AND season_pass_id=v_sp.id;
    IF NOT FOUND THEN
      INSERT INTO player_season_pass(player_id,season_pass_id,xp,current_tier,is_premium)
      VALUES(p_player_id,v_sp.id,0,0,false) ON CONFLICT DO NOTHING;
      v_psp.xp:=0; v_psp.current_tier:=0; v_psp.is_premium:=false;
    END IF;
    SELECT jsonb_agg(jsonb_build_object(
      'tier',tier_level,'xp_required',xp_required,'is_premium',is_premium,'reward',reward_json,
      'unlocked',v_psp.xp>=xp_required
    ) ORDER BY tier_level,is_premium) INTO v_tiers FROM season_pass_tiers WHERE season_pass_id=v_sp.id;
    RETURN jsonb_build_object('ok',true,'season_name',v_sp.name,'season_number',v_sp.season_number,
      'end_at',v_sp.end_at,'player_xp',v_psp.xp,'current_tier',v_psp.current_tier,
      'is_premium',v_psp.is_premium,'tiers',v_tiers);
    END; $function$;

-- 3. get_player_stats: lectura privada del perfil propio (mercado, packs, misiones).
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
$function$;

-- 4. get_player_rank: sólo el propio jugador. El ranking público sigue disponible
--    por get_leaderboard y get_public_pvp_rankings (sin cambios).
CREATE OR REPLACE FUNCTION public.get_player_rank(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      DECLARE
        v_season    record;
        v_ranking   record;
        v_mmr       integer := 0;
        v_tier      text;
        v_tier_color text;
        v_tier_icon  text;
        v_tier_min   integer;
        v_shields    integer := 0;
      BEGIN
        PERFORM public.assert_caller_is_player(p_player_id);

        -- Current active season
        SELECT id INTO v_season FROM public.pvp_seasons WHERE active = true LIMIT 1;

        -- Player ranking in this season
        SELECT mmr, wins, losses, draws
          INTO v_ranking
          FROM public.pvp_rankings
         WHERE player_id = p_player_id
           AND (v_season IS NULL OR season_id = v_season.id)
         ORDER BY updated_at DESC LIMIT 1;

        v_mmr := COALESCE(v_ranking.mmr, 1000);

        -- Determine tier (Iron -> Bronze -> Silver -> Gold -> Platinum -> Diamond -> Mythic)
        -- tier_icon guarda el nombre del glifo canónico de ForgeIcon, nunca un emoji.
        IF    v_mmr >= 3000 THEN v_tier := 'Mythic';   v_tier_color := '#ff4444'; v_tier_icon := 'rank-mythic';   v_tier_min := 3000;
        ELSIF v_mmr >= 2400 THEN v_tier := 'Diamond';  v_tier_color := '#4a9eff'; v_tier_icon := 'rank-diamond';  v_tier_min := 2400;
        ELSIF v_mmr >= 1800 THEN v_tier := 'Platinum'; v_tier_color := '#a855f7'; v_tier_icon := 'rank-platinum'; v_tier_min := 1800;
        ELSIF v_mmr >= 1300 THEN v_tier := 'Gold';     v_tier_color := '#e8b84b'; v_tier_icon := 'rank-gold';     v_tier_min := 1300;
        ELSIF v_mmr >= 900  THEN v_tier := 'Silver';   v_tier_color := '#b0b0b0'; v_tier_icon := 'rank-silver';   v_tier_min := 900;
        ELSIF v_mmr >= 500  THEN v_tier := 'Bronze';   v_tier_color := '#cd7f32'; v_tier_icon := 'rank-bronze';   v_tier_min := 500;
        ELSE                     v_tier := 'Iron';     v_tier_color := '#9e9e9e'; v_tier_icon := 'rank-iron';     v_tier_min := 0;
        END IF;

        -- Shields
        IF v_season.id IS NOT NULL THEN
          SELECT shields_remaining INTO v_shields
            FROM public.rank_shields
           WHERE player_id = p_player_id AND season_id = v_season.id AND tier_name = v_tier;
        END IF;

        RETURN jsonb_build_object(
          'ok',         true,
          'player_id',  p_player_id,
          'mmr',        v_mmr,
          'tier',       v_tier,
          'tier_color', v_tier_color,
          'tier_icon',  v_tier_icon,
          'tier_min',   v_tier_min,
          'shields',    COALESCE(v_shields, 0),
          'wins',       COALESCE(v_ranking.wins, 0),
          'losses',     COALESCE(v_ranking.losses, 0),
          'season_id',  v_season.id
        );
      END;
      $function$;

-- 5. Recorte de superficie sin consumidor (ni cliente ni base de datos):
--    vexforge_grant_relic ya exige admin de control; get_player_display_names
--    tiene equivalente público (get_public_player_names) para rutas anónimas.
REVOKE ALL ON FUNCTION public.vexforge_grant_relic(uuid, uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vexforge_grant_relic(uuid, uuid, integer, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_player_display_names(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_display_names(uuid[]) TO service_role;

-- 6. Reafirma privilegios de las 4 funciones redefinidas (CREATE OR REPLACE
--    conserva los grants previos; se declaran de forma explícita e idempotente).
REVOKE ALL ON FUNCTION public.vexforge_evolve_card(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vexforge_evolve_card(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_season_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_season_progress(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_player_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_player_stats(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_player_rank(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_player_rank(uuid) TO authenticated, service_role;

COMMIT;
