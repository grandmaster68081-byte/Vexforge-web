import type { DomainStatus } from "../shared/types/domain";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

const INVENTORY_BG = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_inventory_locked.jpg";

interface Props {
  title: string;
  status: Extract<DomainStatus, "blocked_auth" | "blocked_no_path">;
  reason: string;
}

export function BlockedRoute({ title, status, reason }: Props) {
  const bgUrl = title.toLowerCase() === "inventory" ? INVENTORY_BG : undefined;

  return (
    <section>
      {bgUrl ? (
        <div className="hero-banner" style={{ backgroundImage: `url(${bgUrl})` }}>
          <div className="hero-banner-overlay">
            <h1>{title}</h1>
            <DomainStatusBadge status={status} />
          </div>
        </div>
      ) : (
        <header className="route-header">
          <h1>{title}</h1>
          <DomainStatusBadge status={status} />
        </header>
      )}
      <div className="empty-state" style={{ borderColor: "#e8702a33" }}>
        <p style={{ color: "#e8702a", fontWeight: 600, marginBottom: 8 }}>Access Restricted</p>
        <p className="muted">{reason}</p>
      </div>
    </section>
  );
}