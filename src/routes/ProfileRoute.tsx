import { useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../domains/profile/useProfile";
import { getRank, tierProgress } from "../lib/rankUtils";
import type { PlayerStats, PlayerRank, PlayerAchievement, WalletSnapshot } from "../domains/profile/repository";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  founder: { label: "Founder",      color: "#E8702A", bg: "rgba(232,112,42,0.14)" },
  admin:   { label: "Forgemaster",  color: "#A855F7", bg: "rgba(168,85,247,0.14)" },
  player:  { label: "Forge Player", color: "#3DC96B", bg: "rgba(61,201,107,0.14)" },
};
const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active:    { label: "Activo",     color: "#3DC96B" },
  banned:    { label: "Baneado",    color: "#E3573F" },
  suspended: { label: "Suspendido", color: "#E8702A" },
};
const ACH_CATEGORY_COLOR: Record<string, string> = {
  pvp:        "#4A9EFF",
  collection: "#E8B84B",
  missions:   "#3DC96B",
  economy:    "#A855F7",
  social:     "#FF6B6B",
  bosses:     "#FF4444",
};
const QUICK_LINKS = [
  { to: "/progress",  icon: "📈", label: "Progreso",   desc: "XP y nivel" },
  { to: "/economy",   icon: "💰", label: "Economía",   desc: "Wallet y ledger" },
  { to: "/inventory", icon: "🎒", label: "Inventario", desc: "Tus items" },
  { to: "/cards",     icon: "🃏", label: "Cartas",     desc: "Tu colección" },
  { to: "/missions",  icon: "📜", label: "Misiones",   desc: "Festival de la Forja" },
  { to: "/settings",  icon: "⚙️", label: "Ajustes",   desc: "Preferencias" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "k";
  return String(n);
}
function fmtVex(n: number): string { return (n ?? 0).toLocaleString("es-MX"); }
function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}
function memberSince(s: string): string {
  const months = Math.floor((Date.now() - new Date(s).getTime()) / (30 * 86400_000));
  if (months < 1)  return "Nuevo miembro";
  if (months === 1) return "1 mes";
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 año" : `${years} años`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonBlock({ h = 80, radius = 12 }: { h?: number; radius?: number }) {
  return <div className="skeleton" style={{ width: "100%", height: h, borderRadius: radius }} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: '"Rajdhani",sans-serif',
        letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-primary)" }}>
        {title}
      </h2>
      {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--fg-muted)" }}>{sub}</p>}
    </div>
  );
}

