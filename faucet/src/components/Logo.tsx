export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'brand brand-compact' : 'brand'}>
    <img src="/kivora-mark.svg" alt="" width="34" height="34" />
    <div><strong>KIVORA</strong><span>REWARDS NETWORK</span></div>
  </div>;
}
