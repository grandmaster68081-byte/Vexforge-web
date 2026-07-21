import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getSeasonRankings, getMySeasonRanking, type SeasonRanking } from "../domains/season/repository";
import { PageLoader } from "../shared/components/PageLoader";
import { EmptyState } from "../shared/components/EmptyState";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_leaderboard.jpg";

const MMR_TIER: Array<{ min: number; label: string; color: string; icon: string }> = [
  { min: 2000, label: "Mítico",     color: "#FF4444", icon: "🔴" },
  { min: 1600, label: "Legendario", color: "#E8B84B", icon: "👑" },
  { min: 1300, label: "Épico",      color: "#A855F7", icon: "💜" },
  { min: 1100, label: "Raro",       color: "#4A9EFF", icon: "💙" },
  { min:    0, label: "Común",      color: "#8B8B9E", icon: "⚪" },
];

function getTier(mmr: number) {
  return MMR_TIER.find(t => mmr >= t.min) ?? MMR_TIER[MMR_TIER.length - 1];
}

function getRankMedal(pos: number) {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return null;
}

function StatChip({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: color ?? "#e8e8f0", fontWeight: 700, fontSize: 14 }}>{value}</div>
      <div style={{ color: "#555", fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function RankRow({ entry, isMe }: { entry: SeasonRanking; isMe: boolean }) {
  const tier = getTier(entry.mmr);
  const medal = getRankMedal(entry.rank_position);
  const winRate = (entry.wins + entry.losses + entry.draws) > 0
    ? Math.round((entry.wins / (entry.wins + entry.losses + entry.draws)) * 100)
    : 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 18px",
      background: isMe ? "#1a1f2e" : "#13131f",
      border: isMe ? "1px solid #4a9eff44" : "1px solid #1a1a2a",
      borderRadius: 10,
      transition: "border-color .2s",
    }}>
      {/* Rank */}
      <div style={{ width: 36, flexShrink: 0, textAlign: "center" }}>
        {medal
          ? <span style={{ fontSize: 20 }}>{medal}</span>
          : <span style={{ color: "#444", fontWeight: 700, fontSize: 15 }}>#{entry.rank_position}</span>
        }
      </div>

      {/* Player name / tier */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: tier.icon ? tier.color : "#8b8b9e", fontSize: 14 }}>{tier.icon}</span>
          <span style={{
            color: isMe ? "#4a9eff" : "#e8e8f0",
            fontWeight: 700, fontSize: 14,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {entry.display_name ?? `Guerrero #${entry.rank_position}`}
            {isMe && <span style={{ color: "#4a9eff", fontSize: 11, marginLeft: 6 }}>• Tú</span>}
          </span>
        </div>
        <div style={{ color: tier.color, fontSize: 11, marginTop: 2 }}>{tier.label}</div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
        <StatChip label="MMR" value={entry.mmr} color="#e8b84b" />
        <StatChip label="Victorias" value={entry.wins} color="#3ddc84" />
        <StatChip label="Derrotas" value={entry.losses} color="#ff6b6b" />
        <StatChip label="Win%" value={winRate + "%"} />
      </div>
    </div>
  );
}

export function SeasonRankingsRoute() {
  const [rankings, setRankings] = useState<SeasonRanking[]>([]);
  const [myRanking, setMyRanking] = useState<SeasonRanking | null>(null);
  const [loading, setLoading]     = useState(true);
  const [authed, setAuthed]       = useState<boolean | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const SEASON = "S1_2026";

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [rankR, myR] = await Promise.all([
      getSeasonRankings(SEASON),
      getMySeasonRanking(SEASON),
    ]);
    setRankings(rankR.data ?? []);
    setMyRanking(myR.data ?? null);
    setError(rankR.reason ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  const myPlayerId = myRanking?.player_id;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a12",
      backgroundImage: `url(${BG_URL})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}>
      <div style={{ minHeight: "100vh", background: "rgba(10,10,18,0.87)", padding: "28px 16px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8b84b", fontSize: 26, margin: "0 0 4px" }}>
              🏆 Rankings de Temporada
            </h1>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "#555", fontSize: 13, margin: 0 }}>
                Temporada <strong style={{ color: "#e8b84b" }}>{SEASON}</strong> · Top clasificados por MMR
              </p>
              <button
                onClick={load}
                style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer" }}>
                ↺ Actualizar
              </button>
            </div>
          </div>

          {/* My ranking highlight */}
          {authed && myRanking && (
            <div style={{
              background: "#0f1a2e", border: "1px solid #4a9eff44", borderRadius: 12,
              padding: "16px 20px", marginBottom: 24,
            }}>
              <div style={{ color: "#4a9eff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
                Tu posición
              </div>
              <RankRow entry={myRanking} isMe={true} />
            </div>
          )}

          {/* Error */}
          {error && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>}

          {/* Rankings list */}
          {rankings.length === 0 ? (
            <EmptyState
              icon="🏆"
              title="Rankings en construcción"
              description="Los rankings se actualizan después de las batallas PvP. ¡Juega y sube tu MMR!"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rankings.map(entry => (
                <RankRow
                  key={entry.player_id + entry.season_key}
                  entry={entry}
                  isMe={entry.player_id === myPlayerId}
                />
              ))}
            </div>
          )}

          {/* Tier legend */}
          <div style={{ marginTop: 40, padding: "16px 20px", background: "#13131f", borderRadius: 12, border: "1px solid #1a1a2a" }}>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Rangos por MMR
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {MMR_TIER.map(t => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{t.icon}</span>
                  <span style={{ color: t.color, fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                  <span style={{ color: "#444", fontSize: 11 }}>{t.min === 0 ? "< 1100" : `≥ ${t.min}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}