// ─── Rank Card ────────────────────────────────────────────────────────────────
function RankCard({ rank, loading }: { rank: PlayerRank | null; loading: boolean }) {
  if (loading) return <SkeletonBlock h={170} />;

  const mmr     = rank?.mmr ?? 1000;
  const tier    = getRank(mmr);
  const pct     = tierProgress(mmr);
  const color   = rank?.tier_color ?? tier.color;
  const icon    = rank?.tier_icon  ?? tier.icon;
  const tierName= rank?.tier       ?? tier.name;
  const wins    = rank?.wins    ?? 0;
  const losses  = rank?.losses  ?? 0;
  const shields = rank?.shields ?? 0;
  const total   = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div style={{ background: "var(--layer-1)", borderRadius: 14,
      border: `1px solid ${color}33`, padding: "20px 22px",
      background: `linear-gradient(135deg, ${color}08 0%, var(--layer-1) 60%)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 38, lineHeight: 1 }}>{icon}</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: '"Rajdhani",sans-serif',
            color, letterSpacing: "0.06em", marginTop: 6 }}>{tierName.toUpperCase()}</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>
            Temporada activa
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace', color }}>
            {mmr}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>MMR</div>
          {shields > 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#4A9EFF",
              fontFamily: '"IBM Plex Mono",monospace' }}>
              🛡️ ×{shields} escudos
            </div>
          )}
        </div>
      </div>

      {/* W/L */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#3DC96B" }}>
          <span style={{ fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace' }}>{wins}</span>
          <span style={{ color: "var(--fg-muted)", marginLeft: 4 }}>W</span>
        </div>
        <div style={{ fontSize: 12, color: "#E3573F" }}>
          <span style={{ fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace' }}>{losses}</span>
          <span style={{ color: "var(--fg-muted)", marginLeft: 4 }}>L</span>
        </div>
        {total > 0 && (
          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
            <span style={{ fontFamily: '"IBM Plex Mono",monospace', color: "var(--fg-primary)" }}>{winRate}%</span>
            <span style={{ marginLeft: 4 }}>win rate</span>
          </div>
        )}
      </div>

      {/* Progress to next tier */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Progreso al siguiente tier
          </span>
          <span style={{ fontSize: 10, fontFamily: '"IBM Plex Mono",monospace', color }}>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transition: "width 0.8s ease" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Stats Grid ───────────────────────────────────────────────────────────────
function StatsGrid({ stats, loading }: { stats: PlayerStats | null; loading: boolean }) {
  const items = [
    { icon: "⚔️", label: "Victorias PVP",     value: stats?.pvp_wins           ?? 0, color: "#4A9EFF" },
    { icon: "📜", label: "Misiones",           value: stats?.missions_completed  ?? 0, color: "#3DC96B" },
    { icon: "🃏", label: "Cartas Únicas",      value: stats?.cards_owned         ?? 0, color: "#E8B84B" },
    { icon: "🏷️", label: "Ventas Mercado",     value: stats?.market_sales        ?? 0, color: "#A855F7" },
    { icon: "💀", label: "Jefes Eliminados",   value: stats?.boss_kills          ?? 0, color: "#FF4444" },
    { icon: "📦", label: "Packs Abiertos",     value: stats?.packs_opened        ?? 0, color: "#FF9F40" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {items.map(({ icon, label, value, color }) => (
        <div key={label} style={{ background: "var(--layer-1)", borderRadius: 12,
          border: `1px solid ${color}22`, padding: "14px 14px 12px",
          position: "relative", overflow: "hidden" }}>
          {loading ? (
            <SkeletonBlock h={50} radius={8} />
          ) : (
            <>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace', color }}>
                {fmtNum(value)}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-muted)", textTransform: "uppercase",
                letterSpacing: "0.07em", marginTop: 3, lineHeight: 1.3 }}>{label}</div>
              {/* Subtle color accent */}
              <div style={{ position: "absolute", top: 0, right: 0, width: 3, height: "100%",
                background: `linear-gradient(180deg, ${color}66, transparent)` }} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Wallet Snapshot ──────────────────────────────────────────────────────────
function WalletSnapshotSection({ wallet, loading }: { wallet: WalletSnapshot | null; loading: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[
        { label: "VEX Ingame",    value: wallet?.vex_ingame    ?? 0, color: "#3DC96B", icon: "⚡" },
        { label: "VEX Tradeable", value: wallet?.vex_tradeable ?? 0, color: "#E8B84B", icon: "💱" },
      ].map(({ label, value, color, icon }) => (
        <Link key={label} to="/economy" style={{ textDecoration: "none" }}>
          <div style={{ background: "var(--layer-1)", borderRadius: 12,
            border: `1px solid ${color}33`, padding: "16px 18px",
            transition: "border-color 0.18s, background 0.18s",
            background: `linear-gradient(135deg, ${color}08 0%, var(--layer-1) 70%)` }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}66`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}33`; }}>
            {loading ? <SkeletonBlock h={50} radius={8} /> : (
              <>
                <div style={{ fontSize: 12, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace', color }}>
                  {fmtVex(value)}
                </div>
                <div style={{ fontSize: 10, color: "var(--fg-muted)", textTransform: "uppercase",
                  letterSpacing: "0.07em", marginTop: 3 }}>{label}</div>
              </>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Achievement Badge ─────────────────────────────────────────────────────────
function AchievementBadge({ ach }: { ach: PlayerAchievement }) {
  const color = ACH_CATEGORY_COLOR[ach.category] ?? "#9A9AB0";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10,
      background: "var(--layer-1)", borderRadius: 10, padding: "10px 14px",
      border: `1px solid ${color}22` }}>
      <div style={{ fontSize: 22, flexShrink: 0 }}>{ach.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-primary)",
          fontFamily: '"Rajdhani",sans-serif', letterSpacing: "0.04em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {ach.title}
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-muted)", marginTop: 2 }}>
          {ach.category} · {fmtDate(ach.unlocked_at)}
        </div>
      </div>
      <div style={{ fontSize: 11, fontFamily: '"IBM Plex Mono",monospace',
        color, fontWeight: 700, flexShrink: 0 }}>+{ach.points}</div>
    </div>
  );
}

// ─── Quick Links ──────────────────────────────────────────────────────────────
function QuickLinksGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {QUICK_LINKS.map(({ to, icon, label, desc }) => (
        <Link key={to} to={to} style={{ textDecoration: "none" }}>
          <div style={{ padding: "16px 14px", borderRadius: 12,
            background: "var(--layer-1)", border: "1px solid rgba(255,255,255,0.06)",
            transition: "border-color 0.18s, background 0.18s" }}
            onMouseEnter={e => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.borderColor = "rgba(201,144,31,0.35)";
              d.style.background  = "rgba(201,144,31,0.05)";
            }}
            onMouseLeave={e => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.borderColor = "rgba(255,255,255,0.06)";
              d.style.background  = "var(--layer-1)";
            }}>
            <span style={{ fontSize: 22, display: "block", marginBottom: 8 }}>{icon}</span>
            <p style={{ fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 13,
              margin: "0 0 3px", color: "var(--fg-primary)" }}>{label}</p>
            <p style={{ fontSize: 11, margin: 0, color: "var(--fg-muted)" }}>{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ProfileRoute() {
  const {
    profile, stats, rank, achievements, wallet,
    totalPoints, loading, statsLoading, reason, signedIn,
  } = useProfile();

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!loading && !signedIn) {
    return (
      <div className="route-container" style={{ paddingBottom: 40 }}>
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🔐</div>
          <h2 style={{ fontFamily: '"Rajdhani",sans-serif', fontSize: 22,
            color: "var(--ember-gold)", margin: "0 0 10px", fontWeight: 700 }}>
            Inicia Sesión
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 24 }}>
            Necesitas una cuenta para ver tu perfil de forjador.
          </p>
          <Link to="/account" style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 28px", borderRadius: 9,
              background: "var(--ember-gold)", border: "none", color: "#0a0a16",
              fontFamily: '"Rajdhani",sans-serif', fontSize: 14, fontWeight: 700,
              letterSpacing: "0.06em", cursor: "pointer" }}>
              Ir a Mi Cuenta
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (!loading && !profile) {
    return (
      <div className="route-container" style={{ paddingBottom: 40 }}>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-title">Perfil no encontrado</div>
          <div className="empty-state-desc">{reason ?? "No se pudo cargar tu perfil."}</div>
        </div>
      </div>
    );
  }

  const role       = profile?.role ?? "player";
  const roleBadge  = ROLE_BADGE[role] ?? ROLE_BADGE.player;
  const statusInfo = STATUS_BADGE[profile?.status ?? "active"] ?? STATUS_BADGE.active;
  const initial    = ((profile?.display_name ?? profile?.email ?? "?")[0]).toUpperCase();

  return (
    <div className="route-container" style={{ paddingBottom: 40 }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700,
          fontFamily: '"Rajdhani",sans-serif', letterSpacing: "0.06em",
          color: "var(--fg-primary)" }}>PERFIL</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--fg-muted)" }}>
          Tu identidad en el reino del hierro
        </p>
      </div>

      {/* ── Identity card ────────────────────────────────────────────────── */}
      <div style={{ background: "var(--layer-1)", borderRadius: 16,
        border: "1px solid rgba(201,144,31,0.18)", padding: "24px 24px 20px",
        marginBottom: 24,
        background: "linear-gradient(135deg, rgba(201,144,31,0.06) 0%, var(--layer-1) 50%)" }}>
        {loading ? (
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div className="skeleton" style={{ width: 72, height: 72, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock h={24} radius={6} />
              <div style={{ marginTop: 8 }}><SkeletonBlock h={14} radius={4} /></div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${roleBadge.color}33, ${roleBadge.color}11)`,
              border: `2.5px solid ${roleBadge.color}66`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 900,
              fontFamily: '"Rajdhani",sans-serif', color: roleBadge.color,
            }}>
              {initial}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: "0 0 5px", fontSize: 21, fontWeight: 700,
                fontFamily: '"Rajdhani",sans-serif', letterSpacing: "0.04em",
                color: "var(--fg-primary)", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis" }}>
                {profile?.display_name ?? "Sin nombre"}
              </h2>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--fg-muted)" }}>
                {profile?.email}
              </p>

              {/* Badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {/* Role */}
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5,
                  background: roleBadge.bg, color: roleBadge.color,
                  fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {roleBadge.label}
                </span>
                {/* Status */}
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5,
                  background: `${statusInfo.color}12`, color: statusInfo.color,
                  fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {statusInfo.label}
                </span>
                {/* Admin */}
                {(profile?.is_super_admin || profile?.is_admin) && (
                  <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5,
                    background: "rgba(168,85,247,0.14)", color: "#A855F7",
                    fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {profile.is_super_admin ? "⚡ Super Admin" : "🔑 Admin"}
                  </span>
                )}
                {/* Telegram */}
                {profile?.telegram_username && (
                  <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5,
                    background: "rgba(74,158,255,0.12)", color: "#4A9EFF",
                    fontWeight: 700, letterSpacing: "0.06em" }}>
                    ✈️ @{profile.telegram_username}
                  </span>
                )}
              </div>
            </div>

            {/* Member since */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: "var(--fg-muted)", textTransform: "uppercase",
                letterSpacing: "0.07em" }}>Miembro</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ember-gold-lt)",
                fontFamily: '"Rajdhani",sans-serif', marginTop: 3 }}>
                {profile?.created_at ? memberSince(profile.created_at) : "—"}
              </div>
              {profile?.created_at && (
                <div style={{ fontSize: 10, color: "var(--fg-muted)", marginTop: 2 }}>
                  {fmtDate(profile.created_at)}
                </div>
              )}
              {/* Total achievement points */}
              {totalPoints > 0 && (
                <div style={{ marginTop: 10,
                  fontSize: 12, fontFamily: '"IBM Plex Mono",monospace',
                  color: "#E8B84B", fontWeight: 700 }}>
                  🏆 {totalPoints} pts
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Two-column: Rank + Stats ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 18, marginBottom: 24 }}>
        {/* Rank */}
        <div>
          <SectionHeader title="Rango PVP" />
          <RankCard rank={rank} loading={statsLoading} />
        </div>

        {/* Stats */}
        <div>
          <SectionHeader title="Estadísticas" />
          <StatsGrid stats={stats} loading={statsLoading} />
        </div>
      </div>

      {/* ── Wallet snapshot ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeader
          title="Cartera VEX"
          sub="Toca una tarjeta para ir a tu economía completa"
        />
        <WalletSnapshotSection wallet={wallet} loading={statsLoading} />
      </div>

      {/* ── Achievements ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <SectionHeader
          title="Logros"
          sub={achievements.length > 0 ? `${achievements.length} desbloqueados · ${totalPoints} puntos totales` : "Sin logros aún"}
        />
        {statsLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0,1,2].map(i => <SkeletonBlock key={i} h={54} />)}
          </div>
        ) : achievements.length === 0 ? (
          <div style={{ background: "var(--layer-1)", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)", padding: "28px 20px",
            textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🏅</div>
            <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>
              Completa misiones, gana batallas y abre packs para desbloquear logros.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {achievements.slice(0, 8).map((ach) => (
              <AchievementBadge key={ach.achievement_id} ach={ach} />
            ))}
            {achievements.length > 8 && (
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--fg-muted)",
                padding: "8px 0" }}>
                +{achievements.length - 8} logros más
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Links ───────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Tu Forge" sub="Acceso rápido a todas tus secciones" />
        <QuickLinksGrid />
      </div>

    </div>
  );
}
