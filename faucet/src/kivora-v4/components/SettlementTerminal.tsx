export type SettlementState = "requested" | "reserved" | "review" | "paid";

export function SettlementTerminal({
  points,
  asset = "USDT",
  network = "TRC20",
  destination,
  state,
}: {
  points: number;
  asset?: string;
  network?: string;
  destination: string;
  state: SettlementState;
}) {
  const stages = ["reserved", "review", "paid"] as const;
  return (
    <div className={`kv4-settlement-terminal state-${state}`}>
      <div className="kv4-terminal-head">
        <span>SETTLEMENT TERMINAL</span>
        <b>{asset} / {network}</b>
      </div>
      <div className="kv4-terminal-amount">{points.toLocaleString()} KP</div>
      <div className="kv4-terminal-destination">{destination}</div>
      <div className="kv4-terminal-steps">
        {stages.map((step, index) => {
          const active = stages.indexOf(state === "requested" ? "reserved" : state === "paid" ? "paid" : state) >= index;
          return <div className={active ? "active" : ""} key={step}><i>{active ? "ACTIVE" : index + 1}</i><span>{step}</span></div>;
        })}
      </div>
    </div>
  );
}
