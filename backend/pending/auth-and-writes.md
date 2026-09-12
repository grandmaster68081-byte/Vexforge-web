# Backend SQL Scripts — Chat 35 (Pendiente aplicación manual)

    Generado automáticamente. Aplica estos scripts en el SQL Editor de Supabase.
    Aplíca en el orden indicado para evitar dependencias.

    ## SCRIPT 1 — Inventory: RLS Policy para jugadores autenticados
    -- Decisión de owner requerida antes de aplicar.
    -- Una vez aprobado, ejecuta esto para desbloquear el dominio inventory:

    ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "authenticated_read_own_inventory"
    ON public.inventory
    FOR SELECT
    TO authenticated
    USING (player_id = (
    SELECT id FROM public.players WHERE auth_user_id = auth.uid() LIMIT 1
    ));

    -- Después de aplicar, actualizar vexforge_web_registry:
    -- UPDATE vexforge_web_registry SET web_role = 'live_in_official_frontend' WHERE domain = 'inventory';


    ## SCRIPT 2 — Clan write RPCs
    -- Necesarios para desbloquear create/join/leave clan.
    -- Implementar tras decisión de owner sobre estructura de permisos:

    CREATE OR REPLACE FUNCTION public.create_clan(
    p_name TEXT,
    p_description TEXT DEFAULT ''
    ) RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_player_id UUID;
    v_clan_id UUID;
    BEGIN
    SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
    IF v_player_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Player profile not found');
    END IF;
    INSERT INTO clans(name, description, created_by)
    VALUES (p_name, p_description, v_player_id)
    RETURNING id INTO v_clan_id;
    RETURN jsonb_build_object('ok', true, 'clan_id', v_clan_id);
    END;
    $$;

    -- create_listing RPC — alternativa al INSERT directo
    CREATE OR REPLACE FUNCTION public.create_listing(
    p_player_card_id UUID,
    p_price NUMERIC
    ) RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_player_id UUID;
    v_listing_id UUID;
    v_ref TEXT;
    BEGIN
    SELECT id INTO v_player_id FROM players WHERE auth_user_id = auth.uid();
    IF v_player_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Player not found');
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM player_cards WHERE id = p_player_card_id AND player_id = v_player_id AND locked = false AND listed = false
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'Card not available for listing');
    END IF;
    v_ref := 'rpc-' || extract(epoch FROM now())::bigint;
    INSERT INTO market_listings(player_id, player_card_id, price, fee, status, reference_id, locked, metadata)
    VALUES (v_player_id, p_player_card_id, p_price, 0, 'active', v_ref, false, '{}')
    RETURNING id INTO v_listing_id;
    UPDATE player_cards SET listed = true WHERE id = p_player_card_id;
    RETURN jsonb_build_object('ok', true, 'listing_id', v_listing_id);
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.create_listing TO authenticated;
    GRANT EXECUTE ON FUNCTION public.create_clan TO authenticated;


    ## SCRIPT 3 — SECURITY DEFINER views: convertir a SECURITY INVOKER
    -- Aplica a las 18 vistas aún marcadas como SECURITY DEFINER.
    -- Ejecutar view por view en el SQL Editor. Ejemplo:
    -- ALTER VIEW public.<nombre_vista> SET (security_invoker = true);
    -- Lista exacta de vistas: obtener via SELECT schemaname,viewname FROM pg_views
    --   WHERE schemaname = 'public' ORDER BY viewname;


    ## SCRIPT 4 — Trigger auto-provisioning (alternativa al frontend)
    -- El frontend (AuthProvider) ya hace provisioning client-side.
    -- Si se prefiere una garantía en el backend, añadir:

    CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
    INSERT INTO public.players (auth_user_id, email, display_name, role, status, source_system)
    VALUES (
      NEW.id,
      NEW.email,
      split_part(NEW.email, '@', 1),
      'player',
      'active',
      'web'
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
    END;
    $$;

    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    