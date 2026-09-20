-- VEXFORGE ECONOMIC TRIGGER FORENSIC EXTRACTION
-- Extracted: 2026-09-20T13:37:53.575Z
-- READ-ONLY export.

-- public.cards.trg_cards_supply_guard
CREATE TRIGGER trg_cards_supply_guard BEFORE INSERT OR UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION vexforge_enforce_card_supply_guard();

-- public.cards.trg_cards_updated_at
CREATE TRIGGER trg_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.economy_ledger.ledger_block_delete
CREATE TRIGGER ledger_block_delete BEFORE DELETE ON economy_ledger FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- public.economy_ledger.ledger_block_update
CREATE TRIGGER ledger_block_update BEFORE UPDATE ON economy_ledger FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- public.economy_ledger.trg_achievements_on_fusion
CREATE TRIGGER trg_achievements_on_fusion AFTER INSERT ON economy_ledger FOR EACH ROW EXECUTE FUNCTION trg_fn_achievements_on_fusion();

-- public.economy_ledger.trg_economy_guard
CREATE TRIGGER trg_economy_guard BEFORE INSERT ON economy_ledger FOR EACH ROW EXECUTE FUNCTION economy_ledger_guard();

-- public.economy_ledger.trg_ledger_auto_fix
CREATE TRIGGER trg_ledger_auto_fix BEFORE INSERT ON economy_ledger FOR EACH ROW EXECUTE FUNCTION ledger_auto_fix();

-- public.economy_ledger.trg_ledger_block_update
CREATE TRIGGER trg_ledger_block_update BEFORE DELETE OR UPDATE ON economy_ledger FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- public.economy_ledger.trg_ledger_hash_chain
CREATE TRIGGER trg_ledger_hash_chain BEFORE INSERT ON economy_ledger FOR EACH ROW EXECUTE FUNCTION ledger_hash_chain();

-- public.kernel_market_guard.trg_market_validation
CREATE TRIGGER trg_market_validation BEFORE INSERT OR UPDATE ON kernel_market_guard FOR EACH ROW EXECUTE FUNCTION validate_market_listing();

-- public.market_listings.trg_achievements_on_market
CREATE TRIGGER trg_achievements_on_market AFTER UPDATE ON market_listings FOR EACH ROW EXECUTE FUNCTION trg_fn_achievements_on_market();

-- public.market_listings.trg_canon_guard_market
CREATE TRIGGER trg_canon_guard_market AFTER INSERT OR UPDATE ON market_listings FOR EACH ROW EXECUTE FUNCTION canon_guard();

-- public.market_listings.trg_compiler_market
CREATE TRIGGER trg_compiler_market AFTER INSERT OR UPDATE ON market_listings FOR EACH STATEMENT EXECUTE FUNCTION trigger_economic_compiler();

-- public.market_listings.trg_event_router_market
CREATE TRIGGER trg_event_router_market AFTER INSERT OR UPDATE ON market_listings FOR EACH ROW EXECUTE FUNCTION vexforge_event_router();

-- public.market_listings.trg_guard_market
CREATE TRIGGER trg_guard_market AFTER INSERT OR UPDATE ON market_listings FOR EACH STATEMENT EXECUTE FUNCTION trigger_economy_guardian();

-- public.market_listings.trg_kernel_market
CREATE TRIGGER trg_kernel_market AFTER INSERT OR UPDATE ON market_listings FOR EACH STATEMENT EXECUTE FUNCTION economy_kernel_guard();

-- public.market_listings.trg_market_anomaly
CREATE TRIGGER trg_market_anomaly AFTER INSERT ON market_listings FOR EACH ROW EXECUTE FUNCTION detect_market_anomaly();

-- public.market_listings.trg_market_event
CREATE TRIGGER trg_market_event AFTER UPDATE ON market_listings FOR EACH ROW EXECUTE FUNCTION hook_market_event();

-- public.market_listings.trg_market_updated_at
CREATE TRIGGER trg_market_updated_at BEFORE UPDATE ON market_listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.market_listings.trg_rebalance_market
CREATE TRIGGER trg_rebalance_market AFTER INSERT OR UPDATE ON market_listings FOR EACH STATEMENT EXECUTE FUNCTION trigger_economy_rebalance();

-- public.market_listings.trg_rule_market
CREATE TRIGGER trg_rule_market AFTER INSERT OR UPDATE ON market_listings FOR EACH STATEMENT EXECUTE FUNCTION trigger_rule_kernel();

