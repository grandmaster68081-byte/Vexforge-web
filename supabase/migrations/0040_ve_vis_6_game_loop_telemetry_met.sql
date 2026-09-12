-- VE-VIS-6-GAME-LOOP-TELEMETRY
-- Solo se puede aplicar después de demostrar cobertura real de las cinco claves.

do $$
begin
  if (
    select count(*)
    from public.vexforge_telemetry_coverage()
    where event_count > 0
  ) <> 5 then
    raise exception
      'VE-VIS-6 cannot become MET: live coverage is missing one or more canonical events';
  end if;
end
$$;

update public.vexforge_visual_tier1_objective
set current_value = '5/5 eventos canónicos con al menos una emisión real; cobertura agregada accesible con rol anon; RLS de jugador preservada.',
    status = 'MET',
    verify_command = 'npm run verify:all',
    verified_at = now(),
    evidence = jsonb_build_object(
      'coverage_function', 'public.vexforge_telemetry_coverage()',
      'required_events', jsonb_build_array(
        'session_start', 'forge_action', 'combat_resolved', 'reward_claimed', 'return_visit'
      ),
      'coverage_requirement', 'event_count > 0 for each canonical event',
      'commands', jsonb_build_array(
        'npm run typecheck',
        'npm run verify:telemetry',
        'npm run verify:build',
        'npm run verify:all'
      ),
      'verified_role', 'anon',
      'authoritative_logic_unchanged', true
    ),
    notes = 'La cobertura viva fue comprobada mediante vexforge_telemetry_coverage() con rol anon; la función no expone filas de jugador ni user_id.',
    updated_at = now()
where criterion_key = 'game_loop_telemetry';