-- ============================================================
    -- BUG-3 FIX: Agregar security_invoker a vistas sin él
    -- Ejecutar en SQL Editor de Supabase
    -- Fecha: 2026-07-19 · Chat 48
    -- ============================================================

    -- PASO 1: Identificar todas las vistas sin security_invoker
    SELECT schemaname, viewname
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname NOT IN (
      SELECT relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'v'
        AND EXISTS (
          SELECT 1 FROM pg_options_to_table(c.reloptions)
          WHERE option_name = 'security_invoker' AND option_value = 'true'
        )
    )
    ORDER BY viewname;

    -- PASO 2: Aplicar security_invoker a todas las vistas identificadas
    -- Ejecutar el resultado del PASO 1 con este patrón:
    -- ALTER VIEW public.<viewname> SET (security_invoker = true);

    -- Ejemplo de las 18 vistas ya identificadas en Chat 46:
    -- Si quedan ~30 más sin aplicar, ejecutar el PASO 1 primero para obtener la lista exacta.

    -- Script genérico para aplicar masivamente (ejecutar en psql o SQL editor):
    DO $$
    DECLARE
    v_view TEXT;
    BEGIN
    FOR v_view IN (
      SELECT viewname FROM pg_views
      WHERE schemaname = 'public'
    )
    LOOP
      BEGIN
        EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v_view);
        RAISE NOTICE 'Applied security_invoker to view: %', v_view;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped view %: %', v_view, SQLERRM;
      END;
    END LOOP;
    END;
    $$;

    -- Verificar cuántas vistas tienen security_invoker después del fix:
    SELECT COUNT(*) as total_views_with_si
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND EXISTS (
      SELECT 1 FROM pg_options_to_table(c.reloptions)
      WHERE option_name = 'security_invoker' AND option_value = 'true'
    );
    