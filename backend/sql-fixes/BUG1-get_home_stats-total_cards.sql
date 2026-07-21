-- ============================================================
    -- BUG-1 FIX: get_home_stats total_cards = 103 → 127
    -- Ejecutar en SQL Editor de Supabase
    -- Fecha: 2026-07-19 · Chat 48
    -- ============================================================

    -- PASO 1: Verificar conteo actual
    SELECT COUNT(*) AS real_count FROM cards WHERE active = true;
    -- Debe retornar 127

    -- PASO 2: Encontrar qué subquery usa get_home_stats para total_cards
    SELECT pg_get_functiondef(oid)
    FROM pg_proc
    WHERE proname = 'get_home_stats';

    -- PASO 3: Aplicar el fix
    -- La función debe usar COUNT(*) FROM cards WHERE active = true (no cards_canonical ni filtros adicionales)
    -- Buscar en la definición la línea con total_cards y reemplazar por:
    --
    --   total_cards := (SELECT COUNT(*) FROM cards WHERE active = true)::int;
    --
    -- Workaround alternativo si no se puede editar la función completa:
    -- Crear una función wrapper:

    CREATE OR REPLACE FUNCTION public.get_home_stats_total_cards_fix()
    RETURNS int LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT COUNT(*)::int FROM cards WHERE active = true
    $$;

    -- Luego verificar con:
    SELECT get_home_stats_total_cards_fix();
    -- Debe retornar 127
    