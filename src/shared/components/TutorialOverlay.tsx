import { useNavigate } from "react-router-dom";
import { useTutorial, TUTORIAL_TOTAL_STEPS } from "../../domains/tutorial/useTutorial";

type TutorialStep = {
  step: number;
  title: string;
  subtitle: string;
  desc: string;
  icon: string;
  action: string | null;
  actionLabel: string;
  accentColor: string;
};

const STEPS: TutorialStep[] = [
  {
    step: 0,
    title: "Bienvenido a VEXFORGE",
    subtitle: "El mundo de las cartas te espera, Forjador",
    desc: "VEXFORGE es un juego de cartas coleccionables de primera línea. Batallas épicas, facciones, misiones y recompensas legendarias te esperan.",
    icon: "⚔️",
    action: null,
    actionLabel: "Comenzar tutorial",
    accentColor: "#e8b84b",
  },
  {
    step: 1,
    title: "Tu Colección de Cartas",
    subtitle: "4 Facciones. Cientos de cartas únicas",
    desc: "Cada carta tiene ataque, defensa, coste de energía y habilidades especiales. Explora tu colección por facción: Guerrero, Mago, Paladín y Pícaro.",
    icon: "🃏",
    action: "/cards",
    actionLabel: "Ver mi Colección →",
    accentColor: "#f87171",
  },
  {
    step: 2,
    title: "Abre tu Primer Pack",
    subtitle: "Nuevas cartas, nuevas posibilidades",
    desc: "Los packs contienen cartas de distintas raridades. Los packs premium garantizan mínimo una carta Épica. ¡Ábrelos y amplía tu arsenal!",
    icon: "📦",
    action: "/packs",
    actionLabel: "Ir a Packs →",
    accentColor: "#818cf8",
  },
  {
    step: 3,
    title: "Ejecuta Misiones",
    subtitle: "Gana XP, VEX y cartas raras",
    desc: "Las misiones son tu fuente principal de progresión. Completa misiones diarias para ganar experiencia, moneda VEX y desbloquear recompensas especiales.",
    icon: "🗺️",
    action: "/missions",
    actionLabel: "Ver Misiones →",
    accentColor: "#34d399",
  },
  {
    step: 4,
    title: "Arena PvP",
    subtitle: "Desafía a Forjadores de todo el mundo",
    desc: "En la Arena PvP enfrentas tu mazo contra jugadores reales en tiempo real. Sube de rango para desbloquear recompensas de temporada exclusivas.",
    icon: "⚡",
    action: "/pvp",
    actionLabel: "Entrar a la Arena →",
    accentColor: "#fbbf24",
  },
  {
    step: 5,
    title: "Construye tu Mazo",
    subtitle: "Diseña la estrategia perfecta",
    desc: "El Deck Builder te permite construir mazos optimizados por facción, rareza y sinergia entre habilidades. Un buen mazo marca la diferencia en la Arena.",
    icon: "🔧",
    action: "/deck-builder",
    actionLabel: "Ir al Deck Builder →",
    accentColor: "#a78bfa",
  },
  {
    step: 6,
    title: "¡Forjador Iniciado!",
    subtitle: "VEXFORGE es tuyo ahora",
    desc: "Has completado el tutorial. Explora libremente: World Bosses, Clanes, Season Pass, Evolución de cartas y mucho más. ¡El legado de VEXFORGE comienza hoy!",
    icon: "🏆",
    action: null,
    actionLabel: "Comenzar Aventura",
    accentColor: "#e8b84b",
  },
];

