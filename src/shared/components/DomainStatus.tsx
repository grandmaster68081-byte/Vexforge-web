import type { DomainStatus } from "../types/domain";

const COPY: Record<DomainStatus, { label: string; tone: string }> = {
  ready: { label: "Live", tone: "#3ddc84" },
  blocked_auth: { label: "Waiting on sign-in", tone: "#e8b339" },
  blocked_no_path: { label: "Not available yet", tone: "#6b7280" },
};

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const { label, tone } = COPY[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        letterSpacing: "0.02em",
        color: tone,
        border: `1px solid ${tone}55`,
        borderRadius: 999,
        padding: "2px 10px",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone }} />
      {label}
    </span>
  );
}