-- VEXFORGE: canonical QA account assignment.
-- The QA classification is additive: preserve the player's existing role and
-- administrative flags; do not demote or impersonate the account.

UPDATE public.players
SET is_qa = TRUE,
    updated_at = now()
WHERE lower(email) = lower('cristiangalvez815@gmail.com');

UPDATE public.vexforge_project_decisions
SET
  official_payload = official_payload || jsonb_build_object(
    'qa_canonical_account_email', 'cristiangalvez815@gmail.com',
    'qa_canonical_account_lookup', 'auth.users + public.players',
    'qa_account_is_qa', true,
    'qa_preserve_existing_privileges', true,
    'qa_expected_player_role', 'owner',
    'qa_expected_is_admin', true,
    'qa_expected_is_super_admin', true,
    'qa_session_must_be_normal', true,
    'qa_must_verify_public_commit', true,
    'qa_must_exercise_affected_routes', true,
    'qa_must_observe_real_result', true
  ),
  updated_at = now()
WHERE decision_key = 'SUPREME-LAW-OPERATOR-QA-HANDOFF'
  AND status = 'official';
