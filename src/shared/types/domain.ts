/** Marks a domain's real backend-readiness, verified against Supabase RLS. */
export type DomainStatus =
  | "ready" // anon-key readable now, wired to real Supabase table
  | "blocked_auth" // RLS confirmed, but requires an auth session that isn't wired yet
  | "blocked_no_path" // no public/authenticated RLS policy exists at all
  | "loading"
  | "error";

export interface DomainResult<T> {
  status: DomainStatus;
  data: T | null;
  reason?: string;
}