-- public.market_listings.trg_self_compile_market
CREATE TRIGGER trg_self_compile_market AFTER INSERT OR UPDATE ON market_listings FOR EACH STATEMENT EXECUTE FUNCTION trigger_self_compiler();

-- public.player_cards.trg_achievements_on_cards
CREATE TRIGGER trg_achievements_on_cards AFTER INSERT OR UPDATE ON player_cards FOR EACH ROW EXECUTE FUNCTION trg_fn_achievements_on_cards();

-- public.player_cards.trg_player_cards_updated_at
CREATE TRIGGER trg_player_cards_updated_at BEFORE UPDATE ON player_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.player_wallet.audit_wallet
CREATE TRIGGER audit_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- public.player_wallet.trg_compiler_wallet
CREATE TRIGGER trg_compiler_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH STATEMENT EXECUTE FUNCTION trigger_economic_compiler();

-- public.player_wallet.trg_guard_wallet
CREATE TRIGGER trg_guard_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH STATEMENT EXECUTE FUNCTION trigger_economy_guardian();

-- public.player_wallet.trg_jobs_wallet
CREATE TRIGGER trg_jobs_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH ROW EXECUTE FUNCTION enqueue_system_job();

-- public.player_wallet.trg_kernel_wallet
CREATE TRIGGER trg_kernel_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH STATEMENT EXECUTE FUNCTION economy_kernel_guard();

-- public.player_wallet.trg_player_wallet_updated_at
CREATE TRIGGER trg_player_wallet_updated_at BEFORE UPDATE ON player_wallet FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.player_wallet.trg_rebalance_wallet
CREATE TRIGGER trg_rebalance_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH STATEMENT EXECUTE FUNCTION trigger_economy_rebalance();

-- public.player_wallet.trg_rule_wallet
CREATE TRIGGER trg_rule_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH STATEMENT EXECUTE FUNCTION trigger_rule_kernel();

-- public.player_wallet.trg_self_compile_wallet
CREATE TRIGGER trg_self_compile_wallet AFTER INSERT OR UPDATE ON player_wallet FOR EACH STATEMENT EXECUTE FUNCTION trigger_self_compiler();

-- public.player_wallet.trg_wallet_anomaly
CREATE TRIGGER trg_wallet_anomaly AFTER UPDATE ON player_wallet FOR EACH ROW EXECUTE FUNCTION detect_wallet_anomaly();

-- public.player_wallet.trg_wallet_updated
CREATE TRIGGER trg_wallet_updated BEFORE UPDATE ON player_wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- public.players.audit_players
CREATE TRIGGER audit_players AFTER INSERT OR UPDATE ON players FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- public.players.trg_init_player_progress
CREATE TRIGGER trg_init_player_progress AFTER INSERT ON players FOR EACH ROW EXECUTE FUNCTION fn_init_player_progress();

-- public.players.trg_players_updated
CREATE TRIGGER trg_players_updated BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- public.players.trg_players_updated_at
CREATE TRIGGER trg_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.telegram_ads.trg_telegram_ads_updated_at
CREATE TRIGGER trg_telegram_ads_updated_at BEFORE UPDATE ON telegram_ads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.telegram_referrals.trg_telegram_referrals_updated_at
CREATE TRIGGER trg_telegram_referrals_updated_at BEFORE UPDATE ON telegram_referrals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.telegram_rewards_log.trg_telegram_rewards_log_updated_at
CREATE TRIGGER trg_telegram_rewards_log_updated_at BEFORE UPDATE ON telegram_rewards_log FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- public.vexforge_android_release_registry.vexforge_android_release_touch_updated_at
CREATE TRIGGER vexforge_android_release_touch_updated_at BEFORE UPDATE ON vexforge_android_release_registry FOR EACH ROW EXECUTE FUNCTION vexforge_touch_android_release_updated_at();

-- public.vexforge_official_asset_manifest.trg_vexforge_official_asset_manifest_updated_at
CREATE TRIGGER trg_vexforge_official_asset_manifest_updated_at BEFORE UPDATE ON vexforge_official_asset_manifest FOR EACH ROW EXECUTE FUNCTION vexforge_set_updated_at();

-- public.vexforge_official_documents.trg_vexforge_official_documents_updated_at
CREATE TRIGGER trg_vexforge_official_documents_updated_at BEFORE UPDATE ON vexforge_official_documents FOR EACH ROW EXECUTE FUNCTION vexforge_set_updated_at();

