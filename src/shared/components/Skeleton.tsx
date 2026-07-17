/* Skeleton shimmer primitives for loading states.
    * Uses .skeleton CSS class (keyframe in styles.css).
    */

    type LineProps = { width?: string | number; height?: number; style?: React.CSSProperties };

    export function SkeletonLine({ width = "100%", height = 13, style }: LineProps) {
    return (
      <div
        className="skeleton"
        style={{ width, height, borderRadius: 4, flexShrink: 0, ...style }}
      />
    );
    }

    /** 2–3 stat card boxes — for HomeRoute, ProgressRoute, EconomyRoute */
    export function SkeletonStatGrid({ count = 3 }: { count?: number }) {
    return (
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonLine width="55%" height={11} />
            <SkeletonLine width="40%" height={28} />
            <SkeletonLine width="70%" height={11} />
          </div>
        ))}
      </div>
    );
    }

    /** Card / pack / asset tiles — for CardsRoute, PacksRoute, AssetsRoute */
    export function SkeletonCardGrid({ count = 6, minWidth = 160 }: { count?: number; minWidth?: number }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`, gap: 12 }}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ borderRadius: 10, aspectRatio: "3/4" }}
          />
        ))}
      </div>
    );
    }

    /** Table placeholder — for MarketRoute, PvpRoute, ClansRoute, EconomyRoute */
    export function SkeletonTable({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, borderRadius: 6, marginBottom: 6 }} />
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 12,
              padding: "11px 0",
              borderBottom: "1px solid #1e1e2e",
              alignItems: "center",
            }}
          >
            {Array.from({ length: cols }, (_, j) => (
              <SkeletonLine key={j} width={j === 0 ? "70%" : j === cols - 1 ? "40%" : "55%"} />
            ))}
          </div>
        ))}
      </div>
    );
    }

    /** Mission / match list rows — for MissionsRoute, PvpRoute matches */
    export function SkeletonList({ rows = 4 }: { rows?: number }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            style={{
              display: "flex", gap: 12, padding: 14,
              background: "#ffffff06", borderRadius: 8, alignItems: "center",
            }}
          >
            <div className="skeleton" style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              <SkeletonLine width="50%" height={14} />
              <SkeletonLine width="30%" height={11} />
            </div>
            <SkeletonLine width={60} height={22} style={{ borderRadius: 10 }} />
          </div>
        ))}
      </div>
    );
    }

    /** Settings / toggle rows — for SettingsRoute */
    export function SkeletonRows({ rows = 3 }: { rows?: number }) {
    return (
      <div>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0", borderBottom: "1px solid #1e1e2e",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <SkeletonLine width={140} height={13} />
              <SkeletonLine width={200} height={11} />
            </div>
            <div className="skeleton" style={{ width: 44, height: 24, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    );
    }

    /** Profile card + detail rows — for ProfileRoute */
    export function SkeletonProfile() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex", gap: 16, alignItems: "center",
            padding: 20, background: "#ffffff06", borderRadius: 10,
          }}
        >
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonLine width="45%" height={20} />
            <SkeletonLine width="25%" height={14} />
          </div>
        </div>
        <SkeletonRows rows={4} />
      </div>
    );
    }

    /** Two card selector panels side-by-side — for FusionRoute */
    export function SkeletonFusion() {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, background: "#ffffff06", borderRadius: 10 }}
          >
            <SkeletonLine width="50%" height={16} />
            <div className="skeleton" style={{ borderRadius: 8, aspectRatio: "3/4", width: "60%", margin: "0 auto" }} />
            <SkeletonLine width="80%" />
            <SkeletonLine width="60%" />
          </div>
        ))}
      </div>
    );
    }
    