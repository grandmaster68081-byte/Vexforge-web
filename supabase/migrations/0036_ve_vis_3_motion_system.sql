-- VE-VIS-3-MOTION-SYSTEM
-- Registra el contrato de motion implementado y su evidencia reproducible.

update public.vexforge_visual_tier1_objective
set current_value = '17 tokens declarados y consumidos; 8 clases publicas aplicadas; prefers-reduced-motion global; 0 motion ad hoc en las superficies del contrato.',
    status = 'MET',
    notes = 'Evidencia: npm run typecheck, npm run verify:motion y npm run verify:build sobre el commit de esta unidad. La guarda comprueba tokens, clases, consumidores y reduced motion.',
    owning_unit = null,
    updated_at = now()
where criterion_key = 'motion_and_feedback';

insert into public.vexforge_project_decisions (
  decision_key, category, title, description, adopted_in_chat, status, official_payload
) values (
  'VE-VIS-3-MOTION-SYSTEM',
  'visual_system',
  'Sistema unificado de motion para entrada, feedback y escenas',
  'VEXFORGE usa un contrato publico de 17 tokens y 8 clases para entradas de superficie, stagger, press, lift, escenas, impactos, nudges y reveals. El fallback global de prefers-reduced-motion elimina animaciones y transformaciones no esenciales.',
  0,
  'official',
  jsonb_build_object(
    'unit', 'VE-VIS-3-MOTION-SYSTEM',
    'criterion_key', 'motion_and_feedback',
    'evidence', jsonb_build_array(
      'npm run typecheck',
      'npm run verify:motion',
      'npm run verify:build'
    ),
    'source_files', jsonb_build_array(
      'src/styles.css',
      'src/App.tsx',
      'src/routes/HomeRoute.tsx',
      'src/components/battle/BattleResultScreen.tsx',
      'scripts/verify-motion.mjs'
    ),
    'token_count', 17,
    'class_count', 8,
    'reduced_motion', true,
    'reopen_when', 'A new critical surface introduces motion outside the public contract, the guard loses coverage, or reduced-motion behavior regresses.'
  )
)
on conflict (decision_key) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  official_payload = excluded.official_payload,
  updated_at = now();