-- public.vexforge_official_modules.trg_vexforge_official_modules_updated_at
CREATE TRIGGER trg_vexforge_official_modules_updated_at BEFORE UPDATE ON vexforge_official_modules FOR EACH ROW EXECUTE FUNCTION vexforge_set_updated_at();

-- public.vexforge_pack_orders.trg_achievements_on_packs
CREATE TRIGGER trg_achievements_on_packs AFTER INSERT OR UPDATE ON vexforge_pack_orders FOR EACH ROW EXECUTE FUNCTION trg_fn_achievements_on_packs();

-- public.vexforge_pack_orders.trg_referral_first_pack_reward
CREATE TRIGGER trg_referral_first_pack_reward AFTER INSERT OR UPDATE OF status ON vexforge_pack_orders FOR EACH ROW EXECUTE FUNCTION process_referral_first_pack_reward_trigger();

-- public.vexforge_player_shards.trg_vexforge_player_shards_guard
CREATE TRIGGER trg_vexforge_player_shards_guard BEFORE INSERT OR UPDATE ON vexforge_player_shards FOR EACH ROW EXECUTE FUNCTION vexforge_enforce_player_shards_guard();

-- public.vexforge_visual_tier1_objective.vexforge_tier1_require_evidence_trg
CREATE TRIGGER vexforge_tier1_require_evidence_trg BEFORE INSERT OR UPDATE ON vexforge_visual_tier1_objective FOR EACH ROW EXECUTE FUNCTION vexforge_tier1_require_evidence();

-- public.wallet_transactions.trg_event_router_wallet
CREATE TRIGGER trg_event_router_wallet AFTER INSERT OR UPDATE ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION vexforge_event_router();

-- public.wallet_transactions.trg_wallet_events
CREATE TRIGGER trg_wallet_events AFTER INSERT OR UPDATE ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION vexforge_event_router();

-- public.wallet_transactions.trg_wallet_tx_auto_ref
CREATE TRIGGER trg_wallet_tx_auto_ref BEFORE INSERT ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION wallet_tx_auto_ref();

-- public.wallet_transactions.trg_wallet_tx_block_update
CREATE TRIGGER trg_wallet_tx_block_update BEFORE DELETE OR UPDATE ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION prevent_mutation();


-- COMPLETE TRIGGER FUNCTION DEFINITIONS

-- public.vexforge_enforce_card_supply_guard() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.vexforge_enforce_card_supply_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    if new.supply is not null and new.supply > 0 then
        if coalesce(new.minted, 0) > new.supply then
            new.minted := new.supply;
        end if;
    end if;

    if new.marketable is null then
        new.marketable := true;
    end if;

    if new.fusion_enabled is null then
        new.fusion_enabled := true;
    end if;

    if new.release_status is null then
        new.release_status := 'reserve';
    end if;

    return new;
end;
$function$

-- public.set_updated_at() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$

-- public.prevent_ledger_mutation() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.prevent_ledger_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    raise exception 'LEDGER IS IMMUTABLE - INSERT ONLY ALLOWED';
end;
$function$

-- public.trg_fn_achievements_on_fusion() | SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.trg_fn_achievements_on_fusion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.entry_type = 'fusion' THEN
    PERFORM fn_check_and_grant_achievements(NEW.player_id);
  END IF;
  RETURN NEW;
END;
$function$

-- public.economy_ledger_guard() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.economy_ledger_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
                                                                                          BEGIN
                                                                                            -- prevent null currency
                                                                                              IF NEW.currency IS NULL THEN
                                                                                                  RAISE EXCEPTION 'currency cannot be null';
                                                                                                    END IF;

                                                                                                      -- enforce balance logic consistency
                                                                                                        IF NEW.balance_after IS NULL THEN
                                                                                                            NEW.balance_after := NEW.balance_before + NEW.amount;
                                                                                                              END IF;

                                                                                                                RETURN NEW;
                                                                                                                END;
                                                                                                                $function$

-- public.ledger_auto_fix() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.ledger_auto_fix()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := public.safe_reference_id();
  END IF;

  RETURN NEW;
END;
$function$

