-- VEXFORGE: make authenticated QA verification a post-deploy closure gate.
-- Documentation/governance only. No player, economy, combat, RLS, Storage, or auth mutation.

insert into public.vexforge_project_decisions (
  decision_key, category, title, description, status, official_payload
)
values (
  'SUPREME-LAW-QA-DEPLOY-CLOSURE-GATE',
  'protocol',
  'Ley suprema: verificación QA real después del deploy',
  'Toda unidad completada debe publicarse en main, comprobar que el deploy público corresponde al commit auditado y verificarse después con una sesión normal de la cuenta QA canónica. La verificación debe recorrer las rutas y criterios afectados y observar el resultado real; no basta con confirmar archivos, HTTP 200 o una afirmación de que la función existe. Si no hay sesión QA utilizable, la unidad queda IMPLEMENTED_UNVERIFIED o BLOCKED y no puede declararse OPERATIONAL, PASS, GO ni COMPLETED. Nunca se usa service_role para suplantar jugadores ni fabricar resultados.',
  'official',
  jsonb_build_object(
    'marker', '★ MUY IMPORTANTE',
    'adoption', 'CANONICAL',
    'priority', 'SUPREMA',
    'mandatory', true,
    'qa_post_deploy_verification_required', true,
    'qa_canonical_account_lookup', 'auth.users',
    'qa_canonical_account_email', 'pavilo20.qa@vexforge.test',
    'qa_session_must_be_normal', true,
    'qa_must_verify_public_commit', true,
    'qa_must_exercise_affected_routes', true,
    'qa_must_observe_real_result', true,
    'http_200_is_insufficient_evidence', true,
    'no_operational_without_qa_evidence', true,
    'missing_qa_session_status', 'IMPLEMENTED_UNVERIFIED_OR_BLOCKED',
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