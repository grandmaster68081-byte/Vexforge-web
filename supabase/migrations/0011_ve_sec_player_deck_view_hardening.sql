-- VE-SEC-1-PLAYER-DECK-EXPOSURE
-- Motivo: el asesor de seguridad reporta ERROR security_definer_view en
-- public.v_player_forge_formation y la tabla public.player_deck tenia una
-- politica SELECT permisiva (qual = true) para el rol public, de modo que
-- cualquier portador de la clave publica podia leer los mazos de todos los
-- jugadores. El cliente solo consulta su propio mazo
-- (src/domains/deck/repository.ts, filtro .eq("player_id", <propio>)) y las
-- funciones SECURITY DEFINER siguen accediendo sin restriccion (bypass RLS).
-- Idempotente: se puede reejecutar sin efectos adicionales.

-- 1) La vista deja de ejecutarse con privilegios del owner.
ALTER VIEW public.v_player_forge_formation SET (security_invoker = on);

-- 2) La vista es de solo lectura y no la consume codigo anonimo.
REVOKE ALL ON public.v_player_forge_formation FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.v_player_forge_formation FROM authenticated;
GRANT SELECT ON public.v_player_forge_formation TO authenticated;

-- 3) Lectura del mazo restringida a su propietario.
DROP POLICY IF EXISTS read_all ON public.player_deck;
DROP POLICY IF EXISTS player_deck_select_own ON public.player_deck;
CREATE POLICY player_deck_select_own
  ON public.player_deck
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.players p
      WHERE p.id = player_deck.player_id
        AND p.auth_user_id = auth.uid()
    )
  );

REVOKE ALL ON public.player_deck FROM anon;
