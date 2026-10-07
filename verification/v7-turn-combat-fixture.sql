-- Isolated schema fixture for run-v7-turn-combat-local.sh.
-- It intentionally contains no production data or connection settings.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'CREATE ROLE anon';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'CREATE ROLE authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'CREATE ROLE service_role';
  END IF;
END;
$$;

CREATE SCHEMA auth;
CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE TABLE public.players (
  id uuid PRIMARY KEY,
  auth_user_id uuid UNIQUE,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE public.cards (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  faction text NOT NULL,
  rarity text NOT NULL,
  image_url text,
  power integer NOT NULL,
  affinity integer NOT NULL,
  prestige integer NOT NULL,
  charge integer NOT NULL,
  synergy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.card_synergy_rules (
  id uuid PRIMARY KEY,
  source_card_id uuid NOT NULL REFERENCES public.cards(id),
  target_card_id uuid NOT NULL REFERENCES public.cards(id),
  synergy_type text NOT NULL,
  modifier numeric NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_card_id, target_card_id, synergy_type)
);

CREATE TABLE public.player_deck (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id),
  slot_number integer NOT NULL,
  card_id uuid REFERENCES public.cards(id),
  is_champion boolean NOT NULL DEFAULT false,
  UNIQUE (player_id, slot_number)
);

INSERT INTO public.players(id, auth_user_id)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111111'),
       ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        '22222222-2222-4222-8222-222222222222'),
       ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        '33333333-3333-4333-8333-333333333333');

INSERT INTO public.cards(id, name, faction, rarity, power, affinity, prestige, charge, synergy_json)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Mirror Champion', 'Aegis', 'Epic', 20, 8, 8, 5, '{"keywords":[]}'),
  ('10000000-0000-4000-8000-000000000002', 'Mirror Vanguard', 'Aegis', 'Rare', 16, 8, 7, 4, '{"keywords":["Guard"]}'),
  ('10000000-0000-4000-8000-000000000003', 'Mirror Sentinel', 'Aegis', 'Rare', 14, 8, 6, 6, '{"keywords":["Drain","Veil"]}'),
  ('10000000-0000-4000-8000-000000000004', 'Mirror Reserve', 'Ember', 'Common', 12, 4, 5, 5, '{"keywords":["Surge"]}');

-- Synthetic local-only rows exercise the same official passive power_pct
-- contract without copying production card data into the isolated fixture.
INSERT INTO public.card_synergy_rules(
  id, source_card_id, target_card_id, synergy_type, modifier, metadata
) VALUES
  ('20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002',
   'fixture_champion_vanguard', 0.20,
   '{"name":"Fixture Vanguard Pair","bonus_type":"power_pct","trigger":"passive"}'),
  ('20000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000004',
   'fixture_champion_reserve', 0.25,
   '{"name":"Fixture Reserve Pair","bonus_type":"power_pct","trigger":"passive"}');

INSERT INTO public.player_deck(player_id, slot_number, card_id, is_champion)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, '10000000-0000-4000-8000-000000000001', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, '10000000-0000-4000-8000-000000000002', false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2, '10000000-0000-4000-8000-000000000003', false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, '10000000-0000-4000-8000-000000000004', false),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 0, '10000000-0000-4000-8000-000000000001', true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1, '10000000-0000-4000-8000-000000000002', false),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2, '10000000-0000-4000-8000-000000000003', false),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 3, '10000000-0000-4000-8000-000000000004', false);
