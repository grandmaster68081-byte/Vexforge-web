-- VE-VIS-4-COMBAT-SCENE-DIRECTION
-- Registra cues visuales dedicados para cada accion de combate resuelta.

update public.vexforge_visual_tier1_objective
set current_value = 'Cue semantico durante cada turno: KO, bloqueo, veneno, doble golpe, drenaje, critico o impacto; guardas estaticas y reduced-motion.',
    status = 'MET',
    notes = 'Evidencia: npm run typecheck, npm run verify:combat-scene y npm run verify:build. El cue consume BattleTurnData y no decide daño, victoria ni settlement.',
    updated_at = now()
where criterion_key = 'combat_scene_direction';

insert into public.vexforge_project_decisions (
  decision_key, category, title, description, adopted_in_chat, status, official_payload
) values (
  'VE-VIS-4-COMBAT-SCENE-DIRECTION',
  'combat_scene',
  'Direccion de escena para cada accion de combate',
  'Cada turno resuelto de InteractiveBattleBoard presenta un cue visual dedicado derivado de BattleTurnData. La capa visual comunica el tipo de evento, pero no controla resultados autoritativos.',
  0,
  'official',
  jsonb_build_object(
    'unit', 'VE-VIS-4-COMBAT-SCENE-DIRECTION',
    'criterion_key', 'combat_scene_direction',
    'evidence', jsonb_build_array(
      'npm run typecheck',
      'npm run verify:combat-scene',
      'npm run verify:build'
    ),
    'event_branches', jsonb_build_array(
      'KO',
      'BLOQUEO',
      'VENENO',
      'DOBLE GOLPE',
      'DRENAJE',
      'CRÍTICO',
      'IMPACTO'
    ),
    'source_files', jsonb_build_array(
      'src/components/battle/InteractiveBattleBoard.tsx',
      'src/styles.css',
      'scripts/verify-combat-scene.mjs'
    ),
    'reduced_motion', true,
    'authoritative_logic_unchanged', true,
    'reopen_when', 'A resolved combat action lacks a dedicated cue, a new event branch is not covered, or reduced-motion/accessibility regresses.'
  )
)
on conflict (decision_key) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  official_payload = excluded.official_payload,
  updated_at = now();