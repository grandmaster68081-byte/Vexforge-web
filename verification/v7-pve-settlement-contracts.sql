\set ON_ERROR_STOP on

-- Local test doubles for the already-deployed mission and boss settlement
-- contracts. This fixture is isolated from the production project.
ALTER TABLE public.cards ADD COLUMN region_id text;
UPDATE public.cards
   SET region_id = CASE id
     WHEN '10000000-0000-4000-8000-000000000001'::uuid THEN 'Catedral del Alba'
     WHEN '10000000-0000-4000-8000-000000000002'::uuid THEN 'Catedral del Alba'
     WHEN '10000000-0000-4000-8000-000000000003'::uuid THEN 'Forge Core'
     ELSE NULL
   END;

CREATE TABLE public.regions (
  code text PRIMARY KEY,
  name text NOT NULL,
  world_alignment text NOT NULL
);
INSERT INTO public.regions(code, name, world_alignment)
VALUES ('forge_core', 'Forge Core', 'Forge Core'),
       ('warbound_zone', 'Warbound Zone', 'Warbound Zone');

CREATE TABLE public.player_progress (
  player_id uuid PRIMARY KEY REFERENCES public.players(id),
  energy integer NOT NULL DEFAULT 100
);
INSERT INTO public.player_progress(player_id, energy)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 100),
       ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 100),
       ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 100);

CREATE TABLE public.missions (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  region_id text,
  mission_type text NOT NULL,
  mission_group text,
  difficulty text,
  energy_cost integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 0,
  reward_vex_ingame numeric NOT NULL DEFAULT 0,
  reward_vex_tradeable numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  system_locked boolean NOT NULL DEFAULT false,
  production_ready boolean NOT NULL DEFAULT true
);
INSERT INTO public.missions(
  id, code, name, region_id, mission_type, mission_group, difficulty,
  energy_cost, reward_xp, reward_vex_ingame, reward_vex_tradeable,
  active, system_locked, production_ready
)
VALUES
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'MISSION_TEST', 'Test Expedition',
   'Catedral del Alba', 'Expedition', 'expedition', 'hard', 7, 30, 4, 0, true, false, true),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'TG_TEST', 'Telegram Contract',
   'Telegram', 'PvE', 'telegram_contract', 'normal', 2, 5, 1, 0, true, false, true),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'BLOCKED_TEST', 'Blocked Mission',
   'Catedral del Alba', 'Expedition', 'expedition', 'normal', 2, 5, 1, 0, true, false, false);

CREATE TABLE public.mission_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id),
  player_id uuid NOT NULL REFERENCES public.players(id),
  idempotency_key text NOT NULL UNIQUE,
  reward_reference_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  energy_spent integer NOT NULL,
  xp_reward bigint NOT NULL DEFAULT 0,
  ingame_reward numeric NOT NULL DEFAULT 0,
  tradeable_reward numeric NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  claimed_at timestamptz
);

CREATE OR REPLACE FUNCTION public.start_mission(
  p_player_id uuid,
  p_mission_id uuid,
  p_idempotency_key text,
  p_reward_reference_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing uuid;
  v_mission public.missions%ROWTYPE;
  v_energy integer;
  v_run_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.players
     WHERE id = p_player_id AND auth_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'player_not_owned';
  END IF;
  SELECT id INTO v_existing
    FROM public.mission_runs
   WHERE idempotency_key = p_idempotency_key;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT * INTO v_mission
    FROM public.missions
   WHERE id = p_mission_id AND active IS TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'mission_not_found'; END IF;

  SELECT energy INTO v_energy
    FROM public.player_progress
   WHERE player_id = p_player_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'player_progress_not_found'; END IF;
  IF v_energy < v_mission.energy_cost THEN RAISE EXCEPTION 'insufficient_energy'; END IF;

  UPDATE public.player_progress
     SET energy = energy - v_mission.energy_cost
   WHERE player_id = p_player_id;
  INSERT INTO public.mission_runs(
    mission_id, player_id, idempotency_key, reward_reference_id,
    status, energy_spent, xp_reward, ingame_reward, tradeable_reward,
    metadata
  ) VALUES (
    p_mission_id, p_player_id, p_idempotency_key, p_reward_reference_id,
    'active', v_mission.energy_cost, v_mission.reward_xp,
    v_mission.reward_vex_ingame, v_mission.reward_vex_tradeable,
    jsonb_build_object('mission_code', v_mission.code)
  )
  RETURNING id INTO v_run_id;
  RETURN v_run_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vexforge_resolve_mission_run(
  p_player_id uuid,
  p_mission_run_id uuid,
  p_outcome text,
  p_battle_result jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_run public.mission_runs%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.players
     WHERE id = p_player_id AND auth_user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'player_not_owned');
  END IF;
  SELECT * INTO v_run
    FROM public.mission_runs
   WHERE id = p_mission_run_id
     AND player_id = p_player_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'mission_run_not_found');
  END IF;
  IF v_run.status <> 'active' THEN
    RETURN jsonb_build_object(
      'success', true, 'claimed', v_run.status = 'claimed', 'idempotent', true
    );
  END IF;

  IF p_outcome = 'won' THEN
    UPDATE public.mission_runs
       SET status = 'claimed',
           completed_at = now(),
           claimed_at = now(),
           metadata = metadata || jsonb_build_object('battle_result', p_battle_result)
     WHERE id = p_mission_run_id;
    RETURN jsonb_build_object('success', true, 'claimed', true, 'idempotent', false);
  ELSIF p_outcome = 'defeated' THEN
    UPDATE public.mission_runs
       SET status = 'failed',
           completed_at = now(),
           metadata = metadata || jsonb_build_object('battle_result', p_battle_result)
     WHERE id = p_mission_run_id;
    RETURN jsonb_build_object('success', true, 'claimed', false, 'idempotent', false);
  END IF;
  RETURN jsonb_build_object('success', false, 'reason', 'invalid_outcome');
