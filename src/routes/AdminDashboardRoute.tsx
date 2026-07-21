import { useState, useEffect, useCallback } from "react";
import { PageLoader } from "../shared/components/PageLoader";
import { useNavigate } from "react-router-dom";
import {
  adminGetOverview, adminGetPlayers, adminGetLedger,
} from "../domains/admin/adminMetrics";
import type { AdminOverview, AdminPlayer, LedgerEntry } from "../domains/admin/adminMetrics";

type Tab = "overview" | "players" | "ledger" | "deposits";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",  label: "Overview",   icon: "📊" },
  { id: "players",   label: "Jugadores",  icon: "👥" },
  { id: "ledger",    label: "Economía",   icon: "📒" },
  { id: "deposits",  label: "Depósitos",  icon: "💰" },
];

const C = {
  bg0:"#0d0d14", bg1:"#12121f", bg2:"#18182a",
  b1:"#1e1e30", b2:"#2a2a3a",
  gold:"#E8B84B", green:"#3DC96B", red:"#FF4B4B",
  blue:"#4A9EFF", purple:"#A855F7",
  muted:"#7a7a9a", dim:"#4a4a6a", main:"#e8e8f0",
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  });
}

// ── KPI Card ─────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, icon, onClick, alert,
}: {
  label: string; value: string; sub?: string; color?: string;
  icon: string; onClick?: () => void; alert?: boolean;
}) {
  const c = color ?? C.muted;
  return (
    <div
      onClick={onClick}
      style={{
        background: C.bg1,
        border: "1px solid " + (alert ? C.red + "88" : c + "33"),
        borderRadius: 12, padding: "16px 18px",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s",
        position: "relative",
      }}
    >
      {alert && (
        <div style={{
          position:"absolute", top:10, right:12,
          width:8, height:8, borderRadius:"50%",
          background:C.red,
          boxShadow:"0 0 8px " + C.red,
        }} />
      )}
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:800, color:c, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:5, letterSpacing:0.5 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.dim, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────
function OverviewTab({ data, onTabChange }: { data: AdminOverview; onTabChange: (t: Tab) => void }) {
  return (
    <div>
      <div style={{ fontSize:12, color:C.dim, marginBottom:20, letterSpacing:1 }}>
        MÉTRICAS GLOBALES · actualizado ahora
      </div>

      {/* Row 1: Jugadores + VEX */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10, marginBottom:10 }}>
        <KpiCard icon="👥" label="Jugadores registrados"
          value={fmt(data.total_players)}
          sub={data.active_players + " activos"}
          color={C.blue}
          onClick={() => onTabChange("players")}
        />
        <KpiCard icon="⚡" label="VEX Tradeable en circulación"
          value={fmt(data.total_vex_tradeable)}
          sub={fmt(data.total_vex_ingame) + " in-game"}
          color={C.gold}
        />
        <KpiCard icon="🃏" label="Cartas distribuidas"
          value={fmt(data.total_cards_distributed)}
          sub={fmt(data.unique_player_card_slots) + " slots únicos"}
          color={C.purple}
        />
        <KpiCard icon="📦" label="Packs abiertos"
          value={fmt(data.total_packs_opened)}
          sub={fmt(data.total_packs_pending) + " pendientes de abrir"}
          color={C.green}
        />
      </div>

      {/* Row 2: Monetización + Ledger */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10, marginBottom:24 }}>
        <KpiCard icon="💵" label="Revenue USDT acumulado"
          value={"$" + Number(data.total_usdt_received).toFixed(2)}
          sub={fmt(data.total_vex_from_deposits) + " VEX emitidos"}
          color={C.green}
        />
        <KpiCard icon="⏳" label="Depósitos PENDIENTES"
          value={String(data.deposits_pending)}
          sub={data.deposits_approved + " aprobados · " + data.deposits_rejected + " rechazados"}
          color={data.deposits_pending > 0 ? C.red : C.muted}
          alert={data.deposits_pending > 0}
          onClick={() => onTabChange("deposits")}
        />
        <KpiCard icon="📒" label="Entradas en ledger"
          value={fmt(data.ledger_entries)}
          color={C.muted}
          onClick={() => onTabChange("ledger")}
        />
      </div>

      {/* Revenue summary bar */}
      <div style={{
        background:C.bg2, border:"1px solid "+C.b1, borderRadius:10,
        padding:"14px 18px",
      }}>
        <div style={{ fontSize:11, color:C.dim, letterSpacing:1, marginBottom:10 }}>
          FLUJO DE VEX
        </div>
        <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:12, color:C.muted }}>Depósitos → VEX emitidos</div>
            <div style={{ fontSize:18, fontWeight:700, color:C.gold }}>
              {fmt(data.total_vex_from_deposits)} VEX
            </div>
          </div>
          <div style={{ color:C.dim, fontSize:20, alignSelf:"center" }}>→</div>
          <div>
            <div style={{ fontSize:12, color:C.muted }}>VEX en wallets ahora</div>
            <div style={{ fontSize:18, fontWeight:700, color:C.blue }}>
              {fmt(data.total_vex_tradeable + data.total_vex_ingame)} VEX
            </div>
          </div>
          <div style={{ color:C.dim, fontSize:20, alignSelf:"center" }}>→</div>
          <div>
            <div style={{ fontSize:12, color:C.muted }}>Cartas en colecciones</div>
            <div style={{ fontSize:18, fontWeight:700, color:C.purple }}>
              {fmt(data.total_cards_distributed)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Players Tab ──────────────────────────────────────────────────────────
function PlayersTab({ players }: { players: AdminPlayer[] }) {
  const [search, setSearch] = useState("");
  const filtered = players.filter(p => {
    const q = search.toLowerCase();
    return !q ||
      (p.display_name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.telegram_username ?? "").toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o telegram…"
          style={{
            width:"100%", boxSizing:"border-box",
            padding:"9px 14px", borderRadius:8,
            border:"1px solid "+C.b2, background:C.bg2,
            color:C.main, fontSize:13,
          }}
        />
      </div>

      {/* Stats row */}
      <div style={{ fontSize:12, color:C.dim, marginBottom:14 }}>
        {filtered.length} jugadores
        {search ? " (filtrados de " + players.length + ")" : ""}
      </div>

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid "+C.b1, color:C.dim }}>
              {["Jugador","Contact","VEX Tradeable","VEX In-game","Cartas","Role","Estado","Registro"].map(h => (
                <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontWeight:600, letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.player_id} style={{
                borderBottom:"1px solid "+C.b1,
                background:i%2===0?"transparent":C.bg2+"40",
              }}>
                <td style={{ padding:"10px 10px", color:C.main, whiteSpace:"nowrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {(p.is_super_admin || p.is_admin) && (
                      <span title={p.is_super_admin?"Super Admin":"Admin"} style={{ fontSize:10 }}>
                        {p.is_super_admin?"👑":"🛡️"}
                      </span>
                    )}
                    <span style={{ fontWeight:600 }}>{p.display_name ?? "(sin nombre)"}</span>
                  </div>
                </td>
                <td style={{ padding:"10px 10px", color:C.muted, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {p.telegram_username ? "@"+p.telegram_username : (p.email ?? "—")}
                </td>
                <td style={{ padding:"10px 10px", color:C.gold, fontWeight:700, textAlign:"right", fontFamily:"monospace" }}>
                  {fmt(p.vex_tradeable)}
                </td>
                <td style={{ padding:"10px 10px", color:C.blue, textAlign:"right", fontFamily:"monospace" }}>
                  {fmt(p.vex_ingame)}
                </td>
                <td style={{ padding:"10px 10px", color:C.purple, textAlign:"right" }}>
                  {p.total_cards}
                  <span style={{ color:C.dim, fontSize:10 }}> ({p.unique_cards} únicos)</span>
                </td>
                <td style={{ padding:"10px 10px", color:C.muted }}>
                  {p.role ?? "player"}
                </td>
                <td style={{ padding:"10px 10px" }}>
                  <span style={{
                    padding:"2px 8px", borderRadius:12, fontSize:10, fontWeight:700,
                    background:p.status==="active" ? C.green+"18" : C.red+"18",
                    color:p.status==="active" ? C.green : C.red,
                  }}>{p.status ?? "—"}</span>
                </td>
                <td style={{ padding:"10px 10px", color:C.dim, whiteSpace:"nowrap" }}>
                  {new Date(p.created_at).toLocaleDateString("es-MX")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:C.dim }}>
            Sin resultados para "{search}"
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ledger Tab ───────────────────────────────────────────────────────────
function LedgerTab({ entries, total, onLoadMore, loading }: {
  entries: LedgerEntry[]; total: number; onLoadMore: () => void; loading: boolean;
}) {
  const ENTRY_COLOR: Record<string, string> = {
    deposit: "#3DC96B", withdrawal: "#FF4B4B",
    pack_purchase: "#A855F7", pack_purchase_vex: "#A855F7",
    quest_reward: "#4A9EFF", mission_reward: "#4A9EFF",
    battle_reward: "#E8B84B", daily_reward: "#E8B84B",
    adjustment: "#7a7a9a",
  };
  function entryColor(t: string) {
    return ENTRY_COLOR[t] ?? "#7a7a9a";
  }

  return (
    <div>
      <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>
        {entries.length} de {total.toLocaleString()} entradas · orden: más recientes primero
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid "+C.b1, color:C.dim }}>
              {["Tipo","Currency","Monto","Balance ant.","Balance post.","Jugador","Fecha"].map(h => (
                <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontWeight:600, letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const c = entryColor(e.entry_type);
              const isPos = e.amount >= 0;
              return (
                <tr key={e.id} style={{
                  borderBottom:"1px solid "+C.b1,
                  background:i%2===0?"transparent":C.bg2+"40",
                }}>
                  <td style={{ padding:"9px 10px", whiteSpace:"nowrap" }}>
                    <span style={{
                      padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:700,
                      background:c+"18", color:c,
                    }}>{e.entry_type}</span>
                  </td>
                  <td style={{ padding:"9px 10px", color:C.muted, fontFamily:"monospace" }}>{e.currency}</td>
                  <td style={{ padding:"9px 10px", fontFamily:"monospace", fontWeight:700, textAlign:"right",
                    color: isPos ? C.green : C.red }}>
                    {isPos ? "+" : ""}{Number(e.amount).toLocaleString()}
                  </td>
                  <td style={{ padding:"9px 10px", color:C.dim, fontFamily:"monospace", textAlign:"right" }}>
                    {e.balance_before != null ? Number(e.balance_before).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding:"9px 10px", color:C.muted, fontFamily:"monospace", textAlign:"right" }}>
                    {e.balance_after != null ? Number(e.balance_after).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding:"9px 10px", color:C.muted, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {e.player_name ?? e.player_email ?? "—"}
                  </td>
                  <td style={{ padding:"9px 10px", color:C.dim, whiteSpace:"nowrap" }}>
                    {fmtDate(e.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {entries.length < total && (
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button
            onClick={onLoadMore}
            disabled={loading}
            style={{
              padding:"9px 24px", borderRadius:8,
              border:"1px solid "+C.b2, background:"transparent",
              color:loading?C.dim:C.muted, cursor:loading?"not-allowed":"pointer", fontSize:13,
            }}
          >
            {loading ? "Cargando…" : "Cargar más (" + (total - entries.length) + " restantes)"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Deposits shortcut Tab ────────────────────────────────────────────────
function DepositsTab({ navigate, pendingCount }: { navigate: (p: string) => void; pendingCount: number }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 0" }}>
      <div style={{ fontSize:56, marginBottom:20 }}>💰</div>
      <div style={{ fontSize:20, fontWeight:800, color:C.gold, marginBottom:8 }}>
        Panel de Depósitos
      </div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:28, textAlign:"center", maxWidth:380 }}>
        Los depósitos USDT → VEX se gestionan en su propia página con panel completo de aprobación.
      </div>
      {pendingCount > 0 && (
        <div style={{
          padding:"10px 20px", borderRadius:8, marginBottom:20,
          background:C.red+"15", border:"1px solid "+C.red+"44", color:C.red,
          fontSize:14, fontWeight:700,
        }}>
          ⚠️ {pendingCount} depósito{pendingCount !== 1 ? "s" : ""} esperando aprobación
        </div>
      )}
      <button
        onClick={() => navigate("/admin/deposits")}
        style={{
          padding:"12px 36px", borderRadius:10, border:"none",
          background:C.gold, color:C.bg0,
          fontWeight:800, fontSize:15, cursor:"pointer", letterSpacing:1,
        }}
      >
        Ir a Depósitos →
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export function AdminDashboardRoute() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  // Data state
  const [overview, setOverview]     = useState<AdminOverview | null>(null);
  const [players, setPlayers]       = useState<AdminPlayer[] | null>(null);
  const [ledger, setLedger]         = useState<LedgerEntry[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(0);

  // Loading / error per tab
  const [loading, setLoading]       = useState<Tab | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // Load overview on mount
  useEffect(() => { loadOverview(); }, []);

  // Load tab data on tab switch
  useEffect(() => {
    if (tab === "players" && players === null) loadPlayers();
    if (tab === "ledger"  && ledger.length === 0) loadLedger(0);
  }, [tab]);

  async function loadOverview() {
    setLoading("overview"); setError(null);
    const res = await adminGetOverview();
    setLoading(null);
    if (!res.data) { setError(res.reason ?? "Error cargando métricas"); return; }
    setOverview(res.data);
  }

  async function loadPlayers() {
    setLoading("players"); setError(null);
    const res = await adminGetPlayers();
    setLoading(null);
    if (!res.data) { setError(res.reason ?? "Error cargando jugadores"); return; }
    setPlayers(res.data);
  }

  async function loadLedger(page: number) {
    setLoading("ledger"); setError(null);
    const res = await adminGetLedger(60, page * 60);
    setLoading(null);
    if (!res.data) { setError(res.reason ?? "Error cargando ledger"); return; }
    setLedger(prev => page === 0 ? res.data! : [...prev, ...res.data!]);
    setLedgerTotal(res.total);
    setLedgerPage(page);
  }

  function handleTabChange(t: Tab) {
    setTab(t); setError(null);
  }

  const isLoading = loading !== null;

  return (
    <div style={{ minHeight:"100vh", background:C.bg0, color:C.main }}>
      <div style={{ maxWidth:1000, margin:"0 auto", padding:"24px 16px 48px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:32 }}>🛡️</span>
            <div>
              <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:C.gold, letterSpacing:2 }}>
                ADMIN DASHBOARD
              </h1>
              <p style={{ margin:0, fontSize:12, color:C.muted }}>
                Panel de control VEXFORGE · solo administradores
              </p>
            </div>
          </div>
          <button
            onClick={() => { loadOverview(); setPlayers(null); setLedger([]); setLedgerPage(0); }}
            style={{
              padding:"7px 16px", borderRadius:8,
              border:"1px solid "+C.b2, background:"transparent",
              color:C.muted, fontSize:12, cursor:"pointer",
            }}
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding:"10px 16px", borderRadius:8, marginBottom:16,
            background:C.red+"15", border:"1px solid "+C.red+"44", color:C.red, fontSize:13,
            display:"flex", justifyContent:"space-between",
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background:"none", border:"none", color:C.red, cursor:"pointer" }}>×</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:24, borderBottom:"1px solid "+C.b1, paddingBottom:0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                padding:"9px 18px", border:"none", background:"transparent",
                color: tab === t.id ? C.gold : C.muted,
                fontWeight: tab === t.id ? 700 : 400,
                fontSize:13, cursor:"pointer",
                borderBottom: tab === t.id ? "2px solid "+C.gold : "2px solid transparent",
                marginBottom:-1, transition:"all 0.15s",
                display:"flex", alignItems:"center", gap:6,
              }}
            >
              <span>{t.icon}</span>
              {t.label}
              {t.id === "deposits" && overview && overview.deposits_pending > 0 && (
                <span style={{
                  background:C.red, color:"#fff",
                  borderRadius:10, fontSize:9, fontWeight:800,
                  padding:"1px 6px", marginLeft:2,
                }}>{overview.deposits_pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading indicator */}
        {isLoading && <PageLoader />}

        {/* Tab content */}
        {tab === "overview" && overview && !isLoading && (
          <OverviewTab data={overview} onTabChange={handleTabChange} />
        )}
        {tab === "overview" && !overview && !isLoading && (
          <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
            <div>Acceso solo para administradores de VEXFORGE</div>
          </div>
        )}
        {tab === "players" && players !== null && !isLoading && (
          <PlayersTab players={players} />
        )}
        {tab === "ledger" && !isLoading && (
          <LedgerTab
            entries={ledger}
            total={ledgerTotal}
            loading={loading === "ledger"}
            onLoadMore={() => loadLedger(ledgerPage + 1)}
          />
        )}
        {tab === "deposits" && (
          <DepositsTab navigate={navigate} pendingCount={overview?.deposits_pending ?? 0} />
        )}

      </div>
    </div>
  );
}