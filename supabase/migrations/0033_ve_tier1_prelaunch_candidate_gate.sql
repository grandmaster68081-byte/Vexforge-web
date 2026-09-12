-- VE-TIER1-4: prelaunch Tier 1 candidate gate
-- Source-control mirror of the authoritative Supabase plan correction.

update public.vexforge_tier1_phases
set goal = 'Medir el bucle y la primera sesion en entorno prelaunch, sin exigir poblacion historica de jugadores.',
    exit_criteria = 'game_loop_telemetry, first_session_flow y economy_readability en MET con sesiones controladas, datos reproducibles y sin costes ocultos.',
    updated_at = now()
where phase = 4;

update public.vexforge_tier1_phases
set goal = 'Demostrar profundidad, contenido y sistemas competitivos listos para lanzamiento mediante recorridos controlados, no mediante anos de operacion.',
    exit_criteria = 'content_depth, live_ops_seasons y social_competitive en MET con una temporada simulada completa, contenido jugable y pruebas autenticadas controladas.',
    updated_at = now()
where phase = 5;

-- Criterion refinements, the official prelaunch decision, and memory fields are
-- applied idempotently by the Supabase management transaction for VE-TIER1-4.
