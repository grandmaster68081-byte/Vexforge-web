import { useState, useCallback } from "react";
import { useClans } from "../domains/clans/useClans";
import type { Clan, ClanWar } from "../domains/clans/useClans";
import { PageLoader }      from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState }      from "../shared/components/EmptyState";
import { useToast }        from "../shared/context/ToastContext";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/backgrounds/bg_clans.jpg";

const ROLE_ICON: Record<string, string> = { leader: "👑", officer: "⭐", member: "⚔️" };
const WAR_STATUS: Record<string, { label: string; color: string }> = {
  active:   { label: "ACTIVA",     color: "#3ddc84" },
  ongoing:  { label: "EN CURSO",   color: "#e8b84b" },
  pending:  { label: "PENDIENTE",  color: "#4a9eff" },
  resolved: { label: "FINALIZADA", color: "#555" },
};

// ---- Sub-components ----

function SectionCard({ title, children, accent = "#a855f7" }: { title: string; children: React.ReactNode; accent?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#12121f", border: `1px solid ${accent}22`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
          borderBottom: open ? `1px solid ${accent}18` : "none",
        }}
      >
        <span style={{ fontFamily: "Cinzel, serif", fontWeight: 800, fontSize: 13, color: "#e8e8f0", letterSpacing: "0.06em" }}>{title}</span>
        <span style={{ color: accent, fontSize: 14 }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div style={{ padding: "14px 18px" }}>{children}</div>}
    </div>
  );
}

function WarCard({ war, myClanId }: { war: ClanWar; myClanId: string }) {
  const cfg = WAR_STATUS[war.status] ?? { label: "GUERRA", color: "#a855f7" };
  const opponent = war.clan_a_id === myClanId ? war.clan_b_name : war.clan_a_name;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
      background: "linear-gradient(90deg,rgba(168,85,247,0.06),transparent)",
      border: "1px solid rgba(168,85,247,0.15)", marginBottom: 8,
    }}>
      <span style={{ fontSize: 18 }}>⚔️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, color: "#e8e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          vs. {opponent}
        </div>
        <div style={{ fontSize: 9, color: "#444", fontFamily: '"IBM Plex Mono",monospace', marginTop: 2 }}>
          {new Date(war.created_at).toLocaleDateString("es-ES")}
          {war.resolved_at ? ` · Fin: ${new Date(war.resolved_at).toLocaleDateString("es-ES")}` : ""}
        </div>
      </div>
      <div style={{
        background: `${cfg.color}18`, border: `1px solid ${cfg.color}44`,
        borderRadius: 6, padding: "2px 8px", fontSize: 8, color: cfg.color,
        fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700, letterSpacing: "0.08em",
      }}>{cfg.label}</div>
    </div>
  );
}

function ClanDiscoveryCard({ clan, onJoin, joining }: { clan: Clan; onJoin: (id: string) => void; joining: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
      background: "#0d0d18", border: "1px solid #1a1a2a", marginBottom: 8,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: "linear-gradient(135deg,rgba(232,184,75,0.15),rgba(232,184,75,0.05))",
        border: "1px solid rgba(232,184,75,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>🛡️</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Cinzel, serif", fontWeight: 800, fontSize: 13, color: "#e8e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {clan.name}
        </div>
        <div style={{ fontSize: 9, color: "#555", fontFamily: '"IBM Plex Mono",monospace', marginTop: 2 }}>
          Prestigio {clan.prestige} · #{clan.code}
        </div>
      </div>
      <button
        onClick={() => onJoin(clan.id)}
        disabled={joining}
        style={{
          background: joining ? "#1a1a2a" : "rgba(61,220,132,0.12)",
          border: "1px solid rgba(61,220,132,0.3)", borderRadius: 8,
          color: "#3ddc84", fontSize: 10, fontWeight: 700, padding: "6px 12px",
          cursor: joining ? "not-allowed" : "pointer", fontFamily: '"IBM Plex Mono",monospace',
        }}
      >{joining ? "..." : "UNIRSE"}</button>
    </div>
  );
}

