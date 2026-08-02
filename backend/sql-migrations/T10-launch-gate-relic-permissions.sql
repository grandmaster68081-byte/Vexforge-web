-- T10: close the anonymous EXECUTE grant left on authenticated relic actions.
-- The function bodies already derive the player from auth.uid(); anonymous
-- callers can never satisfy that contract and must not reach the functions.

REVOKE ALL ON FUNCTION public.equip_relic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.equip_relic(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.equip_relic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_relic(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.unequip_relic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unequip_relic(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.unequip_relic(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unequip_relic(uuid) TO service_role;