-- public.ledger_hash_chain() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.ledger_hash_chain()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  last_hash text;
BEGIN

  /* obtener último hash del mismo jugador */
  SELECT row_hash
  INTO last_hash
  FROM economy_ledger
  WHERE player_id = NEW.player_id
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.prev_hash := last_hash;

  NEW.row_hash := compute_ledger_hash(
    NEW.player_id,
    NEW.currency,
    NEW.amount,
    NEW.reference_id,
    NEW.prev_hash
  );

  RETURN NEW;
END;
$function$

-- public.validate_market_listing() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.validate_market_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

    -- basic anomaly detection
    IF NEW.price <= 0 THEN
        NEW.blocked := true;
        NEW.reason := 'invalid_price';
        NEW.anomaly_score := 1;
    END IF;

    IF NEW.price > 1000000 THEN
        NEW.blocked := true;
        NEW.reason := 'price_outlier';
        NEW.anomaly_score := 0.95;
    END IF;

    RETURN NEW;
END;
$function$

-- public.trg_fn_achievements_on_market() | SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.trg_fn_achievements_on_market()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status::text IN ('sold','completed') AND (OLD IS NULL OR OLD.status::text NOT IN ('sold','completed')) THEN
    PERFORM fn_check_and_grant_achievements(NEW.player_id);
  END IF;
  RETURN NEW;
END;
$function$

-- public.canon_guard() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.canon_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin

    -- prevent recursive trigger spam
    if pg_trigger_depth() > 1 then
        return NEW;
    end if;

    -- safe hooks (non-blocking)
    perform public.safe_economy_rebalance();
    perform public.safe_validate_game_state();

    return NEW;

end;
$function$

-- public.trigger_economic_compiler() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.trigger_economic_compiler()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM run_economic_compiler();

  RETURN NULL;
END;
$function$

-- public.vexforge_event_router() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.vexforge_event_router()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_event_player_id uuid;
BEGIN
  IF NEW IS NULL THEN
    RETURN NULL;
  END IF;

  IF TG_TABLE_NAME = 'pvp_matches' THEN
    v_event_player_id := NEW.player_a;
  ELSE
    v_event_player_id := NEW.player_id;
  END IF;

  INSERT INTO public.event_log (
    id,
    player_id,
    event_type,
    reference_id,
    source_table,
    source_id,
    payload,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_event_player_id,
    TG_OP,
    COALESCE(NEW.id::text, gen_random_uuid()::text),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, NULL),
    to_jsonb(NEW),
    now()
  );

  RETURN NEW;
END;
$function$

-- public.trigger_economy_guardian() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.trigger_economy_guardian()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM economy_autoresolve();

  RETURN NULL;
END;
$function$

-- public.economy_kernel_guard() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.economy_kernel_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM spawn_economy_processes();
  PERFORM economy_os_orchestrator();

  RETURN NULL;
END;
$function$

-- public.detect_market_anomaly() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.detect_market_anomaly()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  IF NEW.price > 10000 THEN

    PERFORM emit_economy_alert(
      'market_price_spike',
      'medium',
      NEW.player_id,
      'market_listings',
      NEW.id::text,
      jsonb_build_object('price', NEW.price)
    );

  END IF;

  RETURN NEW;
END;
$function$

-- public.hook_market_event() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.hook_market_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  begin

      if NEW.status = 'sold' then

          perform emit_game_event(
              NEW.player_id,
              'market_sold',
              'market_listings',
              NEW.id::text,
              jsonb_build_object(
                  'price', NEW.price
              )
          );

      end if;

      return NEW;
  end;
  $function$

-- public.trigger_economy_rebalance() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.trigger_economy_rebalance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM economy_rebalance_tick();

  RETURN NULL;
END;
$function$

-- public.trigger_rule_kernel() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.trigger_rule_kernel()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM economy_self_rewrite();

  RETURN NULL;
END;
$function$

-- public.trigger_self_compiler() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.trigger_self_compiler()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

  PERFORM generate_emergent_rules();
  PERFORM approve_emergent_rules();

  RETURN NULL;
END;
$function$

-- public.trg_fn_achievements_on_cards() | SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.trg_fn_achievements_on_cards()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM fn_check_and_grant_achievements(NEW.player_id);
  RETURN NEW;
END;
$function$

-- public.audit_trigger() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  actor uuid;
BEGIN

  actor := NULL;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF to_jsonb(NEW) ? 'player_id' THEN
      actor := (to_jsonb(NEW)->>'player_id')::uuid;
    END IF;
  END IF;

  INSERT INTO event_log (
    player_id,
    event_type,
    reference_id,
    source_table,
    source_id,
    payload
  )
  VALUES (
    actor,
    TG_OP,
    gen_random_uuid()::text,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, NULL),
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$function$