// ---- War Starter Modal ----
function StartWarModal({ allClans, myClanId, onStart, onClose }: {
  allClans: Clan[]; myClanId: string; onStart: (clanId: string) => Promise<void>; onClose: () => void;
}) {
  const [starting, setStarting] = useState<string | null>(null);
  const eligible = allClans.filter(c => c.id !== myClanId);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#12121f", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 16,
        padding: 24, maxWidth: 420, width: "100%", maxHeight: "80vh", overflow: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontFamily: "Cinzel, serif", fontWeight: 800, fontSize: 15, color: "#a855f7" }}>⚔️ Declarar Guerra</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {eligible.length === 0
          ? <p style={{ color: "#555", fontSize: 13, textAlign: "center" }}>No hay otros Clanes disponibles.</p>
          : eligible.map(clan => (
            <div key={clan.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
              background: "#0d0d18", border: "1px solid #1a1a2a", marginBottom: 8,
            }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Cinzel, serif", fontWeight: 800, fontSize: 13, color: "#e8e8f0" }}>{clan.name}</div>
                <div style={{ fontSize: 9, color: "#555", fontFamily: '"IBM Plex Mono",monospace' }}>Prestigio {clan.prestige}</div>
              </div>
              <button
                onClick={async () => { setStarting(clan.id); await onStart(clan.id); setStarting(null); onClose(); }}
                disabled={!!starting}
                style={{
                  background: starting === clan.id ? "#1a1a2a" : "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.35)", borderRadius: 8,
                  color: "#a855f7", fontSize: 10, fontWeight: 700, padding: "6px 12px",
                  cursor: starting ? "not-allowed" : "pointer", fontFamily: '"IBM Plex Mono",monospace',
                }}
              >{starting === clan.id ? "..." : "ATACAR"}</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ---- Create Clan Modal ----
function CreateClanModal({ onCreate, onClose }: { onCreate: (name: string, desc: string) => Promise<void>; onClose: () => void }) {
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [creating, setCreating] = useState(false);
  const handle = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name, desc);
    setCreating(false);
    onClose();
  };
  const inp: React.CSSProperties = {
    width: "100%", background: "#0a0a14", border: "1px solid #2a2a3a", borderRadius: 8,
    color: "#e8e8f0", fontSize: 13, padding: "10px 12px", fontFamily: "inherit", boxSizing: "border-box",
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#12121f", border: "1px solid rgba(61,220,132,0.3)", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontFamily: "Cinzel, serif", fontWeight: 800, fontSize: 15, color: "#3ddc84" }}>🛡️ Crear Clan</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <input placeholder="Nombre del Clan" value={name} onChange={e => setName(e.target.value)} style={{ ...inp, marginBottom: 10 }} maxLength={40} />
        <textarea placeholder="Descripción (opcional)" value={desc} onChange={e => setDesc(e.target.value)} style={{ ...inp, resize: "vertical", minHeight: 60, marginBottom: 16 }} maxLength={200} />
        <button
          onClick={handle} disabled={creating || !name.trim()}
          style={{
            width: "100%", background: creating ? "#1a1a2a" : "rgba(61,220,132,0.15)",
            border: "1px solid rgba(61,220,132,0.35)", borderRadius: 10, color: "#3ddc84",
            fontWeight: 700, fontSize: 12, padding: "12px", cursor: creating || !name.trim() ? "not-allowed" : "pointer",
            fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.06em",
          }}
        >{creating ? "Creando..." : "CREAR CLAN"}</button>
      </div>
    </div>
  );
}

// ---- Main Route ----
export function ClansRoute() {
  const { clanData, authed, reload, startWar, join, leave, create } = useClans();
  const { showToast } = useToast();
  const [warModal, setWarModal]       = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [joining, setJoining]         = useState<string | null>(null);
  const [leaving, setLeaving]         = useState(false);

  const handleJoin = useCallback(async (clanId: string) => {
    setJoining(clanId);
    const res = await join(clanId);
    setJoining(null);
    showToast(res.data?.message ?? (res.data?.ok ? "¡Te uniste!" : "Error al unirse."), res.data?.ok ? "success" : "error");
  }, [join, showToast]);

  const handleLeave = useCallback(async () => {
    if (!confirm("¿Seguro que quieres salir del Clan?")) return;
    setLeaving(true);
    const res = await leave();
    setLeaving(false);
    showToast(res.data?.message ?? "Saliste del Clan.", res.data?.ok ? "info" : "error");
  }, [leave, showToast]);

  const handleStartWar = useCallback(async (opponentClanId: string) => {
    const res = await startWar(opponentClanId);
    showToast(res.data?.message ?? (res.data?.ok ? "¡Guerra declarada!" : "Error."), res.data?.ok ? "success" : "error");
  }, [startWar, showToast]);

  const handleCreate = useCallback(async (name: string, desc: string) => {
    const res = await create(name, desc);
    showToast(res.data?.message ?? (res.data?.ok ? "¡Clan creado!" : "Error."), res.data?.ok ? "success" : "error");
  }, [create, showToast]);

  if (clanData.status === "loading") return <PageLoader />;
  if (authed === false)              return <BlockedAuthState message="Inicia sesión para ver los Clanes." />;

  const d           = clanData.data;
  const hasClan     = !!d?.myClan;
  const wars        = d?.activeWars ?? [];
  const members     = d?.members ?? [];
  const allClans    = d?.allClans ?? [];
  const myClan      = d?.myClan;
  const myMember    = d?.myMembership;
  const activeWars  = wars.filter(w => w.status !== "resolved");
  const pastWars    = wars.filter(w => w.status === "resolved");

  return (
    <div
      className="forge-route-bg"
      style={{
        minHeight: "100vh", background: "#08080f",
        backgroundImage: `linear-gradient(rgba(8,8,15,0.82),rgba(8,8,15,0.92)),url(${BG_URL})`,
        backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "Cinzel, serif", fontWeight: 900, fontSize: 22, color: "#e8e8f0", margin: 0, letterSpacing: "0.06em" }}>
            ⚔️ Clanes
          </h1>
          {myClan && (
            <p style={{ color: "#555", fontSize: 11, fontFamily: '"IBM Plex Mono",monospace', marginTop: 6 }}>
              {myClan.name} · {myMember?.role ? (ROLE_ICON[myMember.role] ?? "") + " " + myMember.role : ""} · Prestigio {myClan.prestige}
            </p>
          )}
        </div>

        {/* ── HAS CLAN ── */}
        {hasClan && myClan && (
          <>
            {/* Clan overview */}
            <SectionCard title="MI CLAN" accent="#e8b84b">
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg,rgba(232,184,75,0.2),rgba(232,184,75,0.05))",
                  border: "1px solid rgba(232,184,75,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                }}>🛡️</div>
                <div>
                  <div style={{ fontFamily: "Cinzel, serif", fontWeight: 900, fontSize: 16, color: "#e8e8f0" }}>{myClan.name}</div>
                  <div style={{ fontSize: 9, color: "#555", fontFamily: '"IBM Plex Mono",monospace', marginTop: 3 }}>#{myClan.code}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ color: "#e8b84b", fontWeight: 700, fontSize: 16, fontFamily: "Rajdhani, sans-serif" }}>{myClan.prestige}</div>
                  <div style={{ color: "#444", fontSize: 9, fontFamily: '"IBM Plex Mono",monospace' }}>PRESTIGIO</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  flex: 1, background: "#0a0a14", borderRadius: 8, padding: "8px 12px", textAlign: "center",
                  border: "1px solid #1a1a2a",
                }}>
                  <div style={{ color: "#4a9eff", fontWeight: 700, fontSize: 14, fontFamily: "Rajdhani, sans-serif" }}>{members.length}</div>
                  <div style={{ color: "#444", fontSize: 8, fontFamily: '"IBM Plex Mono",monospace', marginTop: 2 }}>MIEMBROS</div>
                </div>
                <div style={{
                  flex: 1, background: "#0a0a14", borderRadius: 8, padding: "8px 12px", textAlign: "center",
                  border: "1px solid #1a1a2a",
                }}>
                  <div style={{ color: "#a855f7", fontWeight: 700, fontSize: 14, fontFamily: "Rajdhani, sans-serif" }}>{activeWars.length}</div>
                  <div style={{ color: "#444", fontSize: 8, fontFamily: '"IBM Plex Mono",monospace', marginTop: 2 }}>GUERRAS ACTIVAS</div>
                </div>
                <div style={{
                  flex: 1, background: "#0a0a14", borderRadius: 8, padding: "8px 12px", textAlign: "center",
                  border: "1px solid #1a1a2a",
                }}>
                  <div style={{ color: "#3ddc84", fontWeight: 700, fontSize: 14, fontFamily: "Rajdhani, sans-serif" }}>
                    {(myClan.contribution_total ?? 0).toLocaleString()}
                  </div>
                  <div style={{ color: "#444", fontSize: 8, fontFamily: '"IBM Plex Mono",monospace', marginTop: 2 }}>CONTRIBUCIÓN</div>
                </div>
              </div>

              {/* Leave button for non-leaders */}
              {myMember?.role !== "leader" && (
                <button
                  onClick={handleLeave} disabled={leaving}
                  style={{
                    marginTop: 12, background: "none", border: "1px solid #2a1a1a", borderRadius: 8,
                    color: "#ff4444", fontSize: 10, padding: "7px 14px", cursor: leaving ? "not-allowed" : "pointer",
                    fontFamily: '"IBM Plex Mono",monospace',
                  }}
                >{leaving ? "Saliendo..." : "Salir del Clan"}</button>
              )}
            </SectionCard>

            {/* Guild Wars */}
            <SectionCard title="GUERRAS DE CLANES" accent="#a855f7">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "#555", fontSize: 11, fontFamily: '"IBM Plex Mono",monospace' }}>
                  {activeWars.length === 0 ? "Sin guerras activas" : `${activeWars.length} guerra(s) en curso`}
                </span>
                <button
                  onClick={() => setWarModal(true)}
                  style={{
                    background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.35)",
                    borderRadius: 8, color: "#a855f7", fontSize: 10, fontWeight: 700,
                    padding: "7px 14px", cursor: "pointer", fontFamily: '"IBM Plex Mono",monospace',
                    letterSpacing: "0.06em",
                  }}
                >⚔️ DECLARAR</button>
              </div>
              {activeWars.length > 0 && activeWars.map(w => (
                <WarCard key={w.id} war={w} myClanId={myClan.id} />
              ))}
              {pastWars.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 9, color: "#333", fontFamily: '"IBM Plex Mono",monospace', marginBottom: 6 }}>HISTORIAL</div>
                  {pastWars.map(w => <WarCard key={w.id} war={w} myClanId={myClan.id} />)}
                </div>
              )}
              {wars.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#333", fontSize: 12 }}>
                  Tu clan no ha librado ninguna guerra aún.
                </div>
              )}
            </SectionCard>

            {/* Roster */}
            <SectionCard title="ROSTER" accent="#4a9eff">
              {members.length === 0
                ? <div style={{ color: "#333", fontSize: 12, textAlign: "center", padding: "10px 0" }}>Sin miembros registrados.</div>
                : members.map((m, i) => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "9px 0",
                    borderBottom: i < members.length - 1 ? "1px solid #1a1a2a" : "none",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: "#0d0d18",
                      border: "1px solid #2a2a3a", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 14, flexShrink: 0,
                    }}>{ROLE_ICON[m.role] ?? "⚔️"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 13 }}>{m.display_name}</div>
                      <div style={{ color: "#444", fontSize: 9, fontFamily: '"IBM Plex Mono",monospace', marginTop: 1 }}>{m.role}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#3ddc84", fontWeight: 700, fontSize: 12, fontFamily: "Rajdhani, sans-serif" }}>
                        {(m.contribution_accumulated ?? 0).toLocaleString()}
                      </div>
                      <div style={{ color: "#333", fontSize: 8, fontFamily: '"IBM Plex Mono",monospace' }}>CONTRIB.</div>
                    </div>
                  </div>
                ))
              }
            </SectionCard>
          </>
        )}

        {/* ── NO CLAN ── */}
        {!hasClan && (
          <>
            <div style={{
              background: "linear-gradient(135deg,rgba(232,184,75,0.06),rgba(168,85,247,0.04))",
              border: "1px solid rgba(232,184,75,0.15)", borderRadius: 14, padding: "20px 18px", marginBottom: 16,
            }}>
              <div style={{ fontFamily: "Cinzel, serif", fontWeight: 900, fontSize: 15, color: "#e8b84b", marginBottom: 6 }}>
                Sin Clan
              </div>
              <div style={{ color: "#555", fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
                Únete a un Clan para participar en Guerras de Clanes, contribuir al prestigio colectivo y conseguir recompensas exclusivas.
              </div>
              <button
                onClick={() => setCreateModal(true)}
                style={{
                  background: "rgba(61,220,132,0.12)", border: "1px solid rgba(61,220,132,0.35)", borderRadius: 10,
                  color: "#3ddc84", fontWeight: 700, fontSize: 11, padding: "10px 18px",
                  cursor: "pointer", fontFamily: '"IBM Plex Mono",monospace', letterSpacing: "0.06em",
                }}
              >🛡️ CREAR CLAN</button>
            </div>

            <SectionCard title="CLANES DISPONIBLES" accent="#4a9eff">
              {allClans.length === 0
                ? <EmptyState message="No hay Clanes públicos disponibles." />
                : allClans.map(c => (
                  <ClanDiscoveryCard key={c.id} clan={c} onJoin={handleJoin} joining={joining === c.id} />
                ))
              }
            </SectionCard>
          </>
        )}

      </div>

      {/* Modals */}
      {warModal && myClan && (
        <StartWarModal
          allClans={allClans.length > 0 ? allClans : []}
          myClanId={myClan.id}
          onStart={handleStartWar}
          onClose={() => setWarModal(false)}
        />
      )}
      {createModal && (
        <CreateClanModal onCreate={handleCreate} onClose={() => setCreateModal(false)} />
      )}
    </div>
  );
}
