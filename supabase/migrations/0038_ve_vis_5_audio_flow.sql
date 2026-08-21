-- VE-VIS-5-AUDIO-FLOW
-- Registra el catálogo procedural y la cobertura de cuatro contextos.

update public.vexforge_visual_tier1_objective
set current_value = '12 entradas procedurales inscritas; hub, battle, missions y market cubiertos; ambient, combate, UI y recompensas con guardas.',
    status = 'MET',
    notes = 'Evidencia: npm run typecheck, npm run verify:audio-flow y npm run verify:build. Web Audio API procedural; sin assets externos ni cambios autoritativos.',
    updated_at = now()
where criterion_key = 'audio_flow';

insert into public.vexforge_project_decisions (
  decision_key, category, title, description, adopted_in_chat, status, official_payload
) values (
  'VE-VIS-5-AUDIO-FLOW',
  'audio',
  'Flujo de audio procedural con catálogo y cuatro contextos',
  'El audio oficial de VEXFORGE usa Web Audio API procedural. El catálogo estable declara procedencia y consumidores para ambientes, combate, UI y recompensas; el proveedor cubre hub, battle, missions y market y conserva bosses/social como contextos adicionales.',
  0,
  'official',
  jsonb_build_object(
    'unit', 'VE-VIS-5-AUDIO-FLOW',
    'criterion_key', 'audio_flow',
    'evidence', jsonb_build_array(
      'npm run typecheck',
      'npm run verify:audio-flow',
      'npm run verify:build'
    ),
    'audio_source', 'web-audio-procedural',
    'manifest_entries', 12,
    'required_contexts', jsonb_build_array('hub', 'battle', 'missions', 'market'),
    'coverage', jsonb_build_array('ambient', 'combat', 'ui', 'rewards'),
    'authoritative_logic_unchanged', true,
    'reopen_when', 'A critical context lacks music, an action lacks SFX, provenance is missing, or gesture/accessibility behavior regresses.'
  )
)
on conflict (decision_key) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  official_payload = excluded.official_payload,
  updated_at = now();