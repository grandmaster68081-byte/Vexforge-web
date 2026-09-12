-- VEXFORGE: enforce transport-correct official preflight and fail-closed access.
-- Documentation/governance only. No player, economy, combat, RLS, Storage, or auth mutation.

update public.vexforge_project_decisions
set
  description = 'La IA debe leer, entender y analizar el 100% del protocolo y la documentación canónica de Supabase antes de iniciar cualquier trabajo. Está prohibido crear o usar entornos locales, clones, réplicas, artefactos o aplicaciones paralelas fuera de los entornos oficiales proporcionados por el propietario sin autorización explícita y específica. Si falta acceso o contexto, debe detenerse y solicitarlo. La disponibilidad de un secreto no demuestra que el acceso esté validado: cada proveedor debe comprobarse con su transporte y esquema de autenticación nativos. Un rechazo debe diagnosticarse primero como transporte, formato, endpoint, alcance, expiración, revocación o permisos; nunca debe atribuirse automáticamente al secreto. GitHub main es una dependencia de autoridad: si no queda validado tras el diagnóstico nativo, el trabajo dependiente del código se cierra en BLOCKED y no se continúa con otra fuente. Las pruebas autenticadas deben buscar primero la cuenta QA canónica registrada en las fuentes vivas; la falta de una sesión utilizable bloquea sólo esa prueba, sin fabricar sesiones ni detener trabajo seguro independiente.',
  official_payload = official_payload
    || jsonb_build_object(
      'transport_correct_auth_required', true,
      'credential_presence_is_not_access_validation', true,
      'native_transport_diagnosis_required', true,
      'github_smart_http_auth', 'HTTPS Basic with x-access-token; never PAT in URL',
      'github_main_is_hard_dependency', true,
      'fail_closed_when_github_main_unvalidated', true,
      'qa_canonical_account_lookup_required', true,
      'qa_session_block_is_scoped_to_authenticated_test', true,
      'no_automatic_credential_blame', true
    ),
  updated_at = now()
where decision_key = 'SUPREME-LAW-PREFLIGHT-OFFICIAL-ENVIRONMENTS';

insert into public.vexforge_project_decisions (
  decision_key, category, title, description, status, official_payload
)
values (
  'SUPREME-LAW-TRANSPORT-FAIL-CLOSED',
  'protocol',
  'Ley suprema: transporte correcto y cierre fail-closed',
  'La autenticación correcta depende del transporte. Un secreto disponible no prueba acceso válido. GitHub API, Git smart HTTP y Supabase Management API deben validarse con HTTPS y sus esquemas nativos. Un fallo se diagnostica antes de culpar al secreto; si main no queda validado, se detiene todo trabajo dependiente del código. La cuenta QA canónica se busca antes de declarar bloqueada una prueba autenticada.',
  'official',
  jsonb_build_object(
    'marker', '★ MUY IMPORTANTE',
    'adoption', 'CANONICAL',
    'priority', 'SUPREMA',
    'mandatory', true,
    'transport_correct_auth_required', true,
    'credential_presence_is_not_access_validation', true,
    'native_transport_diagnosis_required', true,
    'github_smart_http_auth', 'HTTPS Basic with x-access-token; never PAT in URL',
    'github_main_is_hard_dependency', true,
    'fail_closed_when_github_main_unvalidated', true,
    'qa_canonical_account_lookup_required', true,
    'qa_session_block_is_scoped_to_authenticated_test', true,
    'no_automatic_credential_blame', true,
    'no_secret_exposure', true,
    'no_admin_impersonation', true
  )
)
on conflict (decision_key) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  official_payload = excluded.official_payload,
  updated_at = now();