import type { DomainStatus } from "../shared/types/domain";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

interface Props {
  title: string;
  status: Extract<DomainStatus, "blocked_auth" | "blocked_no_path">;
  reason: string;
}

export function BlockedRoute({ title, status, reason }: Props) {
  return (
    <section>
      <header className="route-header">
        <h1>{title}</h1>
        <DomainStatusBadge status={status} />
      </header>
      <div className="empty-state">
        <p>{reason}</p>
      </div>
    </section>
  );
}
