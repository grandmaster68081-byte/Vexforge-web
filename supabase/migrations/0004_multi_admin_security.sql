-- VEXFORGE: database-backed multi-admin authorization.
-- Admin access is granted by an active players row, never by a hard-coded email.

CREATE OR REPLACE FUNCTION public.vexforge_is_control_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.players
    WHERE auth_user_id = auth.uid()
      AND status = 'active'
      AND (is_admin = true OR is_super_admin = true)
      AND role IN ('admin', 'owner')
  );
$function$;

REVOKE ALL ON FUNCTION public.vexforge_is_control_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vexforge_is_control_admin() TO anon, authenticated;

-- These legacy views are explicitly invoker-security views. Their grants remain
-- harmless because the underlying RLS policies decide which rows are visible.
ALTER VIEW public.tg_wallet SET (security_invoker = true);
ALTER VIEW public.tg_inventory SET (security_invoker = true);
ALTER VIEW public.canon_player_profile SET (security_invoker = true);
ALTER VIEW public.admin_economy_view SET (security_invoker = true);
ALTER VIEW public.admin_players_view SET (security_invoker = true);

-- These reporting views aggregate data across players and are not part of the
-- normal player inventory surface. Keep them private to backend/admin roles.
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON public.tg_wallet, public.tg_inventory
  FROM anon, authenticated;