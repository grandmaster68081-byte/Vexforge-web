import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useFriends } from "../domains/friends/useFriends";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { EmptyState } from "../shared/components/EmptyState";
import { useToast } from "../shared/context/ToastContext";

const btn = (col = "#3ddc84"): React.CSSProperties => ({
  padding: "6px 16px", borderRadius: 7, border: `1px solid ${col}44`,
  background: "transparent", color: col, fontSize: 11, cursor: "pointer", fontWeight: 700,
});

function FriendCard({ friend, onChallenge }: { friend: any; onChallenge: (id: string) => void }) {
  const name = friend.display_name ?? `#${(friend.friend_id ?? "").slice(0, 6)}`;
  return (
    <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2a2a3a,#1a1a2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {name[0]?.toUpperCase() ?? "?"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 13 }}>{name}</div>
        <div style={{ color: "#444", fontSize: 10, marginTop: 2 }}>Forjador</div>
      </div>
      <button onClick={() => onChallenge(friend.friend_id)} style={btn("#e8b84b")}>⚔️ Desafiar</button>
    </div>
  );
}

function PendingCard({ request, onAccept, onDecline }: { request: any; onAccept: (id: string) => void; onDecline: (id: string) => void }) {
  const name = request.display_name ?? `#${(request.friend_id ?? "").slice(0, 6)}`;
  return (
    <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#2a2a3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {name[0]?.toUpperCase() ?? "?"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 13 }}>{name}</div>
        <div style={{ color: "#555", fontSize: 10 }}>Quiere ser tu amigo</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onAccept(request.id)} style={btn()}>✓</button>
        <button onClick={() => onDecline(request.id)} style={btn("#e3573f")}>✕</button>
      </div>
    </div>
  );
}

export function FriendsRoute() {
  const { friends, pending, challenges, loading, addFriend, accept, decline, challenge, respondChallenge } = useFriends();
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const [searchId, setSearchId] = useState("");
  const [tab, setTab]           = useState<"friends" | "pending" | "challenges">("friends");
  const { addToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
  }, []);

  const handleAdd = async () => {
    if (!searchId.trim()) return;
    const r = await addFriend(searchId.trim());
    if (r.ok) addToast("success", "Solicitud enviada"); else addToast("error", "Error al enviar", r.reason ?? "Error desconocido");
    if (r.ok) setSearchId("");
  };

  const tabSt = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
    background: active ? "#3ddc8422" : "transparent",
    color: active ? "#3ddc84" : "#555", fontWeight: 700, fontSize: 13,
  });

  const badge = (n: number, color = "#e8b84b") => n > 0
    ? <span style={{ marginLeft: 6, background: color + "22", color, borderRadius: 12, padding: "1px 8px", fontSize: 10 }}>{n}</span>
    : null;

  if (authed === null || loading) return <PageLoader />;
  if (authed === false) return <BlockedAuthState message="Inicia sesión para ver tus amigos y enviar solicitudes." />;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Social ───</p>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>🤝 Amigos</h1>
        <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Conecta con otros Forjadores. Desafíalos. Crece junto a ellos.</p>
      </div>

      <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <p style={{ color: "#888", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", margin: "0 0 10px" }}>AÑADIR FORJADOR POR ID</p>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} placeholder="UUID del jugador…" style={{ flex: 1, background: "#0e0e1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "9px 14px", color: "#e8e8f0", fontSize: 12 }} />
          <button onClick={handleAdd} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3ddc84,#2ab86a)", color: "#0a0a12", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Añadir</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, background: "#0e0e1a", borderRadius: 10, padding: 4, marginBottom: 20 }}>
        <button onClick={() => setTab("friends")} style={tabSt(tab === "friends")}>⚔️ Amigos {badge(friends.length, "#3ddc84")}</button>
        <button onClick={() => setTab("pending")} style={tabSt(tab === "pending")}>📨 Solicitudes {badge(pending.length)}</button>
        <button onClick={() => setTab("challenges")} style={tabSt(tab === "challenges")}>🎯 Desafíos {badge(challenges.length, "#e3573f")}</button>
      </div>

      {tab === "friends" && (
        friends.length === 0
          ? <EmptyState icon="🤝" title="Sin amigos aún" description="Añade a otros Forjadores por su ID para conectar y desafiarlos." />
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {friends.map((f: any) => (
                <FriendCard key={f.id ?? f.friend_id} friend={f} onChallenge={async (id) => {
                  const r = await challenge(id);
                  r.ok ? addToast("success", "Desafío enviado 🎯") : addToast("error", "Error al enviar desafío", r.reason ?? "Error desconocido");
                }} />
              ))}
            </div>
      )}

      {tab === "pending" && (
        pending.length === 0
          ? <EmptyState icon="📨" title="Sin solicitudes" description="No tienes solicitudes de amistad pendientes." />
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pending.map((p: any) => (
                <PendingCard key={p.id} request={p}
                  onAccept={async (id) => { await accept(id); addToast("success", "Solicitud aceptada"); }}
                  onDecline={async (id) => { await decline(id); addToast("error", "Solicitud rechazada"); }}
                />
              ))}
            </div>
      )}

      {tab === "challenges" && (
        challenges.length === 0
          ? <EmptyState icon="🎯" title="Sin desafíos" description="No tienes desafíos activos. Reta a un amigo desde la pestaña Amigos." />
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {challenges.map((c: any) => (
                <div key={c.id} style={{ background: "#12121a", border: "1px solid #e3573f33", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28 }}>🎯</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 13 }}>Desafío directo</div>
                    <div style={{ color: "#555", fontSize: 11 }}>Estado: {c.status}</div>
                  </div>
                  {c.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={async () => { const r = await respondChallenge(c.id, true); r.ok ? addToast("success", "Desafío aceptado") : addToast("error", "Error al aceptar"); }} style={btn()}>Aceptar</button>
                      <button onClick={async () => { const r = await respondChallenge(c.id, false); r.ok ? addToast("error", "Desafío rechazado") : addToast("error", "Error al rechazar"); }} style={btn("#e3573f")}>Rechazar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
      )}
    </main>
  );
}
