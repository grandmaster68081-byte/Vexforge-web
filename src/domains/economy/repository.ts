import type { DomainResult } from "../../shared/types/domain";

/**
 * BLOCKED ON AUTH, NOT ON SCHEMA.
 * Verified chat 21 (vexforge_project_documents.verified_read_path_specs_v1):
 * the real Supabase table and RLS policy for 'economy' exist and are correctly
 * configured, but every policy requires auth.uid() to match players.auth_user_id.
 * There is no auth provider wired into this app yet.
 * Do NOT stub this with fake/local data pretending to be real -- once auth is
 * wired, replace this function body with a real supabase.from(...) call using
 * the columns already documented in verified_read_path_specs_v1.
 */
export async function getEconomy(): Promise<DomainResult<never>> {
  return {
    status: "blocked_auth",
    data: null,
    reason: "No auth session wired yet. See backend/pending/auth-and-writes.md.",
  };
}
