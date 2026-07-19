import { useState } from "react";
import { useFriends } from "../domains/friends/useFriends";

const S: Record<string, React.CSSProperties> = {
card: { background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
};
const btn = (col = "#3ddc84"): React.CSSProperties => ({ padding: "5px 14px", borderRadius: 6, border: "1px solid " + col + "44", background: "transparent", color: col, fontSize: 11, cursor: "pointer", fontWeight: 700 });

export function FriendsRoute() {
const { friends, pending, challenges, loading, addFriend, accept, decline, challenge, respondChallenge } = useFriends();
const [searchId, setSearchId] = useState("");
const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
const [tab, setTab] = useState<"friends" | "pending" | "challenges">("friends");

const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

const handleAdd = async () => {
  if (!searchId.trim()) return;
  const r = await addFriend(searchId.trim());
  flash(r.ok ? "Solicitud enviada" : (r.reason ?? "Error al enviar"), r.ok);
  if (r.ok) setSearchId("");
};

const tabSt = (active: boolean): React.CSSProperties => ({
  padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
  background: active ? "#3ddc8422" : "transparent", color: active ? "#3ddc84" : "#555", fontWeight: 700, fontSize: 12,
});

const empty = (icon: string, text: string) => (
  <div style={{ textAlign: "center", padding: "48px 0", color: "#444" }}>
    <p style={{ fontSize: 36, margin: "0 0 12px" }}>{icon}</p>
    <p style={{ fontSize: 13 }}>{text}</p>
  </div>
);

return (
  <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Social ───</p>
      <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>🤝 Amigos</h1>
      <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Conecta con otros Forjadores y desafíalos a duelos directos.</p>
    </div>

    {/* Add friend input */}
    <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
      <p style={{ color: "#888", fontSize: 11, margin: "0 0 10px", fontWeight: 700, letterSpacing: "0.1em" }}>AÑADIR AMIGO (Player ID)</p>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="UUID del jugador..."
          style={{ flex: 1, background: "#0e0e1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "8px 14px", color: "#e8e8f0", fontSize: 12 }} />
        <button onClick={handleAdd} style={{ ...btn(), padding: "8px 20px" }}>Añadir</button>
      </div>
      {msg && <p style={{ marginTop: 8, fontSize: 12, color: msg.ok ? "#3ddc84" : "#e3573f" }}>{msg.text}</p>}
    </div>

    {/* Tabs */}
    <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0e0e1a", borderRadius: 10, padding: 4 }}>
      <button onClick={() => setTab("friends")} style={tabSt(tab === "friends")}>⚔️ Amigos {friends.length > 0 && <span style={{ background: "#3ddc8422", borderRadius: 12, padding: "1px 7px", fontSize: 10, marginLeft: 4 }}>{friends.length}</span>}</button>
      <button onClick={() => setTab("pending")} style={tabSt(tab === "pending")}>📨 Solicitudes {pending.length > 0 && <span style={{ background: "#e8b84b22", borderRadius: 12, padding: "1px 7px", fontSize: 10, color: "#e8b84b", marginLeft: 4 }}>{pending.length}</span>}</button>
      <button onClick={() => setTab("challenges")} style={tabSt(tab === "challenges")}>🏟️ Duelos {challenges.length > 0 && <span style={{ background: "#e3573f22", borderRadius: 12, padding: "1px 7px", fontSize: 10, color: "#e3573f", marginLeft: 4 }}>{challenges.length}</span>}</button>
    </div>

    {loading ? <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Cargando...</p>
      : tab === "friends" ? (
        friends.length === 0 ? empty("⚔️", "Aún no tienes amigos. Comparte tu Player ID y añade Forjadores.")
          : friends.map(f => (
            <div key={f.id} style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚔️</div>
                <div>
                  <p style={{ margin: 0, color: "#e8e8f0", fontWeight: 700, fontSize: 14 }}>{f.display_name}</p>
                  <p style={{ margin: "2px 0 0", color: "#555", fontSize: 11 }}>Nivel {f.level}</p>
                </div>
              </div>
              <button onClick={() => challenge(f.friend_id).then(r => flash(r.ok ? "Duelo enviado a " + f.display_name : (r.reason ?? "Error"), r.ok))} style={btn("#e8b84b")}>⚔️ Duelo</button>
            </div>
          ))
      ) : tab === "pending" ? (
        pending.length === 0 ? empty("📨", "Sin solicitudes de amistad pendientes")
          : pending.map(p => (
            <div key={p.id} style={S.card}>
              <div>
                <p style={{ margin: 0, color: "#e8e8f0", fontWeight: 700, fontSize: 14 }}>{p.display_name}</p>
                <p style={{ margin: "2px 0 0", color: "#888", fontSize: 11 }}>Nivel {p.level} · quiere ser tu amigo</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => accept(p.id)} style={btn("#3ddc84")}>✓ Aceptar</button>
                <button onClick={() => decline(p.id)} style={btn("#e3573f")}>✗ Rechazar</button>
              </div>
            </div>
          ))
      ) : (
        challenges.length === 0 ? empty("🏟️", "Sin duelos pendientes")
          : challenges.map(c => (
            <div key={c.id} style={S.card}>
              <div>
                <p style={{ margin: 0, color: "#e8e8f0", fontWeight: 700, fontSize: 14 }}>{c.challenger_name ?? "Guerrero"}</p>
                <p style={{ margin: "2px 0 0", color: "#e8b84b", fontSize: 11 }}>te ha lanzado un duelo directo</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => respondChallenge(c.id, true)} style={btn("#3ddc84")}>✓ Aceptar</button>
                <button onClick={() => respondChallenge(c.id, false)} style={btn("#e3573f")}>✗ Rechazar</button>
              </div>
            </div>
          ))
      )}
  </main>
);
}