-- public.enqueue_system_job() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.enqueue_system_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

INSERT INTO system_jobs(
  job_type,
  payload
)
VALUES(
  TG_TABLE_NAME,
  jsonb_build_object(
    'table',TG_TABLE_NAME,
    'id',COALESCE(NEW.id::text,'unknown')
  )
);

RETURN NEW;

END;
$function$

-- public.detect_wallet_anomaly() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.detect_wallet_anomaly()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  avg_balance numeric;
BEGIN

  SELECT AVG(vex_ingame + vex_tradeable)
  INTO avg_balance
  FROM player_wallet;

  IF NEW.vex_ingame + NEW.vex_tradeable > avg_balance * 10 THEN

    PERFORM emit_economy_alert(
      'wallet_overflow',
      'high',
      NEW.player_id,
      'player_wallet',
      NEW.player_id::text,
      jsonb_build_object(
        'balance', NEW.vex_ingame + NEW.vex_tradeable,
        'avg', avg_balance
      )
    );

  END IF;

  RETURN NEW;
END;
$function$

-- public.update_updated_at() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$

-- public.fn_init_player_progress() | SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.fn_init_player_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.player_progress (
    id, player_id, level, xp, xp_to_next,
    energy, max_energy, energy_last_regen, tutorial_step, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), NEW.id, 1, 0, 100,
    100, 100, now(), 1, now(), now()
  )
  ON CONFLICT (player_id) DO NOTHING;
  RETURN NEW;
END;
$function$

-- public.vexforge_touch_android_release_updated_at() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.vexforge_touch_android_release_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  if new.status = 'PUBLISHED' and old.status is distinct from 'PUBLISHED' then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$function$

-- public.vexforge_set_updated_at() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.vexforge_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$

-- public.trg_fn_achievements_on_packs() | SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.trg_fn_achievements_on_packs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.status IN ('completed','delivered','fulfilled') AND (OLD IS NULL OR OLD.status NOT IN ('completed','delivered','fulfilled')) THEN
    PERFORM fn_check_and_grant_achievements(NEW.player_id);
  END IF;
  RETURN NEW;
END;
$function$

-- public.process_referral_first_pack_reward_trigger() | SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.process_referral_first_pack_reward_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_buyer_auth_id uuid;
  v_is_paid boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_is_paid := NEW.status IN ('paid', 'completed', 'delivered', 'fulfilled');
  ELSE
    v_is_paid := NEW.status IN ('paid', 'completed', 'delivered', 'fulfilled')
      AND OLD.status NOT IN ('paid', 'completed', 'delivered', 'fulfilled');
  END IF;

  IF v_is_paid THEN
    SELECT p.auth_user_id INTO v_buyer_auth_id
    FROM public.players p
    WHERE p.id = NEW.player_id;

    IF v_buyer_auth_id IS NOT NULL THEN
      PERFORM public.process_first_pack_referral_reward(
        v_buyer_auth_id,
        COALESCE(NEW.price_usdt, 0) * 100
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$

-- public.vexforge_enforce_player_shards_guard() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.vexforge_enforce_player_shards_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    if new.quantity is null then
        new.quantity := 0;
    end if;

    if new.quantity < 0 then
        new.quantity := 0;
    end if;

    return new;
end;
$function$

-- public.vexforge_tier1_require_evidence() | SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.vexforge_tier1_require_evidence()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'MET' then
    if new.evidence is null
       or jsonb_typeof(new.evidence) <> 'array'
       or jsonb_array_length(new.evidence) = 0 then
      raise exception 'VE-TIER1-PLAN-HARDENING: criterio % no puede declararse MET sin evidence (jsonb array no vacio).', new.criterion_key;
    end if;
    if new.verify_command is null or length(btrim(new.verify_command)) = 0 then
      raise exception 'VE-TIER1-PLAN-HARDENING: criterio % no puede declararse MET sin verify_command reproducible.', new.criterion_key;
    end if;
    if new.verified_at is null then
      new.verified_at := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$function$

-- public.wallet_tx_auto_ref() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.wallet_tx_auto_ref()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := public.safe_reference_id();
  END IF;

  RETURN NEW;
END;
$function$

-- public.prevent_mutation() | SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.prevent_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
    raise exception
        'append_only_table_violation';
        end;
        $function$