export function TutorialOverlay() {
  const { tutorialStep, loading, advance, skip, showTutorial } = useTutorial();
  const navigate = useNavigate();

  if (loading || !showTutorial) return null;

  const currentStep = STEPS[Math.min(tutorialStep, STEPS.length - 1)];
  const isLast = tutorialStep >= TUTORIAL_TOTAL_STEPS - 1;
  const progress = Math.round(((tutorialStep) / (TUTORIAL_TOTAL_STEPS - 1)) * 100);

  async function handleAction() {
    if (isLast) {
      await skip();
      return;
    }
    if (currentStep.action) {
      navigate(currentStep.action);
    }
    await advance(tutorialStep + 1);
  }

  async function handleSkip() {
    await skip();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(3, 3, 10, 0.80)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      animation: "fadeInOverlay 0.3s ease",
    }}>
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,184,75,0.0); }
          50%       { box-shadow: 0 0 24px 4px rgba(232,184,75,0.18); }
        }
        .tut-btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .tut-btn-skip:hover    { color: #e8b84b; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(145deg, #0e0e1a, #13131f)",
        border: `1px solid ${currentStep.accentColor}44`,
        borderRadius: 16,
        boxShadow: `0 0 48px rgba(0,0,0,0.6), 0 0 0 1px ${currentStep.accentColor}22`,
        overflow: "hidden",
        animation: "pulse-glow 3s ease-in-out infinite",
      }}>

        {/* ── Header accent bar ── */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, transparent, ${currentStep.accentColor}, transparent)`,
        }} />

        {/* ── Progress bar ── */}
        <div style={{ padding: "18px 24px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10, color: "#888",
              letterSpacing: "0.15em", textTransform: "uppercase"
            }}>
              Tutorial — Paso {Math.min(tutorialStep + 1, TUTORIAL_TOTAL_STEPS)} / {TUTORIAL_TOTAL_STEPS}
            </span>
            <button
              onClick={handleSkip}
              className="tut-btn-skip"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10, color: "#555", letterSpacing: "0.1em",
                textTransform: "uppercase", transition: "color 0.2s",
              }}
            >
              Saltar →
            </button>
          </div>
          <div style={{
            height: 3, borderRadius: 2,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${currentStep.accentColor}99, ${currentStep.accentColor})`,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* ── Icon + Content ── */}
        <div style={{ padding: "28px 28px 8px" }}>
          <div style={{
            fontSize: 52, lineHeight: 1, marginBottom: 20,
            filter: "drop-shadow(0 0 16px rgba(232,184,75,0.3))",
          }}>
            {currentStep.icon}
          </div>

          <div style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10, letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: currentStep.accentColor,
            marginBottom: 6,
          }}>
            {currentStep.subtitle}
          </div>

          <h2 style={{
            fontFamily: '"Cinzel", serif',
            fontSize: 22, fontWeight: 700,
            color: "#f0eaff",
            margin: "0 0 14px",
            lineHeight: 1.2,
          }}>
            {currentStep.title}
          </h2>

          <p style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 12, lineHeight: 1.7,
            color: "#9a9ab8",
            margin: "0 0 28px",
          }}>
            {currentStep.desc}
          </p>
        </div>

        {/* ── Step dots ── */}
        <div style={{
          display: "flex", gap: 6, justifyContent: "center",
          padding: "0 28px 20px",
        }}>
          {STEPS.map((s, i) => (
            <div key={s.step} style={{
              width: i === tutorialStep ? 20 : 6,
              height: 6, borderRadius: 3,
              background: i <= tutorialStep
                ? currentStep.accentColor
                : "rgba(255,255,255,0.1)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {/* ── Action button ── */}
        <div style={{ padding: "4px 24px 24px" }}>
          <button
            onClick={handleAction}
            className="tut-btn-primary"
            style={{
              width: "100%",
              padding: "13px 24px",
              borderRadius: 8,
              border: "none",
              background: `linear-gradient(135deg, ${currentStep.accentColor}, ${currentStep.accentColor}cc)`,
              color: "#0a0a14",
              fontFamily: '"Rajdhani", sans-serif',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "filter 0.2s, transform 0.15s",
            }}
          >
            {currentStep.actionLabel}
          </button>
        </div>

        {/* ── Bottom accent ── */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${currentStep.accentColor}22, transparent)`,
        }} />
      </div>
    </div>
  );
}
