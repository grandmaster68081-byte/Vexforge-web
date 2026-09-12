-- 0046_ve_pvp_2_where_true_safeupdate_fix.sql
-- Fix constant-folded WHERE true predicates rejected by safeupdate on the authenticator role.
-- All target tables are singleton state tables with a non-null primary key id.
-- Function bodies are sourced from the live Supabase database and changed only at the affected predicates.
CREATE OR REPLACE FUNCTION public.apply_reality_rules()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r record;
BEGIN

  FOR r IN
    SELECT * FROM reality_rules
    WHERE active = true
  LOOP

    /* simplificado: si condición coincide, aplica efecto global */

    IF (r.condition @> '{"global": true}') THEN

      UPDATE world_reality_state
      SET difficulty_scalar = difficulty_scalar * COALESCE((r.effect->>'difficulty')::numeric, 1),
          loot_scalar = loot_scalar * COALESCE((r.effect->>'loot')::numeric, 1),
          xp_scalar = xp_scalar * COALESCE((r.effect->>'xp')::numeric, 1),
          market_scalar = market_scalar * COALESCE((r.effect->>'market')::numeric, 1),
          pvp_scalar = pvp_scalar * COALESCE((r.effect->>'pvp')::numeric, 1),
          last_update = now()
  WHERE id IS NOT NULL;

    END IF;

  END LOOP;

END;
$function$;

CREATE OR REPLACE FUNCTION public.economic_brake_check()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_inflation numeric;
BEGIN

  SELECT inflation_rate
  INTO v_inflation
  FROM economy_global_metrics
  ORDER BY computed_at DESC
  LIMIT 1;

  IF v_inflation IS NULL THEN
    RETURN;
  END IF;

  -- =========================
  -- EMERGENCY CONDITIONS
  -- =========================

  IF v_inflation > 2.5 THEN
    UPDATE meta_system_state
    SET
      emergency_brake = true,
      reward_scaling = 0.5,
      extraction_limit = 0.05,
      updated_at = now()
  WHERE id IS NOT NULL;
  ELSE
    UPDATE meta_system_state
    SET
      emergency_brake = false,
      extraction_limit = 0.20,
      updated_at = now()
  WHERE id IS NOT NULL;
  END IF;

END;
$function$;

CREATE OR REPLACE FUNCTION public.economy_os_orchestrator()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  load numeric;
BEGIN

  load := calculate_economy_load();

  /* REGISTRO DE PROCESOS ACTUALIZADOS */

  INSERT INTO economy_processes(process_type, cpu_cost, risk_score, priority)
  VALUES
    ('market', 2, random() * 100, 2),
    ('pvp', 3, random() * 100, 3),
    ('wallet', 1, random() * 100, 1),
    ('mission', 2, random() * 100, 2),
    ('compiler', 4, random() * 100, 4),
    ('meta', 5, random() * 100, 5);


  /* =====================================================
     CAMBIO DE MODO GLOBAL
     ===================================================== */

  UPDATE economy_kernel_state
  SET mode =
    CASE
      WHEN load < 800 THEN 'stable'
      WHEN load < 1500 THEN 'stress'
      WHEN load < 2500 THEN 'critical'
      ELSE 'lockdown'
    END
  WHERE id IS NOT NULL;

END;
$function$;

CREATE OR REPLACE FUNCTION public.meta_system_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total_in numeric;
  v_total_trade numeric;
  v_inflation numeric;
  v_active_players int;
  v_reward_pressure numeric;
  v_extraction_pressure numeric;
BEGIN

  -- =========================
  -- GLOBAL SNAPSHOT
  -- =========================
  SELECT
    COALESCE(SUM(vex_ingame),0),
    COALESCE(SUM(vex_tradeable),0),
    COUNT(*)
  INTO v_total_in, v_total_trade, v_active_players
  FROM player_wallet;

  -- =========================
  -- INFLATION RATE
  -- =========================
  v_inflation := v_total_trade / NULLIF(v_total_in + 1, 0);

  -- =========================
  -- PRESSURE METRICS
  -- =========================
  v_reward_pressure := v_active_players * v_inflation;
  v_extraction_pressure := v_total_trade * 0.001;

  -- =========================
  -- UPDATE GLOBAL STATE
  -- =========================
  UPDATE economy_global_metrics
  SET
    total_vex_in = v_total_in,
    total_vex_trade = v_total_trade,
    inflation_rate = v_inflation,
    active_players = v_active_players,
    reward_pressure = v_reward_pressure,
    computed_at = now()
  WHERE id IS NOT NULL;

