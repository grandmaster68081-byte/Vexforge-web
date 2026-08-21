-- VE-VIS-3-ICON-LANGUAGE-RESIDUAL
-- Cierra el criterio de lenguaje de iconos después de eliminar runas Unicode
-- de la cinemática de ataque y ampliar la guarda pública de identidad.

update public.vexforge_visual_tier1_objective
set current_value = '188 archivos TS/TSX verificados; 0 sustitutos Unicode genericos visibles, incluyendo el rango runico U+1600-U+16FF; CardAttackCinematic usa ForgeIcon SVG.',
    status = 'MET',
    notes = 'Evidencia: npm run typecheck, npm run verify:ui-identity y npm run verify:build sobre el commit de esta unidad. La guarda elimina comentarios antes de inspeccionar codigo ejecutable.',
    owning_unit = null,
    updated_at = now()
where criterion_key = 'icon_language';

insert into public.vexforge_project_decisions (
  decision_key,
  category,
  title,
  description,
  adopted_in_chat,
  status,
  official_payload
) values (
  'VE-VIS-3-ICON-LANGUAGE-RESIDUAL',
  'visual_identity',
  'Cierre de runas Unicode en el lenguaje de iconos',
  'Las partículas de runa de la cinemática de ataque se representan exclusivamente con iconos SVG del sistema ForgeIcon. La guarda de identidad incluye el rango Unicode rúnico para impedir regresiones.',
  0,
  'official',
  jsonb_build_object(
    'unit', 'VE-VIS-3-ICON-LANGUAGE-RESIDUAL',
    'criterion_key', 'icon_language',
    'evidence', jsonb_build_array(
      'npm run typecheck',
      'npm run verify:ui-identity',
      'npm run verify:build'
    ),
    'source_files', jsonb_build_array(
      'src/components/battle/CardAttackCinematic.tsx',
      'scripts/verify-ui-identity.mjs'
    ),
    'reopen_when', 'A visible ForgeIconName is rendered as raw text, or a new icon-like Unicode range appears in executable UI code.'
  )
)
on conflict (decision_key) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  official_payload = excluded.official_payload,
  updated_at = now();