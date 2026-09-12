-- VEXFORGE: QA funcional posterior al release queda a cargo del operador.
-- Gobernanza únicamente; no modifica jugadores, economía, combate, RLS, Storage ni auth.

update public.vexforge_project_decisions
set
  status = 'superseded',
  official_payload = official_payload || jsonb_build_object(
    'superseded_by', 'SUPREME-LAW-OPERATOR-QA-HANDOFF',
    'qa_post_deploy_verification_required_for_delivery', false
  ),
  updated_at = now()
where decision_key = 'SUPREME-LAW-QA-DEPLOY-CLOSURE-GATE';

insert into public.vexforge_project_decisions (
  decision_key, category, title, description, status, official_payload
)
values (
  'SUPREME-LAW-OPERATOR-QA-HANDOFF',
  'protocol',
  'Ley suprema: entrega del APK y QA a cargo del operador',
  'La IA implementa, verifica typecheck/build, publica en main, espera el workflow oficial y entrega el enlace del APK correspondiente al commit auditado. La IA no crea ni recupera sesiones QA, no recorre el APK y no bloquea la entrega por falta de QA. La unidad queda IMPLEMENTED_UNVERIFIED hasta que el operador aporte la verificación funcional; OPERATIONAL, PASS y GO requieren esa evidencia. Los hallazgos del operador reabren la unidad.',
  'official',
  jsonb_build_object(
    'marker', 'CANONICAL',
    'adoption', 'CANONICAL',
    'priority', 'SUPREMA',
    'operator_qa_required_for_delivery', false,
    'operator_qa_required_for_operational', true,
    'agent_must_wait_for_official_workflow', true,
    'agent_must_return_apk_download_url', true,
    'missing_operator_qa_status', 'IMPLEMENTED_UNVERIFIED',
    'operator_findings_reopen_unit', true,
    'no_admin_impersonation', true,
    'no_secret_exposure', true
  )
)
on conflict (decision_key) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  official_payload = excluded.official_payload,
  updated_at = now();