END;
$$;

CREATE TABLE public.world_bosses (
  id uuid PRIMARY KEY,
  boss_code text NOT NULL,
  name text NOT NULL,
  region_id text,
  tier text,
  power_level bigint NOT NULL DEFAULT 1,
  hp bigint NOT NULL DEFAULT 1000,
  reward_pool jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);
INSERT INTO public.world_bosses(
  id, boss_code, name, region_id, tier, power_level, hp, reward_pool, active
)
VALUES
  ('99999999-9999-4999-8999-999999999999', 'BOSS_TEST', 'Test World Boss',
   'forge_core', 'T2', 1000, 10000, '{"vex_ingame":100,"shards":5}'::jsonb, true),
  ('88888888-8888-4888-8888-888888888888', 'BOSS_INACTIVE', 'Inactive Boss',
   'forge_core', 'T1', 100, 1000, '{}'::jsonb, false);

CREATE TABLE public.battle_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id),
  mission_run_id uuid REFERENCES public.mission_runs(id),
  mission_id uuid REFERENCES public.missions(id),
  idempotency_key text NOT NULL UNIQUE,
  mode text NOT NULL CHECK (mode IN ('mission', 'boss', 'raid', 'pvp')),
  rules_version text NOT NULL,
  seed bigint NOT NULL,
  status text NOT NULL CHECK (status IN (
    'created', 'started', 'completed', 'defeated', 'abandoned', 'expired', 'rejected'
  )),
  outcome boolean,
  formation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  world_boss_id uuid REFERENCES public.world_bosses(id)
);
CREATE TABLE public.world_boss_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_boss_id uuid NOT NULL REFERENCES public.world_bosses(id),
  player_id uuid NOT NULL REFERENCES public.players(id),
  battle_run_id uuid NOT NULL UNIQUE REFERENCES public.battle_runs(id),
  damage bigint NOT NULL,
  reward_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL
);

CREATE OR REPLACE FUNCTION public.vexforge_attack_world_boss(
  p_world_boss_id uuid,
  p_damage bigint,
  p_battle_run_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_player_id uuid;
  v_run public.battle_runs%ROWTYPE;
  v_encounter_id uuid;
BEGIN
  SELECT id INTO v_player_id
    FROM public.players
   WHERE auth_user_id = auth.uid()
   LIMIT 1;
  SELECT * INTO v_run
    FROM public.battle_runs
   WHERE id = p_battle_run_id
     AND player_id = v_player_id
   FOR UPDATE;
  IF NOT FOUND
     OR v_run.mode <> 'boss'
     OR v_run.world_boss_id <> p_world_boss_id
     OR v_run.status <> 'completed'
     OR v_run.outcome IS NOT TRUE
     OR p_damage IS NULL
     OR p_damage <= 0
     OR p_damage > COALESCE((v_run.result_snapshot->>'damage')::bigint, 0) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'battle_result_not_authoritative');
  END IF;

  SELECT id INTO v_encounter_id
    FROM public.world_boss_encounters
   WHERE battle_run_id = p_battle_run_id;
  IF v_encounter_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'encounter_id', v_encounter_id);
  END IF;

  INSERT INTO public.world_boss_encounters(
    world_boss_id, player_id, battle_run_id, damage, reward_json, status
  ) VALUES (
    p_world_boss_id, v_player_id, p_battle_run_id, p_damage,
    jsonb_build_object('test_contract', true), 'completed'
  )
  RETURNING id INTO v_encounter_id;
  RETURN jsonb_build_object(
    'ok', true, 'idempotent', false,
    'encounter_id', v_encounter_id, 'damage_dealt', p_damage
  );
END;
$$;
