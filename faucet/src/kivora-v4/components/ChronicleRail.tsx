export type ChronicleEvent = {
  time: string;
  title: string;
  detail: string;
  tone: "cyan" | "lime" | "violet" | "gold";
};

export function ChronicleRail({ events }: { events: ChronicleEvent[] }) {
  return (
    <div className="kv4-chronicle-rail">
      {events.map((event) => (
        <div className="kv4-chronicle-event" key={`${event.time}-${event.title}`}>
          <div className="kv4-chronicle-time">{event.time}</div>
          <div className={`kv4-chronicle-node tone-${event.tone}`} />
          <div>
            <strong>{event.title}</strong>
            <span>{event.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
