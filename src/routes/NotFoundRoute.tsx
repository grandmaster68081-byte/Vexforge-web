import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ForgeIcon, type ForgeIconName } from "../shared/components/ForgeIcon";

// Fragmentos de código falso para el efecto visual
const GLITCH_CHARS = "▓░▒█▄▀■□▪▫◆◇●○";
const RUNE_SYMS = ["✦","◈","⬡","✧","◆","⊕","★","⟐","⊗","⬢"];
const LORE_MSGS = [
  "Este sector del multiverso fue sellado por la Forja.",
  "Las coordenadas no existen en ningún plano conocido.",
  "Los registros han sido borrados por los Forjadores.",
  "Ruta destruida en la Gran Fragmentación del Arco IV.",
  "Acceso denegado por el Consejo de la Forja Antigua.",
];

function useGlitch(text: string, running: boolean): string {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!running) { setOut(text); return; }
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      const corrupted = text.split("").map((c, i) => {
        if (c === " ") return " ";
        const chance = Math.sin(frame * 0.4 + i) > 0.3;
        return chance ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : c;
      }).join("");
      setOut(frame > 18 ? text : corrupted);
      if (frame > 22) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [text, running]);
  return out;
}

export function NotFoundRoute() {
  const [glitching, setGlitching] = useState(false);
  const [loreIdx] = useState(() => Math.floor(Math.random() * LORE_MSGS.length));

  const text404 = useGlitch("404", glitching);
  const textTitle = useGlitch("RUTA PERDIDA", glitching);

  useEffect(() => {
    setGlitching(true);
    const t = setTimeout(() => setGlitching(false), 1600);
    return () => clearTimeout(t);
  }, []);

  // Loop glitch periódico
  useEffect(() => {
    const id = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 1400);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg, #05050d 0%, #0a0a18 50%, #06060f 100%)",
      padding: "40px 24px",
    }}>
      <style>{`
        @keyframes nf-float-rune {
          0%   { opacity: 0; transform: translateY(0) scale(0.7) rotate(0deg); }
          20%  { opacity: 0.35; }
          80%  { opacity: 0.2; }
          100% { opacity: 0; transform: translateY(-120px) scale(1.1) rotate(15deg); }
        }
        @keyframes nf-scan {
          0%   { transform: translateY(-100%); opacity: 0.07; }
          100% { transform: translateY(100vh);  opacity: 0.04; }
        }
        @keyframes nf-pulse-border {
          0%, 100% { box-shadow: 0 0 0px rgba(232,64,64,0), 0 0 30px rgba(232,64,64,0.06); }
          50%       { box-shadow: 0 0 20px rgba(232,64,64,0.18), 0 0 60px rgba(232,64,64,0.08); }
        }
        @keyframes nf-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px) skewX(-2deg); }
          40%     { transform: translateX(5px)  skewX(2deg); }
          60%     { transform: translateX(-3px) skewX(-1deg); }
          80%     { transform: translateX(3px); }
        }
        @keyframes nf-glow-404 {
          0%, 100% { text-shadow: 0 0 30px rgba(232,64,64,0.4), 0 0 80px rgba(232,64,64,0.15); }
          50%       { text-shadow: 0 0 50px rgba(232,64,64,0.65), 0 0 120px rgba(232,64,64,0.25); }
        }
        @keyframes nf-reveal-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-glitching { animation: nf-shake 0.12s steps(1) infinite; }
        .nf-btn-back:hover {
          background: rgba(232,64,64,0.15) !important;
          border-color: rgba(232,64,64,0.6) !important;
          transform: translateY(-2px);
        }
        .nf-btn-home:hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Partículas de runas flotantes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left:  `${(i * 17 + 5) % 90 + 5}%`,
          bottom: `${(i * 13 + 8) % 40}%`,
          fontSize: `${(i % 3) + 9}px`,
          color: "#e84040",
          opacity: 0,
          animation: `nf-float-rune ${(i % 4) + 5}s ease-in-out ${i * 0.6}s infinite`,
          pointerEvents: "none",
          userSelect: "none",
        }}>{RUNE_SYMS[i % RUNE_SYMS.length]}</div>
      ))}

      {/* Línea de scan CRT */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, rgba(232,64,64,0.08), transparent)",
        animation: "nf-scan 4s linear infinite",
        pointerEvents: "none",
      }} />

      {/* Tarjeta principal */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "min(520px, 96vw)",
        background: "linear-gradient(160deg, #0e0e1e 0%, #0a0a16 100%)",
        border: "1px solid rgba(232,64,64,0.22)",
        borderRadius: 20,
        padding: "48px 40px 44px",
        textAlign: "center",
        animation: "nf-pulse-border 3.5s ease-in-out infinite",
      }}>
        {/* Barra decorativa superior */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #e84040, transparent)", marginBottom: 32 }} />

        {/* Código de error con efecto glitch */}
        <div
          className={glitching ? "nf-glitching" : ""}
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: "clamp(72px, 18vw, 112px)",
            fontWeight: 900,
            lineHeight: 1,
            color: "#e84040",
            letterSpacing: "-2px",
            animation: "nf-glow-404 2.8s ease-in-out infinite",
            marginBottom: 8,
          }}
        >{text404}</div>

        {/* Título con glitch */}
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          letterSpacing: "0.25em",
          color: "rgba(232,64,64,0.7)",
          textTransform: "uppercase",
          marginBottom: 24,
          animation: "nf-reveal-up 0.6s ease 0.2s both",
        }}>{textTitle}</div>

        {/* Separador runas */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
          animation: "nf-reveal-up 0.6s ease 0.4s both",
        }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(232,64,64,0.3))" }} />
          <span style={{ color: "rgba(232,64,64,0.5)", fontSize: 14 }}>◆</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(232,64,64,0.3), transparent)" }} />
        </div>

        {/* Mensaje lore aleatorio */}
        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 14, lineHeight: 1.65,
          color: "#6a7080",
          maxWidth: 380, margin: "0 auto 8px",
          animation: "nf-reveal-up 0.6s ease 0.5s both",
        }}>
          {LORE_MSGS[loreIdx]}
        </p>

        {/* Código de error técnico */}
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10, color: "rgba(255,255,255,0.14)",
          margin: "0 0 36px", letterSpacing: "0.1em",
          animation: "nf-reveal-up 0.6s ease 0.6s both",
        }}>
          ERR_ROUTE_NOT_FOUND · VEXFORGE_WEB · {new Date().getFullYear()}
        </p>

        {/* Botones */}
        <div style={{
          display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
          animation: "nf-reveal-up 0.6s ease 0.7s both",
        }}>
          <Link to="/" className="nf-btn-home" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 28px",
            background: "linear-gradient(135deg, #e84040dd, #e84040)",
            color: "#fff",
            borderRadius: 10,
            fontFamily: "'Cinzel', serif",
            fontWeight: 700, fontSize: 13,
            letterSpacing: "0.08em",
            textDecoration: "none",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 20px rgba(232,64,64,0.3)",
          }}>
            ← Volver a la Forja
          </Link>
          <Link to="/cards" className="nf-btn-back" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 28px",
            background: "transparent",
            color: "#8891a0",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700, fontSize: 13,
            letterSpacing: "0.08em",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}>
            Ver Cartas →
          </Link>
        </div>

        {/* Barra decorativa inferior */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(232,64,64,0.25), transparent)", marginTop: 40 }} />
      </div>

      {/* Rutas rápidas de rescate */}
      <div style={{
        marginTop: 28, display: "flex", gap: 8, flexWrap: "wrap",
        justifyContent: "center",
        animation: "nf-reveal-up 0.6s ease 0.9s both",
      }}>
        {[
          { to: "/pvp",         label: "Arena PvP", icon: "arena"       as ForgeIconName },
          { to: "/packs",       label: "Packs",     icon: "packs"       as ForgeIconName },
          { to: "/missions",    label: "Misiones",  icon: "map"         as ForgeIconName },
          { to: "/leaderboard", label: "Ranking",   icon: "leaderboard" as ForgeIconName },
        ].map(({ to, label, icon }) => (
          <Link key={to} to={to} style={{
            padding: "7px 14px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#5a6275",
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            fontSize: 12, textDecoration: "none",
            transition: "color 0.15s, background 0.15s",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "#e8e8f0";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "#5a6275";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
          }}
          >
            <ForgeIcon name={icon} size={13} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
