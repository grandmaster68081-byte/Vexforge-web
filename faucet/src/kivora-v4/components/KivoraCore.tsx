export function KivoraCore({ availablePoints }: { availablePoints: number }) {
  return (
    <div className="kv4-core" aria-label="Kivora Core">
      <div className="kv4-core-orbit kv4-core-orbit-a" />
      <div className="kv4-core-orbit kv4-core-orbit-b" />
      <div className="kv4-core-crystal" aria-hidden="true" />
      <div className="kv4-core-pulse" aria-hidden="true" />
      <div className="kv4-core-readout">
        <span>KIVORA CORE</span>
        <strong>{availablePoints.toLocaleString()} KP</strong>
      </div>
    </div>
  );
}
