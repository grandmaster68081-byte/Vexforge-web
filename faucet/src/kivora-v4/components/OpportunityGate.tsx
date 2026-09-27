export type OpportunityGateProps = {
  title: string;
  category: string;
  rewardPoints: number;
  imageUrl: string;
  meta: string;
  accent: "cyan" | "lime" | "violet" | "gold";
  onOpen?: () => void;
};

export function OpportunityGate(props: OpportunityGateProps) {
  return (
    <article className={`kv4-opportunity-gate accent-${props.accent}`}>
      <div className="kv4-opportunity-image" style={{ backgroundImage: `url(${props.imageUrl})` }} />
      <div className="kv4-opportunity-content">
        <span className="kv4-opportunity-category">{props.category}</span>
        <h3>{props.title}</h3>
        <p>{props.meta}</p>
        <div className="kv4-opportunity-bottom">
          <strong>+{props.rewardPoints.toLocaleString()} KP</strong>
          <button type="button" onClick={props.onOpen}>ENTER →</button>
        </div>
      </div>
    </article>
  );
}
