-- VE-SEC-2-DEFINER-EXPOSURE-TRIAGE
-- Triaje funcion por funcion de RPCs SECURITY DEFINER alcanzables con la clave publicable.
--
-- Grupo A (interno, ningun cliente debe invocarlo):
--   grant_achievement(uuid,text)              -> acuña VEX y XP para un player_id arbitrario, sin control de identidad.
--   fn_check_and_grant_achievements(uuid)     -> mismo motor, invocable sobre jugadores ajenos.
--   Ambas se ejecutan desde check_my_achievements() y triggers SECURITY DEFINER (owner postgres),
--   que no dependen de estos grants. => EXECUTE retirado de PUBLIC, anon y authenticated.
--
-- Grupo B (superficie administrativa): todas verifican internamente vexforge_is_control_admin()
--   y en el codigo solo se llaman desde rutas de admin autenticadas.
--   => EXECUTE retirado de PUBLIC y anon; se conserva explicitamente para authenticated y service_role.
--
-- Nota: el EXECUTE por defecto se concede a PUBLIC, por lo que revocar solo a anon no basta.
-- Idempotente y reversible (un GRANT devuelve el estado previo).

BEGIN;

DO $$
DECLARE r RECORD;
BEGIN
  -- Grupo A: cierre total para roles de cliente.
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN ('grant_achievement', 'fn_check_and_grant_achievements')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;

  -- Grupo B: solo administradores autenticados.
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname IN (
        'vexforge_is_control_admin',
        'vexforge_admin_get_overview',
        'vexforge_admin_get_players',
        'vexforge_admin_get_ledger',
        'vexforge_admin_get_deposits',
        'vexforge_admin_get_withdrawals',
        'vexforge_admin_get_shop_orders',
        'vexforge_approve_deposit',
        'vexforge_reject_deposit',
        'vexforge_approve_shop_order',
        'vexforge_reject_shop_order',
        'admin_reject_withdrawal',
        'vexforge_grant_relic'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

COMMIT;
