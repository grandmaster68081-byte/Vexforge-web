import type { DomainResult } from "../../shared/types/domain";

/**
 * NO FRONTEND PATH EXISTS. Verified chat 21: the only RLS policy on the
 * backing table(s) for 'inventory' is service_role-only. There is no public or
 * authenticated policy at all under the current schema. This is not
 * something auth can unblock -- it needs an intentional backend decision
 * (e.g. a new RLS policy or an exposed RPC) before this domain can be wired.
 * See backend/pending/backend-gaps.md.
 */
export async function getInventory(): Promise<DomainResult<never>> {
  return {
    status: "blocked_no_path",
    data: null,
    reason: "No public/authenticated RLS policy exists for 'inventory'. Needs a backend decision, not a frontend fix.",
  };
}