END;
$function$;

CREATE OR REPLACE FUNCTION public.mutate_reality()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  state jsonb;
BEGIN

  state := analyze_world_state();

  /* =====================================================
     INFLACIÓN DEL MUNDO
     ===================================================== */

  IF (state->>'avg_wallet')::numeric > 9000 THEN

    UPDATE world_reality_state
    SET loot_scalar = 0.85,
        xp_scalar = 0.9,
        market_scalar = 1.2,
        stability = stability - 5,
        last_update = now()
  WHERE id IS NOT NULL;

  END IF;


  /* =====================================================
     SOBRECARGA DE MERCADO
     ===================================================== */

  IF (state->>'market_pressure')::int > 500 THEN

    UPDATE world_reality_state
    SET market_scalar = 1.4,
        loot_scalar = 0.9,
        stability = stability - 7,
        last_update = now()
  WHERE id IS NOT NULL;

  END IF;


  /* =====================================================
     GUERRA PvP GLOBAL
     ===================================================== */

  IF (state->>'pvp_pressure')::int > 200 THEN

    UPDATE world_reality_state
    SET pvp_scalar = 1.3,
        xp_scalar = 1.1,
        stability = stability - 10,
        last_update = now()
  WHERE id IS NOT NULL;

  END IF;


  /* =====================================================
     COLAPSO CONTROLADO
     ===================================================== */

  IF (SELECT stability FROM world_reality_state WHERE id='global') < 40 THEN

    UPDATE world_reality_state
    SET difficulty_scalar = 1.5,
        loot_scalar = 0.7,
        xp_scalar = 0.8,
        market_scalar = 1.6,
        pvp_scalar = 1.4,
        last_update = now()
  WHERE id IS NOT NULL;

  END IF;

END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_to_canonical_reality()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  canon uuid;
BEGIN

  SELECT active_branch
  INTO canon
  FROM canonical_reality
  WHERE id = 'global';

  IF canon IS NULL THEN
    RETURN;
  END IF;

  /* aquí es donde el mundo “se adapta” */

  UPDATE world_reality_state
  SET stability = 100,
      last_update = now()
  WHERE id IS NOT NULL;

  /* ajuste simplificado: el mundo base sigue al canon */

  UPDATE world_reality_state
  SET difficulty_scalar = 1.0 + (random() * 0.2),
      loot_scalar = 1.0,
      xp_scalar = 1.0,
      market_scalar = 1.0,
      pvp_scalar = 1.0
  WHERE id IS NOT NULL;

END;
$function$;

CREATE OR REPLACE FUNCTION public.update_market_stability()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trade numeric;
  v_volatility numeric;
BEGIN

  SELECT total_vex_trade
  INTO v_trade
  FROM economy_global_metrics
  ORDER BY computed_at DESC
  LIMIT 1;

  v_volatility := v_trade / 1000000.0;

  UPDATE market_dynamic_state
  SET
    volatility_index = v_volatility,
    global_floor_multiplier = GREATEST(0.5, 1.0 - v_volatility),
    dump_pressure = v_volatility * 0.8,
    last_updated = now()
  WHERE id IS NOT NULL;

END;
$function$;

CREATE OR REPLACE FUNCTION public.update_reward_scaling()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_inflation numeric;
  v_k numeric;
BEGIN

  SELECT inflation_rate
  INTO v_inflation
  FROM economy_global_metrics
  ORDER BY computed_at DESC
  LIMIT 1;

  IF v_inflation IS NULL THEN
    v_inflation := 0;
  END IF;

  -- =========================
  -- CORE FORMULA (TU CANON)
  -- k_new = k_old * (1 - αI + βE - γW)
  -- =========================

  SELECT inflation_dampener
  INTO v_k
  FROM meta_system_state
  LIMIT 1;

  IF v_k IS NULL THEN
    v_k := 1.0;
  END IF;

  v_k := v_k * (1 - (0.4 * v_inflation));

  UPDATE meta_system_state
  SET
    inflation_dampener = GREATEST(0.2, LEAST(2.0, v_k)),
    updated_at = now()
  WHERE id IS NOT NULL;

END;
$function$;

CREATE OR REPLACE FUNCTION public.vexforge_meta_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  -- placeholder control logic hook
  -- aquí después conectamos inflation / PES / rewards

  UPDATE meta_system_state
  SET updated_at = now()
  WHERE id IS NOT NULL;

END;
$function$;

