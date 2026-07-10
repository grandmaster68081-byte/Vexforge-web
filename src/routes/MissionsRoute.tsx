import { useEffect, useState } from "react";
import { listActiveMissions, type Mission } from "../domains/missions/repository";
import { DomainStatusBadge } from "../shared/components/DomainStatus";

export function MissionsRoute() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listActiveMissions().then((r) => {
      if (r.data) setMissions(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <section>
      <header className="route-header">
        <h1>Missions</h1>
        <DomainStatusBadge status="ready" />
      </header>
      {loading && <p className="muted">Loading missions from Supabase…</p>}
      <ul className="mission-list">
        {missions.map((m) => (
          <li key={m.id}>
            <strong>{m.name}</strong>
            <span className="muted"> · {m.region_id} · {m.difficulty} · {m.energy_cost} energy</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
